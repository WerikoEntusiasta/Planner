import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, X, ChevronDown, ChevronUp, Palette, PlusCircle, Share2, Clock } from 'lucide-react';
import { Post, Client, User } from '../types';

interface QuickOnboardingGuideProps {
  currentUser?: User | null;
  posts: Post[];
  activeClient?: Client;
  onOpenBrandKit: () => void;
  onOpenNewPost: () => void;
  onOpenApprovalLink: () => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export default function QuickOnboardingGuide({
  currentUser,
  posts,
  activeClient,
  onOpenBrandKit,
  onOpenNewPost,
  onOpenApprovalLink,
}: QuickOnboardingGuideProps) {
  // Resolve user account creation timestamp (works for both official users and team members)
  const userCreationTime = useMemo(() => {
    if (currentUser?.createdAt) {
      const parsed = new Date(currentUser.createdAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    
    // Fallback: lookup or store first-seen timestamp per user ID in localStorage
    const storageKey = `planner_user_created_ts_${currentUser?.id || 'default'}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    
    const now = Date.now();
    localStorage.setItem(storageKey, now.toString());
    return now;
  }, [currentUser?.id, currentUser?.createdAt]);

  const [isExpired, setIsExpired] = useState<boolean>(() => {
    return Date.now() - userCreationTime >= ONE_HOUR_MS;
  });

  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(`planner_onboarding_dismissed_${currentUser?.id || 'default'}`) === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [minutesRemaining, setMinutesRemaining] = useState<number>(() => {
    const diff = userCreationTime + ONE_HOUR_MS - Date.now();
    return Math.max(0, Math.ceil(diff / 60000));
  });

  // Watch the 1-hour expiration timer and trigger smooth fadeout animation
  useEffect(() => {
    const timeRemainingMs = userCreationTime + ONE_HOUR_MS - Date.now();

    if (timeRemainingMs <= 0) {
      setIsExpired(true);
      return;
    }

    // Interval to update remaining minutes indicator
    const interval = setInterval(() => {
      const remaining = userCreationTime + ONE_HOUR_MS - Date.now();
      if (remaining <= 0) {
        setMinutesRemaining(0);
        clearInterval(interval);
      } else {
        setMinutesRemaining(Math.max(1, Math.ceil(remaining / 60000)));
      }
    }, 30000);

    // Timeout to trigger graceful fadeout before unmounting
    const fadeoutTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsExpired(true);
      }, 900); // Allow fadeout animation to complete
    }, Math.max(0, timeRemainingMs - 900));

    return () => {
      clearInterval(interval);
      clearTimeout(fadeoutTimer);
    };
  }, [userCreationTime]);

  // Determine completion of steps based on real state
  const hasPosts = posts.length > 0;
  const hasBrandKit = Boolean(
    (activeClient as any)?.brandColors?.primary || 
    localStorage.getItem('creator_planner_brand_kit') ||
    localStorage.getItem('creator_planner_brand_kit_v2')
  );
  const hasCopiedLink = localStorage.getItem('planner_onboarding_link_copied') === 'true';

  const completedCount = (hasBrandKit ? 1 : 0) + (hasPosts ? 1 : 0) + (hasCopiedLink ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsDismissed(true);
      setIsFadingOut(false);
      localStorage.setItem(`planner_onboarding_dismissed_${currentUser?.id || 'default'}`, 'true');
    }, 500);
  };

  const handleShareClick = () => {
    localStorage.setItem('planner_onboarding_link_copied', 'true');
    onOpenApprovalLink();
  };

  // If 1 hour has elapsed, do not show the onboarding guide at all
  if (isExpired) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className={`flex justify-end transition-all duration-700 ease-out ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <button
          onClick={() => {
            setIsDismissed(false);
            localStorage.removeItem(`planner_onboarding_dismissed_${currentUser?.id || 'default'}`);
          }}
          className="text-[11px] font-mono text-[#92929F] hover:text-[#F2F2F5] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121218] border border-[#24242D] transition-all cursor-pointer shadow-sm hover:border-[#8B5CF6]/40"
        >
          <Sparkles size={12} className="text-[#A78BFA]" />
          <span>Guia de Início Rápido ({completedCount}/3)</span>
          {minutesRemaining > 0 && (
            <span className="text-[10px] text-[#F97316] font-bold">({minutesRemaining}m)</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#121218] border border-[#24242D] p-5 shadow-sm transition-all duration-700 ease-out transform ${
        isFadingOut
          ? 'opacity-0 -translate-y-4 scale-98 pointer-events-none max-h-0 py-0 my-0 border-transparent overflow-hidden'
          : 'opacity-100 translate-y-0 scale-100 max-h-[600px] animate-fade-in'
      }`}
    >
      {/* Top Header Row */}
      <div className="relative flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#17171F] border border-[#24242D] text-[#A78BFA] shrink-0">
            <Sparkles size={18} className="text-[#F97316]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/25">
                Onboarding de Sucesso
              </span>
              <span className="text-xs font-mono font-semibold text-[#92929F]">
                {completedCount} de 3 passos concluídos
              </span>
              {minutesRemaining > 0 && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                  <Clock size={11} className="animate-pulse text-amber-400" />
                  <span>Ativo na 1ª hora ({minutesRemaining}m restantes)</span>
                </span>
              )}
            </div>
            <h3 className="text-sm md:text-base font-display font-bold text-[#F2F2F5] tracking-tight mt-0.5">
              Configure seu fluxo em menos de 2 minutos
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F] transition-all cursor-pointer"
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F] transition-all cursor-pointer"
            title="Fechar guia"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full bg-[#0B0B0F] h-2 rounded-full overflow-hidden border border-[#24242D] mb-4">
        <div 
          className="bg-gradient-to-r from-[#8B5CF6] to-[#F97316] h-full rounded-full transition-all duration-700 ease-out"
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
              : 'bg-[#17171F] border-[#24242D] hover:border-[#8B5CF6]/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {hasBrandKit ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-[#686873]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Palette size={13} className="text-blue-400" />
                  <h4 className="text-xs font-semibold text-[#F2F2F5]">1. Kit de Marca & Cores</h4>
                </div>
                <p className="text-[11px] text-[#92929F] mt-1 leading-relaxed">
                  Defina logo, tom de voz e cores da marca do cliente.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBrandKit}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasBrandKit 
                  ? 'bg-[#121218] text-[#F2F2F5] hover:bg-[#20202B] border border-[#24242D]' 
                  : 'bg-[#8B5CF6]/15 text-[#A78BFA] hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30'
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
              : 'bg-[#17171F] border-[#24242D] hover:border-[#8B5CF6]/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {hasPosts ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-[#686873]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <PlusCircle size={13} className="text-[#A78BFA]" />
                  <h4 className="text-xs font-semibold text-[#F2F2F5]">2. Criar Primeiro Conteúdo</h4>
                </div>
                <p className="text-[11px] text-[#92929F] mt-1 leading-relaxed">
                  Crie um post no calendário com gancho, roteiro e CTA.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenNewPost}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasPosts 
                  ? 'bg-[#121218] text-[#F2F2F5] hover:bg-[#20202B] border border-[#24242D]' 
                  : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm'
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
              : 'bg-[#17171F] border-[#24242D] hover:border-[#8B5CF6]/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {hasCopiedLink ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-[#686873]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Share2 size={13} className="text-[#F97316]" />
                  <h4 className="text-xs font-semibold text-[#F2F2F5]">3. Link de Aprovação</h4>
                </div>
                <p className="text-[11px] text-[#92929F] mt-1 leading-relaxed">
                  Envie o link sem senha para o cliente aprovar em 1 clique.
                </p>
              </div>
            </div>

            <button
              onClick={handleShareClick}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hasCopiedLink 
                  ? 'bg-[#121218] text-[#F2F2F5] hover:bg-[#20202B] border border-[#24242D]' 
                  : 'bg-[#F97316]/15 text-[#F97316] hover:bg-[#F97316]/25 border border-[#F97316]/30'
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
