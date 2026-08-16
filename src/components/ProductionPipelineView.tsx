import React, { useState } from 'react';
import { Post, ProductionStage, TeamRole } from '../types';
import { Plus, MoveRight, ArrowRight, Video, FileText, CheckCircle2, Calendar, Send, Sparkles, User, Tag, Layers, Clock } from 'lucide-react';

interface ProductionPipelineViewProps {
  posts: Post[];
  onUpdatePostStage: (postId: string, newStage: ProductionStage) => void;
  onOpenPostDialog: (post?: Post) => void;
  activeRole?: TeamRole;
}

const STAGES: { id: ProductionStage; label: string; icon: any; color: string; bg: string; borderColor: string }[] = [
  { id: 'idea', label: 'Ideia', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: 'script', label: 'Roteiro', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'recording', label: 'Gravação', icon: Video, color: 'text-red-400', bg: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: 'editing', label: 'Edição', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { id: 'approved', label: 'Aprovado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'scheduled', label: 'Agendado', icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
  { id: 'published', label: 'Publicado', icon: Send, color: 'text-emerald-300', bg: 'bg-emerald-600/10', borderColor: 'border-emerald-600/30' },
];

export default function ProductionPipelineView({
  posts,
  onUpdatePostStage,
  onOpenPostDialog,
  activeRole = 'gestor'
}: ProductionPipelineViewProps) {
  const [filterRole, setFilterRole] = useState<TeamRole | 'all'>('all');

  // Helper to determine production stage if not explicitly set
  const getPostStage = (p: Post): ProductionStage => {
    if (p.productionStage) return p.productionStage;
    if (p.status === 'published') return 'published';
    if (p.status === 'scheduled') return 'scheduled';
    if (p.approvalStatus === 'approved') return 'approved';
    if (p.scriptText && p.visualIdea) return 'editing';
    if (p.scriptText) return 'script';
    return 'idea';
  };

  const filteredPosts = posts.filter(p => {
    if (filterRole === 'all') return true;
    return p.assignedRole === filterRole;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-panel-card p-4 rounded-2xl border border-panel-border shadow-lg">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <span className="p-1.5 bg-accent-purple/10 text-accent-purple rounded-lg border border-accent-purple/20">
              <Layers size={18} />
            </span>
            Esteira & Pipeline de Produção
          </h3>
          <p className="text-xs text-zinc-400">
            Gerencie o fluxo de criação do briefing à publicação final estilo Kanban Trello.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-panel-border">
            <span className="text-[10px] font-mono text-zinc-400 pl-2">Filtrar Função:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none pr-2 font-bold"
            >
              <option value="all">Todas as Funções</option>
              <option value="redator">Redator / Roteirista</option>
              <option value="designer">Designer / Editor</option>
              <option value="social_media">Social Media</option>
              <option value="gestor">Gestor / Admin</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>

          <button
            onClick={() => onOpenPostDialog()}
            className="px-3 py-2 bg-accent-purple hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={14} /> Nova Ideia de Conteúdo
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const ColIcon = col.icon;
          const stagePosts = filteredPosts.filter(p => getPostStage(p) === col.id);

          return (
            <div
              key={col.id}
              className="bg-panel-card border border-panel-border/80 rounded-2xl p-3 flex flex-col min-w-[200px] h-[620px] shadow-lg"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-panel-border/60">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 rounded-md ${col.bg} ${col.color}`}>
                    <ColIcon size={14} />
                  </span>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-panel-border">
                  {stagePosts.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stagePosts.length === 0 ? (
                  <div className="h-32 border border-dashed border-panel-border/60 rounded-xl flex items-center justify-center text-center p-3">
                    <span className="text-[10px] text-zinc-600 font-mono">Sem itens</span>
                  </div>
                ) : (
                  stagePosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-zinc-950 p-3 rounded-xl border border-panel-border hover:border-accent-purple/50 transition-all space-y-2 group shadow-sm"
                    >
                      {/* Top tags */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-panel-border">
                          {post.platform}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-accent-orange">
                          {post.format}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => onOpenPostDialog(post)}
                        className="text-xs font-bold text-white group-hover:text-accent-purple transition-colors cursor-pointer line-clamp-2"
                      >
                        {post.title}
                      </h4>

                      {/* Hook or snippet */}
                      {post.hookText && (
                        <p className="text-[10px] text-zinc-400 italic line-clamp-2 bg-zinc-900 p-1.5 rounded border border-panel-border/30">
                          "{post.hookText}"
                        </p>
                      )}

                      {/* Assigned role indicator & Scheduled Date */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-panel-border/40">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock size={11} /> {post.scheduledDate ? post.scheduledDate.substring(5) : 'Sem data'}
                        </span>

                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {post.assignedRole ? post.assignedRole : 'Redator/Des.'}
                        </span>
                      </div>

                      {/* Move Stage Actions */}
                      <div className="pt-1 flex items-center justify-between gap-1 border-t border-panel-border/30">
                        <button
                          onClick={() => onOpenPostDialog(post)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-white"
                        >
                          Editar
                        </button>

                        <div className="flex items-center gap-1">
                          {STAGES.findIndex(s => s.id === col.id) < STAGES.length - 1 && (
                            <button
                              onClick={() => {
                                const currIdx = STAGES.findIndex(s => s.id === col.id);
                                const nextStage = STAGES[currIdx + 1].id;
                                onUpdatePostStage(post.id, nextStage);
                              }}
                              className="px-2 py-0.5 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple text-[10px] font-bold rounded-lg border border-accent-purple/30 flex items-center gap-0.5 transition-all"
                              title="Avançar para a próxima etapa da esteira"
                            >
                              Avançar <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
