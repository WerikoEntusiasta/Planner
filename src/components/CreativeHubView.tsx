import React, { useState, useEffect, useRef } from 'react';
import { Creative, CreativeAsset, CreativeFormat, CreativeStatus, Client, User } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Sparkles, Plus, Image as ImageIcon, Film, LayoutGrid, Check, 
  X, MessageSquare, Send, Copy, ExternalLink, Trash2, Edit3, 
  ArrowLeft, ArrowRight, Star, Clock, CheckCircle2, AlertCircle, 
  Search, Filter, Smartphone, RefreshCw, Upload, Eye, Layers, 
  CheckCheck, Share2, HelpCircle, Shield
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
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || 'all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedGeneralLink, setCopiedGeneralLink] = useState(false);
  const [previewingShareToken, setPreviewingShareToken] = useState<string | null>(null);
  const [previewingHubClientId, setPreviewingHubClientId] = useState<string | null>(null);

  // Modal State for Creating/Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Modal Form States
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

  // Handle open modal for edit
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

  // Client-side image compression helper for optimal loading, memory, and fast syncing
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  // File Upload Handler (Supports images up to 20 slides, and large videos up to 15GB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    const fileList = Array.from(files);

    if (formFormat === 'carousel') {
      const remainingSlots = 20 - formAssets.length;
      if (fileList.length > remainingSlots) {
        setUploadError(`Você pode adicionar no máximo 20 imagens no carrossel. Foram adicionadas as primeiras ${remainingSlots} selecionadas.`);
      }
    }

    const filesToProcess = formFormat === 'carousel' ? fileList.slice(0, 20 - formAssets.length) : fileList.slice(0, 1);
    setIsProcessingFiles(true);

    try {
      const newAssets: CreativeAsset[] = [];

      for (let index = 0; index < filesToProcess.length; index++) {
        const file = filesToProcess[index];
        const isVideoFile = file.type.startsWith('video/');
        const isImageFile = file.type.startsWith('image/');

        if (!isVideoFile && !isImageFile) {
          setUploadError('Formato de arquivo não suportado. Por favor, envie imagens (PNG, JPG, WEBP) ou vídeos (MP4, MOV, WEBM).');
          continue;
        }

        // Check max video limit (15GB = 15 * 1024 * 1024 * 1024 bytes)
        const maxVideoSize = 15 * 1024 * 1024 * 1024;
        if (isVideoFile && file.size > maxVideoSize) {
          setUploadError('O arquivo de vídeo selecionado excede o limite máximo suportado de 15GB.');
          continue;
        }

        if (isVideoFile) {
          const videoBlobUrl = URL.createObjectURL(file);
          newAssets.push({
            id: `ast_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            url: videoBlobUrl,
            type: 'video',
            size: file.size,
            format: file.name.split('.').pop()?.toLowerCase(),
            order: formAssets.length + index
          });
        } else {
          const compressedDataUrl = await compressImageFile(file);
          if (compressedDataUrl) {
            newAssets.push({
              id: `ast_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              url: compressedDataUrl,
              type: 'image',
              size: file.size,
              format: file.name.split('.').pop()?.toLowerCase(),
              order: formAssets.length + index
            });
          }
        }
      }

      setFormAssets(prev => [...prev, ...newAssets]);
    } catch (err: any) {
      console.error('Error during file processing:', err);
      setUploadError('Ocorreu um erro ao processar as mídias. Tente novamente.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reorder slide left
  const handleMoveSlideLeft = (index: number) => {
    if (index === 0) return;
    const updated = [...formAssets];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    // Re-index orders
    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setFormAssets(reordered);
    setPreviewSlideIndex(index - 1);
  };

  // Reorder slide right
  const handleMoveSlideRight = (index: number) => {
    if (index >= formAssets.length - 1) return;
    const updated = [...formAssets];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    // Re-index orders
    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setFormAssets(reordered);
    setPreviewSlideIndex(index + 1);
  };

  // Set slide as cover (index 0)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const updated = [...formAssets];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setFormAssets(reordered);
    setPreviewSlideIndex(0);
  };

  // Delete slide
  const handleDeleteSlide = (index: number) => {
    const updated = formAssets.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx }));
    setFormAssets(updated);
    if (previewSlideIndex >= updated.length && updated.length > 0) {
      setPreviewSlideIndex(updated.length - 1);
    }
  };

  // Save Creative
  const handleSaveCreative = async (targetStatus: CreativeStatus = 'pending_approval') => {
    if (!formTitle.trim()) {
      setUploadError('Por favor, informe o título do criativo.');
      return;
    }
    const resolvedClientId = formClientId || (clients[0]?.id || 'default_client');
    if (formAssets.length === 0) {
      setUploadError('Por favor, adicione pelo menos uma imagem ou vídeo ao criativo.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      const clientObj = clients.find(c => c.id === resolvedClientId);
      const creativeId = editingCreative?.id || `crt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const shareToken = editingCreative?.shareToken || `appr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newCreative: Creative = {
        id: creativeId,
        userId: currentUser?.id || 'user',
        clientId: resolvedClientId,
        clientName: clientObj?.name || 'Marca Principal',
        title: formTitle.trim(),
        description: formDescription.trim(),
        format: formFormat,
        platform: formPlatform,
        status: editingCreative ? (editingCreative.status === 'draft' ? targetStatus : editingCreative.status) : targetStatus,
        assets: formAssets,
        aspectRatio: formAspectRatio,
        shareToken,
        clientFeedback: editingCreative?.clientFeedback,
        approvalDate: editingCreative?.approvalDate,
        createdAt: editingCreative?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Update React state immediately
      const updatedList = editingCreative
        ? creatives.map(c => c.id === editingCreative.id ? newCreative : c)
        : [newCreative, ...creatives];

      setCreatives(updatedList);

      // Safe localStorage persistence (prevent QuotaExceededError crash when carousels have multiple slides)
      try {
        localStorage.setItem('creator_planner_creatives', JSON.stringify(updatedList));
      } catch (storageErr) {
        console.warn('LocalStorage quota reached, syncing via server database:', storageErr);
        try {
          const lightweightList = updatedList.map(c => ({
            ...c,
            assets: c.assets.slice(0, 3)
          }));
          localStorage.setItem('creator_planner_creatives', JSON.stringify(lightweightList));
        } catch (e) {}
      }

      // 2. Persist to server backend
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
            body: JSON.stringify(newCreative)
          });
        } catch (err) {
          console.error('Offline / Failed to sync creative to backend:', err);
        }
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save creative:', err);
      setUploadError(err?.message || 'Erro inesperado ao salvar criativo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Creative
  const handleDeleteCreative = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este criativo?')) return;

    const updated = creatives.filter(c => c.id !== id);
    setCreatives(updated);
    localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

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

  // Copy Individual Client Approval Link
  const handleCopyLink = async (shareToken: string) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${shareToken}`;
    const success = await copyToClipboard(approvalUrl);
    if (success) {
      setCopiedToken(shareToken);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  // Open WhatsApp with direct single approval message
  const handleShareWhatsApp = (creative: Creative) => {
    const origin = window.location.origin;
    const approvalUrl = `${origin}/aprovar?creativeToken=${creative.shareToken}`;
    const message = encodeURIComponent(
      `Olá! O criativo "${creative.title}" está pronto para sua aprovação no nosso portal.\n\n` +
      `🔗 Acesse para visualizar em formato real e aprovar com 1 clique:\n${approvalUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Copy General Client Approval Hub Link (All creatives in one link)
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

  // Share General Client Approval Hub on WhatsApp
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

  // Open Preview as client (in-app modal or external link)
  const handleViewAsClient = (shareToken: string) => {
    setPreviewingShareToken(shareToken);
  };

  const handlePreviewGeneralHub = (targetClientId?: string) => {
    const resolvedClient = targetClientId || (selectedClientId !== 'all' ? selectedClientId : (clients[0]?.id || 'all'));
    setPreviewingHubClientId(resolvedClient);
  };

  // Filtered creatives list
  const filteredCreatives = creatives.filter(c => {
    if (selectedClientId !== 'all' && c.clientId !== selectedClientId) return false;
    if (filterFormat !== 'all' && c.format !== filterFormat) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
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
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const currentSelectedClientObj = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. HERO HEADER WITH STATS & CTA */}
      <div className="p-6 md:p-7 bg-[#121218] rounded-2xl border border-[#24242D] relative shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#A78BFA] text-xs font-mono font-bold uppercase tracking-wider">
              <Layers size={14} className="text-[#8B5CF6]" />
              <span>Central de Criativos & Aprovação</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F2F2F5] tracking-tight">
              Organize Carrosséis, Vídeos e Imagens
            </h1>
            <p className="text-xs md:text-sm text-[#92929F] leading-relaxed">
              Suba até <strong className="text-[#F2F2F5]">20 imagens em carrossel</strong> com ordenação organizada ou <strong className="text-[#F2F2F5]">vídeos de até 15GB</strong> e compartilhe tanto o link individual de cada post quanto o <strong className="text-[#F2F2F5]">Link Geral da Central</strong> onde o cliente aprova tudo de uma só vez.
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

        {/* 1.1 PROMINENT GENERAL LINK BANNER (LINK GERAL PARA O CLIENTE VER TUDO) */}
        <div className="mt-5 p-4 md:p-5 bg-[#17171F] rounded-xl border border-[#24242D] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 text-[10px] font-mono font-bold uppercase">
                Link Geral da Marca
              </span>
              <h3 className="text-sm font-semibold text-[#F2F2F5] font-display">
                Central Geral de Aprovação do Cliente {currentSelectedClientObj ? `(${currentSelectedClientObj.name})` : ''}
              </h3>
            </div>
            <p className="text-xs text-[#92929F]">
              Envie este link para seu cliente ver <strong className="text-[#F97316]">todos os {pendingCount} criativos pendentes</strong> em uma única tela e aprovar ou solicitar ajustes em lote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleCopyGeneralLink()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                copiedGeneralLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
              }`}
            >
              {copiedGeneralLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedGeneralLink ? 'Link Geral Copiado!' : 'Copiar Link Geral da Central'}</span>
            </button>

            <button
              onClick={() => handleShareGeneralWhatsApp()}
              className="px-3.5 py-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-emerald-400 hover:text-emerald-300 border border-[#24242D] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Enviar Central Completa pelo WhatsApp"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Enviar no WhatsApp</span>
            </button>

            <button
              onClick={() => handlePreviewGeneralHub()}
              className="px-3.5 py-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-[#92929F] hover:text-[#F2F2F5] border border-[#24242D] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Visualizar a Central de Aprovação como o Cliente"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Visualizar como Cliente</span>
            </button>
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
              <MessageSquare size={11} /> Ajustes Solicitados
            </span>
            <div className="text-xl font-bold font-display text-amber-400">{changesCount}</div>
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
            <option value="all">Todos os Status</option>
            <option value="pending_approval">⏳ Aguardando Aprovação</option>
            <option value="approved">🔵 Aprovados</option>
            <option value="changes_requested">⚠️ Ajustes Solicitados</option>
            <option value="draft">📝 Rascunhos</option>
          </select>
        </div>
      </div>

      {/* 3. CREATIVES GRID LIST */}
      {filteredCreatives.length === 0 ? (
        <div className="bg-[#121218] border border-[#24242D] rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-center justify-center text-[#A78BFA] mx-auto">
            <ImageIcon size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F2F2F5] font-display">Nenhum criativo encontrado</h3>
            <p className="text-xs text-[#92929F] max-w-sm mx-auto">
              Suba seu primeiro carrossel de até 20 imagens ou vídeo para enviar o link de aprovação ao cliente.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-black hover:bg-zinc-100 transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Criar Primeiro Criativo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreatives.map((creative) => {
            const firstAsset = creative.assets?.[0];
            const isCarousel = creative.format === 'carousel';
            const isVideo = creative.format === 'video' || firstAsset?.type === 'video';
            const isPending = creative.status === 'pending_approval' || creative.status === 'draft';
            const isApproved = creative.status === 'approved';
            const isChanges = creative.status === 'changes_requested';

            return (
              <div
                key={creative.id}
                className={`bg-[#121218] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group border ${
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
                  onClick={() => handleViewAsClient(creative.shareToken)}
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
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] text-[10px] font-semibold flex items-center gap-1">
                        <Clock size={12} /> Aguardando Aprovação
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Aprovado
                      </span>
                    )}
                    {isChanges && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <Clock size={12} /> Ajustes
                      </span>
                    )}
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#686873]">
                      <span className="text-[#A78BFA] font-semibold uppercase">{creative.clientName || 'Cliente'}</span>
                      <span>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <h3 
                      onClick={() => handleViewAsClient(creative.shareToken)}
                      className="font-semibold text-sm text-[#F2F2F5] line-clamp-1 group-hover:text-[#A78BFA] transition-colors cursor-pointer"
                    >
                      {creative.title}
                    </h3>

                    {creative.description && (
                      <p className="text-xs text-[#92929F] line-clamp-2 leading-relaxed">
                        {creative.description}
                      </p>
                    )}

                    {creative.clientFeedback && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                        💬 "{creative.clientFeedback}"
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="pt-3 border-t border-[#24242D] space-y-2">
                    
                    {/* Individual Post Approval Link Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(creative.shareToken)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                          copiedToken === creative.shareToken
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#17171F] hover:bg-[#20202B] text-[#F2F2F5] border border-[#24242D]'
                        }`}
                        title="Copiar link de aprovação individual deste post"
                      >
                        {copiedToken === creative.shareToken ? (
                          <>
                            <Check size={13} />
                            <span>Link Individual Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar Link Individual</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(creative)}
                        className="p-2 rounded-xl bg-[#17171F] hover:bg-emerald-500/20 text-emerald-400 border border-[#24242D] transition-all cursor-pointer flex-shrink-0"
                        title="Enviar este post pelo WhatsApp"
                      >
                        <Share2 size={14} />
                      </button>

                      <button
                        onClick={() => handleViewAsClient(creative.shareToken)}
                        className="p-2 rounded-xl bg-[#17171F] hover:bg-[#20202B] text-[#92929F] hover:text-[#F2F2F5] border border-[#24242D] transition-all cursor-pointer flex-shrink-0"
                        title="Visualizar este post como Cliente"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>

                    {/* Edit and Delete buttons */}
                    <div className="flex items-center justify-end gap-1.5 text-[#686873] pt-1">
                      <button
                        onClick={() => handleOpenEditModal(creative)}
                        className="p-1.5 rounded-lg hover:bg-[#17171F] hover:text-[#F2F2F5] transition-all cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Edit3 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCreative(creative.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL FOR CREATING / EDITING CREATIVE (ENFASE MÁXIMA EM CARROSSEL & VÍDEO) */}
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
                      <span className="text-[11px] block">Carrossel</span>
                      <span className="text-[9px] text-zinc-500">Até 20 imgs</span>
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
                      <span className="text-[11px] block">Vídeo</span>
                      <span className="text-[9px] text-zinc-500">Até 15GB</span>
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
                      <span className="text-[11px] block">Imagem</span>
                      <span className="text-[9px] text-zinc-500">Única</span>
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Proporção de Visualização
                  </label>
                  <div className="flex gap-2">
                    {(['1:1', '4:5', '9:16', '16:9'] as const).map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setFormAspectRatio(ratio)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          formAspectRatio === ratio
                            ? 'bg-zinc-800 border-purple-500 text-purple-400'
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
                    <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400">
                      Legenda / Copy do Post
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAIModalOpen(true)}
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Gerar sugestão de copy e carrossel com IA"
                    >
                      <Sparkles size={12} className="text-purple-400" />
                      <span>Gerar com IA</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Digite a legenda sugerida para o post..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>

              </div>

              {/* RIGHT: UPLOAD & CAROUSEL REORDER ZONE (ENFASE MÁXIMA!) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase font-bold text-zinc-400">
                    {formFormat === 'carousel' ? `Imagens do Carrossel (${formAssets.length}/20)` : 'Mídia do Criativo'}
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {formFormat === 'carousel' ? 'Arraste ou ordene os slides' : 'Vídeos de até 15GB'}
                  </span>
                </div>

                {/* UPLOAD DROPZONE */}
                <div
                  onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                    isProcessingFiles
                      ? 'border-purple-500 bg-purple-950/20 cursor-wait'
                      : 'border-zinc-800 hover:border-purple-500/50 bg-zinc-950/60 cursor-pointer hover:bg-purple-950/10 group'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple={formFormat === 'carousel'}
                    accept={formFormat === 'video' ? 'video/*' : 'image/*,video/*'}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2 transition-all">
                    {isProcessingFiles ? (
                      <RefreshCw size={22} className="animate-spin text-purple-400" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-white">
                    {isProcessingFiles
                      ? 'Otimizando e preparando imagens...'
                      : `Clique ou arraste ${formFormat === 'carousel' ? 'até 20 imagens' : 'seus arquivos'} aqui`}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {formFormat === 'carousel' ? 'PNG, JPG, WEBP • O cliente verá em formato carrossel real' : 'Suporta arquivos de alta resolução até 15GB'}
                  </p>
                </div>

                {/* CAROUSEL SLIDES REORDER LIST */}
                {formAssets.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">
                      Organizar Ordem das Imagens
                    </span>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {formAssets.map((asset, index) => (
                        <div
                          key={asset.id || index}
                          className={`p-2 rounded-2xl bg-zinc-900 border flex items-center justify-between gap-3 transition-all ${
                            previewSlideIndex === index ? 'border-purple-500 bg-purple-950/20' : 'border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {/* Slide Number Badge */}
                            <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>

                            {/* Thumbnail */}
                            <div 
                              onClick={() => setPreviewSlideIndex(index)}
                              className="w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer border border-zinc-700"
                            >
                              {asset.type === 'video' ? (
                                <video src={asset.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                              )}
                            </div>

                            <div className="truncate">
                              <p className="text-xs font-medium text-white truncate max-w-[140px]">
                                {asset.name}
                              </p>
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {index === 0 ? '⭐ Capa do Carrossel' : `Slide ${index + 1}`}
                              </span>
                            </div>
                          </div>

                          {/* REORDER BUTTONS */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSlideLeft(index)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 hover:text-white transition-all cursor-pointer"
                              title="Mover para a esquerda / anterior"
                            >
                              <ArrowLeft size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveSlideRight(index)}
                              disabled={index === formAssets.length - 1}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 hover:text-white transition-all cursor-pointer"
                              title="Mover para a direita / próximo"
                            >
                              <ArrowRight size={12} />
                            </button>

                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetAsCover(index)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white transition-all cursor-pointer"
                                title="Definir como Capa (Slide 1)"
                              >
                                <Star size={12} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(index)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                              title="Remover slide"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* MODAL ACTIONS FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-500 text-center sm:text-left">
                O cliente receberá um link limpo e intuitivo para aprovar o carrossel/vídeo diretamente.
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCreative('draft')}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 hover:text-white transition-all cursor-pointer"
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

      {/* 5. IN-APP CLIENT APPROVAL PREVIEW MODAL (PREVENTS CONNECTION REFUSED / POPUP BLOCKING) */}
      {(previewingShareToken || previewingHubClientId) && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col">
          <div className="bg-[#121218] border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono font-bold text-purple-400">
                {previewingHubClientId ? 'Central Geral do Cliente (Pré-visualização)' : 'Criativo Individual (Pré-visualização)'}
              </span>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Esta é a visualização exata que seu cliente terá ao abrir o link.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const url = previewingHubClientId
                    ? `${window.location.origin}/aprovar?client=${previewingHubClientId}&mode=hub`
                    : `${window.location.origin}/aprovar?creativeToken=${previewingShareToken}`;
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
              onBackToApp={() => {
                setPreviewingShareToken(null);
                setPreviewingHubClientId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* 5. DESIGNER CAROUSEL AI GENERATOR MODAL */}
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
