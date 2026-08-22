/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Platform, ContentFormat, FunnelStage, Client, User, UserPermissions } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { 
  Calendar, Grid, Layers, Plus, Sparkles, ChevronDown, ChevronRight, UserPlus, LogOut, 
  Users, Edit3, LifeBuoy, Shield, BarChart2, Palette, Hash, Rocket, 
  Bookmark, Workflow, Menu, X, CheckCircle2, Target, TrendingUp,
  Image as ImageIcon, Wrench, Lock
} from 'lucide-react';

interface AppNavigationSidebarProps {
  activeView: 'grid' | 'calendar' | 'kanban' | 'dashboard' | 'pipeline' | 'carousel-ai' | 'editor' | 'creatives';
  setActiveView: (v: 'grid' | 'calendar' | 'kanban' | 'dashboard' | 'pipeline' | 'carousel-ai' | 'editor' | 'creatives') => void;
  onNewPostClick: () => void;
  
  // Client props
  clients: Client[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onCreateClient: (name: string) => void;
  onRenameClient?: (clientId: string, name: string) => void;

  // Auth & Modals
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenTeamModal?: () => void;
  onOpenSupportModal?: () => void;
  onOpenLGPDModal?: () => void;
  onOpenIntegrationsModal?: () => void;
  onOpenBrandKitModal?: () => void;
  onOpenHashtagLibraryModal?: () => void;
  onOpenCampaignsModal?: () => void;
  onOpenReferenceHubModal?: () => void;
  onOpenCarouselAIModal?: () => void;
  isSimulatedSession?: boolean;
  onExitSimulation?: () => void;
  
  // Stats
  totalPostsCount: number;
  scheduledCount: number;
  draftCount: number;
  publishedCount: number;

  // Mobile drawer state
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AppNavigationSidebar({
  activeView,
  setActiveView,
  onNewPostClick,
  clients,
  activeClientId,
  onSelectClient,
  onCreateClient,
  onRenameClient,
  currentUser,
  onLogout,
  onOpenTeamModal,
  onOpenSupportModal,
  onOpenLGPDModal,
  onOpenIntegrationsModal,
  onOpenBrandKitModal,
  onOpenHashtagLibraryModal,
  onOpenCampaignsModal,
  onOpenReferenceHubModal,
  onOpenCarouselAIModal,
  isSimulatedSession,
  onExitSimulation,
  totalPostsCount,
  scheduledCount,
  draftCount,
  publishedCount,
  mobileOpen,
  setMobileOpen
}: AppNavigationSidebarProps) {
  const { t } = useLanguage();
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isToolsHovered, setIsToolsHovered] = useState(false);
  const [isToolsPinned, setIsToolsPinned] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeClient = clients.find(c => c.id === activeClientId) || clients[0];

  // Helper to check user granular permissions
  const hasPerm = (key: keyof UserPermissions): boolean => {
    if (!currentUser) return true;
    if (!currentUser.isTeamMember) return true; // Workspace Owner always has all permissions
    if (!currentUser.permissions) return true;
    return currentUser.permissions[key] !== false;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPerm('manageClients')) {
      alert('Você não tem permissão para adicionar novas marcas/clientes.');
      return;
    }
    if (newClientName.trim()) {
      onCreateClient(newClientName.trim());
      setNewClientName('');
    }
  };

  const navItems = [
    { id: 'grid', label: t('viewCards', 'Cards Estratégicos'), icon: Grid, color: 'text-accent-purple', allowed: true },
    { id: 'calendar', label: t('editorialCalendar', 'Calendário Mensal'), icon: Calendar, color: 'text-white', allowed: true },
    { id: 'kanban', label: t('viewBoard', 'Board Kanban'), icon: Layers, color: 'text-accent-orange', allowed: true },
    { id: 'pipeline', label: 'Pipeline de Produção', icon: Workflow, color: 'text-blue-400', allowed: hasPerm('productionPipeline') },
    { id: 'creatives', label: 'Central de Criativos', icon: ImageIcon, color: 'text-pink-400', allowed: hasPerm('creativeHub') },
    { id: 'dashboard', label: t('viewDashboard', 'Dashboard de Métricas'), icon: BarChart2, color: 'text-emerald-400', allowed: hasPerm('viewMetrics') },
  ];

  const toolItems = [
    { 
      id: 'carousel_ai', 
      label: 'Criador de Carrossel IA', 
      icon: Sparkles, 
      color: 'text-accent-purple', 
      action: onOpenCarouselAIModal,
      allowed: hasPerm('useAI'),
      isComingSoon: true 
    },
    { id: 'brandkit', label: 'Kit de Marca', icon: Palette, color: 'text-accent-blue', action: onOpenBrandKitModal, allowed: hasPerm('manageBrandKit') },
    { id: 'campaigns', label: 'Campanhas Multicanal', icon: Rocket, color: 'text-accent-orange', action: onOpenCampaignsModal, allowed: hasPerm('manageCampaigns') },
    { id: 'reference', label: 'Central de Inspirações', icon: Bookmark, color: 'text-accent-purple', action: onOpenReferenceHubModal, allowed: true },
    { id: 'hashtags', label: 'Biblioteca Hashtags', icon: Hash, color: 'text-accent-purple', action: onOpenHashtagLibraryModal, allowed: true },
    { 
      id: 'integrations', 
      label: t('integrations', 'Integrações'), 
      icon: Workflow, 
      color: 'text-accent-orange', 
      action: onOpenIntegrationsModal,
      allowed: hasPerm('manageIntegrations')
    },
    { id: 'team', label: currentUser?.isTeamMember ? t('viewTeam', 'Equipa & Permissões') : t('teamAndPlans', 'Equipa & Planos'), icon: Users, color: 'text-accent-orange', action: onOpenTeamModal, allowed: true },
    { id: 'support', label: t('support', 'Suporte Técnico'), icon: LifeBuoy, color: 'text-accent-orange', action: onOpenSupportModal, allowed: true },
    { id: 'privacy', label: t('privacy', 'Privacidade & LGPD'), icon: Shield, color: 'text-emerald-400', action: onOpenLGPDModal, allowed: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-panel-black border-r border-panel-border select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-[#24242D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#121218] border border-[#24242D] flex items-center justify-center shadow-sm">
            <div className="flex space-x-[3px] items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F2F2F5] border border-black/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-display font-bold tracking-tight text-[#F2F2F5]">
                Content Planner
              </h1>
            </div>
            <p className="text-[10px] text-[#686873] font-mono tracking-tight">
              Instagram, TikTok & YouTube
            </p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg bg-[#121218] border border-[#24242D] text-[#92929F] hover:text-[#F2F2F5]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Client Selector Box */}
      <div className="p-4 border-b border-[#24242D]/70" ref={clientDropdownRef}>
        <label className="block text-[10px] font-mono uppercase font-bold text-[#686873] mb-1.5">
          {t('clientLabel', 'Cliente Atual')}
        </label>
        <div className="relative">
          <button
            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#121218] border border-[#24242D] text-[#F2F2F5] hover:border-[#8B5CF6]/40 hover:bg-[#17171F] transition-all cursor-pointer shadow-sm text-xs font-semibold"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] flex-shrink-0" />
              <span className="truncate">{activeClient?.name || t('selectClient', 'Selecione...')}</span>
            </div>
            <ChevronDown size={14} className={`text-[#686873] transition-transform flex-shrink-0 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isClientDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-[#121218] border border-[#24242D] rounded-xl shadow-2xl overflow-hidden z-50 p-1.5 animate-fade-in">
              <div className="text-[9px] font-mono uppercase font-bold text-[#686873] px-2 py-1 border-b border-[#24242D] mb-1">
                {t('selectClient', 'Selecione o Cliente')}
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group/item ${
                      c.id === activeClientId
                        ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 font-semibold text-[#F2F2F5]'
                        : 'text-[#92929F] hover:bg-[#17171F] hover:text-[#F2F2F5]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelectClient(c.id);
                        setIsClientDropdownOpen(false);
                      }}
                      className="text-left flex-1 truncate cursor-pointer outline-none font-medium"
                    >
                      {c.name}
                    </button>
                    <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={() => {
                          const newName = prompt(`Digite o novo nome para "${c.name}":`, c.name);
                          if (newName && newName.trim() && onRenameClient) {
                            onRenameClient(c.id, newName.trim());
                          }
                        }}
                        title="Renomear"
                        className="p-1 rounded text-[#92929F] hover:text-[#A78BFA] hover:bg-[#17171F]"
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#24242D] mt-1 pt-1.5 px-1">
                <form onSubmit={handleCreateSubmit} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Novo cliente..."
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="flex-1 bg-[#0B0B0F] border border-[#24242D] rounded-lg px-2 py-1 text-xs text-[#F2F2F5] placeholder-[#686873] focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <button
                    type="submit"
                    disabled={!newClientName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Criar
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* NEW POST CTA BUTTON (CLEAN WHITE WITH BLACK TEXT) */}
        <button
          onClick={() => {
            if (!hasPerm('createCards')) {
              alert('Você não tem permissão para criar novos conteúdos no workspace.');
              return;
            }
            onNewPostClick();
            setMobileOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-bold text-xs shadow-sm transition-all cursor-pointer ${
            !hasPerm('createCards')
              ? 'bg-[#121218] border border-[#24242D] text-[#686873] cursor-not-allowed opacity-75'
              : 'bg-white hover:bg-zinc-100 text-black shadow-sm'
          }`}
        >
          {!hasPerm('createCards') ? (
            <>
              <Lock size={14} />
              <span>Criação Bloqueada</span>
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={2.5} />
              <span>{t('planContent', 'Planejar Conteúdo')}</span>
            </>
          )}
        </button>

        {/* PRIMARY VIEWS MENU */}
        <div>
          <div className="text-[10px] font-mono uppercase font-bold text-[#686873] tracking-wider mb-2 px-2">
            Visualizações Principais
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isAllowed = item.allowed !== false;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isAllowed) {
                      alert('Acesso restrito: Esta visualização foi desabilitada para o seu usuário pelo administrador.');
                      return;
                    }
                    setActiveView(item.id as any);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    !isAllowed
                      ? 'text-[#686873] opacity-60 hover:bg-[#121218] cursor-not-allowed'
                      : isActive
                      ? 'bg-[#8B5CF6]/12 border border-[#8B5CF6]/25 text-[#F2F2F5] font-semibold'
                      : 'text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F]'
                  }`}
                >
                  <Icon size={16} className={!isAllowed ? 'text-[#686873]' : isActive ? 'text-[#A78BFA]' : 'text-[#686873]'} />
                  <span className={!isAllowed ? 'line-through text-[#686873]' : ''}>{item.label}</span>
                  {!isAllowed ? (
                    <Lock size={12} className="ml-auto text-[#686873]" />
                  ) : isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ADVANCED TOOLS & RESOURCES MENU (HOVER EXPANDABLE) */}
        <div 
          className="relative rounded-2xl transition-all"
          onMouseEnter={() => setIsToolsHovered(true)}
          onMouseLeave={() => setIsToolsHovered(false)}
        >
          {/* Header trigger button with hover & click toggle */}
          <button
            type="button"
            onClick={() => setIsToolsPinned(prev => !prev)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none text-left ${
              isToolsHovered || isToolsPinned || activeView === 'carousel-ai'
                ? 'bg-[#17171F] border-[#8B5CF6]/30 text-[#F2F2F5]'
                : 'bg-[#121218] border-[#24242D] text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg border transition-all ${
                isToolsHovered || isToolsPinned
                  ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#A78BFA]'
                  : 'bg-[#17171F] border-[#24242D] text-[#686873]'
              }`}>
                <Wrench size={13} className="flex-shrink-0" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-semibold text-[#F2F2F5] truncate flex items-center gap-1.5">
                  <span>Ferramentas & Recursos</span>
                </div>
                <div className="text-[9px] font-mono text-[#686873] flex items-center gap-1">
                  <span>{toolItems.length} utilitários</span>
                  <span>•</span>
                  <span className="text-[#A78BFA]/90">Passe o mouse</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className={`p-1 rounded-md transition-transform duration-200 ${
                (isToolsHovered || isToolsPinned || activeView === 'carousel-ai') ? 'rotate-180 text-[#A78BFA]' : 'text-[#686873]'
              }`}>
                <ChevronDown size={14} />
              </span>
            </div>
          </button>

          {/* Hover / Expandable Body */}
          {(isToolsHovered || isToolsPinned || activeView === 'carousel-ai') && (
            <div className="mt-1.5 p-1.5 rounded-xl bg-[#121218] border border-[#24242D] shadow-xl space-y-0.5 animate-fade-in">
              {toolItems.map((tool) => {
                const Icon = tool.icon;
                const isCarouselAI = tool.id === 'carousel_ai';
                const isActive = isCarouselAI && activeView === 'carousel-ai';
                const isComingSoon = (tool as any).isComingSoon;
                const isAllowed = tool.allowed !== false;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (!isAllowed) {
                        alert('Acesso restrito: Esta ferramenta foi desabilitada para o seu usuário pelo administrador.');
                        return;
                      }
                      tool.action?.();
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left group ${
                      !isAllowed
                        ? 'text-[#686873] opacity-60 hover:bg-[#121218] cursor-not-allowed'
                        : isActive
                        ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#F2F2F5] font-semibold'
                        : 'text-[#92929F] hover:text-[#F2F2F5] hover:bg-[#17171F]'
                    }`}
                  >
                    <Icon size={14} className={`${!isAllowed ? 'text-[#686873]' : isActive ? 'text-[#A78BFA]' : 'text-[#686873]'} flex-shrink-0`} />
                    <span className={`truncate text-[11px] ${!isAllowed ? 'line-through text-[#686873]' : ''}`}>{tool.label}</span>
                    {!isAllowed ? (
                      <Lock size={11} className="ml-auto text-[#686873] flex-shrink-0" />
                    ) : isComingSoon ? (
                      <span className="ml-auto px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/25 flex-shrink-0">
                        Em Breve
                      </span>
                    ) : isActive ? (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* STATS MINI CARD */}
        <div className="bg-[#121218] border border-[#24242D] p-3 rounded-xl space-y-2">
          <div className="text-[10px] font-mono uppercase font-bold text-[#686873] flex items-center justify-between">
            <span>Métricas do Workspace</span>
            <span className="text-[#F2F2F5] font-bold">{totalPostsCount} posts</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
            <div className="bg-[#17171F] p-1 rounded border border-[#24242D]">
              <span className="block text-[#F97316] font-bold">{draftCount}</span>
              <span className="text-[#686873] text-[9px]">Rasc.</span>
            </div>
            <div className="bg-[#17171F] p-1 rounded border border-[#24242D]">
              <span className="block text-[#A78BFA] font-bold">{scheduledCount}</span>
              <span className="text-[#686873] text-[9px]">Agend.</span>
            </div>
            <div className="bg-[#17171F] p-1 rounded border border-[#24242D]">
              <span className="block text-emerald-400 font-bold">{publishedCount}</span>
              <span className="text-[#686873] text-[9px]">Post.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sidebar Footer / User Account & Language */}
      <div className="p-4 border-t border-panel-border space-y-3 bg-panel-black">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#92929F] font-mono">Idioma</span>
          <LanguageSelector variant="compact" />
        </div>

        {currentUser && (
          <div className="pt-2 border-t border-[#24242D] flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-semibold text-[#F2F2F5] truncate">{currentUser.name}</div>
              <div className="text-[10px] text-[#686873] truncate font-mono">{currentUser.email}</div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair da Conta"
                className="p-2 rounded-lg bg-[#17171F] border border-[#24242D] text-[#92929F] hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer flex-shrink-0"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 flex-shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 h-full bg-panel-black z-50 flex flex-col shadow-2xl animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
