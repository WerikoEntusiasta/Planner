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
      allowed: hasPerm('manageIntegrations'),
      isComingSoon: true 
    },
    { id: 'team', label: currentUser?.isTeamMember ? t('viewTeam', 'Equipa & Permissões') : t('teamAndPlans', 'Equipa & Planos'), icon: Users, color: 'text-accent-orange', action: onOpenTeamModal, allowed: true },
    { id: 'support', label: t('support', 'Suporte Técnico'), icon: LifeBuoy, color: 'text-accent-orange', action: onOpenSupportModal, allowed: true },
    { id: 'privacy', label: t('privacy', 'Privacidade & LGPD'), icon: Shield, color: 'text-emerald-400', action: onOpenLGPDModal, allowed: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-panel-black border-r border-panel-border/80 select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-panel-border/85 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-panel-card border border-panel-border flex items-center justify-center shadow-lg group">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-purple to-accent-orange opacity-40 rounded-xl blur-md" />
            <div className="relative flex space-x-[2px] items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-display font-bold tracking-tight gradient-title">
                Content Planner
              </h1>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Instagram, TikTok & YouTube
            </p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg bg-panel-card text-zinc-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Client Selector Box */}
      <div className="p-4 border-b border-panel-border/60" ref={clientDropdownRef}>
        <label className="block text-[10px] font-mono uppercase font-bold text-zinc-500 mb-1.5">
          {t('clientLabel', 'Cliente Atual')}
        </label>
        <div className="relative">
          <button
            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-panel-card border border-panel-border text-zinc-100 hover:border-zinc-700 transition-all cursor-pointer shadow-sm text-xs font-semibold"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-accent-purple flex-shrink-0" />
              <span className="truncate">{activeClient?.name || t('selectClient', 'Selecione...')}</span>
            </div>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform flex-shrink-0 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isClientDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-panel-card border border-panel-border rounded-xl shadow-2xl overflow-hidden z-50 p-1.5 animate-fade-in">
              <div className="text-[9px] font-mono uppercase font-bold text-zinc-500 px-2 py-1 border-b border-panel-border/50 mb-1">
                {t('selectClient', 'Selecione o Cliente')}
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between group/item ${
                      c.id === activeClientId
                        ? 'bg-accent-purple/20 border border-accent-purple/30 font-bold text-accent-purple'
                        : 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
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
                        className="p-1 rounded text-zinc-400 hover:text-accent-purple hover:bg-zinc-800"
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-panel-border/50 mt-1 pt-1.5 px-1">
                <form onSubmit={handleCreateSubmit} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Novo cliente..."
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-panel-border rounded-lg px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-purple"
                  />
                  <button
                    type="submit"
                    disabled={!newClientName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-accent-purple to-accent-orange text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* NEW POST CTA BUTTON */}
        <button
          onClick={() => {
            if (!hasPerm('createCards')) {
              alert('Você não tem permissão para criar novos conteúdos no workspace.');
              return;
            }
            onNewPostClick();
            setMobileOpen(false);
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-bold text-xs shadow-lg transition-all cursor-pointer ${
            !hasPerm('createCards')
              ? 'bg-zinc-900 border border-panel-border text-zinc-500 cursor-not-allowed opacity-75'
              : 'bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90'
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
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 tracking-wider mb-2 px-2">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    !isAllowed
                      ? 'text-zinc-600 opacity-60 hover:opacity-100 hover:bg-zinc-950 cursor-not-allowed'
                      : isActive
                      ? 'bg-gradient-to-r from-accent-purple/20 to-accent-orange/10 border border-accent-purple/30 text-white font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon size={16} className={!isAllowed ? 'text-zinc-600' : isActive ? 'text-accent-purple' : item.color} />
                  <span className={!isAllowed ? 'line-through text-zinc-600' : ''}>{item.label}</span>
                  {!isAllowed ? (
                    <Lock size={12} className="ml-auto text-zinc-500" />
                  ) : isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />
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
                ? 'bg-zinc-900/90 border-accent-purple/40 text-white shadow-lg'
                : 'bg-panel-card/50 border-panel-border/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg border transition-all ${
                isToolsHovered || isToolsPinned
                  ? 'bg-accent-purple/20 border-accent-purple/30 text-accent-purple'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                <Wrench size={13} className="flex-shrink-0" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold text-zinc-200 truncate flex items-center gap-1.5">
                  <span>Ferramentas & Recursos</span>
                </div>
                <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                  <span>{toolItems.length} utilitários</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-accent-purple/80">Passe o mouse</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className={`p-1 rounded-md transition-transform duration-200 ${
                (isToolsHovered || isToolsPinned || activeView === 'carousel-ai') ? 'rotate-180 text-accent-purple' : 'text-zinc-500'
              }`}>
                <ChevronDown size={14} />
              </span>
            </div>
          </button>

          {/* Hover / Expandable Body */}
          {(isToolsHovered || isToolsPinned || activeView === 'carousel-ai') && (
            <div className="mt-1.5 p-1.5 rounded-xl bg-zinc-950/90 border border-panel-border/80 shadow-2xl space-y-0.5 animate-fade-in backdrop-blur-md">
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
                        ? 'text-zinc-600 opacity-60 hover:opacity-100 hover:bg-zinc-950 cursor-not-allowed'
                        : isActive
                        ? 'bg-gradient-to-r from-accent-purple/25 to-accent-orange/15 border border-accent-purple/40 text-white font-bold shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <Icon size={14} className={`${!isAllowed ? 'text-zinc-600' : tool.color} flex-shrink-0`} />
                    <span className={`truncate text-[11px] ${!isAllowed ? 'line-through text-zinc-600' : ''}`}>{tool.label}</span>
                    {!isAllowed ? (
                      <Lock size={11} className="ml-auto text-zinc-600 flex-shrink-0" />
                    ) : isComingSoon ? (
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex-shrink-0">
                        Em Breve
                      </span>
                    ) : isActive ? (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* STATS MINI CARD */}
        <div className="bg-panel-card border border-panel-border p-3 rounded-xl space-y-2">
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 flex items-center justify-between">
            <span>Métricas do Workspace</span>
            <span className="text-white font-bold">{totalPostsCount} posts</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
            <div className="bg-zinc-900 p-1 rounded border border-panel-border">
              <span className="block text-amber-500 font-bold">{draftCount}</span>
              <span className="text-zinc-500 text-[9px]">Rasc.</span>
            </div>
            <div className="bg-zinc-900 p-1 rounded border border-panel-border">
              <span className="block text-accent-purple font-bold">{scheduledCount}</span>
              <span className="text-zinc-500 text-[9px]">Agend.</span>
            </div>
            <div className="bg-zinc-900 p-1 rounded border border-panel-border">
              <span className="block text-emerald-500 font-bold">{publishedCount}</span>
              <span className="text-zinc-500 text-[9px]">Post.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sidebar Footer / User Account & Language */}
      <div className="p-4 border-t border-panel-border/80 space-y-3 bg-zinc-950/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">Idioma</span>
          <LanguageSelector variant="compact" />
        </div>

        {currentUser && (
          <div className="pt-2 border-t border-panel-border/50 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-zinc-500 truncate font-mono">{currentUser.email}</div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair da Conta"
                className="p-2 rounded-lg bg-zinc-900 text-red-400 hover:text-white hover:bg-red-500/20 transition-all cursor-pointer flex-shrink-0"
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
