/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Platform, ContentFormat, FunnelStage, User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { Menu, Plus, Filter, Sparkles, Lock } from 'lucide-react';

interface HeaderProps {
  activePlatform: Platform | 'all';
  setActivePlatform: (p: Platform | 'all') => void;
  activeStage: FunnelStage | 'all';
  setActiveStage: (s: FunnelStage | 'all') => void;
  activeFormat: ContentFormat | 'all';
  setActiveFormat: (f: ContentFormat | 'all') => void;
  activeView: string;
  onNewPostClick: () => void;
  onOpenMobileSidebar: () => void;
  currentUser?: User | null;
  activeTeamMembersCount?: number;
  isLive?: boolean;
}

export default function Header({
  activePlatform,
  setActivePlatform,
  activeStage,
  setActiveStage,
  activeFormat,
  setActiveFormat,
  activeView,
  onNewPostClick,
  onOpenMobileSidebar,
  currentUser,
  activeTeamMembersCount = 1,
  isLive = true
}: HeaderProps) {
  const { t } = useLanguage();

  const canCreate = !currentUser?.isTeamMember || !currentUser?.permissions || currentUser.permissions.createCards !== false;

  const renderPlatformSvg = (type: Platform, size = 15) => {
    switch (type) {
      case 'instagram':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        );
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'grid': return t('viewCards', 'Cards Estratégicos');
      case 'calendar': return t('editorialCalendar', 'Calendário Editorial');
      case 'kanban': return t('viewBoard', 'Board de Produção');
      case 'pipeline': return 'Pipeline Multicanal';
      case 'dashboard': return t('viewDashboard', 'Dashboard de Desempenho');
      default: return 'Visão Geral';
    }
  };

  return (
    <header className="border-b border-panel-border bg-panel-black px-4 py-3.5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      
      {/* Left: Mobile Toggle & Current Section Title */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-[#121218] border border-[#24242D] text-[#92929F] hover:text-[#F2F2F5] cursor-pointer"
            title="Abrir Menu Lateral"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-display font-bold text-[#F2F2F5] tracking-tight">
                {getViewTitle()}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA]">
                PRO 2026
              </span>
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                title={isLive ? "Conectado via WebSocket: ações refletem instantaneamente para a equipe" : "Conectando ao canal em tempo real..."}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="hidden sm:inline">Tempo Real</span>
              </div>
            </div>
            <p className="text-xs text-[#92929F]">
              Gerencie e filtre seu conteúdo multicanal em tempo real
            </p>
          </div>
        </div>

        {/* Mobile New Post CTA */}
        {canCreate ? (
          <button
            onClick={onNewPostClick}
            className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white hover:bg-zinc-100 text-black shadow-sm cursor-pointer font-bold transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="md:hidden p-2 rounded-xl bg-[#121218] border border-[#24242D] text-[#686873]">
            <Lock size={16} />
          </div>
        )}
      </div>

      {/* Center/Right: Filters and Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
        
        {/* PLATFORMS FILTER */}
        <div className="flex items-center gap-1 p-1 bg-[#121218] rounded-xl border border-[#24242D]">
          <button
            onClick={() => setActivePlatform('all')}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activePlatform === 'all'
                ? 'bg-[#17171F] text-[#F2F2F5] font-semibold border border-[#24242D]'
                : 'text-[#92929F] hover:text-[#F2F2F5]'
            }`}
          >
            {t('all', 'Todos')}
          </button>
          
          <button
            onClick={() => setActivePlatform('instagram')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activePlatform === 'instagram'
                ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#F2F2F5] font-semibold'
                : 'text-[#92929F] hover:text-[#F2F2F5]'
            }`}
          >
            {renderPlatformSvg('instagram', 13)}
            <span className="hidden sm:inline">Instagram</span>
          </button>

          <button
            onClick={() => setActivePlatform('tiktok')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activePlatform === 'tiktok'
                ? 'bg-zinc-800 border border-zinc-700 text-white font-semibold'
                : 'text-[#92929F] hover:text-[#F2F2F5]'
            }`}
          >
            {renderPlatformSvg('tiktok', 13)}
            <span className="hidden sm:inline">TikTok</span>
          </button>

          <button
            onClick={() => setActivePlatform('youtube')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activePlatform === 'youtube'
                ? 'bg-[#F97316]/20 border border-[#F97316]/40 text-[#F2F2F5] font-semibold'
                : 'text-[#92929F] hover:text-[#F2F2F5]'
            }`}
          >
            {renderPlatformSvg('youtube', 13)}
            <span className="hidden sm:inline">YouTube</span>
          </button>
        </div>

        {/* FUNNEL STAGE FILTER */}
        <div className="flex items-center gap-1 p-1 bg-[#121218] rounded-xl border border-[#24242D]">
          <button
            onClick={() => setActiveStage('all')}
            className={`text-[11px] px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeStage === 'all'
                ? 'bg-[#17171F] text-[#F2F2F5] font-semibold border border-[#24242D]'
                : 'text-[#92929F] hover:text-[#F2F2F5]'
            }`}
          >
            Funil
          </button>
          {(['TOFU', 'MOFU', 'BOFU'] as FunnelStage[]).map((stage) => {
            return (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                className={`text-[11px] font-mono px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeStage === stage
                    ? 'bg-[#17171F] text-[#F2F2F5] font-semibold border border-[#24242D]'
                    : 'text-[#92929F] hover:text-[#F2F2F5]'
                }`}
              >
                {stage}
              </button>
            );
          })}
        </div>

        {/* CONTENT FORMATS FILTER */}
        <select
          value={activeFormat}
          onChange={(e) => setActiveFormat(e.target.value as ContentFormat | 'all')}
          className="bg-[#121218] text-[#F2F2F5] border border-[#24242D] text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer focus:border-[#8B5CF6]/50 capitalize"
        >
          <option value="all">{t('formatFilter', 'Todos os Formatos')}</option>
          <option value="reels">Reels</option>
          <option value="shorts">{t('formatShorts', 'Shorts')}</option>
          <option value="video">{t('formatVideo', 'Vídeo Longo')}</option>
          <option value="carousel">{t('formatCarousel', 'Carrossel')}</option>
          <option value="stories">Stories</option>
          <option value="live">Live</option>
        </select>

        {/* Desktop Plan Content CTA */}
        {canCreate ? (
          <button
            onClick={onNewPostClick}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-bold text-xs bg-white text-black hover:bg-zinc-100 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('planContent', 'Planejar Conteúdo')}</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121218] border border-[#24242D] text-[#686873] text-xs font-mono select-none">
            <Lock size={13} className="text-[#686873]" />
            <span>Criação Bloqueada</span>
          </div>
        )}

      </div>
    </header>
  );
}
