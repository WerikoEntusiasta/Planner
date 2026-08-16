/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Post, PostStatus, Platform } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { ChevronLeft, ChevronRight, Edit, AlertCircle, Calendar } from 'lucide-react';

interface KanbanViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
}

export default function KanbanView({
  posts,
  onPostClick,
  onUpdateStatus
}: KanbanViewProps) {
  const { t } = useLanguage();

  const columns: { id: PostStatus; label: string; icon: string; bgClass: string; borderClass: string }[] = [
    { id: 'draft', label: t('statusDraft', 'Rascunho / Ideia'), icon: '📁', bgClass: 'bg-zinc-900/30', borderClass: 'border-zinc-805' },
    { id: 'production', label: t('statusInReview', 'Em Produção'), icon: '⚙️', bgClass: 'bg-accent-orange-glow', borderClass: 'border-accent-orange/20' },
    { id: 'scheduled', label: t('statusScheduled', 'Roteirizado / Agendado'), icon: '⏰', bgClass: 'bg-accent-purple-glow', borderClass: 'border-accent-purple/20' },
    { id: 'published', label: t('statusPublished', 'Publicado / Concluído'), icon: '✅', bgClass: 'bg-emerald-950/10', borderClass: 'border-emerald-900/10' }
  ];

  // Helper to get platform elements
  const renderPlatTag = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return <span className="text-[9px] font-bold text-accent-purple bg-accent-purple/10 border border-accent-purple/25 px-1.5 py-0.2 rounded font-mono">IG</span>;
      case 'youtube':
        return <span className="text-[9px] font-bold text-accent-orange bg-accent-orange/10 border border-accent-orange/25 px-1.5 py-0.2 rounded font-mono">YT</span>;
      case 'tiktok':
        return <span className="text-[9px] font-bold text-white bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 rounded font-mono">TT</span>;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'TOFU': return 'text-amber-400 bg-amber-500/10';
      case 'MOFU': return 'text-accent-purple bg-accent-purple/10';
      default: return 'text-accent-orange bg-accent-orange/10';
    }
  };

  // Status transitions
  const statusFlow: PostStatus[] = ['draft', 'production', 'scheduled', 'published'];

  const moveLeft = (post: Post) => {
    const currentIndex = statusFlow.indexOf(post.status);
    if (currentIndex > 0) {
      onUpdateStatus(post.id, statusFlow[currentIndex - 1]);
    }
  };

  const moveRight = (post: Post) => {
    const currentIndex = statusFlow.indexOf(post.status);
    if (currentIndex < statusFlow.length - 1) {
      onUpdateStatus(post.id, statusFlow[currentIndex + 1]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start select-none">
      {columns.map((col) => {
        const colPosts = posts.filter(p => p.status === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl border border-panel-border/85 p-4 flex flex-col space-y-3 ${col.bgClass}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-1 border-b border-panel-border/40">
              <div className="flex items-center gap-1.5 text-left">
                <span className="text-sm">{col.icon}</span>
                <h4 className="text-xs font-display font-bold text-white font-mono uppercase tracking-wider">
                  {col.label}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-panel-card border border-panel-border text-zinc-400 px-2 py-0.5 rounded-full">
                {colPosts.length}
              </span>
            </div>

            {/* Posts Cards list inside Column */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {colPosts.length === 0 ? (
                <div className="py-8 text-center bg-panel-black/10 border border-dashed border-panel-border/30 rounded-xl">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">{t('noPostsHere', 'Sem Posts aqui')}</span>
                </div>
              ) : (
                colPosts.map((post) => {
                  const translatedPost = getTranslatedPost(post, t);
                  const borderPlatform = post.platform === 'instagram' ? 'hover:border-accent-purple/50' : post.platform === 'youtube' ? 'hover:border-accent-orange/50' : 'hover:border-white/50';
                  
                  return (
                    <div
                      key={post.id}
                      className={`group bg-panel-card p-3.5 border border-panel-border/80 rounded-xl space-y-3 transition-all cursor-pointer ${borderPlatform}`}
                      onClick={() => onPostClick(post)}
                    >
                      {/* Platform header line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {renderPlatTag(post.platform)}
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{getTranslatedFormat(post.format, t)}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded ${getStageColor(post.funnelStage)}`}>
                          {getTranslatedStage(post.funnelStage, t)}
                        </span>
                      </div>

                      {/* Main Title text */}
                      <p className="text-xs font-bold text-zinc-200 line-clamp-2 leading-tight text-left">
                        {translatedPost.title}
                      </p>

                      {/* Info and Navigation row */}
                      <div className="flex items-center justify-between pt-2 border-t border-panel-border/30 gap-1" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Date display */}
                        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                          <Calendar size={9} />
                          {post.scheduledDate.substring(5, 10).split('-').reverse().join('/')}
                        </span>

                        {/* Arrows transition controls */}
                        <div className="flex items-center gap-0.5">
                          {post.status !== 'draft' ? (
                            <button
                              onClick={() => moveLeft(post)}
                              title={t('prevStage', 'Recuar etapa')}
                              className="p-1 rounded bg-panel-black hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-panel-border"
                            >
                              <ChevronLeft size={10} />
                            </button>
                          ) : (
                            <span className="w-[18px]" />
                          )}

                          <button
                            onClick={() => onPostClick(post)}
                            title={t('editData', 'Editar Dados')}
                            className="p-1 rounded bg-panel-black hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-panel-border"
                          >
                            <Edit size={10} />
                          </button>

                          {post.status !== 'published' ? (
                            <button
                              onClick={() => moveRight(post)}
                              title={t('nextStage', 'Avançar etapa')}
                              className="p-1 rounded bg-panel-black hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-panel-border"
                            >
                              <ChevronRight size={10} />
                            </button>
                          ) : (
                            <span className="w-[18px]" />
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
