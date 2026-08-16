import React from 'react';
import SeoHead from './SeoHead';
import SeoInternalLinks from './SeoInternalLinks';
import { BASE_URL } from './seoData';
import { AlertTriangle, Home, Search, ArrowRight, Sparkles } from 'lucide-react';

interface SeoNotFoundViewProps {
  isGone410?: boolean;
}

export default function SeoNotFoundView({ isGone410 = false }: SeoNotFoundViewProps) {
  const meta = {
    title: isGone410 ? 'Recurso Removido (410) | Planner Amplifica' : 'Página não Encontrada (404) | Planner Amplifica',
    description: isGone410 
      ? 'Este recurso foi permanentemente removido de nossos servidores. Explore nosso calendário de conteúdo e blog.'
      : 'A página que você procura não foi encontrada. Navegue pelos nossos calendários de conteúdo e ferramentas.',
    keywords: ['pagina nao encontrada', '404', '410', 'planner amplifica'],
    canonical: `${BASE_URL}/404`,
    lang: 'pt-BR' as const,
    h1: isGone410 ? 'Recurso Removido (HTTP 410)' : 'Página Não Encontrada (HTTP 404)',
    subtitle: isGone410
      ? 'O link acessado foi permanentemente desativado. Mas temos várias outras soluções para você.'
      : 'O endereço digitado pode ter mudado ou não estar mais disponível.'
  };

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white flex flex-col justify-between">
      <SeoHead meta={meta} />

      <header className="border-b border-panel-border bg-panel-black/90 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-purple flex items-center justify-center text-white font-bold font-display shadow-md">
              PA
            </div>
            <span className="font-display font-black text-lg text-white tracking-tight">
              Planner <span className="text-accent-purple">Amplifica</span>
            </span>
          </a>

          <a
            href="/"
            className="bg-accent-purple text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Home size={14} />
            <span>Voltar ao Início</span>
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-orange/10 text-accent-orange border border-accent-orange/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>

        <h1 className="text-3xl md:text-5xl font-display font-black text-white">
          {meta.h1}
        </h1>

        <p className="text-sm md:text-base text-zinc-300 max-w-lg mx-auto">
          {meta.subtitle}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent-purple hover:bg-accent-purple-dark text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Home size={14} />
            <span>Ir para a Homepage</span>
          </a>

          <a
            href="/planner-de-conteudo"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-panel-card hover:bg-zinc-800 text-zinc-200 border border-panel-border font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} className="text-accent-orange" />
            <span>Conhecer o Planner de Conteúdo</span>
          </a>
        </div>
      </main>

      <SeoInternalLinks currentLang="pt-BR" />
    </div>
  );
}
