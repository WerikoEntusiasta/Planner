import { Post } from '../types';

export function getTranslatedFormat(format: string, t: (key: string, defaultText?: string) => string): string {
  if (!format) return '';
  const f = format.toLowerCase();
  if (f === 'carousel' || f === 'carrossel') {
    return t('formatCarousel', 'Carrossel');
  }
  if (f === 'reels') {
    return t('formatReels', 'Reels');
  }
  if (f === 'shorts') {
    return t('formatShorts', 'Shorts');
  }
  if (f === 'video' || f === 'vídeo' || f === 'vídeo longo') {
    return t('formatVideo', 'Vídeo Longo');
  }
  if (f === 'static' || f === 'estático' || f === 'post estático') {
    return t('formatStatic', 'Post Estático');
  }
  if (f === 'stories' || f === 'status') {
    return t('formatStories', 'Stories');
  }
  if (f === 'article' || f === 'artigo') {
    return t('formatArticle', 'Artigo');
  }
  return format;
}

export function getTranslatedStage(stage: string, t: (key: string, defaultText?: string) => string): string {
  if (!stage) return '';
  const s = stage.toUpperCase();
  if (s.startsWith('TOFU')) {
    return t('stageTOFU', 'TOFU (Atração)');
  }
  if (s.startsWith('MOFU')) {
    return t('stageMOFU', 'MOFU (Nutrição)');
  }
  if (s.startsWith('BOFU')) {
    return t('stageBOFU', 'BOFU (Venda)');
  }
  return stage;
}

export function getTranslatedStatus(status: string, t: (key: string, defaultText?: string) => string): string {
  if (!status) return '';
  const st = status.toLowerCase();
  if (st === 'draft' || st === 'rascunho') {
    return t('statusDraft', 'Rascunho');
  }
  if (st === 'production' || st === 'produção' || st === 'em produção') {
    return t('statusInReview', 'Em Produção');
  }
  if (st === 'scheduled' || st === 'agendado') {
    return t('statusScheduled', 'Agendado');
  }
  if (st === 'published' || st === 'publicado') {
    return t('statusPublished', 'Publicado');
  }
  return status;
}

export function getTranslatedPost(post: Post, t: (key: string, defaultText?: string) => string): Post {
  if (!post || !post.id) return post;

  const baseId = post.id.replace(/^demo_post_/, '');

  // Check if there are specific translation keys for this post ID (e.g. p1 to p9)
  const translatedTitle = t(`post_${baseId}_title`);
  const translatedDesc = t(`post_${baseId}_desc`);
  const translatedHook = t(`post_${baseId}_hook`);
  const translatedScript = t(`post_${baseId}_script`);
  const translatedVisual = t(`post_${baseId}_visual`);

  return {
    ...post,
    title: translatedTitle !== `post_${baseId}_title` ? translatedTitle : post.title,
    description: translatedDesc !== `post_${baseId}_desc` ? translatedDesc : post.description,
    hookText: translatedHook !== `post_${baseId}_hook` ? translatedHook : post.hookText,
    scriptText: translatedScript !== `post_${baseId}_script` ? translatedScript : post.scriptText,
    visualIdea: translatedVisual !== `post_${baseId}_visual` ? translatedVisual : post.visualIdea,
  };
}
