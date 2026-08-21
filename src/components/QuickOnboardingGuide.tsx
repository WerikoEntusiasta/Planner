import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, X, ChevronDown, ChevronUp, Palette, PlusCircle, Share2, Award } from 'lucide-react';
import { Post, Client } from '../types';

interface QuickOnboardingGuideProps {
  posts: Post[];
  activeClient?: Client;
  onOpenBrandKit: () => void;
  onOpenNewPost: () => void;
  onOpenApprovalLink: () => void;
}

export default function QuickOnboardingGuide({
  posts,
  activeClient,
  onOpenBrandKit,
  onOpenNewPost,
  onOpenApprovalLink,
}: QuickOnboardingGuideProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('planner_onboarding_dismissed') === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Determine completion of steps based on real state
  const hasPosts = posts.length > 0;
  const hasBrandKit = Boolean(
    activeClient?.brandColors?.primary || 
    localStorage.getItem('creator_planner_brand_kit') ||
    localStorage.getItem('creator_planner_brand_kit_v2')
  );
  const hasCopiedLink = localStorage.getItem('planner_onboarding_link_copied') === 'true';

  const completedCount = (hasBrandKit ? 1 : 0) + (hasPosts ? 1 : 0) + (hasCopiedLink ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('planner_onboarding_dismissed', 'true');
  };

  const handleShareClick = () => {
    localStorage.setItem('planner_onboarding_link_copied', 'true');
    onOpenApprovalLink();
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => {
            setIsDismissed(false);
            localStorage.removeItem('planner_onboarding_dismissed');
          }}
          className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-card border border-panel-border transition-all cursor-pointer shadow-sm hover:border-accent-purple"
        >
          <Sparkles size={12} className="text-accent-purple" />
          <span>Guia de Início Rápido ({completedCount}/3)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-panel-card via-[#151520] to-panel-card border border-accent-purple/30 p-5 shadow-xl transition-all animate-fade-in">
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-24 bg-accent-orange/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-orange/20 border border-accent-purple/40 text-accent-purple">
            <Sparkles size={20} className="text-accent-orange" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                🚀 Onboarding de Sucesso
              </span>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {completedCount} de 3 passos concluídos
              </span>
            </div>
            <h3 className="text-sm md:text-base font-display font-bold text-white tracking-tight mt-0.5">
              Configure seu fluxo em menos de 2 minutos
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title="Fechar guia"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-panel-black h-2 rounded-full overflow-hidden border border-panel-border/60 mb-4">
        <div 
          className="bg-gradient-to-r from-accent-purple via-pink-500 to-accent-orange h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List (Collapsible) */}
      {!isCollapsed && (
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          
          {/* STEP 1: BRAND KIT */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            hasBrandKit 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {hasBrandKit ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-zinc-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Palette size={13} className="text-accent-blue" />
                  <h4 className="text-xs font-bold text-white">1. Kit de Marca & Cores</h4>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Defina logo, tom de voz e cores da marca do cliente.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBrandKit}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasBrandKit 
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700' 
                  : 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/40'
              }`}
            >
              <span>{hasBrandKit ? 'Editar Kit' : 'Configurar Kit'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* STEP 2: CREATE FIRST POST */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            hasPosts 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {hasPosts ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-zinc-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <PlusCircle size={13} className="text-accent-purple" />
                  <h4 className="text-xs font-bold text-white">2. Criar Primeiro Conteúdo</h4>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Crie um post no calendário com gancho, roteiro e CTA.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenNewPost}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasPosts 
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700' 
                  : 'bg-gradient-to-r from-accent-purple to-accent-orange text-white shadow-md hover:opacity-90'
              }`}
            >
              <span>{hasPosts ? '+ Novo Post' : 'Criar Post com IA'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* STEP 3: SHARE APPROVAL LINK */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
            hasCopiedLink 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {hasCopiedLink ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-zinc-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Share2 size={13} className="text-accent-orange" />
                  <h4 className="text-xs font-bold text-white">3. Link de Aprovação</h4>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Envie o link sem senha para o cliente aprovar em 1 clique.
                </p>
              </div>
            </div>

            <button
              onClick={handleShareClick}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasCopiedLink 
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-700' 
                  : 'bg-accent-orange/20 text-accent-orange hover:bg-accent-orange/30 border border-accent-orange/40'
              }`}
            >
              <span>{hasCopiedLink ? 'Abrir Link de Aprovação' : 'Gerar Link do Cliente'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
