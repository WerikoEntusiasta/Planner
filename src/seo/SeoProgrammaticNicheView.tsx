import React from 'react';
import SeoHead from './SeoHead';
import Breadcrumbs from './Breadcrumbs';
import SeoInternalLinks from './SeoInternalLinks';
import { BASE_URL } from './seoData';
import { Sparkles, CheckCircle2, ArrowRight, Zap, Lightbulb, Video, Target, Globe } from 'lucide-react';

interface NicheData {
  slug: string;
  lang: 'pt-BR' | 'en';
  nicheName: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  sampleHooks: string[];
}

interface SeoProgrammaticNicheViewProps {
  niche: NicheData;
  onStartFreeTrial: () => void;
}

export default function SeoProgrammaticNicheView({ niche, onStartFreeTrial }: SeoProgrammaticNicheViewProps) {
  const isPt = niche.lang === 'pt-BR';

  const meta = {
    title: niche.title,
    description: niche.description,
    keywords: niche.keywords,
    canonical: `${BASE_URL}${isPt ? '' : '/en'}/ideias/${niche.slug}`,
    lang: niche.lang,
    h1: niche.h1,
    subtitle: isPt 
      ? `Estratégia comprovada de conteúdo para ${niche.nicheName} atraírem mais clientes e autoridade nas redes sociais.`
      : `Proven content strategy and video script hooks for ${niche.nicheName} to build authority and gain leads.`,
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}${isPt ? '' : '/en'}` },
      { name: isPt ? 'Ideias de Conteúdo' : 'Content Ideas', item: `${BASE_URL}${isPt ? '/ideias' : '/en/ideas'}` },
      { name: niche.nicheName, item: `${BASE_URL}${isPt ? '/ideias/' : '/en/ideas/'}${niche.slug}` }
    ],
    faqs: [
      {
        question: isPt ? `Como criar conteúdo no Instagram para ${niche.nicheName}?` : `How to create social media content for ${niche.nicheName}?`,
        answer: isPt
          ? `Para ${niche.nicheName}, divida seus posts entre atração com mitos e erros comuns, nutrição mostrando bastidores e tirando dúvidas frequentes, e conversão apresentando casos de sucesso e chamada direta para consulta.`
          : `For ${niche.nicheName}, balance your posts between top-of-funnel educational videos addressing myths, middle-of-funnel FAQs, and direct calls to action for appointments.`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white">
      <SeoHead meta={meta} />

      {/* Header */}
      <header className="border-b border-panel-border bg-panel-black/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-purple flex items-center justify-center text-white font-bold font-display shadow-md">
              PA
            </div>
            <span className="font-display font-black text-lg text-white tracking-tight">
              Planner <span className="text-accent-purple">Amplifica</span>
            </span>
          </a>

          <button
            onClick={onStartFreeTrial}
            className="bg-accent-purple hover:bg-accent-purple-dark text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>{isPt ? 'Usar Planner para este Nicho' : 'Use Planner For This Niche'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10 text-left">
        <Breadcrumbs items={meta.breadcrumbs} lang={niche.lang} />

        {/* Hero */}
        <section className="text-center space-y-6 pt-2 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange rounded-full text-xs font-mono font-bold">
            <Lightbulb size={14} />
            <span>{isPt ? `SEO PROGRAMÁTICO PARA ${niche.nicheName.toUpperCase()}` : `CONTENT MATRIX FOR ${niche.nicheName.toUpperCase()}`}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight max-w-4xl mx-auto">
            {niche.h1}
          </h1>

          <p className="text-sm md:text-base text-zinc-300 max-w-2xl mx-auto">
            {meta.subtitle}
          </p>

          <div className="pt-2">
            <button
              onClick={onStartFreeTrial}
              className="px-8 py-4 rounded-xl bg-accent-purple hover:bg-accent-purple-dark text-white font-display font-black text-sm shadow-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{isPt ? 'Gerar Calendário com IA para este Nicho' : 'Generate AI Calendar For This Niche'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Sample Viral Hooks Section */}
        <section className="space-y-4 bg-panel-card p-6 md:p-8 rounded-2xl border border-panel-border">
          <div className="flex items-center gap-2">
            <Video size={20} className="text-accent-purple" />
            <h2 className="text-xl font-display font-bold text-white">
              {isPt ? 'Exemplos de Ganchos Virais de Vídeo (Reels / TikTok / Shorts)' : 'Sample Viral Video Hooks (Reels / Shorts)'}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            {isPt ? 'Utilize estes ganchos testados nos primeiros 3 segundos do seu vídeo para prender a atenção:' : 'Use these tested hooks in the first 3 seconds of your short-form videos:'}
          </p>

          <div className="space-y-3 pt-2">
            {niche.sampleHooks.map((hook, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-panel-black/80 border border-panel-border/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">"{hook}"</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {isPt ? 'Formato sugerido: Reel de 15s a 30s com legenda em texto nativo.' : 'Suggested format: 15s to 30s Reel with native text overlay.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Funnel Strategy Matrix */}
        <section className="space-y-6">
          <h2 className="text-xl font-display font-bold text-white text-center">
            {isPt ? 'Matriz de Funil Editorial Recomendada' : 'Recommended Editorial Funnel Matrix'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold">TOFU - Atração</span>
              <h3 className="font-bold text-white text-sm">Mitos e Curiosidades</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt ? 'Vídeos curtos desmentindo mitos populares e gerando forte engajamento.' : 'Short videos busting popular myths with high shares.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-2">
              <span className="px-2 py-0.5 rounded bg-accent-purple/10 text-accent-purple text-[10px] font-mono font-bold">MOFU - Nutrição</span>
              <h3 className="font-bold text-white text-sm">Dúvidas Frequentes & Carrosséis</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt ? 'Posts explicativos passo a passo que provam sua autoridade técnica.' : 'Step-by-step explanatory posts showcasing deep expertise.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-2">
              <span className="px-2 py-0.5 rounded bg-accent-orange/10 text-accent-orange text-[10px] font-mono font-bold">BOFU - Conversão</span>
              <h3 className="font-bold text-white text-sm">Chamada Direta para Agendamento</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt ? 'Apresentação do serviço ou consulta com CTA direta para o link da bio/WhatsApp.' : 'Direct presentation of services with a clear booking CTA.'}
              </p>
            </div>
          </div>
        </section>

      </main>

      <SeoInternalLinks currentLang={niche.lang} />
    </div>
  );
}
