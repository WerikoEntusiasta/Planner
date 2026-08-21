import React from 'react';
import { Post } from '../types';
import { Clock, Send, CheckCircle2, FileEdit, LayoutGrid, Calendar as CalIcon, Filter, Layers } from 'lucide-react';

interface QuickStatusCountersProps {
  posts: Post[];
  selectedStatusFilter: string | 'all';
  onSelectStatusFilter: (status: string | 'all') => void;
  onSwitchView?: (view: string) => void;
}

export default function QuickStatusCounters({
  posts,
  selectedStatusFilter,
  onSelectStatusFilter,
  onSwitchView,
}: QuickStatusCountersProps) {
  const total = posts.length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const inReviewCount = posts.filter(p => p.approvalStatus === 'pending' || (p.status as string) === 'in_review').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const approvedCount = posts.filter(p => p.status === 'published' || p.approvalStatus === 'approved').length;

  const items = [
    {
      id: 'all',
      label: 'Todos os Conteúdos',
      count: total,
      icon: Layers,
      color: 'text-zinc-300',
      activeBg: 'bg-zinc-800 text-white border-zinc-600',
      badgeColor: 'bg-zinc-700/60 text-zinc-200',
    },
    {
      id: 'in_review',
      label: 'Aguardando Aprovação',
      count: inReviewCount,
      icon: Clock,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      hasAlert: inReviewCount > 0,
    },
    {
      id: 'scheduled',
      label: 'Agendados & Prontos',
      count: scheduledCount,
      icon: Send,
      color: 'text-accent-blue',
      activeBg: 'bg-accent-blue/20 text-blue-300 border-accent-blue/50 shadow-md',
      badgeColor: 'bg-accent-blue/20 text-blue-300 border border-accent-blue/30',
    },
    {
      id: 'approved',
      label: 'Aprovados / Publicados',
      count: approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'draft',
      label: 'Rascunhos & Ideias',
      count: draftCount,
      icon: FileEdit,
      color: 'text-zinc-400',
      activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedStatusFilter === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectStatusFilter(item.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              isSelected
                ? item.activeBg
                : 'bg-panel-card/70 border-panel-border/80 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Icon size={14} className={item.color} />
            <span>{item.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isSelected ? 'bg-white/20 text-white' : item.badgeColor
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
