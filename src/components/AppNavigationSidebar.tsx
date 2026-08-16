/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Platform, ContentFormat, FunnelStage, Client, User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { 
  Calendar, Grid, Layers, Plus, Sparkles, ChevronDown, UserPlus, LogOut, 
  Users, Edit3, LifeBuoy, Shield, BarChart2, Palette, Hash, Rocket, 
  Bookmark, Workflow, Menu, X, CheckCircle2, Target, TrendingUp 
} from 'lucide-react';

interface AppNavigationSidebarProps {
  activeView: 'grid' | 'calendar' | 'kanban' | 'dashboard' | 'pipeline' | 'carousel-ai';
  setActiveView: (v: 'grid' | 'calendar' | 'kanban' | 'dashboard' | 'pipeline' | 'carousel-ai') => void;
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientName.trim()) {
      onCreateClient(newClientName.trim());
      setNewClientName('');
    }
  };

  const navItems = [
    { id: 'grid', label: t('viewCards', 'Cards Estratégicos'), icon: Grid, color: 'text-accent-purple' },
    { id: 'calendar', label: t('editorialCalendar', 'Calendário Mensal'), icon: Calendar, color: 'text-white' },
    { id: 'kanban', label: t('viewBoard', 'Board Kanban'), icon: Layers, color: 'text-accent-orange' },
    { id: 'pipeline', label: 'Pipeline de Produção', icon: Workflow, color: 'text-blue-400' },
    { id: 'dashboard', label: t('viewDashboard', 'Dashboard de Métricas'), icon: BarChart2, color: 'text-emerald-400' },
  ];

  const toolItems = [
    { id: 'carousel_ai', label: 'Criador de Carrossel IA', icon: Sparkles, color: 'text-accent-purple', action: onOpenCarouselAIModal },
    { id: 'brandkit', label: 'Kit de Marca', icon: Palette, color: 'text-accent-blue', action: onOpenBrandKitModal },
    { id: 'campaigns', label: 'Campanhas Multicanal', icon: Rocket, color: 'text-accent-orange', action: onOpenCampaignsModal },
    { id: 'reference', label: 'Central de Inspirações', icon: Bookmark, color: 'text-accent-purple', action: onOpenReferenceHubModal },
    { id: 'hashtags', label: 'Biblioteca Hashtags', icon: Hash, color: 'text-accent-purple', action: onOpenHashtagLibraryModal },
    { id: 'integrations', label: t('integrations', 'Integrações'), icon: Workflow, color: 'text-accent-purple', action: onOpenIntegrationsModal },
    { id: 'team', label: currentUser?.isTeamMember ? t('viewTeam', 'Equipa') : t('teamAndPlans', 'Equipa & Planos'), icon: Users, color: 'text-accent-orange', action: onOpenTeamModal },
    { id: 'support', label: t('support', 'Suporte Técnico'), icon: LifeBuoy, color: 'text-accent-orange', action: onOpenSupportModal },
    { id: 'privacy', label: t('privacy', 'Privacidade & LGPD'), icon: Shield, color: 'text-emerald-400', action: onOpenLGPDModal },
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
            onNewPostClick();
            setMobileOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 shadow-lg transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t('planContent', 'Planejar Conteúdo')}</span>
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
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as any);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-purple/20 to-accent-orange/10 border border-accent-purple/30 text-white font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-accent-purple' : item.color} />
                  <span>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ADVANCED TOOLS & RESOURCES MENU */}
        <div>
          <div className="text-[10px] font-mono uppercase font-bold text-zinc-500 tracking-wider mb-2 px-2">
            Ferramentas & Recursos
          </div>
          <div className="space-y-1">
            {toolItems.map((tool) => {
              const Icon = tool.icon;
              const isCarouselAI = tool.id === 'carousel_ai';
              const isActive = isCarouselAI && activeView === 'carousel-ai';
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    tool.action?.();
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-purple/25 to-accent-orange/15 border border-accent-purple/40 text-white font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                  }`}
                >
                  <Icon size={15} className={tool.color} />
                  <span>{tool.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple" />}
                </button>
              );
            })}
          </div>
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
