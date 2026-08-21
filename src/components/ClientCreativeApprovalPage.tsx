import React, { useState, useEffect } from 'react';
import { Creative, CreativeAsset } from '../types';
import { 
  Check, X, MessageSquare, Send, Sparkles, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, Smartphone, Instagram, 
  Film, Image as ImageIcon, CheckCircle2, Clock, ThumbsUp, 
  Share2, Maximize2, Shield, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientCreativeApprovalPageProps {
  shareToken: string;
  onBackToApp?: () => void;
}

export default function ClientCreativeApprovalPage({ shareToken, onBackToApp }: ClientCreativeApprovalPageProps) {
  const [creative, setCreative] = useState<Creative & { creatorName?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carousel & media viewer state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [mockupMode, setMockupMode] = useState<'feed' | 'clean' | 'mobile'>('feed');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'changes' | 'reject'>('changes');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusResult, setStatusResult] = useState<'approved' | 'changes_requested' | 'rejected' | null>(null);

  // Fetch creative data by shareToken
  const loadCreative = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try fetching from server
      const res = await fetch(`/api/creatives/public/${encodeURIComponent(shareToken)}`);
      const data = await res.json();
      if (res.ok && data.success && data.creative) {
        setCreative(data.creative);
        if (data.creative.status === 'approved') setStatusResult('approved');
        else if (data.creative.status === 'changes_requested') setStatusResult('changes_requested');
        else if (data.creative.status === 'rejected') setStatusResult('rejected');
      } else {
        // 2. Fallback to localStorage for offline or local preview
        const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
        const found = localCreatives.find(c => c.shareToken === shareToken || c.id === shareToken);
        if (found) {
          setCreative(found);
          if (found.status === 'approved') setStatusResult('approved');
          else if (found.status === 'changes_requested') setStatusResult('changes_requested');
          else if (found.status === 'rejected') setStatusResult('rejected');
        } else {
          setError('Criativo não localizado ou o link de aprovação expirou.');
        }
      }
    } catch (err: any) {
      // Fallback to localStorage
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const found = localCreatives.find(c => c.shareToken === shareToken || c.id === shareToken);
      if (found) {
        setCreative(found);
      } else {
        setError('Não foi possível carregar o criativo. Verifique sua conexão com a internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shareToken) {
      loadCreative();
    }
  }, [shareToken]);

  // Keyboard navigation for carousel slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!creative || creative.assets.length <= 1) return;
      if (e.key === 'ArrowRight') {
        setCurrentSlideIndex((prev) => (prev + 1) % creative.assets.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => (prev - 1 + creative.assets.length) % creative.assets.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creative]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/creatives/public/${encodeURIComponent(shareToken)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          feedback: 'Aprovado pelo cliente.'
        })
      });
      const data = await response.json();
      
      // Update local storage backup
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => c.shareToken === shareToken ? { ...c, status: 'approved' as const, approvalDate: new Date().toLocaleDateString('pt-BR') } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      setStatusResult('approved');
      if (creative) {
        setCreative({ ...creative, status: 'approved', approvalDate: new Date().toLocaleDateString('pt-BR') });
      }
    } catch (err) {
      console.error('Failed to submit approval:', err);
      setStatusResult('approved');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmitting(true);
    const targetStatus = feedbackType === 'changes' ? 'changes_requested' : 'rejected';
    try {
      await fetch(`/api/creatives/public/${encodeURIComponent(shareToken)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          feedback: feedbackText.trim()
        })
      });

      // Update local storage backup
      const localCreatives: Creative[] = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      const updated = localCreatives.map(c => c.shareToken === shareToken ? { ...c, status: targetStatus, clientFeedback: feedbackText.trim(), approvalDate: new Date().toLocaleDateString('pt-BR') } : c);
      localStorage.setItem('creator_planner_creatives', JSON.stringify(updated));

      setShowFeedbackModal(false);
      setStatusResult(targetStatus);
      if (creative) {
        setCreative({ ...creative, status: targetStatus, clientFeedback: feedbackText.trim() });
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setShowFeedbackModal(false);
      setStatusResult(targetStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-zinc-300">Carregando criativo para aprovação...</h3>
        <p className="text-xs text-zinc-500 mt-1">Carregando mídias em alta resolução</p>
      </div>
    );
  }

  if (error || !creative) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-bounce">
          <AlertCircle size={30} />
        </div>
        <h2 className="text-xl font-bold font-display">Link de Aprovação Não Encontrado</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-md">
          {error || 'Este criativo pode ter sido removido ou o link expirou. Por favor, solicite um novo link ao responsável.'}
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={loadCreative}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={13} />
            Tentar Novamente
          </button>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
            >
              Voltar ao Aplicativo
            </button>
          )}
        </div>
      </div>
    );
  }

  const assets = creative.assets || [];
  const currentAsset = assets[currentSlideIndex] || assets[0];
  const isCarousel = creative.format === 'carousel' || assets.length > 1;
  const isVideo = creative.format === 'video' || currentAsset?.type === 'video';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* 1. TOP PORTAL HEADER */}
      <header className="border-b border-zinc-800/80 bg-[#121217]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-orange-500 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Sparkles size={16} className="text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white font-display">Portal de Aprovação de Criativos</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
                {creative.clientName || 'Cliente'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Enviado por <span className="text-zinc-200 font-medium">{creative.creatorName || 'Sua Agência / Creator'}</span>
            </p>
          </div>
        </div>

        {/* STATUS PILL */}
        <div className="flex items-center gap-3">
          {creative.status === 'approved' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={14} />
              <span>Aprovado</span>
            </div>
          )}
          {creative.status === 'changes_requested' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Clock size={14} />
              <span>Ajustes Solicitados</span>
            </div>
          )}
          {creative.status === 'rejected' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
              <X size={14} />
              <span>Reprovado</span>
            </div>
          )}
          {creative.status === 'pending_approval' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold animate-pulse">
              <Clock size={14} />
              <span>Aguardando sua Aprovação</span>
            </div>
          )}

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 transition-all"
            >
              Voltar ao Planner
            </button>
          )}
        </div>
      </header>

      {/* 2. SUCCESS/NOTIFICATION BANNER */}
      {statusResult === 'approved' && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-3 text-center text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>Este criativo foi <strong>APROVADO</strong> com sucesso! O criador já recebeu sua confirmação.</span>
        </div>
      )}

      {statusResult === 'changes_requested' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
          <Clock size={16} className="text-amber-400 shrink-0" />
          <span>Sua solicitação de alteração foi registrada. O criador fará as modificações solicitadas.</span>
        </div>
      )}

      {/* 3. MAIN PORTAL WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: INTERACTIVE MEDIA / CAROUSEL VIEWER (7 COLS) */}
        <section className="lg:col-span-7 flex flex-col items-center">
          
          {/* Controls Bar above preview */}
          <div className="w-full max-w-lg mb-3 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase font-bold text-zinc-400 px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-800">
                {isCarousel ? `Carrossel (${assets.length} slides)` : isVideo ? 'Vídeo' : 'Imagem Única'}
              </span>
              <span className="text-[11px] text-zinc-500">Proporção {creative.aspectRatio || '1:1'}</span>
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
                Modo Limpo
              </button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="w-full max-w-lg bg-[#14141c] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* INSTAGRAM / SOCIAL HEADER (In Mockup Mode) */}
            {mockupMode === 'feed' && (
              <div className="p-3.5 border-b border-zinc-800/80 bg-[#181822] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-orange-400 p-[1.5px]">
                    <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {creative.clientName?.charAt(0) || 'C'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {creative.clientName ? creative.clientName.toLowerCase().replace(/\s+/g, '.') : 'cliente.oficial'}
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
                creative.aspectRatio === '9:16'
                  ? 'aspect-[9/16] min-h-[500px]'
                  : creative.aspectRatio === '4:5'
                  ? 'aspect-[4/5] min-h-[440px]'
                  : creative.aspectRatio === '16:9'
                  ? 'aspect-video min-h-[280px]'
                  : 'aspect-square min-h-[400px]'
              }`}
            >
              {assets.length === 0 ? (
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
              {isCarousel && assets.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-white border border-white/10 shadow-lg z-10">
                  {currentSlideIndex + 1}/{assets.length}
                </div>
              )}

              {/* CAROUSEL NAVIGATION ARROWS */}
              {isCarousel && assets.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + assets.length) % assets.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-20 shadow-lg"
                    title="Slide Anterior (Seta Esquerda)"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % assets.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-20 shadow-lg"
                    title="Próximo Slide (Seta Direita)"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* CAROUSEL DOTS INDICATOR */}
            {isCarousel && assets.length > 1 && (
              <div className="py-2.5 bg-[#14141c] flex items-center justify-center gap-1.5 border-t border-zinc-800/60">
                {assets.map((_, idx) => (
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

          {/* CAROUSEL THUMBNAIL STRIP (When > 1 asset) */}
          {isCarousel && assets.length > 1 && (
            <div className="w-full max-w-lg mt-4 bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800">
              <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 mb-2 px-1 flex items-center justify-between">
                <span>Navegar pelos {assets.length} slides</span>
                <span className="text-zinc-400">Clique para abrir</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {assets.map((asset, idx) => (
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
        </section>

        {/* RIGHT COLUMN: CREATIVE DETAILS & APPROVAL ACTIONS (5 COLS) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* CREATIVE TITLE & DETAILS CARD */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider mb-2">
                <Instagram size={12} /> {creative.platform.toUpperCase()} • {creative.format.toUpperCase()}
              </div>
              <h2 className="text-xl font-bold font-display text-white">
                {creative.title}
              </h2>
            </div>

            {creative.description && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase text-zinc-400 block">
                  Legenda / Texto da Publicação
                </label>
                <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl text-xs text-zinc-300 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
                  {creative.description}
                </div>
              </div>
            )}

            {creative.clientFeedback && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                <span className="font-mono font-bold uppercase text-[10px] block text-amber-400">
                  Último feedback registrado:
                </span>
                <p className="italic">"{creative.clientFeedback}"</p>
                {creative.approvalDate && (
                  <span className="text-[10px] text-zinc-400 block mt-1">Data: {creative.approvalDate}</span>
                )}
              </div>
            )}
          </div>

          {/* APPROVAL ACTION BUTTONS */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-display">
              Sua Decisão sobre este Criativo
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Avalie o design, carrossel e textos acima. Você pode aprovar imediatamente ou solicitar ajustes com instruções específicas.
            </p>

            <div className="space-y-2.5 pt-2">
              
              {/* APPROVE BUTTON */}
              <button
                onClick={handleApprove}
                disabled={isSubmitting || creative.status === 'approved'}
                className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check size={18} strokeWidth={2.5} />
                <span>{creative.status === 'approved' ? 'Criativo Já Aprovado' : 'Aprovar Criativo'}</span>
              </button>

              {/* REQUEST CHANGES BUTTON */}
              <button
                onClick={() => {
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

          {/* CONTACT & SECURITY FOOTER */}
          <div className="text-center text-[11px] text-zinc-500 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <Shield size={12} className="text-purple-400" />
              Ambiente seguro de aprovação de conteúdo
            </p>
            <p>© {new Date().getFullYear()} Planner de Conteúdo Multicanal</p>
          </div>

        </section>
      </main>

      {/* FEEDBACK / CHANGES MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                <h3 className="font-bold text-sm text-white">
                  {feedbackType === 'changes' ? 'Descreva os Ajustes Desejados' : 'Motivo da Reprovação'}
                </h3>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {feedbackType === 'changes'
                ? 'Indique quais slides, imagens ou textos você deseja modificar (ex: "Trocar foto do slide 2" ou "Mudar título do carrossel").'
                : 'Explique o motivo para que a equipe possa produzir uma nova proposta alinhada à sua expectativa.'}
            </p>

            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Digite aqui seu feedback detalhado..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowFeedbackModal(false)}
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
