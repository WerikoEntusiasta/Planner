import React, { useState, useEffect, useRef } from 'react';
import { Creative, CreativeAsset, CreativeFormat, CreativeStatus, Client, User } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Sparkles, Plus, Image as ImageIcon, Film, LayoutGrid, Check, 
  X, MessageSquare, Send, Copy, ExternalLink, Trash2, Edit3, 
  ArrowLeft, ArrowRight, Star, Clock, CheckCircle2, AlertCircle, 
  Search, Filter, Smartphone, RefreshCw, Upload, Eye, Layers, 
  CheckCheck, Share2, HelpCircle, Shield, AlignLeft, FileText, 
  Wand2, MessageCircle, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClientCreativeApprovalPage from './ClientCreativeApprovalPage';
import DesignerCarouselAIModal, { GeneratedCarouselData } from './DesignerCarouselAIModal';

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

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCaptionStatus, setFilterCaptionStatus] = useState<string>('all');
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

  // Modal State for Creating/Editing full creative
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

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

  useEffect(() => {
    loadCreatives();
  }, [currentUser, selectedClientId]);

  // Handle open modal for new creative
  const handleOpenCreateModal = () => {
    setEditingCreative(null);
    setFormTitle('');
    setFormDescription('');
    setFormClientId(activeClientId || clients[0]?.id || 'default_client');
    setFormFormat('carousel');
    setFormPlatform('instagram');
    setFormAspectRatio('1:1');
    setFormAssets([]);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsSaving(false);
    setIsProcessingFiles(false);
    setIsModalOpen(true);
  };

  // Handle open modal for edit full creative
  const handleOpenEditModal = (creative: Creative) => {
    setEditingCreative(creative);
    setFormTitle(creative.title);
    setFormDescription(creative.description || '');
    setFormClientId(creative.clientId || activeClientId || clients[0]?.id || 'default_client');
    setFormFormat(creative.format);
    setFormPlatform(creative.platform);
    setFormAspectRatio(creative.aspectRatio || '1:1');
    setFormAssets(creative.assets || []);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsSaving(false);
    setIsProcessingFiles(false);
    setIsModalOpen(true);
  };

  // Handle open Quick Caption Editor
  const handleOpenCaptionEditor = (creative: Creative) => {
    setCaptionModalCreative(creative);
    setCaptionText(creative.description || '');
    setIsCaptionModalOpen(true);
  };

  // Handle Save Quick Caption
  const handleSaveCaption = async (generateLinkImmediately = false) => {
    if (!captionModalCreative) return;
    setIsSavingCaption(true);

    const updatedCreative: Creative = {
      ...captionModalCreative,
      description: captionText.trim(),
      captionStatus: captionText.trim() ? 'pending_approval' : undefined,
      updatedAt: new Date().toISOString()
    };

    // Optimistic UI update
    const updatedCreatives = creatives.map(c => c.id === captionModalCreative.id ? updatedCreative : c);
    setCreatives(updatedCreatives);
    try {
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updatedCreatives));
    } catch (e) {}

    // Save to server
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
        console.error('Failed to save caption on server:', err);
      }
    }

    setIsSavingCaption(false);

    if (generateLinkImmediately) {
      handleCopyCaptionLink(captionModalCreative.shareToken);
    } else {
      setIsCaptionModalOpen(false);
    }
  };

  // Handle AI Generate Caption using Gemini 3.7 Flash
  const handleGenerateAICaption = async () => {
    if (!captionModalCreative) return;
    setIsGeneratingAICaption(true);
    try {
      const res = await fetch('/api/ai/caption-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: captionModalCreative.title,
          clientName: captionModalCreative.clientName,
          platform: captionModalCreative.platform,
          format: captionModalCreative.format,
          tone: aiTone,
          goal: aiGoal,
          existingCaption: captionText
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.caption) {
        setCaptionText(data.data.caption);
      } else {
        alert('Não foi possível gerar a legenda no momento. Tente novamente.');
      }
    } catch (err) {
      console.error('Error generating caption:', err);
      alert('Erro ao conectar com a IA para gerar legenda.');
    } finally {
      setIsGeneratingAICaption(false);
    }
  };

  // Handle Apply AI generated carousel into creative form
  const handleApplyAIToCreative = (carouselData: GeneratedCarouselData) => {
    setEditingCreative(null);
    setFormTitle(carouselData.title || `Carrossel: ${carouselData.hook.slice(0, 40)}`);
    setFormDescription(`${carouselData.caption}\n\n${(carouselData.hashtags || []).join(' ')}`);
    setFormClientId(selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'default_client'));
    setFormFormat('carousel');
    setFormPlatform('instagram');
    setFormAspectRatio('1:1');
    setFormAssets([]);
    setPreviewSlideIndex(0);
    setUploadError(null);
    setIsSaving(false);
    setIsProcessingFiles(false);
    setIsModalOpen(true);
  };

  // Client-side image compression helper
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  // Process uploaded files (Carousels up to 20 images or Videos up to 15GB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError(null);
    setIsProcessingFiles(true);

    try {
      const remainingSlots = 20 - formAssets.length;
      if (remainingSlots <= 0) {
        setUploadError('Limite de 20 slides por carrossel atingido.');
        setIsProcessingFiles(false);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      const newAssets: CreativeAsset[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
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

  // Remove asset from form
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

  // Move asset order in carousel
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
      assets: formAssets,
      aspectRatio: formAspectRatio,
      shareToken: editingCreative?.shareToken || `token_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`,
      createdAt: editingCreative?.createdAt || now,
      updatedAt: now
    };

    // Optimistic state update
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

    // Save to server
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

  // ==========================================
  // LINK SHARING & COPYING HANDLERS
  // ==========================================

  // 1. Copy Individual Client Approval Link (Full Post)
  const handleCopyLink = async (shareToken: string) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${shareToken}`;
    const success = await copyToClipboard(approvalUrl);
    if (success) {
      setCopiedToken(shareToken);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  // 2. Copy Individual Caption Approval Link (Focus on Caption)
  const handleCopyCaptionLink = async (shareToken: string) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${shareToken}&focus=caption`;
    const success = await copyToClipboard(approvalUrl);
    if (success) {
      setCopiedCaptionToken(shareToken);
      setTimeout(() => setCopiedCaptionToken(null), 3000);
    }
  };

  // 3. Share Individual Post on WhatsApp
  const handleShareWhatsApp = (creative: Creative) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${creative.shareToken}`;
    const message = encodeURIComponent(
      `Olá! O criativo "${creative.title}" está pronto para sua aprovação no nosso portal.\n\n` +
      `🔗 Acesse para visualizar em formato real e aprovar com 1 clique:\n${approvalUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // 4. Share Individual Caption on WhatsApp
  const handleShareCaptionWhatsApp = (creative: Creative) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${creative.shareToken}&focus=caption`;
    const message = encodeURIComponent(
      `Olá! Adicionei a legenda para o criativo "${creative.title}".\n\n` +
      `✍️ Revise o texto e aprove com 1 clique pelo link:\n${approvalUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // 5. Copy General Client Approval Hub Link (All Creatives)
  const handleCopyGeneralLink = async (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const hubUrl = `${origin}/aprovar?client=${resolvedClient}&mode=hub`;
    const success = await copyToClipboard(hubUrl);
    if (success) {
      setCopiedGeneralLink(true);
      setTimeout(() => setCopiedGeneralLink(false), 3000);
    }
  };

  // 6. Copy General Caption Approval Hub Link (All Captions)
  const handleCopyGeneralCaptionLink = async (targetClientId?: string) => {
    const origin = window.location.origin;
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    const hubUrl = `${origin}/aprovar?client=${resolvedClient}&focus=caption&mode=hub`;
    const success = await copyToClipboard(hubUrl);
    if (success) {
      setCopiedGeneralCaptionLink(true);
      setTimeout(() => setCopiedGeneralCaptionLink(false), 3000);
    }
  };

  // 7. Share General Client Approval Hub on WhatsApp
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

  // 8. Share General Caption Approval Hub on WhatsApp
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

  // Open Preview as client
  const handleViewAsClient = (shareToken: string, focus: 'all' | 'visual' | 'caption' = 'all') => {
    setPreviewingFocus(focus);
    setPreviewingShareToken(shareToken);
  };

  const handlePreviewGeneralHub = (targetClientId?: string, focus: 'all' | 'visual' | 'caption' = 'all') => {
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    setPreviewingFocus(focus);
    setPreviewingHubClientId(resolvedClient);
  };

  // Filtered creatives list
  const filteredCreatives = creatives.filter(c => {
    if (selectedClientId !== 'all' && c.clientId !== selectedClientId) return false;
    if (filterFormat !== 'all' && c.format !== filterFormat) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    
    if (filterCaptionStatus !== 'all' && c.status === 'rejected') return false;
    if (filterCaptionStatus === 'missing' && Boolean(c.description?.trim())) return false;
    if (filterCaptionStatus === 'has_caption' && !c.description?.trim()) return false;
    if (filterCaptionStatus === 'pending_approval' && (!c.description?.trim() || (c.captionStatus && c.captionStatus !== 'pending_approval' && c.captionStatus !== 'draft'))) return false;
    if (filterCaptionStatus === 'approved' && (!c.description?.trim() || c.captionStatus !== 'approved')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchClient = c.clientName?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      return matchTitle || matchClient || matchDesc;
    }
    return true;
  });

  // Calculate stats
  const totalCount = creatives.length;
  const pendingCount = creatives.filter(c => c.status === 'pending_approval' || c.status === 'draft').length;
  const approvedCount = creatives.filter(c => c.status === 'approved').length;
  const changesCount = creatives.filter(c => c.status === 'changes_requested').length;
  
  const validCaptionCreatives = creatives.filter(c => c.status !== 'rejected');
  const totalWithCaption = validCaptionCreatives.filter(c => Boolean(c.description?.trim())).length;
  const pendingCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && (c.captionStatus === 'pending_approval' || !c.captionStatus || c.captionStatus === 'draft')).length;
  const missingCaptionsCount = validCaptionCreatives.filter(c => !c.description?.trim()).length;

  const currentSelectedClientObj = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. HERO HEADER WITH STATS & CTA */}
      <div className="p-6 md:p-7 bg-[#121218] rounded-2xl border border-[#24242D] relative shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#A78BFA] text-xs font-mono font-bold uppercase tracking-wider">
              <Layers size={14} className="text-[#8B5CF6]" />
              <span>Central de Criativos & Aprovação de Legendas</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F2F2F5] tracking-tight">
              Organize Carrosséis, Vídeos e Legendas
            </h1>
            <p className="text-xs md:text-sm text-[#92929F] leading-relaxed">
              Envie artes visuais, carrosséis de até 20 slides ou vídeos de até 15GB. Se enviar sem legenda, você pode <strong className="text-[#F2F2F5]">adicionar e gerar o link de aprovação de legenda individual ou da central toda</strong> com 1 clique a qualquer momento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-display font-semibold text-xs bg-[#17171F] hover:bg-[#20202B] text-[#F2F2F5] border border-[#24242D] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#A78BFA]" />
              <span>Gerar Textos para Carrossel (IA)</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl font-display font-bold text-xs bg-white hover:bg-zinc-100 text-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Novo Criativo</span>
            </button>
          </div>
        </div>

        {/* 1.1 PROMINENT GENERAL LINKS BANNERS (MÍDIAS & LEGENDAS DA CENTRAL) */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* GENERAL HUB: CRIATIVOS & MÍDIAS */}
          <div className="p-4 md:p-5 bg-[#17171F] rounded-xl border border-[#24242D] flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 text-[10px] font-mono font-bold uppercase">
                  Central Geral de Criativos
                </span>
                <h3 className="text-xs font-semibold text-[#F2F2F5] font-display">
                  Link Geral da Marca {currentSelectedClientObj ? `(${currentSelectedClientObj.name})` : ''}
                </h3>
              </div>
              <p className="text-xs text-[#92929F]">
                Aprovação completa dos posts e carrosséis ({pendingCount} pendentes).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopyGeneralLink()}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  copiedGeneralLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
                }`}
              >
                {copiedGeneralLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedGeneralLink ? 'Link Copiado!' : 'Copiar Link da Central'}</span>
              </button>

              <button
                onClick={() => handleShareGeneralWhatsApp()}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-emerald-400 border border-[#24242D] transition-all cursor-pointer"
                title="Enviar no WhatsApp"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={() => handlePreviewGeneralHub(undefined, 'all')}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-[#92929F] hover:text-[#F2F2F5] border border-[#24242D] transition-all cursor-pointer"
                title="Visualizar como Cliente"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* GENERAL HUB: APROVAÇÃO DE LEGENDAS DA CENTRAL TODA */}
          <div className="p-4 md:p-5 bg-gradient-to-r from-[#1b1712] to-[#17171F] rounded-xl border border-amber-500/25 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                  <AlignLeft size={11} />
                  <span>Central Geral de Legendas</span>
                </span>
                <h3 className="text-xs font-semibold text-white font-display">
                  Aprovação de Todas as Legendas
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Gera um link exclusivo para o cliente aprovar todas as legendas e copys de uma vez só.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopyGeneralCaptionLink()}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  copiedGeneralCaptionLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {copiedGeneralCaptionLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedGeneralCaptionLink ? 'Link de Legendas Copiado!' : 'Copiar Link de Legendas da Central'}</span>
              </button>

              <button
                onClick={() => handleShareGeneralCaptionWhatsApp()}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                title="Enviar Legendas da Central no WhatsApp"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={() => handlePreviewGeneralHub(undefined, 'caption')}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-zinc-400 hover:text-white border border-[#24242D] transition-all cursor-pointer"
                title="Visualizar Central de Legendas como Cliente"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* STATS COUNTERS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#24242D]">
          <div className="bg-[#17171F] border border-[#24242D] rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-[#686873] block mb-0.5">Total Criativos</span>
            <div className="text-xl font-bold font-display text-[#F2F2F5]">{totalCount}</div>
          </div>
          <div className="bg-[#17171F] border border-[#F97316]/20 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-[#F97316] block mb-0.5 flex items-center gap-1">
              <Clock size={11} /> Aguardando Aprovação
            </span>
            <div className="text-xl font-bold font-display text-[#F97316]">{pendingCount}</div>
          </div>
          <div className="bg-[#17171F] border border-blue-500/20 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400 block mb-0.5 flex items-center gap-1">
              <CheckCircle2 size={11} /> Aprovados
            </span>
            <div className="text-xl font-bold font-display text-blue-400">{approvedCount}</div>
          </div>
          <div className="bg-[#17171F] border border-amber-500/20 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-0.5 flex items-center gap-1">
              <AlignLeft size={11} /> Com Legenda Cadastrada
            </span>
            <div className="text-xl font-bold font-display text-amber-400">{totalWithCaption} <span className="text-xs text-zinc-500 font-normal">({missingCaptionsCount} sem legenda)</span></div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
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
            <option value="carousel">🎠 Carrossel (Até 20 imagens)</option>
            <option value="video">🎬 Vídeo (Até 15GB)</option>
            <option value="single_image">🖼️ Imagem Única</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-[#F2F2F5] focus:outline-none focus:border-[#8B5CF6]/50 cursor-pointer"
          >
            <option value="all">Status do Visual</option>
            <option value="pending_approval">⏳ Aguardando Aprovação</option>
            <option value="approved">🔵 Aprovados</option>
            <option value="changes_requested">⚠️ Ajustes Solicitados</option>
          </select>

          {/* Caption Filter */}
          <select
            value={filterCaptionStatus}
            onChange={(e) => setFilterCaptionStatus(e.target.value)}
            className="bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-[#F2F2F5] focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="all">Filtro de Legendas</option>
            <option value="missing">⚠️ Sem Legenda (Adicionar)</option>
            <option value="has_caption">✍️ Com Legenda</option>
            <option value="pending_approval">⏳ Legendas Pendentes</option>
            <option value="approved">✅ Legendas Aprovadas</option>
          </select>

        </div>
      </div>

      {/* 3. CREATIVES GRID VIEW */}
      {filteredCreatives.length === 0 ? (
        <div className="bg-[#121218] border border-[#24242D] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-center justify-center text-[#686873] mx-auto">
            <Layers size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#F2F2F5] font-display">Nenhum criativo encontrado</h3>
            <p className="text-xs text-[#92929F] max-w-sm mx-auto">
              Crie seu primeiro post em carrossel ou vídeo para enviar para aprovação do cliente.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-black text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Criar Primeiro Post</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreatives.map((creative) => {
            const firstAsset = creative.assets?.[0];
            const isCarousel = creative.format === 'carousel' || (creative.assets || []).length > 1;
            const isVideo = creative.format === 'video' || firstAsset?.type === 'video';
            const isPending = creative.status === 'pending_approval' || creative.status === 'draft';
            const isApproved = creative.status === 'approved';
            const isChanges = creative.status === 'changes_requested';

            const hasCaption = Boolean(creative.description?.trim());
            const isCaptionPending = hasCaption && (creative.captionStatus === 'pending_approval' || !creative.captionStatus || creative.captionStatus === 'draft');
            const isCaptionApproved = hasCaption && creative.captionStatus === 'approved';
            const isCaptionChanges = hasCaption && creative.captionStatus === 'changes_requested';

            return (
              <div
                key={creative.id}
                className={`bg-[#121218] rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col group ${
                  isPending
                    ? 'border-[#F97316]/30 hover:border-[#F97316]/60'
                    : isApproved
                    ? 'border-blue-500/30 hover:border-blue-500/60'
                    : isChanges
                    ? 'border-amber-500/30 hover:border-amber-500/60'
                    : 'border-[#24242D] hover:border-[#8B5CF6]/30'
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

                  {/* STATUS BADGE (VISUAL) */}
                  <div className="absolute top-3 right-3">
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <Clock size={12} /> Visual Pendente
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={12} /> Criativo Aprovado
                      </span>
                    )}
                    {isChanges && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <Clock size={12} /> Ajustes no Visual
                      </span>
                    )}
                    {creative.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <X size={12} /> Criativo Reprovado
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

                    {/* CAPTION PILL / QUICK BUTTON */}
                    <div className="pt-1">
                      {hasCaption ? (
                        <div className="p-2.5 bg-[#17171F] border border-[#24242D] rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                              isCaptionApproved
                                ? 'text-emerald-400'
                                : isCaptionChanges
                                ? 'text-amber-400'
                                : 'text-orange-400'
                            }`}>
                              <AlignLeft size={11} />
                              <span>{isCaptionApproved ? 'Legenda Aprovada' : isCaptionChanges ? 'Ajuste na Legenda' : 'Legenda Pendente'}</span>
                            </span>

                            <button
                              onClick={() => handleOpenCaptionEditor(creative)}
                              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={11} />
                              <span>Editar Copy</span>
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
                          <span>Adicionar Legenda / Gerar Link de Legenda</span>
                        </button>
                      )}
                    </div>

                    {creative.clientFeedback && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                        💬 Visual: "{creative.clientFeedback}"
                      </div>
                    )}

                    {creative.captionFeedback && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                        ✍️ Legenda: "{creative.captionFeedback}"
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="pt-3 border-t border-[#24242D] space-y-2">
                    
                    {/* Link Actions row */}
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Post Approval Link */}
                      <button
                        onClick={() => handleCopyLink(creative.shareToken)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                          copiedToken === creative.shareToken
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#17171F] hover:bg-[#20202B] text-[#F2F2F5] border border-[#24242D]'
                        }`}
                        title="Copiar link de aprovação completa do post"
                      >
                        {copiedToken === creative.shareToken ? <Check size={12} /> : <Copy size={12} />}
                        <span className="truncate">{copiedToken === creative.shareToken ? 'Copiado!' : 'Link Completo'}</span>
                      </button>

                      {/* Caption Approval Link */}
                      <button
                        onClick={() => {
                          if (!hasCaption) {
                            handleOpenCaptionEditor(creative);
                          } else {
                            handleCopyCaptionLink(creative.shareToken);
                          }
                        }}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                          copiedCaptionToken === creative.shareToken
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1b1712] hover:bg-[#251f18] text-amber-400 border border-amber-500/30'
                        }`}
                        title="Copiar link focado na aprovação da legenda"
                      >
                        {copiedCaptionToken === creative.shareToken ? <Check size={12} /> : <AlignLeft size={12} />}
                        <span className="truncate">{copiedCaptionToken === creative.shareToken ? 'Copiado!' : 'Link Legenda'}</span>
                      </button>

                    </div>

                    {/* Secondary WhatsApp and Preview row */}
                    <div className="flex items-center justify-between text-[#686873] pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleShareWhatsApp(creative)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer text-xs flex items-center gap-1"
                          title="WhatsApp do Post"
                        >
                          <Share2 size={13} />
                          <span className="text-[11px]">Zap Post</span>
                        </button>

                        {hasCaption && (
                          <button
                            onClick={() => handleShareCaptionWhatsApp(creative)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-all cursor-pointer text-xs flex items-center gap-1"
                            title="WhatsApp da Legenda"
                          >
                            <MessageSquare size={13} />
                            <span className="text-[11px]">Zap Legenda</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(creative)}
                          className="p-1.5 rounded-lg hover:bg-[#17171F] hover:text-[#F2F2F5] transition-all cursor-pointer text-xs flex items-center gap-1"
                          title="Editar post completo"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
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

            {/* AI GENERATOR TRIGGER */}
            <div className="p-4 bg-gradient-to-r from-purple-950/40 via-[#171722] to-amber-950/40 border border-purple-500/25 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">Criar / Aprimorar Legenda com Inteligência Artificial</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAICaption}
                  disabled={isGeneratingAICaption}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                >
                  <Wand2 size={13} />
                  <span>{isGeneratingAICaption ? 'Gerando Legenda...' : '✨ Gerar Legenda com IA'}</span>
                </button>
              </div>

              {/* TONE & GOAL SELECTORS */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">Tom de Voz:</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="persuasivo e envolvente">Persuasivo & Envolvente</option>
                    <option value="educativo e didático">Educativo & Didático</option>
                    <option value="autoridade e especialista">Autoridade & Especialista</option>
                    <option value="descontraído e dinâmico">Descontraído & Dinâmico</option>
                    <option value="direto e minimalista">Direto & Minimalista</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">Objetivo:</label>
                  <select
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="engajamento e comentários">Engajamento & Comentários</option>
                    <option value="salvamentos e compartilhamentos">Salvamentos & Compartilhamento</option>
                    <option value="vendas e clique na bio">Vendas & CTA na Bio / Direct</option>
                    <option value="geração de leads">Geração de Leads</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TEXTAREA FOR CAPTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200 block">
                  Texto da Legenda / Copy Completo:
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  {captionText.length} caracteres
                </span>
              </div>

              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Escreva ou cole a legenda do post com ganchos, quebras de linha e hashtags..."
                className="w-full h-44 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-xs text-white placeholder-zinc-600 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* ACTIONS FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsCaptionModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCaption(false)}
                  disabled={isSavingCaption}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-all cursor-pointer text-center"
                >
                  {isSavingCaption ? 'Salvando...' : 'Salvar Legenda'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCaption(true)}
                  disabled={isSavingCaption || !captionText.trim()}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Copy size={14} />
                  <span>{isSavingCaption ? 'Salvando...' : 'Salvar e Copiar Link de Aprovação'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL FOR CREATING / EDITING FULL CREATIVE (CAROUSEL & VIDEO)          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#14141f] border border-zinc-800 max-w-4xl w-full rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin"
          >
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-orange-500 text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    {editingCreative ? 'Editar Criativo' : 'Novo Criativo para Aprovação'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Configure as imagens do carrossel ou vídeo e gere o link para seu cliente aprovar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
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

      {/* 7. DESIGNER CAROUSEL AI GENERATOR MODAL */}
      <DesignerCarouselAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        clients={clients}
        activeClientId={formClientId || selectedClientId}
        currentUser={currentUser}
        onApplyToCreative={handleApplyAIToCreative}
      />

    </div>
  );
}
