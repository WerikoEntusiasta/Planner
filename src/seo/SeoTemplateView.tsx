import React from 'react';
import SeoHead from './SeoHead';
import Breadcrumbs from './Breadcrumbs';
import SeoInternalLinks from './SeoInternalLinks';
import { BASE_URL } from './seoData';
import { Sparkles, Download, CheckCircle2, ArrowRight, Layers, FileSpreadsheet, Calendar } from 'lucide-react';

interface TemplateData {
  slug: string;
  lang: 'pt-BR' | 'en';
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  downloadTitle: string;
}

interface SeoTemplateViewProps {
  template: TemplateData;
  onStartFreeTrial: () => void;
}

export default function SeoTemplateView({ template, onStartFreeTrial }: SeoTemplateViewProps) {
  const isPt = template.lang === 'pt-BR';

  const meta = {
    title: template.title,
    description: template.description,
    keywords: template.keywords,
    canonical: `${BASE_URL}${isPt ? '' : '/en'}/templates/${template.slug}`,
    lang: template.lang,
    h1: template.h1,
    subtitle: isPt 
      ? 'Acesse este modelo de planejamento pronto e otimizado para aumentar a produtividade das suas redes sociais.'
      : 'Access this ready-to-use planning template to instantly level up your social media publishing workflow.',
    breadcrumbs: [
      { name: 'Home', item: `${BASE_URL}${isPt ? '' : '/en'}` },
      { name: 'Templates', item: `${BASE_URL}${isPt ? '/templates' : '/en/templates'}` },
      { name: template.downloadTitle, item: `${BASE_URL}${isPt ? '/templates/' : '/en/templates/'}${template.slug}` }
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
            <span>{isPt ? 'Usar Template no App' : 'Use Template In App'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10 text-left">
        <Breadcrumbs items={meta.breadcrumbs} lang={template.lang} />

        {/* Hero */}
        <section className="text-center space-y-6 pt-4 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono font-bold">
            <FileSpreadsheet size={14} />
            <span>{isPt ? 'TEMPLATE PRONTO & INTERATIVO' : 'FREE READY-TO-USE TEMPLATE'}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight max-w-4xl mx-auto">
            {template.h1}
          </h1>

          <p className="text-sm md:text-base text-zinc-300 max-w-2xl mx-auto">
            {meta.subtitle}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartFreeTrial}
              className="px-8 py-4 rounded-xl bg-accent-purple hover:bg-accent-purple-dark text-white font-display font-black text-sm shadow-xl inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{isPt ? 'Abrir Template Interativo Grátis' : 'Open Interactive Template'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* What's Inside Checklist */}
        <section className="p-6 md:p-8 rounded-2xl bg-panel-card border border-panel-border space-y-6">
          <h2 className="text-xl font-display font-bold text-white">
            {isPt ? 'O que você encontra neste template:' : 'What is included in this template:'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isPt ? 'Estrutura por Estágio de Funil' : 'Funnel Stage Categorization'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isPt ? 'Organização visual entre TOFU (Atração), MOFU (Nutrição) e BOFU (Conversão).' : 'Visual grouping into Top, Middle, and Bottom funnel content.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isPt ? 'Formatos para Instagram, TikTok e YouTube' : 'Multi-Platform Format Matrix'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isPt ? 'Campos para Reels, Shorts, Carrosséis, Stories e Vídeos Longos.' : 'Fields for Reels, Shorts, Carousels, Stories, and Longform Videos.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isPt ? 'Campos de Roteiro e Ganchos' : 'Scripting & Hook Fields'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isPt ? 'Espaço para registrar o gancho dos primeiros 3 segundos de cada vídeo.' : 'Dedicated slots for first 3-second video hooks and script points.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isPt ? 'Aprovação de Clientes e Status' : 'Approval & Status Pipeline'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isPt ? 'Acompanhamento do status de Rascunho, Agendado e Publicado.' : 'Track Draft, Scheduled, and Published content status.'}
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <SeoInternalLinks currentLang={template.lang} />
    </div>
  );
}
