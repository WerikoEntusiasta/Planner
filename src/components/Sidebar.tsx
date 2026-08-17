import React, { useState } from 'react';
import { Post, WeeklyGoal, Platform } from '../types';
import IAChatSuggester from './IAChatSuggester';
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react';

interface SidebarProps {
  posts: Post[];
  goals: WeeklyGoal[];
  onToggleGoal: (id: string) => void;
  onAddQuickPost: (platform: Platform, format: any, titleStr: string) => void;
  onAddGoal: (title: string, platform: Platform) => void;
  onCreatePostFromAI?: (idea: Partial<Post> | Partial<Post>[]) => void;
  userPlan?: string;
  isTeamMember?: boolean;
  userId?: string;
  onOpenPricing?: () => void;
}

export default function Sidebar({
  onCreatePostFromAI,
  userPlan,
  isTeamMember,
  userId,
  onOpenPricing,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`transition-all duration-300 relative bg-panel-black border-l border-panel-border/80 flex-shrink-0 select-none flex flex-col ${
      isCollapsed ? 'w-14 p-2' : 'w-full lg:w-96 p-6'
    }`}>
      {/* Collapse / Expand Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-4 top-6 z-35 w-8 h-8 bg-accent-purple hover:bg-purple-600 text-white border-2 border-white/20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-105"
        title={isCollapsed ? "Expandir Menu de IA" : "Recolher Menu de IA"}
      >
        {isCollapsed ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center justify-center h-full py-4 space-y-4">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-2.5 rounded-xl bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 border border-accent-purple/40 transition-all cursor-pointer group relative"
            title="Expandir Menu de IA"
          >
            <Bot size={18} className="animate-pulse" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 border border-panel-border text-white text-[10px] font-mono rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
              Expandir Menu de IA
            </span>
          </button>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col h-full space-y-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-purple via-accent-orange to-accent-purple rounded-2xl blur opacity-30 animate-pulse pointer-events-none" />
          <div className="relative flex-1 flex flex-col h-full">
            <IAChatSuggester
              onCreatePostFromAI={onCreatePostFromAI}
              userPlan={userPlan}
              isTeamMember={isTeamMember}
              userId={userId}
              onOpenPricing={onOpenPricing}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
