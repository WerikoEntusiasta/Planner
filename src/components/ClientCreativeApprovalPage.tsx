import React, { useState, useEffect } from 'react';
import { Creative, CreativeAsset, CreativeStatus } from '../types';
import { 
  Check, X, MessageSquare, Send, Sparkles, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, Smartphone, Instagram, 
  Film, Image as ImageIcon, CheckCircle2, Clock, ThumbsUp, 
  Share2, Maximize2, Shield, RefreshCw, Layers, ArrowLeft,
  CheckCheck, Filter, ThumbsDown, HelpCircle, ExternalLink,
  FileText, Copy, AlignLeft, Hash, Edit3, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../utils/clipboard';

interface ClientCreativeApprovalPageProps {
  shareToken?: string;
  clientToken?: string;
  initialMode?: 'single' | 'hub';
  initialFocus?: 'all' | 'visual' | 'caption';
  onBackToApp?: () => void;
}

export default function ClientCreativeApprovalPage({ 
  shareToken, 
  clientToken, 
  initialMode = 'single',
  initialFocus = 'all',
  onBackToApp 
}: ClientCreativeApprovalPageProps) {
  // Check URL query param for focus
  const urlFocus = new URLSearchParams(window.location.search).get('focus') || 
                   new URLSearchParams(window.location.search).get('type') || 
                   (window.location.pathname.includes('/aprovar-legenda') ? 'caption' : initialFocus);

  // Focus: 'all' | 'visual' | 'caption'
  const [approvalFocus, setApprovalFocus] = useState<'all' | 'visual' | 'caption'>(
    urlFocus === 'caption' ? 'caption' : (urlFocus === 'visual' ? 'visual' : 'all')
  );

  // Mode: 'single' (focused on 1 creative) or 'hub' (all creatives gallery for the brand)
  const [viewMode, setViewMode] = useState<'single' | 'hub'>(
    clientToken || initialMode === 'hub' || (!shareToken && clientToken) ? 'hub' : 'single'
  );

  // Data states
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [activeCreative, setActiveCreative] = useState<(Creative & { creatorName?: string }) | null>(null);
  const [clientName, setClientName] = useState<string>('Cliente');
  const [creatorName, setCreatorName] = useState<string>('Agência / Criador');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hub filter states
  const [hubStatusFilter, setHubStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'changes_requested'>('pending_approval');
  const [hubCaptionFilter, setHubCaptionFilter] = useState<'all' | 'pending_approval' | 'approved' | 'changes_requested' | 'missing'>('all');

  // Carousel & media viewer state for inspector
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mockupMode, setMockupMode] = useState<'feed' | 'clean'>('feed');
  
  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [targetFeedbackCreative, setTargetFeedbackCreative] = useState<Creative | null>(null);
  const [feedbackTargetType, setFeedbackTargetType] = useState<'all' | 'caption'>('all');
  const [feedbackType, setFeedbackType] = useState<'changes' | 'reject'>('changes');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  // Notification helper
  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch data from server
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const resolvedClient = clientToken || new URLSearchParams(window.location.search).get('client') || new URLSearchParams(window.location.search).get('clientToken') || '';
    const resolvedShareToken = shareToken || new URLSearchParams(window.location.search).get('creativeToken') || new URLSearchParams(window.location.search).get('shareToken') || '';

    try {
      // If we have a client identifier or hub mode, try the public-hub endpoint
      if (resolvedClient || viewMode === 'hub' || (!resolvedShareToken && resolvedClient)) {
        const res = await fetch(`/api/creatives/public-hub/${encodeURIComponent(resolvedClient || 'all')}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.creatives) && data.creatives.length > 0) {
          setCreatives(data.creatives);
          setClientName(data.clientName || 'Sua Marca');
          setCreatorName(data.creatorName || 'Agência / Criador');

          if (resolvedShareToken) {
            const found = data.creatives.find((c: Creative) => c.shareToken === resolvedShareToken || c.id === resolvedShareToken);
            if (found) {
              setActiveCreative(found);
              setViewMode('single');
            } else {
              setActiveCreative(data.creatives[0]);
            }
          } else {
            setActiveCreative(data.creatives[0]);
          }
          setIsLoading(false);
          return;
        }
      }

      // If we have a single shareToken, try the single public endpoint
      if (resolvedShareToken) {
        const res = await fetch(`/api/creatives/public/${encodeURIComponent(resolvedShareToken)}`);
        const data = await res.json();
        if (res.ok && data.success && data.creative) {
          setActiveCreative(data.creative);
          setClientName(data.creative.clientName || 'Sua Marca');
          setCreatorName(data.creative.creatorName || 'Agência / Criador');
          
          // Also try to load sibling creatives for the general hub if clientId is present
          if (data.creative.clientId) {
            try {
              const hubRes = await fetch(`/api/creatives/public-hub/${encodeURIComponent(data.creative.clientId)}`);
              const hubData = await hubRes.json();
              if (hubRes.ok && hubData.success && Array.isArray(hubData.creatives)) {
                setCreatives(hubData.creatives);
              } else {
                setCreatives([data.creative]);
              }
            } catch {
              setCreatives([data.creative]);
            }
          } else {
            setCreatives([data.creative]);
          }

          setIsLoading(false);
          return;
        }
      }

      // Local storage fallback for offline / dev preview
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      if (localCreatives.length > 0) {
        let matching = localCreatives;
        if (resolvedClient && resolvedClient !== 'all') {
          matching = localCreatives.filter(c => c.clientId === resolvedClient);
        }
        if (matching.length === 0) matching = localCreatives;

        setCreatives(matching);
        const target = resolvedShareToken 
          ? matching.find(c => c.shareToken === resolvedShareToken || c.id === resolvedShareToken) || matching[0]
          : matching[0];

        setActiveCreative(target);
        setClientName(target?.clientName || matching[0]?.clientName || 'Sua Marca');
        setCreatorName('Agência / Criador');
        setIsLoading(false);
        return;
      }

      setError('Nenhum criativo localizado ou o link de aprovação expirou.');
    } catch (err: any) {
      console.warn('Network error, fallback to local storage:', err);
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      if (localCreatives.length > 0) {
        setCreatives(localCreatives);
        setActiveCreative(localCreatives[0]);
        setClientName(localCreatives[0].clientName || 'Sua Marca');
      } else {
        setError('Não foi possível carregar a central de aprovação. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shareToken, clientToken]);

  // Reset slide index when active creative changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeCreative?.id]);

  // Keyboard navigation for carousel slides in inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'single' || !activeCreative || (activeCreative.assets || []).length <= 1) return;
      if (e.key === 'ArrowRight') {
        setCurrentSlideIndex((prev) => (prev + 1) % activeCreative.assets.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => (prev - 1 + activeCreative.assets.length) % activeCreative.assets.length);
      } else if (e.key === 'Escape') {
        setViewMode('hub');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCreative, viewMode]);

  // Copy caption text helper
  const handleCopyCaptionText = async (text?: string, creativeId?: string) => {
    if (!text) return;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedCaptionId(creativeId || 'active');
      showToast('Texto da legenda copiado com sucesso! 📋', 'success');
      setTimeout(() => setCopiedCaptionId(null), 2500);
    }
  };

  // Handle single creative visual approval
  const handleApproveCreative = async (creativeToApprove: Creative) => {
    setIsSubmitting(true);
    const token = creativeToApprove.shareToken || creativeToApprove.id;
    const formattedDate = new Date().toLocaleDateString('pt-BR');

    // Optimistic UI update
    setCreatives(prev => prev.map(c => c.id === creativeToApprove.id ? { ...c, status: 'approved', approvalDate: formattedDate } : c));
    if (activeCreative?.id === creativeToApprove.id) {
      setActiveCreative(prev => prev ? { ...prev, status: 'approved', approvalDate: formattedDate } : null);
    }

    try {
      await fetch(`/api/creatives/public/${encodeURIComponent(token)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          targetType: 'all',
          feedback: 'Visual do criativo aprovado pelo cliente.'
        })
      });

      // Update local storage backup
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => (c.shareToken === token || c.id === creativeToApprove.id) ? { ...c, status: 'approved' as const, approvalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      showToast(`Criativo "${creativeToApprove.title}" APROVADO com sucesso! 🚀`, 'success');
    } catch (err) {
      console.error('Failed to submit approval:', err);
      showToast(`Criativo aprovado!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle single caption approval
  const handleApproveCaption = async (creativeToApprove: Creative) => {
    setIsSubmitting(true);
    const token = creativeToApprove.shareToken || creativeToApprove.id;
    const formattedDate = new Date().toLocaleDateString('pt-BR');

    // Optimistic UI update
    setCreatives(prev => prev.map(c => c.id === creativeToApprove.id ? { ...c, captionStatus: 'approved', captionApprovalDate: formattedDate } : c));
    if (activeCreative?.id === creativeToApprove.id) {
      setActiveCreative(prev => prev ? { ...prev, captionStatus: 'approved', captionApprovalDate: formattedDate } : null);
    }

    try {
      await fetch(`/api/creatives/public/${encodeURIComponent(token)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          targetType: 'caption',
          feedback: 'Legenda e texto aprovados pelo cliente.'
        })
      });

      // Update local storage backup
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => (c.shareToken === token || c.id === creativeToApprove.id) ? { ...c, captionStatus: 'approved' as const, captionApprovalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      showToast(`Legenda de "${creativeToApprove.title}" APROVADA com sucesso! ✍️✨`, 'success');
    } catch (err) {
      console.error('Failed to submit caption approval:', err);
      showToast(`Legenda aprovada!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Batch Approve All Pending Creatives (Visuals)
  const handleBatchApprovePending = async () => {
    const pendingList = creatives.filter(c => c.status === 'pending_approval' || c.status === 'draft');
    if (pendingList.length === 0) return;

    if (!confirm(`Deseja aprovar os ${pendingList.length} criativos pendentes de uma só vez?`)) {
      return;
    }

    setIsSubmitting(true);
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const pendingIds = pendingList.map(c => c.id);

    // Optimistic update
    setCreatives(prev => prev.map(c => pendingIds.includes(c.id) ? { ...c, status: 'approved', approvalDate: formattedDate } : c));
    if (activeCreative && pendingIds.includes(activeCreative.id)) {
      setActiveCreative(prev => prev ? { ...prev, status: 'approved', approvalDate: formattedDate } : null);
    }

    try {
      await fetch('/api/creatives/public-hub/batch-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeIds: pendingIds,
          status: 'approved',
          targetType: 'all',
          feedback: 'Aprovado em lote pelo cliente.'
        })
      });

      // Update local storage
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => pendingIds.includes(c.id) ? { ...c, status: 'approved' as const, approvalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      showToast(`🎉 Todos os ${pendingList.length} criativos foram aprovados com sucesso!`, 'success');
    } catch (err) {
      console.error('Failed batch approval:', err);
      showToast(`Criativos aprovados com sucesso!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Batch Approve All Pending Captions (excluding rejected creatives)
  const handleBatchApproveCaptions = async () => {
    const pendingCaptionList = creatives.filter(c => c.status !== 'rejected' && c.description && (c.captionStatus === 'pending_approval' || !c.captionStatus || c.captionStatus === 'draft'));
    if (pendingCaptionList.length === 0) {
      showToast('Nenhuma legenda pendente de aprovação.', 'info');
      return;
    }

    if (!confirm(`Deseja aprovar todas as ${pendingCaptionList.length} legendas pendentes de uma só vez?`)) {
      return;
    }

    setIsSubmitting(true);
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const pendingIds = pendingCaptionList.map(c => c.id);

    // Optimistic update
    setCreatives(prev => prev.map(c => pendingIds.includes(c.id) ? { ...c, captionStatus: 'approved', captionApprovalDate: formattedDate } : c));
    if (activeCreative && pendingIds.includes(activeCreative.id)) {
      setActiveCreative(prev => prev ? { ...prev, captionStatus: 'approved', captionApprovalDate: formattedDate } : null);
    }

    try {
      await fetch('/api/creatives/public-hub/batch-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creativeIds: pendingIds,
          status: 'approved',
          targetType: 'caption',
          feedback: 'Legendas aprovadas em lote pelo cliente.'
        })
      });

      // Update local storage
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => pendingIds.includes(c.id) ? { ...c, captionStatus: 'approved' as const, captionApprovalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      showToast(`✍️ Todas as ${pendingCaptionList.length} legendas foram aprovadas com sucesso!`, 'success');
    } catch (err) {
      console.error('Failed batch caption approval:', err);
      showToast(`Legendas aprovadas com sucesso!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit feedback (changes requested or reject)
  const handleSendFeedback = async () => {
    if (!targetFeedbackCreative || !feedbackText.trim()) return;
    setIsSubmitting(true);
    const targetStatus = feedbackType === 'changes' ? 'changes_requested' : 'rejected';
    const token = targetFeedbackCreative.shareToken || targetFeedbackCreative.id;
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const isCaptionTarget = feedbackTargetType === 'caption';

    // Optimistic update
    if (isCaptionTarget) {
      setCreatives(prev => prev.map(c => c.id === targetFeedbackCreative.id ? { 
        ...c, 
        captionStatus: targetStatus, 
        captionFeedback: feedbackText.trim(), 
        captionApprovalDate: formattedDate 
      } : c));
      if (activeCreative?.id === targetFeedbackCreative.id) {
        setActiveCreative(prev => prev ? { 
          ...prev, 
          captionStatus: targetStatus, 
          captionFeedback: feedbackText.trim(), 
          captionApprovalDate: formattedDate 
        } : null);
      }
    } else {
      setCreatives(prev => prev.map(c => c.id === targetFeedbackCreative.id ? { 
        ...c, 
        status: targetStatus, 
        clientFeedback: feedbackText.trim(), 
        approvalDate: formattedDate 
      } : c));
      if (activeCreative?.id === targetFeedbackCreative.id) {
        setActiveCreative(prev => prev ? { 
          ...prev, 
          status: targetStatus, 
          clientFeedback: feedbackText.trim(), 
          approvalDate: formattedDate 
        } : null);
      }
    }

    try {
      await fetch(`/api/creatives/public/${encodeURIComponent(token)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          targetType: isCaptionTarget ? 'caption' : 'all',
          feedback: feedbackText.trim()
        })
      });

      // Update local storage
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => {
        if (c.shareToken === token || c.id === targetFeedbackCreative.id) {
          if (isCaptionTarget) {
            return { ...c, captionStatus: targetStatus, captionFeedback: feedbackText.trim(), captionApprovalDate: formattedDate };
          }
          return { ...c, status: targetStatus, clientFeedback: feedbackText.trim(), approvalDate: formattedDate };
        }
        return c;
      });
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      setShowFeedbackModal(false);
      setFeedbackText('');
      showToast(feedbackType === 'changes' ? (isCaptionTarget ? 'Ajustes na legenda enviados à equipe! ✍️' : 'Solicitação de ajuste enviada à equipe! 📝') : 'Feedback registrado.', 'info');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setShowFeedbackModal(false);
      setFeedbackText('');
      showToast('Feedback registrado.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open single creative inspector from the hub
  const handleInspectCreative = (creative: Creative) => {
    setActiveCreative(creative);
    setViewMode('single');
  };

  // Cycle to previous / next creative in inspector
  const handleCycleCreative = (direction: 'next' | 'prev') => {
    // When focusing on captions, skip rejected creatives
    const list = approvalFocus === 'caption' ? creatives.filter(c => c.status !== 'rejected') : creatives;
    if (!activeCreative || list.length <= 1) return;
    const currentIndex = list.findIndex(c => c.id === activeCreative.id);
    if (currentIndex === -1) {
      if (list.length > 0) setActiveCreative(list[0]);
      return;
    }

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= list.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = list.length - 1;

    setActiveCreative(list[nextIndex]);
  };

  // Quick preset feedback pills
  const CAPTION_QUICK_SUGGESTIONS = [
    'Ajustar gancho da 1ª linha',
    'Trocar chamada para ação (CTA)',
    'Corrigir ortografia / pontuação',
    'Deixar tom mais formal',
    'Deixar tom mais descontraído',
    'Adicionar mais emojis',
    'Reduzir tamanho do texto'
  ];

  const CREATIVE_QUICK_SUGGESTIONS = [
    'Ajustar cores da marca',
    'Trocar imagem / foto',
    'Aumentar contraste do texto',
    'Corrigir alinhamento',
    'Inserir logo oficial',
    'Mudar tipografia'
  ];

  // ==========================================
  // LOADING / ERROR STATES
  // ==========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090D] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 animate-spin blur-md opacity-75" />
          <div className="absolute w-12 h-12 rounded-2xl bg-[#14141C] flex items-center justify-center">
            <RefreshCw className="animate-spin text-purple-400" size={24} />
          </div>
        </div>
        <h2 className="text-xl font-bold font-display text-zinc-100 tracking-tight">
          Carregando Portal de Aprovação...
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm text-center">
          Preparando a visualização em alta fidelidade dos criativos e legendas da marca {clientName}.
        </p>
      </div>
    );
  }

  if (error || !activeCreative) {
    return (
      <div className="min-h-screen bg-[#09090D] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#14141C] border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold font-display text-white">Central Não Encontrada</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error || 'O link de aprovação pode ter expirado ou o criativo foi arquivado pelo criador.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Voltar ao App
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active creative helpers
  const activeAssets = activeCreative.assets || [];
  const activeSlide = activeAssets[currentSlideIndex] || activeAssets[0];
  const isCarousel = activeCreative.format === 'carousel' || activeAssets.length > 1;
  const isVideo = activeCreative.format === 'video' || activeSlide?.type === 'video';

  // Stats for hub
  const totalCount = creatives.length;
  const pendingCount = creatives.filter(c => c.status === 'pending_approval' || c.status === 'draft').length;
  const approvedCount = creatives.filter(c => c.status === 'approved').length;
  const changesCount = creatives.filter(c => c.status === 'changes_requested').length;
  const rejectedCount = creatives.filter(c => c.status === 'rejected').length;

  // Caption stats (Creatives with status 'rejected' are strictly excluded from caption approval)
  const validCaptionCreatives = creatives.filter(c => c.status !== 'rejected');
  const totalCaptionsWithText = validCaptionCreatives.filter(c => Boolean(c.description?.trim())).length;
  const pendingCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && (c.captionStatus === 'pending_approval' || !c.captionStatus || c.captionStatus === 'draft')).length;
  const approvedCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && c.captionStatus === 'approved').length;
  const changesCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && c.captionStatus === 'changes_requested').length;
  const missingCaptionsCount = validCaptionCreatives.filter(c => !c.description?.trim()).length;

  // Filter creatives for the hub view
  const filteredHubCreatives = creatives.filter(c => {
    if (approvalFocus === 'caption') {
      // Reproved/rejected creatives must NOT appear for caption approval
      if (c.status === 'rejected') return false;

      if (hubCaptionFilter === 'missing') return !c.description?.trim();
      if (hubCaptionFilter === 'pending_approval') return Boolean(c.description?.trim()) && (c.captionStatus === 'pending_approval' || !c.captionStatus || c.captionStatus === 'draft');
      if (hubCaptionFilter === 'approved') return Boolean(c.description?.trim()) && c.captionStatus === 'approved';
      if (hubCaptionFilter === 'changes_requested') return Boolean(c.description?.trim()) && c.captionStatus === 'changes_requested';
      return true;
    }

    if (hubStatusFilter === 'all') return true;
    if (hubStatusFilter === 'pending_approval') return c.status === 'pending_approval' || c.status === 'draft';
    return c.status === hubStatusFilter;
  });

  return (
    <div className="min-h-screen bg-[#09090D] text-zinc-100 font-sans flex flex-col selection:bg-purple-500 selection:text-white">
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-md border ${
              toastMessage.type === 'success'
                ? 'bg-blue-600/90 border-blue-400 text-white'
                : toastMessage.type === 'info'
                ? 'bg-amber-600/90 border-amber-400 text-white'
                : 'bg-zinc-900/90 border-zinc-700 text-white'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP CLIENT PORTAL HEADER BAR */}
      <header className="h-16 px-4 md:px-8 border-b border-zinc-800/80 bg-[#101017]/95 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
        
        {/* LEFT BRAND & TITLE */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black font-display text-sm shadow-md shadow-purple-600/20">
            {clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-white font-display leading-tight">
                Central de Aprovação
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">
                {clientName}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Enviado por <span className="text-zinc-200 font-medium">{creatorName}</span>
            </p>
          </div>
        </div>

        {/* CENTER FOCUS SELECTOR (VISUAL vs CAPTION / COPYWRITING) */}
        <div className="hidden md:flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setApprovalFocus('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              approvalFocus === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye size={13} />
            <span>Visão Completa</span>
          </button>

          <button
            onClick={() => setApprovalFocus('visual')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              approvalFocus === 'visual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon size={13} />
            <span>Criativos & Mídias</span>
          </button>

          <button
            onClick={() => setApprovalFocus('caption')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              approvalFocus === 'caption'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlignLeft size={13} />
            <span>Legendas & Copy</span>
            {pendingCaptionsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* RIGHT HEADER ACTIONS */}
        <div className="flex items-center gap-2.5">
          {/* Switch Mode Button */}
          {viewMode === 'single' ? (
            <button
              onClick={() => setViewMode('hub')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ver todos os criativos da marca de uma vez só"
            >
              <Layers size={14} className="text-purple-400" />
              <span>Ver Todos ({creatives.length})</span>
            </button>
          ) : (
            approvalFocus === 'caption' ? (
              pendingCaptionsCount > 0 && (
                <button
                  onClick={handleBatchApproveCaptions}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  <span>Aprovar Todas as Legendas ({pendingCaptionsCount})</span>
                </button>
              )
            ) : (
              pendingCount > 0 && (
                <button
                  onClick={handleBatchApprovePending}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  <span>Aprovar Todos ({pendingCount})</span>
                </button>
              )
            )
          )}

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
            >
              Voltar ao Planner
            </button>
          )}
        </div>
      </header>

      {/* MOBILE FOCUS SELECTOR */}
      <div className="flex md:hidden items-center justify-around bg-[#101017] p-2 border-b border-zinc-800 text-xs">
        <button
          onClick={() => setApprovalFocus('all')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${approvalFocus === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}
        >
          Geral
        </button>
        <button
          onClick={() => setApprovalFocus('visual')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all ${approvalFocus === 'visual' ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
        >
          Mídias
        </button>
        <button
          onClick={() => setApprovalFocus('caption')}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${approvalFocus === 'caption' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
        >
          <span>Legendas</span>
          {pendingCaptionsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODE A: GENERAL CREATIVE HUB GALLERY (LINK GERAL PARA APROVAR TODOS)   */}
      {/* ========================================================================= */}
      {viewMode === 'hub' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
          
          {/* HUB HERO SUMMARY BANNER */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-purple-950/40 via-[#151520] to-orange-950/30 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider">
                  <Layers size={14} className="text-purple-400" />
                  <span>
                    {approvalFocus === 'caption' 
                      ? 'Central de Aprovação de Legendas & Copy' 
                      : 'Central Geral de Aprovação de Criativos'}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">
                  {approvalFocus === 'caption' ? `Legendas da Marca ${clientName}` : `Criativos da Marca ${clientName}`}
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  {approvalFocus === 'caption'
                    ? 'Revise os textos, ganchos e chamadas para ação de cada publicação abaixo. Você pode aprovar individualmente cada legenda ou aprovar o lote completo.'
                    : 'Revise todos os posts, carrosséis, vídeos e legendas abaixo. Você pode aprovar ou solicitar ajustes individualmente em cada item ou aprovar tudo de uma só vez.'}
                </p>
              </div>

              {/* BATCH ACTION BUTTON */}
              {approvalFocus === 'caption' ? (
                pendingCaptionsCount > 0 ? (
                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    <button
                      onClick={handleBatchApproveCaptions}
                      disabled={isSubmitting}
                      className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCheck size={18} strokeWidth={2.5} />
                      <span>Aprovar Todas as Legendas ({pendingCaptionsCount})</span>
                    </button>
                    <span className="text-[11px] text-orange-400 font-mono font-semibold flex items-center gap-1">
                      <Clock size={12} className="animate-pulse" /> {pendingCaptionsCount} legenda(s) aguardando sua revisão
                    </span>
                  </div>
                ) : (
                  <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Todas as legendas adicionadas estão aprovadas!</span>
                  </div>
                )
              ) : (
                pendingCount > 0 ? (
                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    <button
                      onClick={handleBatchApprovePending}
                      disabled={isSubmitting}
                      className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCheck size={18} strokeWidth={2.5} />
                      <span>Aprovar Todos os Pendentes ({pendingCount})</span>
                    </button>
                    <span className="text-[11px] text-orange-400 font-mono font-semibold flex items-center gap-1">
                      <Clock size={12} className="animate-pulse" /> {pendingCount} criativo(s) aguardando sua decisão
                    </span>
                  </div>
                ) : (
                  <div className="px-5 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-blue-400" />
                    <span>Todos os criativos desta central já estão avaliados!</span>
                  </div>
                )
              )}
            </div>

            {/* STATS TABS */}
            {approvalFocus === 'caption' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
                <button
                  onClick={() => setHubCaptionFilter('pending_approval')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubCaptionFilter === 'pending_approval'
                      ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-orange-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-orange-400 block mb-0.5 flex items-center gap-1">
                    <Clock size={11} /> Legendas Pendentes
                  </span>
                  <div className="text-2xl font-bold font-display text-orange-400">{pendingCaptionsCount}</div>
                </button>

                <button
                  onClick={() => setHubCaptionFilter('approved')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubCaptionFilter === 'approved'
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-0.5 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Legendas Aprovadas
                  </span>
                  <div className="text-2xl font-bold font-display text-emerald-400">{approvedCaptionsCount}</div>
                </button>

                <button
                  onClick={() => setHubCaptionFilter('changes_requested')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubCaptionFilter === 'changes_requested'
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-0.5 flex items-center gap-1">
                    <MessageSquare size={11} /> Ajustes em Legendas
                  </span>
                  <div className="text-2xl font-bold font-display text-amber-400">{changesCaptionsCount}</div>
                </button>

                <button
                  onClick={() => setHubCaptionFilter('all')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubCaptionFilter === 'all'
                      ? 'bg-purple-500/15 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-purple-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5 flex items-center gap-1">
                    <AlignLeft size={11} /> Todas as Legendas
                  </span>
                  <div className="text-2xl font-bold font-display text-white">{totalCaptionsWithText}</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
                <button
                  onClick={() => setHubStatusFilter('pending_approval')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubStatusFilter === 'pending_approval'
                      ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-orange-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-orange-400 block mb-0.5 flex items-center gap-1">
                    <Clock size={11} /> Aguardando Aprovação
                  </span>
                  <div className="text-2xl font-bold font-display text-orange-400">{pendingCount}</div>
                </button>

                <button
                  onClick={() => setHubStatusFilter('approved')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubStatusFilter === 'approved'
                      ? 'bg-blue-500/15 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-blue-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-blue-400 block mb-0.5 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Aprovados
                  </span>
                  <div className="text-2xl font-bold font-display text-blue-400">{approvedCount}</div>
                </button>

                <button
                  onClick={() => setHubStatusFilter('changes_requested')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubStatusFilter === 'changes_requested'
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-0.5 flex items-center gap-1">
                    <MessageSquare size={11} /> Ajustes Solicitados
                  </span>
                  <div className="text-2xl font-bold font-display text-amber-400">{changesCount}</div>
                </button>

                <button
                  onClick={() => setHubStatusFilter('all')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    hubStatusFilter === 'all'
                      ? 'bg-purple-500/15 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-purple-500/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5 flex items-center gap-1">
                    <Layers size={11} /> Total de Criativos
                  </span>
                  <div className="text-2xl font-bold font-display text-white">{totalCount}</div>
                </button>
              </div>
            )}
          </div>

          {/* CREATIVES GALLERY GRID */}
          {filteredHubCreatives.length === 0 ? (
            <div className="bg-[#14141c] border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-500 mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">Nenhum item nesta categoria</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Alterne os filtros acima para visualizar os demais posts e legendas da central.
                </p>
              </div>
              <button
                onClick={() => {
                  setHubStatusFilter('all');
                  setHubCaptionFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Ver Todos</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHubCreatives.map((creative) => {
                const assets = creative.assets || [];
                const firstAsset = assets[0];
                const isCar = creative.format === 'carousel' || assets.length > 1;
                const isVid = creative.format === 'video' || firstAsset?.type === 'video';
                
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
                    className={`bg-[#14141c] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col border group ${
                      approvalFocus === 'caption'
                        ? isCaptionPending
                          ? 'border-orange-500/40 hover:border-orange-500/80 shadow-orange-500/5'
                          : isCaptionApproved
                          ? 'border-emerald-500/40 hover:border-emerald-500/80 shadow-emerald-500/5'
                          : isCaptionChanges
                          ? 'border-amber-500/40 hover:border-amber-500/80'
                          : 'border-zinc-800/90 hover:border-amber-500/40'
                        : isPending
                        ? 'border-orange-500/40 hover:border-orange-500/80 shadow-orange-500/5'
                        : isApproved
                        ? 'border-blue-500/40 hover:border-blue-500/80 shadow-blue-500/5'
                        : isChanges
                        ? 'border-amber-500/40 hover:border-amber-500/80'
                        : 'border-zinc-800/90 hover:border-purple-500/40'
                    }`}
                  >
                    {/* CARD THUMBNAIL / CAROUSEL MINI VIEWER */}
                    <div 
                      onClick={() => handleInspectCreative(creative)}
                      className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {firstAsset ? (
                        isVid ? (
                          <video src={firstAsset.url} className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <img
                            src={firstAsset.url}
                            alt={creative.title}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                          />
                        )
                      ) : (
                        <div className="text-zinc-600">
                          <ImageIcon size={32} />
                        </div>
                      )}

                      {/* FORMAT PILL */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1.5 shadow-lg">
                        {isCar ? (
                          <>
                            <Layers size={11} className="text-purple-400" />
                            <span>Carrossel ({assets.length} slides)</span>
                          </>
                        ) : isVid ? (
                          <>
                            <Film size={11} className="text-orange-400" />
                            <span>Vídeo</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon size={11} className="text-blue-400" />
                            <span>Imagem Única</span>
                          </>
                        )}
                      </div>

                      {/* STATUS BADGES */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                        {/* 1. VISUAL STATUS BADGE (EXPLICITLY SHOWING CRIATIVO APROVADO) */}
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
                            <CheckCircle2 size={12} /> Criativo Aprovado
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg animate-pulse">
                            <Clock size={12} /> Criativo Pendente
                          </span>
                        )}
                        {isChanges && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <MessageSquare size={12} /> Ajuste no Visual
                          </span>
                        )}
                        {creative.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <X size={12} /> Criativo Reprovado
                          </span>
                        )}

                        {/* 2. CAPTION STATUS BADGE (WHEN VIEWING IN CAPTION MODE) */}
                        {approvalFocus === 'caption' && (
                          !hasCaption ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-400 text-[10px] font-bold flex items-center gap-1 shadow-lg">
                              Sem Legenda
                            </span>
                          ) : isCaptionPending ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg animate-pulse">
                              <Clock size={11} /> Legenda Pendente
                            </span>
                          ) : isCaptionApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                              <CheckCircle2 size={11} /> Legenda Aprovada
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-lg">
                              <MessageSquare size={11} /> Ajuste na Legenda
                            </span>
                          )
                        )}
                      </div>

                      {/* HOVER OVERLAY: INSPECT HINT */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                        <span className="px-3 py-1.5 rounded-xl bg-purple-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                          <Eye size={14} /> Abrir em Tela Cheia
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span className="text-purple-400 font-bold uppercase">{creative.clientName || clientName}</span>
                          <span>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>

                        <h3 
                          onClick={() => handleInspectCreative(creative)}
                          className="font-bold text-sm text-white line-clamp-1 group-hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          {creative.title}
                        </h3>

                        {/* STATUS DO CRIATIVO VISUAL (QUANDO APROVADO) */}
                        {isApproved && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                            <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                            <span>Status: Criativo Aprovado</span>
                          </div>
                        )}

                        {/* CAPTION BLOCK */}
                        {hasCaption ? (
                          <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                                <AlignLeft size={11} /> Legenda & Copy
                              </span>
                              <button
                                onClick={() => handleCopyCaptionText(creative.description, creative.id)}
                                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                title="Copiar texto"
                              >
                                {copiedCaptionId === creative.id ? (
                                  <span className="text-emerald-400 font-bold">Copiado!</span>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                              {creative.description}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl text-[11px] text-zinc-500 flex items-center gap-2">
                            <AlignLeft size={13} className="text-zinc-600 shrink-0" />
                            <span>Sem legenda cadastrada para este post.</span>
                          </div>
                        )}

                        {creative.captionFeedback && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                            ✍️ Ajuste na Legenda: "{creative.captionFeedback}"
                          </div>
                        )}

                        {creative.clientFeedback && !creative.captionFeedback && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                            💬 Feedback Visual: "{creative.clientFeedback}"
                          </div>
                        )}
                      </div>

                      {/* INLINE ACTION BUTTONS */}
                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                        
                        {approvalFocus === 'caption' ? (
                          <div className="flex items-center gap-2">
                            {hasCaption ? (
                              <>
                                <button
                                  onClick={() => handleApproveCaption(creative)}
                                  disabled={isSubmitting || isCaptionApproved}
                                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                                    isCaptionApproved
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                                  }`}
                                >
                                  <Check size={13} strokeWidth={2.5} />
                                  <span>{isCaptionApproved ? 'Legenda Aprovada' : 'Aprovar Legenda'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setTargetFeedbackCreative(creative);
                                    setFeedbackTargetType('caption');
                                    setFeedbackType('changes');
                                    setShowFeedbackModal(true);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Solicitar Ajuste na Legenda"
                                >
                                  <Edit3 size={13} />
                                  <span>Ajustar</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleInspectCreative(creative)}
                                className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>Ver Criativo</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveCreative(creative)}
                              disabled={isSubmitting || isApproved}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                                isApproved
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                              }`}
                            >
                              <Check size={13} strokeWidth={2.5} />
                              <span>{isApproved ? 'Aprovado' : 'Aprovar'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setTargetFeedbackCreative(creative);
                                setFeedbackTargetType('all');
                                setFeedbackType('changes');
                                setShowFeedbackModal(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Solicitar Ajustes"
                            >
                              <MessageSquare size={13} />
                              <span>Ajustes</span>
                            </button>

                            <button
                              onClick={() => handleInspectCreative(creative)}
                              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all cursor-pointer"
                              title="Ver em Detalhes"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: SINGLE CREATIVE DETAILED INSPECTOR & CAROUSEL VIEW             */}
      {/* ========================================================================= */}
      {viewMode === 'single' && activeCreative && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: VISUAL MOCKUP & CAROUSEL SLIDES (7 COLS) */}
          <section className="lg:col-span-7 flex flex-col items-center">
            
            {/* TOP CONTROLS FOR VISUAL INSPECTION */}
            <div className="w-full max-w-lg mb-4 flex items-center justify-between">
              <button
                onClick={() => setViewMode('hub')}
                className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800"
              >
                <ArrowLeft size={14} />
                <span>Voltar à Central ({creatives.length} posts)</span>
              </button>

              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setMockupMode('feed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    mockupMode === 'feed' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Simular visualização no feed do Instagram"
                >
                  <Smartphone size={12} />
                  <span>Feed</span>
                </button>
                <button
                  onClick={() => setMockupMode('clean')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    mockupMode === 'clean' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Visualização limpa da arte"
                >
                  <Maximize2 size={12} />
                  <span>Arte Pura</span>
                </button>
              </div>
            </div>

            {/* INSTAGRAM MOCKUP CONTAINER */}
            <div className="w-full max-w-lg bg-black border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
              
              {/* FEED HEADER SIMULATION */}
              {mockupMode === 'feed' && (
                <div className="p-3.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-xs text-white">
                        {clientName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{clientName.toLowerCase().replace(/\s+/g, '')}</span>
                      <span className="text-[10px] text-zinc-400 block leading-none">Publicação Oficial</span>
                    </div>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-1 font-mono text-xs">
                    <Instagram size={14} className="text-pink-500" />
                  </div>
                </div>
              )}

              {/* MEDIA DISPLAY AREA */}
              <div className="relative aspect-square sm:aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                {activeSlide ? (
                  isVideo ? (
                    <video
                      src={activeSlide.url}
                      controls
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={activeSlide.url}
                      alt={activeSlide.title || `Slide ${currentSlideIndex + 1}`}
                      className="w-full h-full object-contain select-none"
                    />
                  )
                ) : (
                  <div className="text-zinc-600 text-center p-8 space-y-2">
                    <ImageIcon size={48} className="mx-auto text-zinc-700" />
                    <p className="text-xs">Nenhuma imagem carregada</p>
                  </div>
                )}

                {/* CAROUSEL SLIDE NUMBER BADGE */}
                {isCarousel && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-lg">
                    <span>{currentSlideIndex + 1}</span>
                    <span className="text-zinc-400">/</span>
                    <span>{activeAssets.length}</span>
                  </div>
                )}

                {/* CAROUSEL PREV / NEXT BUTTONS */}
                {isCarousel && activeAssets.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + activeAssets.length) % activeAssets.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-sm"
                      title="Slide Anterior (Seta Esquerda)"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % activeAssets.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-sm"
                      title="Próximo Slide (Seta Direita)"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* FEED FOOTER SIMULATION */}
              {mockupMode === 'feed' && (
                <div className="p-3.5 bg-zinc-950 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-zinc-300">
                    <div className="flex items-center gap-3">
                      <ThumbsUp size={16} className="text-zinc-400" />
                      <MessageCircle size={16} className="text-zinc-400" />
                      <Share2 size={16} className="text-zinc-400" />
                    </div>
                    {isCarousel && (
                      <div className="flex items-center gap-1">
                        {activeAssets.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentSlideIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* SLIDE THUMBNAIL STRIP (FOR CAROUSELS) */}
            {isCarousel && activeAssets.length > 1 && (
              <div className="w-full max-w-lg mt-3 overflow-x-auto pb-2">
                <div className="flex items-center gap-2">
                  {activeAssets.map((asset, idx) => (
                    <button
                      key={asset.id || idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                        idx === currentSlideIndex
                          ? 'border-purple-500 scale-105 shadow-md shadow-purple-500/20'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={asset.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold bg-black/80 text-white px-1 rounded">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CYCLING BAR TO PREV / NEXT CREATIVE IN GALLERY */}
            {creatives.length > 1 && (
              <div className="w-full max-w-lg mt-4 flex items-center justify-between px-1">
                <button
                  onClick={() => handleCycleCreative('prev')}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Criativo Anterior</span>
                </button>
                <span className="text-[11px] font-mono text-zinc-500">
                  {creatives.findIndex(c => c.id === activeCreative.id) + 1} de {creatives.length} criativos
                </span>
                <button
                  onClick={() => handleCycleCreative('next')}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Próximo Criativo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

          </section>

          {/* RIGHT COLUMN: DETAILS & APPROVAL ACTIONS (5 COLS) */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* CREATIVE TITLE & DETAILS CARD */}
            <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
              
              {/* STATUS INDICATOR (ORANGE FOR PENDING, BLUE FOR APPROVED, RED FOR REJECTED) */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  <Instagram size={12} /> {activeCreative.platform?.toUpperCase() || 'INSTAGRAM'} • {activeCreative.format?.toUpperCase() || 'CARROSSEL'}
                </div>

                {activeCreative.status === 'approved' && (
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                    <CheckCircle2 size={13} /> Criativo Aprovado
                  </span>
                )}
                {(activeCreative.status === 'pending_approval' || activeCreative.status === 'draft') && (
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center gap-1 shadow-md animate-pulse">
                    <Clock size={13} /> Criativo Pendente
                  </span>
                )}
                {activeCreative.status === 'changes_requested' && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center gap-1 shadow-md">
                    <MessageSquare size={13} /> Ajuste Solicitado
                  </span>
                )}
                {activeCreative.status === 'rejected' && (
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                    <X size={13} /> Criativo Reprovado
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  {activeCreative.title}
                </h2>
              </div>

              {/* VISUAL APPROVAL STATUS BANNER */}
              {activeCreative.status === 'approved' && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-2 text-xs text-blue-200 font-semibold">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                  <span>Status da Arte Visual: <strong className="text-blue-300">Criativo Aprovado</strong></span>
                </div>
              )}
              {activeCreative.status === 'rejected' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-xs text-red-200 font-semibold">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>Este criativo visual foi <strong>Reprovado</strong>. A aprovação de legenda fica desabilitada.</span>
                </div>
              )}

              {/* LEGENDA / TEXTO DA PUBLICAÇÃO WITH COPY AND CAPTION APPROVAL */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <AlignLeft size={13} />
                    <span>Legenda & Copywriting</span>
                  </label>

                  {activeCreative.description && (
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeCreative.captionStatus === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : activeCreative.captionStatus === 'changes_requested'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                      }`}>
                        {activeCreative.captionStatus === 'approved' ? 'Legenda Aprovada' : activeCreative.captionStatus === 'changes_requested' ? 'Ajuste na Legenda' : 'Legenda Pendente'}
                      </span>

                      <button
                        onClick={() => handleCopyCaptionText(activeCreative.description, activeCreative.id)}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 cursor-pointer"
                        title="Copiar Legenda"
                      >
                        <Copy size={12} />
                        <span>{copiedCaptionId === activeCreative.id ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {activeCreative.description ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-950/80 border border-amber-500/20 rounded-2xl text-xs text-zinc-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap font-sans selection:bg-amber-500">
                      {activeCreative.description}
                    </div>

                    {/* CAPTION DIRECT APPROVAL / ADJUSTMENT BUTTONS (DISABLED IF CREATIVE IS REJECTED) */}
                    {activeCreative.status !== 'rejected' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveCaption(activeCreative)}
                          disabled={isSubmitting || activeCreative.captionStatus === 'approved'}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            activeCreative.captionStatus === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                          }`}
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>{activeCreative.captionStatus === 'approved' ? 'Legenda Já Aprovada' : 'Aprovar Esta Legenda'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setTargetFeedbackCreative(activeCreative);
                            setFeedbackTargetType('caption');
                            setFeedbackType('changes');
                            setShowFeedbackModal(true);
                          }}
                          disabled={isSubmitting}
                          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Ajustar Legenda</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500 flex items-center gap-2">
                    <AlignLeft size={16} className="text-zinc-600 shrink-0" />
                    <span>Nenhuma legenda foi cadastrada pela equipe para este post ainda.</span>
                  </div>
                )}
              </div>

              {activeCreative.captionFeedback && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-mono font-bold uppercase text-[10px] block text-amber-400">
                    Ajuste solicitado na Legenda:
                  </span>
                  <p className="italic">"{activeCreative.captionFeedback}"</p>
                </div>
              )}

              {activeCreative.clientFeedback && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-mono font-bold uppercase text-[10px] block text-amber-400">
                    Ajuste solicitado no Visual:
                  </span>
                  <p className="italic">"{activeCreative.clientFeedback}"</p>
                  {activeCreative.approvalDate && (
                    <span className="text-[10px] text-zinc-400 block mt-1">Data: {activeCreative.approvalDate}</span>
                  )}
                </div>
              )}
            </div>

            {/* DECISION ACTION BUTTONS (VISUAL APPROVAL) */}
            <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-400" />
                <span>Decisão sobre a Arte Visual / Mídia</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Avalie os slides e imagens do post. Aprove a arte visual ou solicite ajustes gráficos.
              </p>

              <div className="space-y-2.5 pt-2">
                
                {/* APPROVE VISUAL BUTTON (BLUE THEME) */}
                <button
                  onClick={() => handleApproveCreative(activeCreative)}
                  disabled={isSubmitting || activeCreative.status === 'approved'}
                  className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    activeCreative.status === 'approved'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25'
                  }`}
                >
                  <Check size={18} strokeWidth={2.5} />
                  <span>{activeCreative.status === 'approved' ? 'Visual Já Aprovado' : 'Aprovar Arte Visual'}</span>
                </button>

                {/* REQUEST CHANGES ON VISUAL BUTTON */}
                <button
                  onClick={() => {
                    setTargetFeedbackCreative(activeCreative);
                    setFeedbackTargetType('all');
                    setFeedbackType('changes');
                    setShowFeedbackModal(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-2xl font-bold text-xs bg-zinc-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>Solicitar Alterações na Arte Visual</span>
                </button>
              </div>
            </div>

            {/* BACK TO ALL CREATIVES */}
            <div className="text-center">
              <button
                onClick={() => setViewMode('hub')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={14} />
                <span>Ver Todos os {creatives.length} Criativos da Central</span>
              </button>
            </div>

            {/* FOOTER */}
            <div className="text-center text-[11px] text-zinc-500 space-y-1">
              <p className="flex items-center justify-center gap-1.5">
                <Shield size={12} className="text-purple-400" />
                Ambiente seguro de aprovação de conteúdo
              </p>
              <p>© {new Date().getFullYear()} Planner de Conteúdo Multicanal</p>
            </div>

          </section>
        </main>
      )}

      {/* 4. FEEDBACK / CHANGES MODAL */}
      {showFeedbackModal && targetFeedbackCreative && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#161622] border border-zinc-800 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${feedbackType === 'changes' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {feedbackTargetType === 'caption' ? <AlignLeft size={18} /> : <MessageSquare size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {feedbackTargetType === 'caption' 
                      ? 'Ajustes na Legenda / Copy' 
                      : (feedbackType === 'changes' ? 'Ajustes na Arte Visual' : 'Motivo da Reprovação')}
                  </h3>
                  <span className="text-[10px] text-zinc-400 block truncate max-w-[240px]">
                    {targetFeedbackCreative.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setTargetFeedbackCreative(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* PRESET QUICK SUGGESTIONS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-zinc-400 block">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(feedbackTargetType === 'caption' ? CAPTION_QUICK_SUGGESTIONS : CREATIVE_QUICK_SUGGESTIONS).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeedbackText(prev => prev ? `${prev}. ${sug}` : sug)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                {feedbackTargetType === 'caption'
                  ? 'Como você gostaria que a legenda ficasse?'
                  : 'Descreva detalhadamente o que precisa ser ajustado:'}
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={feedbackTargetType === 'caption' 
                  ? 'Ex: Por favor altere a chamada final para "Comente QUERO para receber o link"...' 
                  : 'Ex: Por favor trocar a foto do slide 3 por uma com maior contraste...'}
                className="w-full h-32 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none text-xs text-white placeholder-zinc-500 resize-none font-sans"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setTargetFeedbackCreative(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={isSubmitting || !feedbackText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/20"
              >
                <Send size={13} />
                <span>Enviar Ajuste</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
