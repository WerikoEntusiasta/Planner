import React, { useState, useEffect } from 'react';
import { Creative, CreativeAsset } from '../types';
import { 
  Check, X, MessageSquare, Send, Sparkles, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, Smartphone, Instagram, 
  Film, Image as ImageIcon, CheckCircle2, Clock, ThumbsUp, 
  Share2, Maximize2, Shield, RefreshCw, Layers, ArrowLeft,
  CheckCheck, Filter, ThumbsDown, HelpCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientCreativeApprovalPageProps {
  shareToken?: string;
  clientToken?: string;
  initialMode?: 'single' | 'hub';
  onBackToApp?: () => void;
}

export default function ClientCreativeApprovalPage({ 
  shareToken, 
  clientToken, 
  initialMode = 'single',
  onBackToApp 
}: ClientCreativeApprovalPageProps) {
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

  // Hub filter state
  const [hubStatusFilter, setHubStatusFilter] = useState<'all' | 'pending_approval' | 'approved' | 'changes_requested'>('pending_approval');

  // Carousel & media viewer state for inspector
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mockupMode, setMockupMode] = useState<'feed' | 'clean'>('feed');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [targetFeedbackCreative, setTargetFeedbackCreative] = useState<Creative | null>(null);
  const [feedbackType, setFeedbackType] = useState<'changes' | 'reject'>('changes');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

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

  // Handle single creative approval
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
          feedback: 'Aprovado pelo cliente.'
        })
      });

      // Update local storage backup
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => (c.shareToken === token || c.id === creativeToApprove.id) ? { ...c, status: 'approved' as const, approvalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      showToast(`Criativo "${creativeToApprove.title}" APROVADO com sucesso! 🚀`, 'success');
    } catch (err) {
      console.error('Failed to submit approval:', err);
      showToast(`Criativo aprovado (modo offline)`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Batch Approve All Pending Creatives
  const handleBatchApprovePending = async () => {
    const pendingList = creatives.filter(c => c.status === 'pending_approval' || c.status === 'draft');
    if (pendingList.length === 0) return;

    if (!confirm(`Deseja aprovar todos os ${pendingList.length} criativos pendentes de uma só vez?`)) {
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

  // Handle submit detailed feedback (changes requested or reject)
  const handleSendFeedback = async () => {
    if (!targetFeedbackCreative || !feedbackText.trim()) return;
    setIsSubmitting(true);
    const targetStatus = feedbackType === 'changes' ? 'changes_requested' : 'rejected';
    const token = targetFeedbackCreative.shareToken || targetFeedbackCreative.id;
    const formattedDate = new Date().toLocaleDateString('pt-BR');

    // Optimistic update
    setCreatives(prev => prev.map(c => c.id === targetFeedbackCreative.id ? { ...c, status: targetStatus, clientFeedback: feedbackText.trim(), approvalDate: formattedDate } : c));
    if (activeCreative?.id === targetFeedbackCreative.id) {
      setActiveCreative(prev => prev ? { ...prev, status: targetStatus, clientFeedback: feedbackText.trim(), approvalDate: formattedDate } : null);
    }

    try {
      await fetch(`/api/creatives/public/${encodeURIComponent(token)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          feedback: feedbackText.trim()
        })
      });

      // Update local storage
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => (c.shareToken === token || c.id === targetFeedbackCreative.id) ? { ...c, status: targetStatus, clientFeedback: feedbackText.trim(), approvalDate: formattedDate } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      setShowFeedbackModal(false);
      setFeedbackText('');
      showToast(feedbackType === 'changes' ? 'Solicitação de ajuste enviada à equipe! 📝' : 'Feedback registrado.', 'info');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setShowFeedbackModal(false);
      setFeedbackText('');
      showToast('Feedback registrado.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open inspector for specific creative
  const handleInspectCreative = (creative: Creative) => {
    setActiveCreative(creative);
    setCurrentSlideIndex(0);
    setViewMode('single');
  };

  // Cycle to next / prev creative in inspector
  const handleCycleCreative = (direction: 'next' | 'prev') => {
    if (!activeCreative || creatives.length <= 1) return;
    const currentIndex = creatives.findIndex(c => c.id === activeCreative.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= creatives.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = creatives.length - 1;

    setActiveCreative(creatives[nextIndex]);
    setCurrentSlideIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-zinc-300">Carregando Central de Aprovação...</h3>
        <p className="text-xs text-zinc-500 mt-1">Carregando mídias e roteiros em alta resolução</p>
      </div>
    );
  }

  if (error && creatives.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-bounce">
          <AlertCircle size={30} />
        </div>
        <h2 className="text-xl font-bold font-display">Link de Aprovação Não Encontrado</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-md">
          {error || 'Os criativos solicitados não foram encontrados ou o link expirou. Solicite um novo link ao responsável.'}
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={13} />
            Tentar Novamente
          </button>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              Voltar ao Aplicativo
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filtered creatives list for the Hub gallery
  const filteredHubCreatives = creatives.filter(c => {
    if (hubStatusFilter === 'all') return true;
    if (hubStatusFilter === 'pending_approval') return c.status === 'pending_approval' || c.status === 'draft';
    return c.status === hubStatusFilter;
  });

  const pendingCount = creatives.filter(c => c.status === 'pending_approval' || c.status === 'draft').length;
  const approvedCount = creatives.filter(c => c.status === 'approved').length;
  const changesCount = creatives.filter(c => c.status === 'changes_requested').length;
  const totalCount = creatives.length;

  const activeAssets = activeCreative?.assets || [];
  const currentAsset = activeAssets[currentSlideIndex] || activeAssets[0];
  const isCarousel = activeCreative?.format === 'carousel' || activeAssets.length > 1;
  const isVideo = activeCreative?.format === 'video' || currentAsset?.type === 'video';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* TOAST NOTIFICATION POPUP */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/40 text-blue-200'
                : 'bg-amber-950/90 border-amber-500/40 text-amber-200'
            }`}
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP PORTAL HEADER */}
      <header className="border-b border-zinc-800/80 bg-[#121217]/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Sparkles size={16} className="text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white font-display">Portal de Aprovação de Criativos</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">
                {clientName}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Enviado por <span className="text-zinc-200 font-medium">{creatorName}</span>
            </p>
          </div>
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
              <span>Ver Todos os Criativos ({creatives.length})</span>
            </button>
          ) : (
            pendingCount > 0 && (
              <button
                onClick={handleBatchApprovePending}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCheck size={14} />
                <span>Aprovar Todos os Pendentes ({pendingCount})</span>
              </button>
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
                  <span>Central Geral de Aprovação</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">
                  Criativos da Marca {clientName}
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
                  Revise todos os posts, carrosséis e vídeos abaixo. Você pode aprovar ou solicitar ajustes individualmente em cada item ou aprovar tudo de uma só vez.
                </p>
              </div>

              {/* BATCH ACTION BUTTON */}
              {pendingCount > 0 ? (
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
              )}
            </div>

            {/* STATS TABS (STATUS COLOR CODING: PENDING = ORANGE, APPROVED = BLUE) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
              
              {/* PENDING CARD (ORANGE) */}
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

              {/* APPROVED CARD (BLUE) */}
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

              {/* CHANGES REQUESTED CARD */}
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

              {/* TOTAL ALL CARD */}
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
          </div>

          {/* CREATIVES GALLERY GRID */}
          {filteredHubCreatives.length === 0 ? (
            <div className="bg-[#14141c] border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-500 mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">Nenhum criativo nesta categoria</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Alterne os filtros acima para visualizar os criativos das outras categorias.
                </p>
              </div>
              <button
                onClick={() => setHubStatusFilter('all')}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Ver Todos ({totalCount})</span>
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

                return (
                  <div
                    key={creative.id}
                    className={`bg-[#14141c] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col border group ${
                      isPending
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

                      {/* STATUS BADGE (ORANGE FOR PENDING, BLUE FOR APPROVED) */}
                      <div className="absolute top-3 right-3">
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg animate-pulse">
                            <Clock size={12} /> Aguardando Aprovação
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <CheckCircle2 size={12} /> Aprovado
                          </span>
                        )}
                        {isChanges && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <MessageSquare size={12} /> Ajustes
                          </span>
                        )}
                      </div>

                      {/* HOVER OVERLAY: INSPECT HINT */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                        <span className="px-3 py-1.5 rounded-xl bg-purple-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                          <Eye size={14} /> Inspecionar em Tela Cheia
                        </span>
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
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

                        {creative.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {creative.description}
                          </p>
                        )}

                        {creative.clientFeedback && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 line-clamp-2 italic">
                            💬 "{creative.clientFeedback}"
                          </div>
                        )}
                      </div>

                      {/* INLINE ACTION BUTTONS */}
                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                        
                        <div className="flex items-center gap-2">
                          {/* 1-Click Approve (Blue theme) */}
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

                          {/* Request changes */}
                          <button
                            onClick={() => {
                              setTargetFeedbackCreative(creative);
                              setFeedbackType('changes');
                              setShowFeedbackModal(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Solicitar Ajustes"
                          >
                            <MessageSquare size={13} />
                            <span>Ajustes</span>
                          </button>

                          {/* Inspect Full Screen */}
                          <button
                            onClick={() => handleInspectCreative(creative)}
                            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer"
                            title="Ver em Detalhes / Formato Feed"
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONTACT & SECURITY FOOTER */}
          <div className="text-center text-[11px] text-zinc-500 py-6 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <Shield size={12} className="text-purple-400" />
              Ambiente seguro e criptografado de aprovação de conteúdo
            </p>
            <p>© {new Date().getFullYear()} Planner de Conteúdo Multicanal</p>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE B: DETAILED SINGLE CREATIVE INSPECTOR                              */}
      {/* ========================================================================= */}
      {viewMode === 'single' && activeCreative && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* LEFT COLUMN: MEDIA CANVAS / SLIDES (7 COLS) */}
          <section className="lg:col-span-7 flex flex-col items-center">
            
            {/* Controls Bar above preview */}
            <div className="w-full max-w-lg mb-3 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('hub')}
                  className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                  title="Voltar para a lista completa de criativos"
                >
                  <ArrowLeft size={12} />
                  <span>Todos os Criativos</span>
                </button>
                <span className="font-mono text-[11px] uppercase font-bold text-zinc-400 px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-800">
                  {isCarousel ? `Carrossel (${activeAssets.length} slides)` : isVideo ? 'Vídeo' : 'Imagem'}
                </span>
              </div>

              {/* Viewport switch: Feed Mockup vs Clean */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setMockupMode('feed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    mockupMode === 'feed' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Feed
                </button>
                <button
                  onClick={() => setMockupMode('clean')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    mockupMode === 'clean' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Limpo
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="w-full max-w-lg bg-[#14141c] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
              
              {/* INSTAGRAM / SOCIAL HEADER (Feed Mockup) */}
              {mockupMode === 'feed' && (
                <div className="p-3.5 border-b border-zinc-800/80 bg-[#181822] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-orange-400 p-[1.5px]">
                      <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {(activeCreative.clientName || clientName)?.charAt(0) || 'C'}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {(activeCreative.clientName || clientName)?.toLowerCase().replace(/\s+/g, '.') || 'cliente.oficial'}
                      </p>
                      <p className="text-[10px] text-zinc-500">Publicação Patrocinada / Feed</p>
                    </div>
                  </div>
                  <div className="text-zinc-500 font-bold text-sm tracking-widest">•••</div>
                </div>
              )}

              {/* MEDIA CANVAS */}
              <div 
                className={`relative bg-black flex items-center justify-center overflow-hidden select-none ${
                  activeCreative.aspectRatio === '9:16'
                    ? 'aspect-[9/16] min-h-[500px]'
                    : activeCreative.aspectRatio === '4:5'
                    ? 'aspect-[4/5] min-h-[440px]'
                    : activeCreative.aspectRatio === '16:9'
                    ? 'aspect-video min-h-[280px]'
                    : 'aspect-square min-h-[400px]'
                }`}
              >
                {activeAssets.length === 0 ? (
                  <div className="p-12 text-center text-zinc-600">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Nenhuma mídia anexada a este criativo</p>
                  </div>
                ) : isVideo || currentAsset?.type === 'video' ? (
                  <video
                    key={currentAsset?.url || 'video'}
                    src={currentAsset?.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentSlideIndex}
                      src={currentAsset?.url}
                      alt={currentAsset?.title || `Slide ${currentSlideIndex + 1}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-full object-contain"
                    />
                  </AnimatePresence>
                )}

                {/* CAROUSEL SLIDE NUMBER BADGE */}
                {isCarousel && activeAssets.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-white border border-white/10 shadow-lg z-10">
                    {currentSlideIndex + 1}/{activeAssets.length}
                  </div>
                )}

                {/* CAROUSEL NAVIGATION ARROWS */}
                {isCarousel && activeAssets.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + activeAssets.length) % activeAssets.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-20 shadow-lg"
                      title="Slide Anterior"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % activeAssets.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-20 shadow-lg"
                      title="Próximo Slide"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* CAROUSEL DOTS INDICATOR */}
              {isCarousel && activeAssets.length > 1 && (
                <div className="py-2.5 bg-[#14141c] flex items-center justify-center gap-1.5 border-t border-zinc-800/60">
                  {activeAssets.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIndex ? 'w-6 bg-purple-500' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      title={`Ir para o slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* CAROUSEL THUMBNAIL STRIP */}
            {isCarousel && activeAssets.length > 1 && (
              <div className="w-full max-w-lg mt-4 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800">
                <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 mb-2 px-1 flex items-center justify-between">
                  <span>Navegar pelos {activeAssets.length} slides</span>
                  <span className="text-zinc-400">Clique para abrir</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {activeAssets.map((asset, idx) => (
                    <button
                      key={asset.id || idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        idx === currentSlideIndex
                          ? 'border-purple-500 scale-105 shadow-md shadow-purple-500/20'
                          : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
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
              
              {/* STATUS INDICATOR (ORANGE FOR PENDING, BLUE FOR APPROVED) */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  <Instagram size={12} /> {activeCreative.platform?.toUpperCase() || 'INSTAGRAM'} • {activeCreative.format?.toUpperCase() || 'CARROSSEL'}
                </div>

                {activeCreative.status === 'approved' && (
                  <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                    <CheckCircle2 size={13} /> Aprovado
                  </span>
                )}
                {(activeCreative.status === 'pending_approval' || activeCreative.status === 'draft') && (
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center gap-1 shadow-md animate-pulse">
                    <Clock size={13} /> Aguardando Aprovação
                  </span>
                )}
                {activeCreative.status === 'changes_requested' && (
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center gap-1 shadow-md">
                    <MessageSquare size={13} /> Ajustes Solicitados
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  {activeCreative.title}
                </h2>
              </div>

              {activeCreative.description && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold uppercase text-zinc-400 block">
                    Legenda / Texto da Publicação
                  </label>
                  <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {activeCreative.description}
                  </div>
                </div>
              )}

              {activeCreative.clientFeedback && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <span className="font-mono font-bold uppercase text-[10px] block text-amber-400">
                    Último feedback registrado:
                  </span>
                  <p className="italic">"{activeCreative.clientFeedback}"</p>
                  {activeCreative.approvalDate && (
                    <span className="text-[10px] text-zinc-400 block mt-1">Data: {activeCreative.approvalDate}</span>
                  )}
                </div>
              )}
            </div>

            {/* DECISION ACTION BUTTONS (BLUE FOR APPROVAL) */}
            <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-display">
                Sua Decisão sobre este Criativo
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Avalie o visual e textos do post. Aprove imediatamente ou solicite ajustes apontando o que precisa mudar.
              </p>

              <div className="space-y-2.5 pt-2">
                
                {/* APPROVE BUTTON (BLUE THEME) */}
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
                  <span>{activeCreative.status === 'approved' ? 'Criativo Já Aprovado' : 'Aprovar Criativo'}</span>
                </button>

                {/* REQUEST CHANGES BUTTON */}
                <button
                  onClick={() => {
                    setTargetFeedbackCreative(activeCreative);
                    setFeedbackType('changes');
                    setShowFeedbackModal(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-2xl font-bold text-xs bg-zinc-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>Solicitar Alterações ou Ajustes</span>
                </button>

                {/* REJECT BUTTON */}
                <button
                  onClick={() => {
                    setTargetFeedbackCreative(activeCreative);
                    setFeedbackType('reject');
                    setShowFeedbackModal(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-zinc-500 hover:text-red-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={14} />
                  <span>Reprovar este Conteúdo</span>
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
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {feedbackType === 'changes' ? 'Descreva os Ajustes Desejados' : 'Motivo da Reprovação'}
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
                className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {feedbackType === 'changes'
                ? 'Indique quais slides, imagens, fontes ou textos você deseja alterar na arte.'
                : 'Explique o motivo para que a equipe possa produzir uma nova proposta alinhada à sua expectativa.'}
            </p>

            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ex: Trocar foto do slide 3, ajustar título da capa..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setTargetFeedbackCreative(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendFeedback}
                disabled={!feedbackText.trim() || isSubmitting}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                  feedbackType === 'changes'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
