/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Post, Platform } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { 
  Tv, 
  Layers, 
  Video, 
  Clock, 
  Trash2, 
  Edit, 
  Sparkles, 
  CheckCircle, 
  HelpCircle,
  Play,
  Copy,
  Calendar,
  Layers2,
  Bookmark
} from 'lucide-react';

interface CardViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onDuplicatePost: (post: Post) => void;
}

export default function CardView({
  posts,
  onPostClick,
  onDeletePost,
  onDuplicatePost
}: CardViewProps) {
  const { t } = useLanguage();

  // Platform icon renderer
  const renderPlatIcon = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return (
          <span className="p-1.5 rounded-md bg-accent-purple/15 text-accent-purple border border-accent-purple/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </span>
        );
      case 'tiktok':
        return (
          <span className="p-1.5 rounded-md bg-white/10 text-white border border-white/25">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
            </svg>
          </span>
        );
      case 'youtube':
        return (
          <span className="p-1.5 rounded-md bg-accent-orange/15 text-accent-orange border border-accent-orange/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
            </svg>
          </span>
        );
    }
  };

  // Helper for dynamic illustrations matching card formats
  const getFormatIllustration = (status: string, format: string) => {
    const baseColor = status === 'published' 
      ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' 
      : status === 'scheduled'
        ? 'border-accent-purple/20 text-accent-purple bg-accent-purple/5'
        : status === 'production'
          ? 'border-accent-orange/20 text-accent-orange bg-accent-orange/5'
          : 'border-zinc-800 text-zinc-500 bg-zinc-900/40';

    return (
      <div className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${baseColor}`}>
        {format === 'carousel' ? <Layers size={18} /> : 
         format === 'video' ? <Tv size={18} /> : 
         format === 'reels' || format === 'shorts' ? <Video size={18} /> :
         <Bookmark size={18} />}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="text-[10px] font-mono bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">✅ {t('statusPublished', 'Publicado')}</span>;
      case 'scheduled':
        return <span className="text-[10px] font-mono bg-accent-purple/20 text-accent-purple-light border border-accent-purple/30 px-2 py-0.5 rounded-full">⏰ {t('statusScheduled', 'Agendado')}</span>;
      case 'production':
        return <span className="text-[10px] font-mono bg-accent-orange/20 text-accent-orange border border-accent-orange/30 px-2 py-0.5 rounded-full">⚙️ {t('statusInReview', 'Produção')}</span>;
      default:
        return <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full">📁 {t('statusDraft', 'Rascunho')}</span>;
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-panel-card border border-panel-border rounded-3xl text-center p-8 select-none">
        <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800 mb-4 animate-bounce">
          <HelpCircle size={32} className="text-zinc-600" />
        </div>
        <h3 className="text-lg font-display font-semibold text-white mb-1">
          {t('noPostsFound', 'Nenhum conteúdo planejado para este filtro')}
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-4">
          {t('noPostsDesc', 'Defina ideias de mídia no menu superior para dar asas às suas redes sociais de forma estruturada.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 select-none">
      {posts.map((post) => {
        const translatedPost = getTranslatedPost(post, t);

        // Build customized colors according to the template
        const stageColor = post.funnelStage === 'TOFU' 
          ? 'text-amber-400 bg-amber-500/10' 
          : post.funnelStage === 'MOFU' 
            ? 'text-accent-purple bg-accent-purple/10' 
            : 'text-accent-orange bg-accent-orange/10';

        const borderClass = post.status === 'published'
          ? 'hover:border-emerald-600'
          : post.platform === 'instagram'
            ? 'hover:border-accent-purple'
            : post.platform === 'youtube'
              ? 'hover:border-accent-orange'
              : 'hover:border-zinc-300';

        return (
          <div
            key={post.id}
            id={`post-card-${post.id}`}
            className={`group bg-panel-card border border-panel-border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${borderClass}`}
          >
            {/* Platform, Subtitle, and Format Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {renderPlatIcon(post.platform)}
                <span className="text-xs font-bold text-zinc-300 capitalize">
                  {post.platform} • <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{getTranslatedFormat(post.format, t)}</span>
                </span>
              </div>
              {getStatusBadge(post.status)}
            </div>

            {/* Title & Micro illustration block */}
            <div className="flex items-start gap-4 mb-5">
              <div className="text-left flex-1 min-w-0">
                <h4 
                  onClick={() => onPostClick(post)}
                  className="text-sm md:text-base font-display font-bold text-zinc-100 group-hover:text-white transition-all line-clamp-2 cursor-pointer leading-snug tracking-tight"
                >
                  {translatedPost.title}
                </h4>
                {translatedPost.description && (
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {translatedPost.description}
                  </p>
                )}
              </div>
              {getFormatIllustration(post.status, post.format)}
            </div>

            {/* Tags and Metadata Footer Area */}
            <div className="pt-4 border-t border-panel-border/50 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-left">
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${stageColor}`}>
                  {getTranslatedStage(post.funnelStage, t)}
                </span>

                <span className="text-[10px] font-mono text-zinc-400 bg-panel-black px-2 py-0.5 rounded-md border border-panel-border/80 flex items-center gap-1">
                  <Calendar size={10} />
                  {post.scheduledDate.substring(5, 10).split('-').reverse().join('/')} ({post.scheduledTime})
                </span>
              </div>

              {/* Action buttons (Trash, Duplicate, Edit) */}
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => onDuplicatePost(post)}
                  title={t('duplicateIdea', 'Duplicar Ideia')}
                  className="p-1 px-1.5 rounded bg-panel-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border cursor-pointer transition-colors"
                >
                  <Copy size={11} />
                </button>
                <button
                  onClick={() => onPostClick(post)}
                  title={t('editPost', 'Editar Post')}
                  className="p-1 px-1.5 rounded bg-panel-black hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border cursor-pointer transition-colors"
                >
                  <Edit size={11} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('confirmDeletePost', 'Deseja excluir este post?'))) {
                      onDeletePost(post.id);
                    }
                  }}
                  title={t('deletePost', 'Excluir Post')}
                  className="p-1 px-1.5 rounded bg-panel-black hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-panel-border cursor-pointer transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
