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
    { id: 'draft', label: t('statusDraft', 'Rascunho / Ideia'), icon: '📁', bgClass: 'bg-[#121218]', borderClass: 'border-[#24242D]' },
    { id: 'production', label: t('statusInReview', 'Em Produção'), icon: '⚙️', bgClass: 'bg-[#121218]', borderClass: 'border-[#24242D]' },
    { id: 'scheduled', label: t('statusScheduled', 'Roteirizado / Agendado'), icon: '⏰', bgClass: 'bg-[#121218]', borderClass: 'border-[#24242D]' },
    { id: 'published', label: t('statusPublished', 'Publicado / Concluído'), icon: '✅', bgClass: 'bg-[#121218]', borderClass: 'border-[#24242D]' }
  ];

  // Helper to get platform elements
  const renderPlatTag = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return <span className="text-[9px] font-semibold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-1.5 py-0.5 rounded font-mono">IG</span>;
      case 'youtube':
        return <span className="text-[9px] font-semibold text-[#F97316] bg-[#F97316]/15 border border-[#F97316]/30 px-1.5 py-0.5 rounded font-mono">YT</span>;
      case 'tiktok':
        return <span className="text-[9px] font-semibold text-[#F2F2F5] bg-[#24242D] border border-[#24242D] px-1.5 py-0.5 rounded font-mono">TT</span>;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'TOFU': return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      case 'MOFU': return 'text-[#A78BFA] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20';
      default: return 'text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20';
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
            className={`rounded-2xl border border-[#24242D] p-4 flex flex-col space-y-3 bg-[#121218] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#24242D]">
              <div className="flex items-center gap-1.5 text-left">
                <span className="text-sm">{col.icon}</span>
                <h4 className="text-xs font-display font-semibold text-[#F2F2F5] uppercase tracking-wider">
                  {col.label}
                </h4>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-[#17171F] border border-[#24242D] text-[#92929F] px-2 py-0.5 rounded-full">
                {colPosts.length}
              </span>
            </div>

            {/* Posts Cards list inside Column */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {colPosts.length === 0 ? (
                <div className="py-8 text-center bg-[#17171F]/40 border border-dashed border-[#24242D] rounded-xl">
                  <span className="text-[10px] font-mono text-[#686873] uppercase tracking-widest block">{t('noPostsHere', 'Sem Posts aqui')}</span>
                </div>
              ) : (
                colPosts.map((post) => {
                  const translatedPost = getTranslatedPost(post, t);
                  
                  return (
                    <div
                      key={post.id}
                      className="group bg-[#17171F] p-3.5 border border-[#24242D] hover:border-[#8B5CF6]/40 rounded-xl space-y-3 transition-all cursor-pointer shadow-sm"
                      onClick={() => onPostClick(post)}
                    >
                      {/* Platform header line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {renderPlatTag(post.platform)}
                          <span className="text-[9px] font-mono text-[#686873] uppercase tracking-wider">{getTranslatedFormat(post.format, t)}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${getStageColor(post.funnelStage)}`}>
                          {getTranslatedStage(post.funnelStage, t)}
                        </span>
                      </div>

                      {/* Main Title text */}
                      <p className="text-xs font-semibold text-[#F2F2F5] line-clamp-2 leading-tight text-left">
                        {translatedPost.title}
                      </p>

                      {/* Info and Navigation row */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#24242D] gap-1" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Quick Date display */}
                        <span className="text-[9px] font-mono text-[#686873] flex items-center gap-1">
                          <Calendar size={9} />
                          {post.scheduledDate.substring(5, 10).split('-').reverse().join('/')}
                        </span>

                        {/* Arrows transition controls */}
                        <div className="flex items-center gap-0.5">
                          {post.status !== 'draft' ? (
                            <button
                              onClick={() => moveLeft(post)}
                              title={t('prevStage', 'Recuar etapa')}
                              className="p-1 rounded-lg bg-[#121218] hover:bg-[#20202B] text-[#92929F] hover:text-[#F2F2F5] transition-all cursor-pointer border border-[#24242D]"
                            >
                              <ChevronLeft size={10} />
                            </button>
                          ) : (
                            <span className="w-[18px]" />
                          )}

                          <button
                            onClick={() => onPostClick(post)}
                            title={t('editData', 'Editar Dados')}
                            className="p-1 rounded-lg bg-[#121218] hover:bg-[#20202B] text-[#92929F] hover:text-[#F2F2F5] transition-all cursor-pointer border border-[#24242D]"
                          >
                            <Edit size={10} />
                          </button>

                          {post.status !== 'published' ? (
                            <button
                              onClick={() => moveRight(post)}
                              title={t('nextStage', 'Avançar etapa')}
                              className="p-1 rounded-lg bg-[#121218] hover:bg-[#20202B] text-[#92929F] hover:text-[#F2F2F5] transition-all cursor-pointer border border-[#24242D]"
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
