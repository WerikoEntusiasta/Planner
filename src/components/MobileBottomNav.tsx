import React from 'react';
import { 
  ImageIcon, Workflow, Calendar, Clock, Menu, Sparkles, Layers, BarChart2, Grid
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface MobileBottomNavProps {
  activeView: string;
  setActiveView: (view: any) => void;
  onOpenMobileMenu: () => void;
  onNewPostClick?: () => void;
  creativesBadgeCount?: number;
  pipelineBadgeCount?: number;
}

export default function MobileBottomNav({
  activeView,
  setActiveView,
  onOpenMobileMenu,
  onNewPostClick,
  creativesBadgeCount = 0,
  pipelineBadgeCount = 0
}: MobileBottomNavProps) {
  const { t } = useLanguage();

  const navButtons = [
    {
      id: 'creatives',
      label: 'Criativos',
      icon: ImageIcon,
      activeColor: 'text-pink-400',
      activeBg: 'bg-pink-500/15 border-pink-500/30',
      badge: creativesBadgeCount > 0 ? creativesBadgeCount : null,
      badgeColor: 'bg-pink-500 text-white'
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Workflow,
      activeColor: 'text-blue-400',
      activeBg: 'bg-blue-500/15 border-blue-500/30',
      badge: pipelineBadgeCount > 0 ? pipelineBadgeCount : null,
      badgeColor: 'bg-blue-500 text-white'
    },
    {
      id: 'calendar',
      label: 'Calendário',
      icon: Calendar,
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/15 border-purple-500/30',
    },
    {
      id: 'scheduling',
      label: 'Agendar',
      icon: Clock,
      activeColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/15 border-emerald-500/30',
    },
  ];

  return (
    <nav 
      aria-label="Navegação Móvel"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-t border-[#24242D] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-4px_25px_rgba(0,0,0,0.6)] select-none"
    >
      <div className="grid grid-cols-5 items-center gap-1 max-w-md mx-auto">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeView === btn.id;

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveView(btn.id as any)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? `${btn.activeBg} border shadow-sm` 
                  : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  className={isActive ? btn.activeColor : 'text-zinc-400'} 
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                {btn.badge && (
                  <span className={`absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${btn.badgeColor} shadow-sm animate-pulse`}>
                    {btn.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 truncate max-w-full ${
                isActive ? `${btn.activeColor} font-bold` : 'text-zinc-400'
              }`}>
                {btn.label}
              </span>
            </button>
          );
        })}

        {/* Menu / Mais Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Menu size={20} className="text-zinc-400" strokeWidth={1.8} />
          <span className="text-[10px] font-medium tracking-tight mt-1 text-zinc-400 truncate max-w-full">
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
}
