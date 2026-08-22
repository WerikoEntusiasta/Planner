import React, { useState, useEffect, useRef } from 'react';
import { Creative, CreativeAsset, CreativeFormat, CreativeStatus, Client, User, ClientObservation } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Sparkles, Plus, Image as ImageIcon, Film, LayoutGrid, Check, 
  X, MessageSquare, Send, Copy, ExternalLink, Trash2, Edit3, 
  ArrowLeft, ArrowRight, Star, Clock, CheckCircle2, AlertCircle, 
  Search, Filter, Smartphone, RefreshCw, Upload, Eye, Layers, 
  CheckCheck, Share2, HelpCircle, Shield, AlignLeft, FileText, 
  Wand2, MessageCircle, MoreHorizontal, Bookmark, Lightbulb, AlertTriangle,
  Calendar, Rocket, XCircle, RotateCcw, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClientCreativeApprovalPage from './ClientCreativeApprovalPage';
import DesignerCarouselAIModal, { GeneratedCarouselData } from './DesignerCarouselAIModal';
import ClientObservationsModal from './ClientObservationsModal';
import ClientObservationsSection from './ClientObservationsSection';
import CreativeHubDashboard, { CreativeSubMenu } from './CreativeHubDashboard';
import CreativeScheduleModal from './CreativeScheduleModal';
import ShareCreativeModal from './ShareCreativeModal';

interface CreativeHubViewProps {
  clients: Client[];
  activeClientId: string;
  currentUser: User | null;
  onOpenPricing?: () => void;
}

export default function CreativeHubView({
  clients,
  activeClientId,
  currentUser,
  onOpenPricing
}: CreativeHubViewProps) {
  // Main state
  const [creatives, setCreatives] = useState<Creative[]>(() => {
    try {
      const saved = localStorage.getItem('creator_planner_creatives');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active SubMenu Tab: 'dashboard' | 'changes_requested' | 'approved' | 'scheduled' | 'posted' | 'rejected'
  const [activeSubMenu, setActiveSubMenu] = useState<CreativeSubMenu>('dashboard');

  // Client Observations & Feedback Rules
  const [observations, setObservations] = useState<ClientObservation[]>(() => {
    try {
      const saved = localStorage.getItem('creator_planner_client_observations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isObservationsModalOpen, setIsObservationsModalOpen] = useState(false);
  const [savedFeedbackMap, setSavedFeedbackMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || 'all');
  
  // Link copy feedback states
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedCaptionToken, setCopiedCaptionToken] = useState<string | null>(null);
  const [copiedGeneralLink, setCopiedGeneralLink] = useState(false);
  const [copiedGeneralCaptionLink, setCopiedGeneralCaptionLink] = useState(false);
  
  // Preview modal states
  const [previewingShareToken, setPreviewingShareToken] = useState<string | null>(null);
  const [previewingHubClientId, setPreviewingHubClientId] = useState<string | null>(null);
  const [previewingFocus, setPreviewingFocus] = useState<'all' | 'visual' | 'caption'>('all');

  // Share Modal State
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    creative?: Creative | null;
    clientId?: string;
    focus?: 'all' | 'visual' | 'caption';
    mode?: 'single' | 'hub';
  }>({ isOpen: false });

  const handleOpenShareModal = (
    creative?: Creative | null,
    clientId?: string,
    focus: 'all' | 'visual' | 'caption' = 'all',
    mode: 'single' | 'hub' = creative ? 'single' : 'hub'
  ) => {
    setShareModalConfig({
      isOpen: true,
      creative: creative || null,
      clientId: clientId || selectedClientId,
      focus,
      mode
    });
  };

  // Modal State for Creating/Editing full creative
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingCreative, setSchedulingCreative] = useState<Creative | null>(null);

  // Quick Caption Editor Modal State
  const [captionModalCreative, setCaptionModalCreative] = useState<Creative | null>(null);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isGeneratingAICaption, setIsGeneratingAICaption] = useState(false);
  const [aiTone, setAiTone] = useState('persuasivo e envolvente');
  const [aiGoal, setAiGoal] = useState('engajamento e conversão');

  // Modal Form States for Full Creative
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState(activeClientId || (clients[0]?.id || 'default_client'));
  const [formFormat, setFormFormat] = useState<CreativeFormat>('carousel');
  const [formPlatform, setFormPlatform] = useState<any>('instagram');
  const [formAspectRatio, setFormAspectRatio] = useState<'1:1' | '4:5' | '9:16' | '16:9'>('1:1');
  const [formAssets, setFormAssets] = useState<CreativeAsset[]>([]);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected client if activeClientId changes or clients populate
  useEffect(() => {
    if (activeClientId) {
      setSelectedClientId(activeClientId);
      setFormClientId(activeClientId);
    } else if (clients.length > 0 && (!formClientId || formClientId === 'default_client')) {
      setFormClientId(clients[0].id);
    }
  }, [activeClientId, clients]);

  // Load creatives from server
  const loadCreatives = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch(`/api/creatives${selectedClientId !== 'all' ? `?clientId=${selectedClientId}` : ''}`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-password': currentUser.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.creatives)) {
        setCreatives(data.creatives);
        try {
          localStorage.setItem('creator_planner_creatives', JSON.stringify(data.creatives));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Using local creatives backup:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load client observations
  const loadObservations = async () => {
    if (!currentUser) return;
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch(`/api/client-observations${selectedClientId !== 'all' ? `?clientId=${selectedClientId}` : ''}`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-password': currentUser.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.observations)) {
        setObservations(data.observations);
        try {
          localStorage.setItem('creator_planner_client_observations', JSON.stringify(data.observations));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Using local observations backup:', e);
    }
  };

  useEffect(() => {
    loadCreatives();
    loadObservations();
  }, [selectedClientId, currentUser]);

  // Helper to compress image
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          const maxDim = 1200;
          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed);
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        image.onerror = () => {
          resolve(readerEvent.target?.result as string);
        };
        image.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Open Full Creative Modal
  const handleOpenCreateModal = () => {
    setEditingCreative(null);
    setFormTitle('');
    setFormDescription('');
    setFormClientId(selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'default_client'));
    setFormFormat('carousel');
    setFormPlatform('instagram');
    setFormAspectRatio('1:1');
    setFormAssets([]);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (creative: Creative) => {
    setEditingCreative(creative);
    setFormTitle(creative.title);
    setFormDescription(creative.description || '');
    setFormClientId(creative.clientId);
    setFormFormat(creative.format);
    setFormPlatform(creative.platform || 'instagram');
    setFormAspectRatio(creative.aspectRatio || '1:1');
    setFormAssets(creative.assets || []);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Quick Caption Modal Handlers
  const handleOpenCaptionEditor = (creative: Creative) => {
    setCaptionModalCreative(creative);
    setCaptionText(creative.description || '');
    setIsCaptionModalOpen(true);
  };

  const handleSaveQuickCaption = async (sendForApproval: boolean = false) => {
    if (!captionModalCreative) return;
    setIsSavingCaption(true);
    const now = new Date().toISOString();
    const newCaptionStatus: CreativeStatus = sendForApproval ? 'pending_approval' : (captionModalCreative.captionStatus || 'draft');

    const updatedCreative: Creative = {
      ...captionModalCreative,
      description: captionText.trim() || undefined,
      captionStatus: captionText.trim() ? newCaptionStatus : undefined,
      updatedAt: now
    };

    const updated = creatives.map(c => c.id === captionModalCreative.id ? updatedCreative : c);
    setCreatives(updated);
    try {
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));
    } catch (e) {}

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch('/api/creatives', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          },
          body: JSON.stringify(updatedCreative)
        });
      } catch (err) {
        console.error('Failed to update caption on server:', err);
      }
    }

    setIsSavingCaption(false);
    setIsCaptionModalOpen(false);

    if (sendForApproval) {
      handleCopyCaptionLink(updatedCreative.shareToken, updatedCreative.id);
    }
  };

  // AI Caption Generation
  const handleGenerateAICaption = async () => {
    if (!captionModalCreative) return;
    setIsGeneratingAICaption(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const clientObj = clients.find(c => c.id === captionModalCreative.clientId);
      const res = await fetch('/api/ai/caption-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-password': currentUser?.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          title: captionModalCreative.title,
          format: captionModalCreative.format,
          clientName: clientObj?.name || captionModalCreative.clientName,
          clientId: captionModalCreative.clientId,
          currentCaption: captionText,
          tone: aiTone,
          goal: aiGoal
        })
      });
      const data = await res.json();
      if (res.ok && data.caption) {
        setCaptionText(data.caption);
      } else {
        alert(data.error || 'Não foi possível gerar a legenda no momento.');
      }
    } catch (err) {
      console.error('AI Caption generation error:', err);
      alert('Erro de conexão ao gerar legenda por IA.');
    } finally {
      setIsGeneratingAICaption(false);
    }
  };

  // Apply AI Carousel data
  const handleApplyAIToCreative = (data: GeneratedCarouselData) => {
    setEditingCreative(null);
    setFormTitle(data.title);
    setFormDescription(data.caption || '');
    setFormFormat('carousel');
    setFormPlatform('instagram');
    setFormAspectRatio('1:1');
    setFormAssets([]);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsModalOpen(true);
    setIsAIModalOpen(false);
  };

  // Upload Assets
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formAssets.length + files.length > 20) {
      setUploadError('Um carrossel permite no máximo 20 imagens.');
      return;
    }

    setIsProcessingFiles(true);
    setUploadError(null);

    try {
      const newAssets: CreativeAsset[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
          const videoUrl = URL.createObjectURL(file);
          newAssets.push({
            id: `asset_${Date.now()}_${i}`,
            type: 'video',
            url: videoUrl,
            name: file.name,
            size: file.size,
            format: file.type.split('/')[1] || 'mp4',
            order: formAssets.length + i,
            title: `Vídeo: ${file.name.slice(0, 20)}`
          });
        } else {
          const compressedDataUrl = await compressImageFile(file);
          newAssets.push({
            id: `asset_${Date.now()}_${i}`,
            type: 'image',
            url: compressedDataUrl,
            name: file.name,
            size: file.size,
            format: file.type.split('/')[1] || 'jpg',
            order: formAssets.length + i,
            title: `Slide ${formAssets.length + i + 1}`
          });
        }
      }

      setFormAssets(prev => [...prev, ...newAssets]);
    } catch (err) {
      console.error('Error processing files:', err);
      setUploadError('Erro ao carregar os arquivos. Tente novamente.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAsset = (index: number) => {
    const updated = formAssets.filter((_, idx) => idx !== index).map((asset, idx) => ({
      ...asset,
      order: idx
    }));
    setFormAssets(updated);
    if (previewSlideIndex >= updated.length) {
      setPreviewSlideIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveAsset = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === formAssets.length - 1)
    ) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const reordered = [...formAssets];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const normalized = reordered.map((item, idx) => ({ ...item, order: idx }));
    setFormAssets(normalized);
    setPreviewSlideIndex(targetIndex);
  };

  // Save creative (Create or Update)
  const handleSaveCreative = async (targetStatus: CreativeStatus = 'pending_approval') => {
    if (!formTitle.trim()) {
      setUploadError('O título do criativo é obrigatório.');
      return;
    }

    if (formAssets.length === 0) {
      setUploadError('Adicione pelo menos 1 imagem ou vídeo para criar o criativo.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    const clientObj = clients.find(c => c.id === formClientId);
    const clientName = clientObj?.name || 'Cliente';
    const now = new Date().toISOString();

    const creativeData: Creative = {
      id: editingCreative?.id || `crt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: currentUser?.id || 'default_user',
      clientId: formClientId,
      clientName: clientName,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      format: formFormat,
      platform: formPlatform,
      status: targetStatus,
      captionStatus: formDescription.trim() ? (editingCreative?.captionStatus || 'pending_approval') : undefined,
      scheduledDate: editingCreative?.scheduledDate,
      scheduledTime: editingCreative?.scheduledTime,
      postedDate: editingCreative?.postedDate,
      assets: formAssets,
      aspectRatio: formAspectRatio,
      shareToken: editingCreative?.shareToken || `token_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`,
      createdAt: editingCreative?.createdAt || now,
      updatedAt: now
    };

    if (editingCreative) {
      const updated = creatives.map(c => c.id === editingCreative.id ? creativeData : c);
      setCreatives(updated);
      try {
        localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));
      } catch (e) {}
    } else {
      const updated = [creativeData, ...creatives];
      setCreatives(updated);
      try {
        localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));
      } catch (e) {}
    }

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch('/api/creatives', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          },
          body: JSON.stringify(creativeData)
        });
      } catch (err) {
        console.error('Failed to save to server:', err);
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Delete creative
  const handleDeleteCreative = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este criativo?')) return;

    const updated = creatives.filter(c => c.id !== id);
    setCreatives(updated);
    try {
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));
    } catch (e) {}

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch(`/api/creatives/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
      } catch (err) {
        console.error('Failed to delete on server:', err);
      }
    }
  };

  // General Status Update Helper
  const handleUpdateCreativeStatus = async (creativeId: string, newStatus: CreativeStatus, extraFields: Partial<Creative> = {}) => {
    const target = creatives.find(c => c.id === creativeId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedCreative: Creative = {
      ...target,
      status: newStatus,
      ...extraFields,
      updatedAt: now
    };

    const updated = creatives.map(c => c.id === creativeId ? updatedCreative : c);
    setCreatives(updated);
    try {
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));
    } catch (e) {}

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch('/api/creatives', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          },
          body: JSON.stringify(updatedCreative)
        });
      } catch (err) {
        console.error('Failed to update creative status on server:', err);
      }
    }
  };

  // Specific Action Handlers
  const handleMarkAsPosted = (creative: Creative) => {
    const now = new Date().toISOString();
    handleUpdateCreativeStatus(creative.id, 'posted', { postedDate: now });
    setToastMessage('🚀 Criativo marcado como postado e movido para a aba Postados!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenScheduleModal = (creative: Creative) => {
    setSchedulingCreative(creative);
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (creative: Creative, scheduledDate: string, scheduledTime: string) => {
    handleUpdateCreativeStatus(creative.id, 'scheduled', { scheduledDate, scheduledTime });
    setToastMessage(`📅 Criativo agendado para ${new Date(scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às ${scheduledTime} e movido para Agendados!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMoveToApproved = (creative: Creative) => {
    handleUpdateCreativeStatus(creative.id, 'approved');
    setToastMessage('🔵 Criativo movido para a aba Aprovados!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestoreCreative = (creative: Creative) => {
    handleUpdateCreativeStatus(creative.id, 'pending_approval', { clientFeedback: undefined });
    setToastMessage('🔄 Criativo restaurado para fila de aprovação!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResubmitForApproval = (creative: Creative) => {
    handleUpdateCreativeStatus(creative.id, 'pending_approval', { 
      captionStatus: creative.description ? 'pending_approval' : undefined,
      clientFeedback: undefined,
      captionFeedback: undefined
    });
    setToastMessage('🚀 Reenviado para aprovação do cliente!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Client Observations Handlers
  const handleSaveFeedbackAsObservation = async (
    creative: Creative,
    feedbackText: string,
    type: 'visual' | 'caption'
  ) => {
    if (!feedbackText.trim()) return;
    const clientName = creative.clientName || clients.find(c => c.id === creative.clientId)?.name || 'Cliente';
    const title = type === 'visual'
      ? `Ajuste Visual: ${creative.title}`
      : `Regra de Copy/Legenda: ${creative.title}`;

    const newObs: ClientObservation = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'default_user',
      clientId: creative.clientId,
      clientName: clientName,
      title: title,
      content: feedbackText.trim(),
      category: type === 'caption' ? 'caption' : 'visual',
      creativeId: creative.id,
      creativeTitle: creative.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await handleSaveObservation(newObs);

    const key = `${creative.id}_${type}`;
    setSavedFeedbackMap(prev => ({ ...prev, [key]: true }));

    setToastMessage(`✓ Salvo nas Regras de ${clientName}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isFeedbackSaved = (creativeId: string, type: 'visual' | 'caption'): boolean => {
    const key = `${creativeId}_${type}`;
    if (savedFeedbackMap[key]) return true;
    return observations.some(o => o.creativeId === creativeId && (type === 'caption' ? o.category === 'caption' : o.category === 'visual'));
  };

  const handleSaveObservation = async (observation: Partial<ClientObservation>): Promise<boolean> => {
    const fullObs: ClientObservation = {
      id: observation.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: observation.userId || currentUser?.id || 'default_user',
      clientId: observation.clientId || selectedClientId || 'default_client',
      clientName: observation.clientName || 'Cliente',
      title: observation.title || 'Observação',
      content: observation.content || '',
      category: observation.category || 'general',
      creativeId: observation.creativeId,
      creativeTitle: observation.creativeTitle,
      createdAt: observation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = observations.findIndex(o => o.id === fullObs.id);
    let updated: ClientObservation[];
    if (existingIndex >= 0) {
      updated = observations.map(o => o.id === fullObs.id ? fullObs : o);
    } else {
      updated = [fullObs, ...observations];
    }
    setObservations(updated);
    try {
      localStorage.setItem('creator_planner_client_observations', JSON.stringify(updated));
    } catch (e) {}

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch('/api/client-observations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          },
          body: JSON.stringify(fullObs)
        });
      } catch (err) {
        console.error('Failed to save observation to server:', err);
      }
    }
    return true;
  };

  const handleDeleteObservation = async (id: string): Promise<boolean> => {
    const updated = observations.filter(o => o.id !== id);
    setObservations(updated);
    try {
      localStorage.setItem('creator_planner_client_observations', JSON.stringify(updated));
    } catch (e) {}

    if (currentUser) {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        await fetch(`/api/client-observations/${id}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
      } catch (err) {
        console.error('Failed to delete observation on server:', err);
      }
    }
    return true;
  };

  // Link Handlers
  const handleCopyLink = async (shareToken?: string, fallbackId?: string) => {
    const origin = window.location.origin;
    const token = shareToken || fallbackId || '';
    const approvalUrl = `${origin}/aprovar?creativeToken=${encodeURIComponent(token)}`;
    const success = await copyToClipboard(approvalUrl);
    if (success) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  const handleCopyCaptionLink = async (shareToken?: string, fallbackId?: string) => {
    const origin = window.location.origin;
    const token = shareToken || fallbackId || '';
    const approvalUrl = `${origin}/aprovar?creativeToken=${encodeURIComponent(token)}&focus=caption`;
    const success = await copyToClipboard(approvalUrl);
    if (success) {
      setCopiedCaptionToken(token);
      setTimeout(() => setCopiedCaptionToken(null), 3000);
    }
  };

  const handleCopyGeneralLink = async (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const generalUrl = `${origin}/aprovar?client=${resolvedClient}&mode=hub`;
    const success = await copyToClipboard(generalUrl);
    if (success) {
      setCopiedGeneralLink(true);
      setTimeout(() => setCopiedGeneralLink(false), 3000);
    }
  };

  const handleCopyGeneralCaptionLink = async (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const generalUrl = `${origin}/aprovar?client=${resolvedClient}&focus=caption&mode=hub`;
    const success = await copyToClipboard(generalUrl);
    if (success) {
      setCopiedGeneralCaptionLink(true);
      setTimeout(() => setCopiedGeneralCaptionLink(false), 3000);
    }
  };

  const handleShareWhatsApp = (creative: Creative) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${encodeURIComponent(creative.shareToken)}`;
    const clientName = creative.clientName || 'Cliente';
    const message = encodeURIComponent(
      `Olá ${clientName}! Preparei a prévia do criativo "${creative.title}" para sua aprovação:\n\n` +
      `🔗 Acesse o link: ${approvalUrl}\n\n` +
      `Por favor, avalie a arte e aprove ou comente com seus ajustes direto pela página!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareCaptionWhatsApp = (creative: Creative) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${encodeURIComponent(creative.shareToken)}&focus=caption`;
    const clientName = creative.clientName || 'Cliente';
    const message = encodeURIComponent(
      `Olá ${clientName}! Segue a legenda do post "${creative.title}" para você revisar e aprovar:\n\n` +
      `✍️ Link de aprovação da legenda: ${approvalUrl}\n\n` +
      `Você pode aprovar com 1 clique ou sugerir qualquer mudança direto na página!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareGeneralWhatsApp = (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const clientObj = clients.find(c => c.id === resolvedClient);
    const clientName = clientObj?.name || 'Cliente';
    const hubUrl = `${origin}/aprovar?client=${resolvedClient}&mode=hub`;
    const message = encodeURIComponent(
      `Olá ${clientName}! Segue o link geral da nossa Central de Criativos para você visualizar todos os posts e carrosséis aguardando aprovação:\n\n` +
      `🔗 ${hubUrl}\n\n` +
      `Você pode aprovar ou solicitar ajustes com 1 clique direto pelo celular ou computador!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareGeneralCaptionWhatsApp = (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const clientObj = clients.find(c => c.id === resolvedClient);
    const clientName = clientObj?.name || 'Cliente';
    const hubUrl = `${origin}/aprovar?client=${resolvedClient}&focus=caption&mode=hub`;
    const message = encodeURIComponent(
      `Olá ${clientName}! Seguem as legendas e textos de todos os criativos da nossa central para você revisar e aprovar de uma só vez:\n\n` +
      `✍️ ${hubUrl}\n\n` +
      `Você pode ler cada copy, sugerir ajustes ou aprovar com 1 clique!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleViewAsClient = (shareToken: string, focus: 'all' | 'visual' | 'caption' = 'all') => {
    setPreviewingFocus(focus);
    setPreviewingShareToken(shareToken);
  };

  const handlePreviewGeneralHub = (targetClientId?: string, focus: 'all' | 'visual' | 'caption' = 'all') => {
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    setPreviewingFocus(focus);
    setPreviewingHubClientId(resolvedClient);
  };

  // Dynamic counts for submenus
  const scopedCreatives = creatives.filter(c => {
    if (selectedClientId !== 'all' && c.clientId !== selectedClientId) return false;
    return true;
  });

  const changesCount = scopedCreatives.filter(c => c.status === 'changes_requested' || c.captionStatus === 'changes_requested').length;
  const approvedCount = scopedCreatives.filter(c => (c.status === 'approved' || c.captionStatus === 'approved') && c.status !== 'posted' && c.status !== 'published' && c.status !== 'scheduled' && c.status !== 'rejected').length;
  const scheduledCount = scopedCreatives.filter(c => c.status === 'scheduled').length;
  const postedCount = scopedCreatives.filter(c => c.status === 'posted' || c.status === 'published').length;
  const rejectedCount = scopedCreatives.filter(c => c.status === 'rejected').length;

  // Filtered creatives list according to active submenu and search/format filters
  const filteredCreatives = scopedCreatives.filter(c => {
    if (filterFormat !== 'all' && c.format !== filterFormat) return false;

    // Submenu Filtering Logic:
    if (activeSubMenu === 'changes_requested') {
      if (c.status !== 'changes_requested' && c.captionStatus !== 'changes_requested') return false;
    } else if (activeSubMenu === 'approved') {
      const isAppr = (c.status === 'approved' || c.captionStatus === 'approved');
      if (!isAppr || c.status === 'posted' || c.status === 'published' || c.status === 'scheduled' || c.status === 'rejected') return false;
    } else if (activeSubMenu === 'scheduled') {
      if (c.status !== 'scheduled') return false;
    } else if (activeSubMenu === 'posted') {
      if (c.status !== 'posted' && c.status !== 'published') return false;
    } else if (activeSubMenu === 'rejected') {
      if (c.status !== 'rejected') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchClient = c.clientName?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      return matchTitle || matchClient || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* ========================================================================= */}
      {/* 1. TOP SUBMENUS NAVIGATION BAR (STATUS WORKFLOW)                           */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 p-1.5 bg-[#121218] border border-[#24242D] rounded-2xl overflow-x-auto shadow-sm">
        
        {/* SUBMENU 1: CENTRAL / DASHBOARD */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'dashboard'
              ? 'bg-[#8B5CF6] text-white shadow-md font-bold'
              : 'text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F]'
          }`}
        >
          <LayoutGrid size={15} />
          <span>Central (Dashboard)</span>
        </button>

        {/* SUBMENU 2: AGUARDANDO MUDANÇA */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('changes_requested')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'changes_requested'
              ? 'bg-amber-500 text-black shadow-md font-bold'
              : 'text-[#92929F] hover:text-amber-400 hover:bg-[#17171F]'
          }`}
        >
          <MessageSquare size={15} />
          <span>Aguardando Mudança</span>
          {changesCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'changes_requested' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {changesCount}
            </span>
          )}
        </button>

        {/* SUBMENU 3: APROVADOS */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'approved'
              ? 'bg-blue-600 text-white shadow-md font-bold'
              : 'text-[#92929F] hover:text-blue-400 hover:bg-[#17171F]'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Aprovados</span>
          {approvedCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'approved' ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {approvedCount}
            </span>
          )}
        </button>

        {/* SUBMENU 4: AGENDADOS */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'scheduled'
              ? 'bg-purple-600 text-white shadow-md font-bold'
              : 'text-[#92929F] hover:text-purple-400 hover:bg-[#17171F]'
          }`}
        >
          <Calendar size={15} />
          <span>Agendados</span>
          {scheduledCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'scheduled' ? 'bg-white text-purple-600' : 'bg-purple-500/20 text-purple-400'
            }`}>
              {scheduledCount}
            </span>
          )}
        </button>

        {/* SUBMENU 5: POSTADOS */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('posted')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'posted'
              ? 'bg-emerald-600 text-white shadow-md font-bold'
              : 'text-[#92929F] hover:text-emerald-400 hover:bg-[#17171F]'
          }`}
        >
          <Rocket size={15} />
          <span>Postados</span>
          {postedCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'posted' ? 'bg-white text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {postedCount}
            </span>
          )}
        </button>

        {/* SUBMENU 6: REJEITADOS */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('rejected')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'rejected'
              ? 'bg-red-600 text-white shadow-md font-bold'
              : 'text-[#92929F] hover:text-red-400 hover:bg-[#17171F]'
          }`}
        >
          <XCircle size={15} />
          <span>Rejeitados</span>
          {rejectedCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'rejected' ? 'bg-white text-red-600' : 'bg-red-500/20 text-red-400'
            }`}>
              {rejectedCount}
            </span>
          )}
        </button>

        {/* SUBMENU 7: OBSERVAÇÕES DO CLIENTE */}
        <button
          type="button"
          onClick={() => setActiveSubMenu('observations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubMenu === 'observations'
              ? 'bg-amber-500 text-black shadow-md font-bold'
              : 'text-[#92929F] hover:text-amber-400 hover:bg-[#17171F]'
          }`}
        >
          <Bookmark size={15} />
          <span>Observações do Cliente</span>
          {observations.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubMenu === 'observations' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {observations.length}
            </span>
          )}
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 2. RENDER SUBMENU VIEW                                                    */}
      {/* ========================================================================= */}
      {activeSubMenu === 'dashboard' ? (
        /* DASHBOARD RESUMO SUBMENU */
        <CreativeHubDashboard
          creatives={creatives}
          clients={clients}
          selectedClientId={selectedClientId}
          onNavigateSubMenu={setActiveSubMenu}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onOpenObservationsModal={() => setIsObservationsModalOpen(true)}
          onOpenCaptionEditor={handleOpenCaptionEditor}
          onOpenEditModal={handleOpenEditModal}
          onMarkAsPosted={handleMarkAsPosted}
          onOpenScheduleModal={handleOpenScheduleModal}
          onViewAsClient={handleViewAsClient}
          onCopyGeneralLink={handleCopyGeneralLink}
          onCopyGeneralCaptionLink={handleCopyGeneralCaptionLink}
          onShareGeneralWhatsApp={handleShareGeneralWhatsApp}
          onShareGeneralCaptionWhatsApp={handleShareGeneralCaptionWhatsApp}
          onPreviewGeneralHub={handlePreviewGeneralHub}
          onOpenShareModal={handleOpenShareModal}
          copiedGeneralLink={copiedGeneralLink}
          copiedGeneralCaptionLink={copiedGeneralCaptionLink}
          observationsCount={observations.length}
        />
      ) : activeSubMenu === 'observations' ? (
        /* SUBMENU: OBSERVAÇÕES DO CLIENTE (DIRETRIZES & REGRAS) */
        <ClientObservationsSection
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClientId={setSelectedClientId}
          currentUser={currentUser}
          observations={observations}
          onSaveObservation={handleSaveObservation}
          onDeleteObservation={handleDeleteObservation}
        />
      ) : (
        /* TAB LIST VIEW: AGUARDANDO MUDANÇA | APROVADOS | AGENDADOS | POSTADOS | REJEITADOS */
        <div className="space-y-5">
          
          {/* TAB HEADER INFO & ACTIONS */}
          <div className="p-5 bg-[#121218] rounded-2xl border border-[#24242D] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  activeSubMenu === 'changes_requested' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  activeSubMenu === 'approved' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  activeSubMenu === 'scheduled' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                  activeSubMenu === 'posted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  {activeSubMenu === 'changes_requested' ? 'Ajustes Solicitados' :
                   activeSubMenu === 'approved' ? 'Aprovados pelo Cliente' :
                   activeSubMenu === 'scheduled' ? 'Publicações Agendadas' :
                   activeSubMenu === 'posted' ? 'Publicações Concluídas' :
                   'Criativos Reprovados'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  ({filteredCreatives.length} {filteredCreatives.length === 1 ? 'item' : 'itens'})
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-display">
                {activeSubMenu === 'changes_requested' && 'Aguardando Mudança (Visual ou Legenda)'}
                {activeSubMenu === 'approved' && 'Aprovados (Prontos para Agendar ou Postar)'}
                {activeSubMenu === 'scheduled' && 'Agendados (Programados para Publicação)'}
                {activeSubMenu === 'posted' && 'Postados (Histórico de Publicações)'}
                {activeSubMenu === 'rejected' && 'Rejeitados (Descartados ou para Revisão)'}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeSubMenu === 'changes_requested' && 'Estes criativos receberam feedback do cliente para ajustes visuais ou de texto.'}
                {activeSubMenu === 'approved' && 'Itens aprovados. Clique em "Marcar como Postado" ou "Agendar" para avançar o fluxo.'}
                {activeSubMenu === 'scheduled' && 'Criativos com data e hora definidas. Quando forem ao ar, marque como Postado.'}
                {activeSubMenu === 'posted' && 'Estes criativos já foram ao ar e estão organizados aqui para não misturar com os novos.'}
                {activeSubMenu === 'rejected' && 'Criativos recusados pelo cliente. Ficam separados para não poluir sua esteira principal.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-black shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Novo Criativo</span>
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121218] border border-[#24242D] p-3.5 rounded-xl shadow-sm">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#686873]" />
              <input
                type="text"
                placeholder="Buscar por título, cliente ou legenda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#17171F] border border-[#24242D] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F2F2F5] placeholder-[#686873] focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              
              {/* Client Filter */}
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-[#F2F2F5] focus:outline-none focus:border-[#8B5CF6]/50 cursor-pointer"
              >
                <option value="all">Todos os Clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Format Filter */}
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-[#F2F2F5] focus:outline-none focus:border-[#8B5CF6]/50 cursor-pointer"
              >
                <option value="all">Todos os Formatos</option>
                <option value="carousel">🎠 Carrossel</option>
                <option value="video">🎬 Vídeo</option>
                <option value="single_image">🖼️ Imagem Única</option>
              </select>

            </div>
          </div>

          {/* CREATIVES GRID VIEW */}
          {filteredCreatives.length === 0 ? (
            <div className="bg-[#121218] border border-[#24242D] rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-center justify-center text-[#686873] mx-auto">
                {activeSubMenu === 'changes_requested' ? <MessageSquare size={32} className="text-amber-400" /> :
                 activeSubMenu === 'approved' ? <CheckCircle2 size={32} className="text-blue-400" /> :
                 activeSubMenu === 'scheduled' ? <Calendar size={32} className="text-purple-400" /> :
                 activeSubMenu === 'posted' ? <Rocket size={32} className="text-emerald-400" /> :
                 <XCircle size={32} className="text-red-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#F2F2F5] font-display">
                  Nenhum item nesta aba
                </h3>
                <p className="text-xs text-[#92929F] max-w-sm mx-auto">
                  {activeSubMenu === 'changes_requested' && 'Não há criativos com alterações pendentes no momento.'}
                  {activeSubMenu === 'approved' && 'Não há criativos aprovados aguardando postagem.'}
                  {activeSubMenu === 'scheduled' && 'Nenhum criativo agendado no momento.'}
                  {activeSubMenu === 'posted' && 'Nenhum criativo marcado como postado ainda.'}
                  {activeSubMenu === 'rejected' && 'Nenhum criativo rejeitado.'}
                </p>
              </div>
              <button
                onClick={() => setActiveSubMenu('dashboard')}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Voltar ao Dashboard da Central</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCreatives.map((creative) => {
                const firstAsset = creative.assets?.[0];
                const isCarousel = creative.format === 'carousel' || (creative.assets || []).length > 1;
                const isVideo = creative.format === 'video' || firstAsset?.type === 'video';
                const hasCaption = Boolean(creative.description?.trim());

                return (
                  <div
                    key={creative.id}
                    className={`bg-[#121218] rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col group ${
                      activeSubMenu === 'changes_requested' ? 'border-amber-500/40 hover:border-amber-500/70' :
                      activeSubMenu === 'approved' ? 'border-blue-500/40 hover:border-blue-500/70' :
                      activeSubMenu === 'scheduled' ? 'border-purple-500/40 hover:border-purple-500/70' :
                      activeSubMenu === 'posted' ? 'border-emerald-500/40 hover:border-emerald-500/70' :
                      activeSubMenu === 'rejected' ? 'border-red-500/40 hover:border-red-500/70' :
                      'border-[#24242D]'
                    }`}
                  >
                    {/* CARD MEDIA THUMBNAIL */}
                    <div 
                      onClick={() => handleViewAsClient(creative.shareToken, 'all')}
                      className="relative aspect-video bg-[#0B0B0F] flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {firstAsset ? (
                        isVideo ? (
                          <video src={firstAsset.url} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img
                            src={firstAsset.url}
                            alt={creative.title}
                            className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
                          />
                        )
                      ) : (
                        <div className="text-[#686873]">
                          <ImageIcon size={32} />
                        </div>
                      )}

                      {/* FORMAT BADGE */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 border border-[#24242D] text-[10px] font-mono font-semibold text-[#F2F2F5] flex items-center gap-1.5 shadow-sm">
                        {isCarousel ? (
                          <>
                            <Layers size={11} className="text-[#A78BFA]" />
                            <span>Carrossel ({creative.assets?.length || 0})</span>
                          </>
                        ) : isVideo ? (
                          <>
                            <Film size={11} className="text-[#F97316]" />
                            <span>Vídeo</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon size={11} className="text-blue-400" />
                            <span>Imagem</span>
                          </>
                        )}
                      </div>

                      {/* STATUS BADGE */}
                      <div className="absolute top-3 right-3">
                        {activeSubMenu === 'changes_requested' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <MessageSquare size={11} /> Ajuste Solicitado
                          </span>
                        )}
                        {activeSubMenu === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/90 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={11} /> Aprovado
                          </span>
                        )}
                        {activeSubMenu === 'scheduled' && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/90 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Calendar size={11} /> Agendado
                          </span>
                        )}
                        {activeSubMenu === 'posted' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <Rocket size={11} /> Postado
                          </span>
                        )}
                        {activeSubMenu === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                            <X size={11} /> Reprovado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#686873]">
                          <span className="text-[#A78BFA] font-semibold uppercase">{creative.clientName || 'Cliente'}</span>
                          <span>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>

                        <h3 
                          onClick={() => handleViewAsClient(creative.shareToken, 'all')}
                          className="font-semibold text-sm text-[#F2F2F5] line-clamp-1 group-hover:text-[#A78BFA] transition-colors cursor-pointer"
                        >
                          {creative.title}
                        </h3>

                        {/* SCHEDULED DATE BADGE */}
                        {creative.scheduledDate && (
                          <div className="p-2 bg-purple-500/15 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Calendar size={13} className="text-purple-400" />
                              <span>{new Date(creative.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {creative.scheduledTime || '18:00'}</span>
                            </span>
                            <button
                              onClick={() => handleOpenScheduleModal(creative)}
                              className="text-[10px] underline hover:text-white cursor-pointer"
                            >
                              Alterar
                            </button>
                          </div>
                        )}

                        {/* POSTED DATE BADGE */}
                        {creative.postedDate && (
                          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Rocket size={13} className="text-emerald-400" />
                              <span>Postado em {new Date(creative.postedDate).toLocaleDateString('pt-BR')}</span>
                            </span>
                          </div>
                        )}

                        {/* CAPTION PILL / QUICK BUTTON */}
                        <div className="pt-1">
                          {hasCaption ? (
                            <div className="p-2.5 bg-[#17171F] border border-[#24242D] rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                                  creative.captionStatus === 'approved' ? 'text-emerald-400' :
                                  creative.captionStatus === 'changes_requested' ? 'text-amber-400' :
                                  'text-orange-400'
                                }`}>
                                  <AlignLeft size={11} />
                                  <span>{creative.captionStatus === 'approved' ? 'Legenda Aprovada' : creative.captionStatus === 'changes_requested' ? 'Ajuste na Legenda' : 'Legenda Pendente'}</span>
                                </span>

                                <button
                                  onClick={() => handleOpenCaptionEditor(creative)}
                                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 size={11} />
                                  <span>Editar</span>
                                </button>
                              </div>
                              <p className="text-xs text-[#92929F] line-clamp-2 leading-relaxed font-sans">
                                {creative.description}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenCaptionEditor(creative)}
                              className="w-full p-2.5 bg-amber-500/10 hover:bg-amber-500/15 border border-dashed border-amber-500/30 rounded-xl text-[11px] text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium"
                            >
                              <Plus size={13} />
                              <span>Adicionar Legenda</span>
                            </button>
                          )}
                        </div>

                        {/* VISUAL FEEDBACK BOX */}
                        {creative.clientFeedback && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                💬 Ajuste Visual:
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveFeedbackAsObservation(creative, creative.clientFeedback!, 'visual');
                                }}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                                  isFeedbackSaved(creative.id, 'visual')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                }`}
                                title="Salvar como observação do cliente para não errar novamente"
                              >
                                {isFeedbackSaved(creative.id, 'visual') ? <Check size={11} className="text-emerald-400" /> : <Bookmark size={11} />}
                                <span>{isFeedbackSaved(creative.id, 'visual') ? 'Salvo nas Regras ✓' : 'Salvar como Observação'}</span>
                              </button>
                            </div>
                            <p className="text-amber-200 text-xs italic font-sans line-clamp-3">
                              "{creative.clientFeedback}"
                            </p>
                          </div>
                        )}

                        {/* CAPTION FEEDBACK BOX */}
                        {creative.captionFeedback && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                ✍️ Ajuste de Legenda:
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveFeedbackAsObservation(creative, creative.captionFeedback!, 'caption');
                                }}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                                  isFeedbackSaved(creative.id, 'caption')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                }`}
                                title="Salvar como observação do cliente para não errar novamente"
                              >
                                {isFeedbackSaved(creative.id, 'caption') ? <Check size={11} className="text-emerald-400" /> : <Bookmark size={11} />}
                                <span>{isFeedbackSaved(creative.id, 'caption') ? 'Salvo nas Regras ✓' : 'Salvar como Observação'}</span>
                              </button>
                            </div>
                            <p className="text-amber-200 text-xs italic font-sans line-clamp-3">
                              "{creative.captionFeedback}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* WORKFLOW ACTION BUTTONS ACCORDING TO SUBMENU */}
                      <div className="pt-3 border-t border-[#24242D] space-y-2">
                        
                        {/* 1. ACTIONS FOR APROVADOS TAB */}
                        {activeSubMenu === 'approved' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenScheduleModal(creative)}
                              className="py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Calendar size={13} />
                              <span>Agendar</span>
                            </button>

                            <button
                              onClick={() => handleMarkAsPosted(creative)}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                            >
                              <Rocket size={13} />
                              <span>Marcar Postado</span>
                            </button>
                          </div>
                        )}

                        {/* 2. ACTIONS FOR AGENDADOS TAB */}
                        {activeSubMenu === 'scheduled' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleMoveToApproved(creative)}
                              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                            >
                              <RotateCcw size={12} />
                              <span>Desagendar</span>
                            </button>

                            <button
                              onClick={() => handleMarkAsPosted(creative)}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                            >
                              <Rocket size={13} />
                              <span>Marcar Postado</span>
                            </button>
                          </div>
                        )}

                        {/* 3. ACTIONS FOR AGUARDANDO MUDANÇA TAB */}
                        {activeSubMenu === 'changes_requested' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleOpenEditModal(creative)}
                              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Edit3 size={13} />
                              <span>Ajustar Arte</span>
                            </button>

                            <button
                              onClick={() => handleResubmitForApproval(creative)}
                              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                            >
                              <Send size={13} />
                              <span>Reenviar p/ Aprovar</span>
                            </button>
                          </div>
                        )}

                        {/* 4. ACTIONS FOR POSTADOS TAB */}
                        {activeSubMenu === 'posted' && (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleMoveToApproved(creative)}
                              className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <RotateCcw size={12} />
                              <span>Desmarcar Postado</span>
                            </button>

                            <button
                              onClick={() => handleViewAsClient(creative.shareToken, 'all')}
                              className="py-1.5 px-3 rounded-xl bg-[#17171F] hover:bg-[#20202B] text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Eye size={12} />
                              <span>Visualizar</span>
                            </button>
                          </div>
                        )}

                        {/* 5. ACTIONS FOR REJEITADOS TAB */}
                        {activeSubMenu === 'rejected' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleRestoreCreative(creative)}
                              className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                            >
                              <RotateCcw size={13} />
                              <span>Restaurar</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCreative(creative.id)}
                              className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Trash2 size={13} />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}

                        {/* LINK COPY & SHARE ROW */}
                        <div className="flex items-center justify-between text-[#686873] pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenShareModal(creative, creative.clientId, 'all', 'single')}
                              className="p-1.5 rounded-lg bg-[#17171F] hover:bg-[#8B5CF6]/20 text-[#A78BFA] hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1 font-semibold"
                              title="Opções de compartilhamento e permissão de download"
                            >
                              <Share2 size={12} />
                              <span className="text-[11px]">Compartilhar</span>
                            </button>

                            <button
                              onClick={() => handleCopyLink(creative.shareToken, creative.id)}
                              className="p-1.5 rounded-lg hover:bg-[#17171F] hover:text-[#F2F2F5] transition-all cursor-pointer text-xs flex items-center gap-1"
                              title="Copiar link rápido"
                            >
                              {copiedToken === (creative.shareToken || creative.id) ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span className="text-[11px]">{copiedToken === (creative.shareToken || creative.id) ? 'Copiado' : 'Link'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(creative)}
                              className="p-1.5 rounded-lg hover:bg-[#17171F] hover:text-[#F2F2F5] transition-all cursor-pointer text-xs"
                              title="Editar"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteCreative(creative.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer text-xs"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SCHEDULE MODAL                                                         */}
      {/* ========================================================================= */}
      <CreativeScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSchedulingCreative(null);
        }}
        creative={schedulingCreative}
        onConfirmSchedule={handleConfirmSchedule}
      />

      {/* ========================================================================= */}
      {/* 4. QUICK CAPTION & COPY MANAGER MODAL                                     */}
      {/* ========================================================================= */}
      {isCaptionModalOpen && captionModalCreative && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#14141f] border border-amber-500/30 max-w-2xl w-full rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <AlignLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    Gerenciador de Legenda & Copywriting
                  </h3>
                  <span className="text-xs text-zinc-400 block truncate max-w-sm">
                    Post: {captionModalCreative.title} ({captionModalCreative.clientName || 'Cliente'})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCaptionModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* CLIENT FEEDBACK ON CAPTION (IF ANY) */}
            {captionModalCreative.captionFeedback && (
              <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    💬 Feedback do Cliente sobre a Legenda:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveFeedbackAsObservation(captionModalCreative, captionModalCreative.captionFeedback!, 'caption')}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Bookmark size={11} />
                    <span>Salvar nas Regras</span>
                  </button>
                </div>
                <p className="text-xs text-amber-200 italic">
                  "{captionModalCreative.captionFeedback}"
                </p>
              </div>
            )}

            {/* AI ASSISTANT PANEL */}
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                  <Sparkles size={16} className="text-purple-400" />
                  <span>Assistente de Copy & Legendas IA</span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Respeita Regras do Cliente
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Tom de Voz</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="persuasivo e envolvente">Persuasivo e Envolvente</option>
                    <option value="educativo e autoridade">Educativo / Especialista</option>
                    <option value="descontraído e viral">Descontraído / Viral</option>
                    <option value="direto e minimalista">Direto e Minimalista</option>
                    <option value="emocional e inspirador">Emocional e Inspirador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Objetivo da Copy</label>
                  <select
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="engajamento e conversão">Engajamento & Comentários</option>
                    <option value="salvamentos e compartilhamentos">Salvar & Compartilhar</option>
                    <option value="chamada para ação no direct">Chamar no Direct / WhatsApp</option>
                    <option value="venda e clique no link">Venda Direta / Link na Bio</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAICaption}
                disabled={isGeneratingAICaption}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isGeneratingAICaption ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Gerando copy inteligente...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>{captionText ? 'Melhorar / Reescrever Legenda com IA' : 'Gerar Legenda Completa com IA'}</span>
                  </>
                )}
              </button>
            </div>

            {/* TEXTAREA FOR CAPTION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                  Texto da Legenda / Copywriting
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {captionText.length} caracteres
                </span>
              </div>
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Escreva a legenda completa do post, incluindo quebras de linha, emojis e hashtags..."
                rows={8}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsCaptionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveQuickCaption(false)}
                  disabled={isSavingCaption}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-all cursor-pointer text-center"
                >
                  Salvar Rascunho
                </button>

                <button
                  onClick={() => handleSaveQuickCaption(true)}
                  disabled={isSavingCaption || !captionText.trim()}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>Salvar & Gerar Link de Legenda</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT FULL CREATIVE MODAL                                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121218] border border-zinc-800 max-w-4xl w-full rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-600/15 border border-purple-500/30 text-purple-400">
                  {editingCreative ? <Edit3 size={20} /> : <Plus size={20} strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">
                    {editingCreative ? 'Editar Criativo' : 'Novo Criativo para Aprovação'}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Carrosséis de até 20 imagens, vídeos de até 15GB ou posts estáticos.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* ERROR ALERT */}
            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* FORM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT: INFO & FORMAT */}
              <div className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Título do Criativo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carrossel: 5 Estratégias de Tráfego Pago"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                {/* Client Select */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Cliente / Marca *
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {clients.length === 0 ? (
                      <option value="default_client">Marca Principal (Workspace)</option>
                    ) : (
                      clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Format Selector */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Formato do Conteúdo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFormat('carousel')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        formFormat === 'carousel'
                          ? 'bg-purple-600/20 border-purple-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layers size={18} className="mx-auto mb-1 text-purple-400" />
                      <span className="text-xs block">Carrossel</span>
                      <span className="text-[10px] text-zinc-500 block">Até 20 slides</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormFormat('video')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        formFormat === 'video'
                          ? 'bg-orange-600/20 border-orange-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Film size={18} className="mx-auto mb-1 text-orange-400" />
                      <span className="text-xs block">Vídeo / Reel</span>
                      <span className="text-[10px] text-zinc-500 block">Até 15GB</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormFormat('single_image')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        formFormat === 'single_image'
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon size={18} className="mx-auto mb-1 text-blue-400" />
                      <span className="text-xs block">Imagem Única</span>
                      <span className="text-[10px] text-zinc-500 block">Post estático</span>
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Proporção da Imagem
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['1:1', '4:5', '9:16', '16:9'] as const).map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setFormAspectRatio(ratio)}
                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                          formAspectRatio === ratio
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption / Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1">
                      <AlignLeft size={12} className="text-amber-400" />
                      <span>Legenda / Copy (Opcional)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Pode adicionar agora ou depois</span>
                  </div>
                  <textarea
                    placeholder="Cole ou digite a legenda do post (ou adicione depois para aprovação de legenda)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

              </div>

              {/* RIGHT: FILE UPLOAD & SLIDE REORDERING */}
              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                    Arquivos do Criativo ({formAssets.length}/20) *
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    {formFormat === 'carousel' ? 'Arraste ou use as setas para ordenar' : 'Vídeos de até 15GB suportados'}
                  </span>
                </div>

                {/* UPLOAD DROPZONE */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={formFormat === 'carousel'}
                    accept={formFormat === 'video' ? 'video/*' : 'image/*,video/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-purple-600/20 text-zinc-400 group-hover:text-purple-400 flex items-center justify-center mx-auto mb-2 transition-all">
                    {isProcessingFiles ? (
                      <RefreshCw size={22} className="animate-spin" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-white mb-0.5">
                    {isProcessingFiles ? 'Processando arquivos...' : 'Clique para selecionar imagens ou vídeos'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {formFormat === 'carousel'
                      ? 'Selecione até 20 imagens de uma vez só para montar o carrossel'
                      : 'Suporte a MP4, MOV, WEBM e imagens de alta resolução'}
                  </p>
                </div>

                {/* SLIDES PREVIEW & REORDER LIST */}
                {formAssets.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-zinc-400 block">
                      Ordenação dos Slides ({formAssets.length} itens):
                    </span>

                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                      {formAssets.map((asset, idx) => (
                        <div
                          key={asset.id || idx}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 group ${
                            idx === previewSlideIndex ? 'border-purple-500' : 'border-zinc-800'
                          }`}
                        >
                          <img
                            src={asset.url}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                            {idx + 1}
                          </span>

                          {/* REORDER / DELETE ACTIONS OVERLAY */}
                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveAsset(idx, 'left');
                                }}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px]"
                                title="Mover para esquerda"
                              >
                                ◀
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAsset(idx);
                              }}
                              className="p-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px]"
                              title="Remover slide"
                            >
                              ✕
                            </button>
                            {idx < formAssets.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveAsset(idx, 'right');
                                }}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px]"
                                title="Mover para direita"
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCreative('draft')}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-all cursor-pointer text-center"
                >
                  Salvar Rascunho
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCreative('pending_approval')}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar e Gerar Link'}</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. IN-APP CLIENT APPROVAL PREVIEW MODAL                                   */}
      {/* ========================================================================= */}
      {(previewingShareToken || previewingHubClientId) && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col">
          <div className="bg-[#121218] border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                previewingFocus === 'caption'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
              }`}>
                {previewingHubClientId 
                  ? (previewingFocus === 'caption' ? 'Central Geral de Legendas (Pré-visualização)' : 'Central Geral do Cliente (Pré-visualização)')
                  : (previewingFocus === 'caption' ? 'Aprovação de Legenda (Pré-visualização)' : 'Criativo Individual (Pré-visualização)')}
              </span>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Esta é a visualização exata que seu cliente terá ao abrir o link.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const url = previewingHubClientId
                    ? `${window.location.origin}/aprovar?client=${previewingHubClientId}&mode=hub${previewingFocus === 'caption' ? '&focus=caption' : ''}`
                    : `${window.location.origin}/aprovar?creativeToken=${previewingShareToken}${previewingFocus === 'caption' ? '&focus=caption' : ''}`;
                  const success = await copyToClipboard(url);
                  if (success) {
                    if (previewingShareToken) setCopiedToken(previewingShareToken);
                    if (previewingHubClientId) setCopiedGeneralLink(true);
                    setTimeout(() => {
                      setCopiedToken(null);
                      setCopiedGeneralLink(false);
                    }, 3000);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>
                  {copiedToken || copiedGeneralLink ? 'Link Copiado!' : 'Copiar Link Real'}
                </span>
              </button>
              
              <button
                onClick={() => {
                  setPreviewingShareToken(null);
                  setPreviewingHubClientId(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <X size={15} />
                <span>Fechar Pré-visualização</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ClientCreativeApprovalPage
              shareToken={previewingShareToken || undefined}
              clientToken={previewingHubClientId || undefined}
              initialMode={previewingHubClientId ? 'hub' : 'single'}
              initialFocus={previewingFocus}
              onBackToApp={() => {
                setPreviewingShareToken(null);
                setPreviewingHubClientId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DESIGNER CAROUSEL AI GENERATOR MODAL                                  */}
      {/* ========================================================================= */}
      <DesignerCarouselAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        clients={clients}
        activeClientId={formClientId || selectedClientId}
        currentUser={currentUser}
        onApplyToCreative={handleApplyAIToCreative}
      />

      {/* ========================================================================= */}
      {/* 8. CLIENT OBSERVATIONS & BRAND GUIDELINES MODAL                           */}
      {/* ========================================================================= */}
      <ClientObservationsModal
        isOpen={isObservationsModalOpen}
        onClose={() => setIsObservationsModalOpen(false)}
        clients={clients}
        activeClientId={selectedClientId !== 'all' ? selectedClientId : undefined}
        currentUser={currentUser}
        observations={observations}
        onSaveObservation={handleSaveObservation}
        onDeleteObservation={handleDeleteObservation}
      />

      {/* ========================================================================= */}
      {/* 9. SHARE CREATIVE & HUB APPROVAL MODAL (WITH DOWNLOAD PERMISSION TOGGLE)  */}
      {/* ========================================================================= */}
      <ShareCreativeModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig({ isOpen: false })}
        creatives={creatives}
        clients={clients}
        initialCreative={shareModalConfig.creative}
        initialClientId={shareModalConfig.clientId}
        initialFocus={shareModalConfig.focus}
        initialMode={shareModalConfig.mode}
      />

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-70 bg-[#171722] border border-amber-500/50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md"
          >
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <CheckCircle2 size={15} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
