import React, { useState } from 'react';
import { BLOG_POSTS, BASE_URL } from './seoData';
import SeoHead from './SeoHead';
import Breadcrumbs from './Breadcrumbs';
import SeoInternalLinks from './SeoInternalLinks';
import { Sparkles, BookOpen, Clock, Calendar, User, Search, ArrowRight, Share2, Tag, ChevronRight } from 'lucide-react';

interface SeoBlogViewProps {
  articleSlug?: string;
  onStartFreeTrial: () => void;
}

export default function SeoBlogView({ articleSlug, onStartFreeTrial }: SeoBlogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeArticle = articleSlug ? BLOG_POSTS.find((p) => p.slug === articleSlug) : null;
  const isPt = activeArticle ? activeArticle.lang === 'pt-BR' : true;

  // Filtered list for blog hub
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCat = selectedCategory === 'all' || post.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchTerm || post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['all', 'Instagram', 'Marketing', 'Content', 'AI', 'Social Media', 'SEO', 'Templates', 'Calendar'];

  // Render Individual Article
  if (activeArticle) {
    const meta = {
      title: `${activeArticle.title} | Blog Planner Amplifica`,
      description: activeArticle.description,
      keywords: activeArticle.keywords,
      canonical: `${BASE_URL}/blog/${activeArticle.slug}`,
      lang: activeArticle.lang,
      ogType: 'article' as const,
      publishedDate: activeArticle.publishedDate,
      author: activeArticle.author,
      h1: activeArticle.h1,
      subtitle: activeArticle.summary,
      breadcrumbs: [
        { name: 'Home', item: `${BASE_URL}/` },
        { name: 'Blog', item: `${BASE_URL}/blog` },
        { name: activeArticle.title, item: `${BASE_URL}/blog/${activeArticle.slug}` }
      ],
      faqs: activeArticle.faqs
    };

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: activeArticle.title,
      description: activeArticle.description,
      datePublished: activeArticle.publishedDate,
      dateModified: activeArticle.publishedDate,
      author: {
        '@type': 'Organization',
        name: activeArticle.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'Planner Amplifica',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/icon-192.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/blog/${activeArticle.slug}`
      }
    };

    return (
      <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white">
        <SeoHead meta={meta} customSchemas={[articleSchema]} />

        {/* Header */}
        <header className="border-b border-panel-border bg-panel-black/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/blog" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-purple flex items-center justify-center text-white font-bold font-display shadow-md">
                PA
              </div>
              <span className="font-display font-black text-lg text-white tracking-tight">
                Blog <span className="text-accent-purple">Amplifica</span>
              </span>
            </a>

            <button
              onClick={onStartFreeTrial}
              className="bg-accent-purple hover:bg-accent-purple-dark text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isPt ? 'Criar Conta Grátis' : 'Start Free Trial'}</span>
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8 text-left">
          <Breadcrumbs items={meta.breadcrumbs} lang={activeArticle.lang} />

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
              <span className="px-2.5 py-1 rounded bg-accent-purple/10 text-accent-purple font-bold border border-accent-purple/20">
                {activeArticle.category}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {activeArticle.readTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {activeArticle.publishedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={12} />
                {activeArticle.author}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight">
              {activeArticle.h1}
            </h1>

            <p className="text-base text-zinc-300 leading-relaxed border-l-2 border-accent-purple pl-4 italic">
              {activeArticle.summary}
            </p>
          </div>

          {/* Table of Contents */}
          {activeArticle.toc && activeArticle.toc.length > 0 && (
            <div className="p-4 rounded-xl bg-panel-card border border-panel-border space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-accent-orange flex items-center gap-1.5">
                <BookOpen size={14} />
                {isPt ? 'Índice do Artigo' : 'Table of Contents'}
              </h3>
              <ul className="space-y-1 text-xs text-zinc-300">
                {activeArticle.toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="hover:text-accent-purple transition-colors flex items-center gap-1">
                      <ChevronRight size={12} className="text-zinc-500" />
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content Body */}
          <article 
            className="prose prose-invert max-w-none text-zinc-200 text-sm md:text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: activeArticle.content }}
          />

          {/* Inline CTA Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-accent-purple/20 to-panel-card border border-accent-purple/30 text-center space-y-4">
            <h3 className="text-lg font-bold text-white">
              {isPt ? 'Gostou das dicas? Experimente na prática com IA!' : 'Ready to streamline your content schedule?'}
            </h3>
            <p className="text-xs text-zinc-300 max-w-lg mx-auto">
              {isPt
                ? 'Crie seu calendário de postagens completo no Planner Amplifica gratuitamente em menos de 2 minutos.'
                : 'Build your complete social media editorial calendar for free with Planner Amplifica in under 2 minutes.'}
            </p>
            <button
              onClick={onStartFreeTrial}
              className="px-6 py-3 rounded-xl bg-accent-purple text-white font-bold text-xs hover:bg-accent-purple-dark transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isPt ? 'Testar Planner Amplifica Grátis' : 'Try Planner Amplifica Free'}</span>
            </button>
          </div>

        </main>

        <SeoInternalLinks currentLang={activeArticle.lang} />
      </div>
    );
  }

  // Render Blog Index / Hub
  const hubMeta = {
    title: 'Blog de Marketing de Conteúdo & Redes Sociais | Planner Amplifica',
    description: 'Aprenda estratégias de calendário editorial, roteiros com IA para Reels e Shorts, gestão de redes sociais e crescimento para criadores e agências.',
    keywords: ['blog redes sociais', 'dicas de marketing de conteudo', 'blog planejamento de conteudo', 'ia para social media'],
    canonical: `${BASE_URL}/blog`,
    lang: 'pt-BR' as const,
    h1: 'Blog do Planner Amplifica',
    subtitle: 'Artigos, guias e estratégias práticas para dominar a criação de conteúdo e mídias sociais.'
  };

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white">
      <SeoHead meta={hubMeta} />

      {/* Header */}
      <header className="border-b border-panel-border bg-panel-black/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-purple flex items-center justify-center text-white font-bold font-display shadow-md">
              PA
            </div>
            <span className="font-display font-black text-lg text-white tracking-tight">
              Blog <span className="text-accent-purple">Amplifica</span>
            </span>
          </a>

          <button
            onClick={onStartFreeTrial}
            className="bg-accent-purple hover:bg-accent-purple-dark text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Criar Conta Grátis</span>
          </button>
        </div>
      </header>

      {/* Blog Hub Main */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-10 text-left">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple rounded-full text-xs font-mono font-bold">
            <BookOpen size={12} />
            <span>CONTEÚDO & ESTRATÉGIA EDITORIAL</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-white">
            {hubMeta.h1}
          </h1>

          <p className="text-sm text-zinc-300">
            {hubMeta.subtitle}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search size={16} className="absolute left-3.5 top-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar artigos no blog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-panel-card border border-panel-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-purple"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-purple text-white shadow'
                    : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
                }`}
              >
                {cat === 'all' ? 'Todas as Categorias' : cat}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="p-6 rounded-2xl bg-panel-card border border-panel-border flex flex-col justify-between space-y-4 hover:border-accent-purple/50 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-accent-purple/10 text-accent-purple font-bold">
                    {post.category}
                  </span>
                  <span>{post.readTime}</span>
                </div>

                <h2 className="text-lg font-display font-bold text-white group-hover:text-accent-purple transition-colors line-clamp-2">
                  <a href={`/blog/${post.slug}`}>{post.title}</a>
                </h2>

                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {post.description}
                </p>
              </div>

              <div className="pt-4 border-t border-panel-border/50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">{post.publishedDate}</span>
                <a
                  href={`/blog/${post.slug}`}
                  className="font-bold text-accent-purple hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Ler artigo</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>

      </main>

      <SeoInternalLinks currentLang="pt-BR" />
    </div>
  );
}
