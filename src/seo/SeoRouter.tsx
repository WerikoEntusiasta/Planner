import React from 'react';
import {
  LANDING_PAGES_SEO,
  FEATURES_SEO,
  COMPARISONS_SEO,
  PROGRAMMATIC_NICHES,
  TEMPLATES_SEO,
  BLOG_POSTS,
  BASE_URL
} from './seoData';
import SeoLandingView from './SeoLandingView';
import SeoProgrammaticNicheView from './SeoProgrammaticNicheView';
import SeoTemplateView from './SeoTemplateView';
import SeoBlogView from './SeoBlogView';
import SeoNotFoundView from './SeoNotFoundView';

interface SeoRouterProps {
  onStartFreeTrial: () => void;
}

export default function SeoRouter({ onStartFreeTrial }: SeoRouterProps) {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, ''); // sanitize trailing slash
  const cleanPath = path || '/';

  // 1. Direct Landing Page match (PT & EN)
  // Supports e.g. /planner-de-conteudo, /pt-br/planner-de-conteudo, /en/content-planner, /content-planner
  const normalizedLandingKey = cleanPath
    .replace(/^\/(pt-br|en)\//, '')
    .replace(/^\//, '');

  if (LANDING_PAGES_SEO[normalizedLandingKey]) {
    return (
      <SeoLandingView
        meta={LANDING_PAGES_SEO[normalizedLandingKey]}
        onStartFreeTrial={onStartFreeTrial}
      />
    );
  }

  // Handle English home (/en or /en/)
  if (cleanPath === '/en' || cleanPath === '/en/') {
    const enHomeMeta = LANDING_PAGES_SEO['content-planner'];
    return (
      <SeoLandingView
        meta={{
          ...enHomeMeta,
          canonical: `${BASE_URL}/en`,
          h1: 'AI Content Planner & Social Media Calendar',
          subtitle: 'Plan, script, and manage your social media strategy across Instagram, YouTube, and TikTok with advanced AI.'
        }}
        onStartFreeTrial={onStartFreeTrial}
      />
    );
  }

  // Handle Portuguese home landing route (/pt-br or /pt-br/)
  if (cleanPath === '/pt-br' || cleanPath === '/pt-br/') {
    const ptHomeMeta = LANDING_PAGES_SEO['planner-de-conteudo'];
    return (
      <SeoLandingView
        meta={{
          ...ptHomeMeta,
          canonical: `${BASE_URL}/pt-br`,
          h1: 'Planner de Conteúdo com IA',
          subtitle: 'Planeje, crie roteiros com inteligência artificial e organize seu calendário editorial em um só lugar.'
        }}
        onStartFreeTrial={onStartFreeTrial}
      />
    );
  }

  // 2. Feature Pages match (/funcionalidade/:key or /features/:key)
  if (cleanPath.startsWith('/funcionalidade/') || cleanPath.startsWith('/features/')) {
    const featureKey = cleanPath.split('/')[2];
    if (featureKey && FEATURES_SEO[featureKey]) {
      return (
        <SeoLandingView
          meta={FEATURES_SEO[featureKey]}
          onStartFreeTrial={onStartFreeTrial}
        />
      );
    }
  }

  // 3. Comparison Pages match (/comparar/:key or /compare/:key)
  if (cleanPath.startsWith('/comparar/') || cleanPath.startsWith('/compare/')) {
    const compKey = cleanPath.split('/')[2];
    if (compKey && COMPARISONS_SEO[compKey]) {
      return (
        <SeoLandingView
          meta={COMPARISONS_SEO[compKey]}
          onStartFreeTrial={onStartFreeTrial}
        />
      );
    }
  }

  // 4. Programmatic Niche Ideas match (/ideias/:slug or /en/ideas/:slug)
  if (cleanPath.startsWith('/ideias/') || cleanPath.startsWith('/en/ideas/')) {
    const parts = cleanPath.split('/');
    const nicheSlug = parts[parts.length - 1];
    const foundNiche = PROGRAMMATIC_NICHES.find((n) => n.slug === nicheSlug);
    if (foundNiche) {
      return (
        <SeoProgrammaticNicheView
          niche={foundNiche}
          onStartFreeTrial={onStartFreeTrial}
        />
      );
    }
  }

  // 5. Templates Pages match (/templates/:slug or /en/templates/:slug)
  if (cleanPath.startsWith('/templates/') || cleanPath.startsWith('/en/templates/')) {
    const parts = cleanPath.split('/');
    const templateSlug = parts[parts.length - 1];
    const foundTemplate = TEMPLATES_SEO.find((t) => t.slug === templateSlug);
    if (foundTemplate) {
      return (
        <SeoTemplateView
          template={foundTemplate}
          onStartFreeTrial={onStartFreeTrial}
        />
      );
    }
  }

  // 6. Blog Routes (/blog or /blog/:slug)
  if (cleanPath === '/blog') {
    return <SeoBlogView onStartFreeTrial={onStartFreeTrial} />;
  }
  if (cleanPath.startsWith('/blog/')) {
    const articleSlug = cleanPath.split('/')[2];
    return <SeoBlogView articleSlug={articleSlug} onStartFreeTrial={onStartFreeTrial} />;
  }

  // 7. RSS Feed Generator XML Response Route (/rss.xml)
  if (cleanPath === '/rss.xml') {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog Planner Amplifica</title>
    <link>${BASE_URL}/blog</link>
    <description>Estratégias de marketing de conteúdo, calendário editorial e inteligência artificial para mídias sociais.</description>
    <language>pt-BR</language>
    ${BLOG_POSTS.map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${BASE_URL}/blog/${p.slug}</link>
      <description><![CDATA[${p.description}]]></description>
      <pubDate>${new Date(p.publishedDate).toUTCString()}</pubDate>
      <guid>${BASE_URL}/blog/${p.slug}</guid>
    </item>`
    ).join('')}
  </channel>
</rss>`;

    // If browser visits /rss.xml directly, replace document body with formatted XML text
    setTimeout(() => {
      document.open();
      document.write(`<pre style="word-wrap: break-word; white-space: pre-wrap;">${rssXml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
      document.close();
    }, 10);
    return null;
  }

  // 8. Explicit 404 or 410 Routes
  if (cleanPath === '/404') {
    return <SeoNotFoundView isGone410={false} />;
  }
  if (cleanPath === '/410') {
    return <SeoNotFoundView isGone410={true} />;
  }

  // Route does not match any static SEO route -> return null to render standard app/landing
  return null;
}
