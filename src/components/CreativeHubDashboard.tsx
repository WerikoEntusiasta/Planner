import React from 'react';
import { Creative, Client, User, CreativeFormat, CreativeStatus } from '../types';
import { 
  Layers, Clock, CheckCircle2, MessageSquare, Calendar, Rocket, 
  XCircle, Copy, Check, Share2, ExternalLink, Sparkles, Plus, 
  Bookmark, AlignLeft, Image as ImageIcon, Film, ArrowRight, Eye, Edit3
} from 'lucide-react';

export type CreativeSubMenu = 'dashboard' | 'changes_requested' | 'approved' | 'scheduled' | 'posted' | 'rejected' | 'observations';

interface CreativeHubDashboardProps {
  creatives: Creative[];
  clients: Client[];
  selectedClientId: string;
  onNavigateSubMenu: (tab: CreativeSubMenu) => void;
  onOpenCreateModal: () => void;
  onOpenAIModal: () => void;
  onOpenObservationsModal: () => void;
  onOpenCaptionEditor: (creative: Creative) => void;
  onOpenEditModal: (creative: Creative) => void;
  onMarkAsPosted: (creative: Creative) => void;
  onOpenScheduleModal: (creative: Creative) => void;
  onViewAsClient: (shareToken: string, focus?: 'all' | 'visual' | 'caption') => void;
  onCopyGeneralLink: (clientId?: string) => void;
  onCopyGeneralCaptionLink: (clientId?: string) => void;
  onShareGeneralWhatsApp: (clientId?: string) => void;
  onShareGeneralCaptionWhatsApp: (clientId?: string) => void;
  onPreviewGeneralHub: (clientId?: string, focus?: 'all' | 'visual' | 'caption') => void;
  onOpenShareModal?: (creative?: Creative | null, clientId?: string, focus?: 'all' | 'visual' | 'caption', mode?: 'single' | 'hub') => void;
  copiedGeneralLink: boolean;
  copiedGeneralCaptionLink: boolean;
  observationsCount: number;
}

export default function CreativeHubDashboard({
  creatives,
  clients,
  selectedClientId,
  onNavigateSubMenu,
  onOpenCreateModal,
  onOpenAIModal,
  onOpenObservationsModal,
  onOpenCaptionEditor,
  onOpenEditModal,
  onMarkAsPosted,
  onOpenScheduleModal,
  onViewAsClient,
  onCopyGeneralLink,
  onCopyGeneralCaptionLink,
  onShareGeneralWhatsApp,
  onShareGeneralCaptionWhatsApp,
  onPreviewGeneralHub,
  onOpenShareModal,
  copiedGeneralLink,
  copiedGeneralCaptionLink,
  observationsCount
}: CreativeHubDashboardProps) {
  const currentSelectedClientObj = clients.find(c => c.id === selectedClientId);

  // Filter creatives for stats based on selected client
  const scopedCreatives = creatives.filter(c => {
    if (selectedClientId !== 'all' && c.clientId !== selectedClientId) return false;
    return true;
  });

  const totalCount = scopedCreatives.length;
  const changesCount = scopedCreatives.filter(c => c.status === 'changes_requested' || c.captionStatus === 'changes_requested').length;
  const approvedCount = scopedCreatives.filter(c => (c.status === 'approved' || c.captionStatus === 'approved') && c.status !== 'posted' && c.status !== 'published' && c.status !== 'scheduled' && c.status !== 'rejected').length;
  const scheduledCount = scopedCreatives.filter(c => c.status === 'scheduled').length;
  const postedCount = scopedCreatives.filter(c => c.status === 'posted' || c.status === 'published').length;
  const rejectedCount = scopedCreatives.filter(c => c.status === 'rejected').length;
  const pendingVisualCount = scopedCreatives.filter(c => c.status === 'pending_approval' || c.status === 'draft').length;

  const validCaptionCreatives = scopedCreatives.filter(c => c.status !== 'rejected');
  const approvedCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && c.captionStatus === 'approved').length;
  const pendingCaptionsCount = validCaptionCreatives.filter(c => Boolean(c.description?.trim()) && (c.captionStatus === 'pending_approval' || !c.captionStatus || c.captionStatus === 'draft')).length;
  const missingCaptionsCount = validCaptionCreatives.filter(c => !c.description?.trim()).length;

  // Items waiting immediate change
  const itemsNeedingChanges = scopedCreatives.filter(c => c.status === 'changes_requested' || c.captionStatus === 'changes_requested').slice(0, 3);
  // Items approved ready to schedule or post
  const itemsApprovedReady = scopedCreatives.filter(c => (c.status === 'approved' || c.captionStatus === 'approved') && c.status !== 'posted' && c.status !== 'published' && c.status !== 'scheduled' && c.status !== 'rejected').slice(0, 3);
  // Recent items
  const recentCreatives = [...scopedCreatives].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* 1. HERO HEADER */}
      <div className="p-6 md:p-7 bg-[#121218] rounded-2xl border border-[#24242D] relative shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#A78BFA] text-xs font-mono font-bold uppercase tracking-wider">
              <Layers size={14} className="text-[#8B5CF6]" />
              <span>Painel Geral da Central de Criativos</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-[#F2F2F5] tracking-tight">
              Visão Geral & Fluxo de Aprovações
            </h1>
            <p className="text-xs md:text-sm text-[#92929F] leading-relaxed">
              Monitore o status dos seus carrosséis, vídeos e legendas. Quando um post for aprovado, você pode <strong className="text-[#F2F2F5]">agendar ou marcar como postado</strong> com 1 clique para manter sua esteira sempre organizada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateSubMenu('observations')}
              className="px-3.5 py-2.5 rounded-xl font-display font-semibold text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Abrir submenu de observações e diretrizes dos clientes"
            >
              <Bookmark size={15} className="text-amber-400" />
              <span>Observações do Cliente</span>
              {observationsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-mono font-bold rounded-full">
                  {observationsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAIModal}
              className="px-4 py-2.5 rounded-xl font-display font-semibold text-xs bg-[#17171F] hover:bg-[#20202B] text-[#F2F2F5] border border-[#24242D] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#A78BFA]" />
              <span>Gerar Textos (IA)</span>
            </button>

            <button
              onClick={onOpenCreateModal}
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
                  Link Geral de Mídias {currentSelectedClientObj ? `(${currentSelectedClientObj.name})` : ''}
                </h3>
              </div>
              <p className="text-xs text-[#92929F]">
                Link completo para o cliente visualizar e aprovar todos os posts e carrosséis ({pendingVisualCount} pendentes).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenShareModal) {
                    onOpenShareModal(null, selectedClientId !== 'all' ? selectedClientId : undefined, 'all', 'hub');
                  } else {
                    onCopyGeneralLink();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  copiedGeneralLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
                }`}
              >
                {copiedGeneralLink ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedGeneralLink ? 'Link Copiado!' : 'Compartilhar Central'}</span>
              </button>

              <button
                onClick={() => onShareGeneralWhatsApp()}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-emerald-400 border border-[#24242D] transition-all cursor-pointer"
                title="Enviar no WhatsApp"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={() => onPreviewGeneralHub(undefined, 'all')}
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
                Link exclusivo para o cliente revisar e aprovar apenas as copys e legendas de uma vez só ({pendingCaptionsCount} pendentes).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenShareModal) {
                    onOpenShareModal(null, selectedClientId !== 'all' ? selectedClientId : undefined, 'caption', 'hub');
                  } else {
                    onCopyGeneralCaptionLink();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  copiedGeneralCaptionLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {copiedGeneralCaptionLink ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copiedGeneralCaptionLink ? 'Link de Legendas Copiado!' : 'Compartilhar Legendas'}</span>
              </button>

              <button
                onClick={() => onShareGeneralCaptionWhatsApp()}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                title="Enviar Legendas da Central no WhatsApp"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={() => onPreviewGeneralHub(undefined, 'caption')}
                className="p-2 rounded-xl bg-[#121218] hover:bg-[#1E1E26] text-zinc-400 hover:text-white border border-[#24242D] transition-all cursor-pointer"
                title="Visualizar Central de Legendas como Cliente"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SUBMENUS KPI RESUME CARDS (CLICKABLE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
            <Layers size={13} className="text-purple-400" />
            <span>Resumo dos Submenus da Central</span>
          </span>
          <span className="text-[11px] text-zinc-500">
            Clique em qualquer cartão para abrir o submenu correspondente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          
          {/* 1. AGUARDANDO MUDANÇA */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('changes_requested')}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <MessageSquare size={18} />
              </span>
              <ArrowRight size={14} className="text-amber-400/60 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-amber-300 leading-none mb-1">
              {changesCount}
            </div>
            <div className="text-xs font-bold text-amber-200">Aguardando Mudança</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Ajustes visuais ou de legenda solicitados</div>
          </button>

          {/* 2. APROVADOS */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('approved')}
            className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <CheckCircle2 size={18} />
              </span>
              <ArrowRight size={14} className="text-blue-400/60 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-blue-300 leading-none mb-1">
              {approvedCount}
            </div>
            <div className="text-xs font-bold text-blue-200">Aprovados</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">Prontos para agendar ou postar</div>
          </button>

          {/* 3. AGENDADOS */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('scheduled')}
            className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Calendar size={18} />
              </span>
              <ArrowRight size={14} className="text-purple-400/60 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-purple-300 leading-none mb-1">
              {scheduledCount}
            </div>
            <div className="text-xs font-bold text-purple-200">Agendados</div>
            <div className="text-[10px] text-purple-400/80 mt-0.5">Com data de publicação definida</div>
          </button>

          {/* 4. POSTADOS */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('posted')}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Rocket size={18} />
              </span>
              <ArrowRight size={14} className="text-emerald-400/60 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-emerald-300 leading-none mb-1">
              {postedCount}
            </div>
            <div className="text-xs font-bold text-emerald-200">Postados</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Histórico concluído e organizado</div>
          </button>

          {/* 5. REJEITADOS */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('rejected')}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:border-red-500 hover:bg-red-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-red-500/20 text-red-400">
                <XCircle size={18} />
              </span>
              <ArrowRight size={14} className="text-red-400/60 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-red-300 leading-none mb-1">
              {rejectedCount}
            </div>
            <div className="text-xs font-bold text-red-200">Rejeitados</div>
            <div className="text-[10px] text-red-400/80 mt-0.5">Criativos reprovados ou descartados</div>
          </button>

          {/* 6. OBSERVAÇÕES DO CLIENTE */}
          <button
            type="button"
            onClick={() => onNavigateSubMenu('observations')}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/15 transition-all text-left group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Bookmark size={18} />
              </span>
              <ArrowRight size={14} className="text-amber-400/60 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-bold font-display text-amber-300 leading-none mb-1">
              {observationsCount}
            </div>
            <div className="text-xs font-bold text-amber-200">Observações</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Diretrizes e aprendizados salvos</div>
          </button>

        </div>
      </div>

      {/* 3. IMMEDIATE ACTION SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 3.1 AGUARDANDO MUDANÇAS (URGENTE) */}
        <div className="p-5 bg-[#121218] border border-amber-500/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <MessageSquare size={15} />
              </span>
              <h3 className="text-sm font-bold text-white font-display">
                Aguardando Mudanças ({changesCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigateSubMenu('changes_requested')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {itemsNeedingChanges.length === 0 ? (
            <div className="p-6 bg-[#17171F] rounded-xl border border-[#24242D] text-center space-y-1">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
              <p className="text-xs text-white font-semibold">Tudo em dia!</p>
              <p className="text-[11px] text-zinc-400">Nenhum criativo ou legenda com ajustes solicitados no momento.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {itemsNeedingChanges.map(c => (
                <div key={c.id} className="p-3 bg-[#17171F] border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">{c.clientName || 'Cliente'}</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">Ajuste Solicitado</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{c.title}</h4>
                  
                  {c.clientFeedback && (
                    <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg italic line-clamp-2">
                      💬 Visual: "{c.clientFeedback}"
                    </p>
                  )}
                  {c.captionFeedback && (
                    <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg italic line-clamp-2">
                      ✍️ Legenda: "{c.captionFeedback}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onOpenCaptionEditor(c)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/30 cursor-pointer"
                    >
                      Editar Legenda
                    </button>
                    <button
                      onClick={() => onOpenEditModal(c)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white text-[11px] font-semibold hover:bg-zinc-700 cursor-pointer"
                    >
                      Editar Criativo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3.2 APROVADOS PRONTOS PARA POSTAR OU AGENDAR */}
        <div className="p-5 bg-[#121218] border border-blue-500/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <CheckCircle2 size={15} />
              </span>
              <h3 className="text-sm font-bold text-white font-display">
                Aprovados Prontos ({approvedCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigateSubMenu('approved')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {itemsApprovedReady.length === 0 ? (
            <div className="p-6 bg-[#17171F] rounded-xl border border-[#24242D] text-center space-y-1">
              <Clock size={24} className="text-zinc-500 mx-auto" />
              <p className="text-xs text-white font-semibold">Nenhum post aprovado aguardando ação</p>
              <p className="text-[11px] text-zinc-400">Envie novos criativos para aprovação usando o link geral da marca.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {itemsApprovedReady.map(c => (
                <div key={c.id} className="p-3 bg-[#17171F] border border-blue-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">{c.clientName || 'Cliente'}</span>
                    <span className="text-[10px] text-blue-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> Aprovado
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{c.title}</h4>
                  
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onOpenScheduleModal(c)}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-semibold hover:bg-purple-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar size={11} />
                      <span>Agendar</span>
                    </button>
                    <button
                      onClick={() => onMarkAsPosted(c)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Rocket size={11} />
                      <span>Marcar como Postado</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. RECENT CREATIVES GRID PREVIEW */}
      <div className="p-5 bg-[#121218] border border-[#24242D] rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <ImageIcon size={15} />
            </span>
            <h3 className="text-sm font-bold text-white font-display">
              Últimos Criativos da Central ({recentCreatives.length})
            </h3>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Adicionar Novo Post</span>
          </button>
        </div>

        {recentCreatives.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Nenhum criativo cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentCreatives.map(c => {
              const firstAsset = c.assets?.[0];
              const isCarousel = c.format === 'carousel' || (c.assets || []).length > 1;
              const isVideo = c.format === 'video' || firstAsset?.type === 'video';

              return (
                <div
                  key={c.id}
                  onClick={() => onViewAsClient(c.shareToken, 'all')}
                  className="bg-[#17171F] border border-[#24242D] hover:border-purple-500/40 rounded-xl overflow-hidden cursor-pointer group transition-all"
                >
                  <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                    {firstAsset ? (
                      isVideo ? (
                        <video src={firstAsset.url} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" />
                      ) : (
                        <img src={firstAsset.url} alt={c.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform" />
                      )
                    ) : (
                      <ImageIcon size={24} className="text-zinc-600" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-zinc-200">
                      {isCarousel ? `Carrossel (${c.assets?.length || 0})` : isVideo ? 'Vídeo' : 'Imagem'}
                    </span>
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      c.status === 'approved' ? 'bg-blue-500/80 text-white' :
                      c.status === 'changes_requested' ? 'bg-amber-500/80 text-black' :
                      c.status === 'scheduled' ? 'bg-purple-500/80 text-white' :
                      c.status === 'posted' ? 'bg-emerald-500/80 text-white' :
                      c.status === 'rejected' ? 'bg-red-500/80 text-white' :
                      'bg-orange-500/80 text-white'
                    }`}>
                      {c.status === 'approved' ? 'Aprovado' :
                       c.status === 'changes_requested' ? 'Ajustes' :
                       c.status === 'scheduled' ? 'Agendado' :
                       c.status === 'posted' ? 'Postado' :
                       c.status === 'rejected' ? 'Rejeitado' :
                       'Pendente'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-[10px] font-mono text-purple-400 font-semibold uppercase">{c.clientName || 'Cliente'}</div>
                    <div className="text-xs font-bold text-white line-clamp-1">{c.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
