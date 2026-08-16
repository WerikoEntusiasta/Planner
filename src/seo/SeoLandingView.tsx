import React, { useState } from 'react';
import { SeoPageMetadata } from './seoData';
import SeoHead from './SeoHead';
import Breadcrumbs from './Breadcrumbs';
import SeoInternalLinks from './SeoInternalLinks';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Zap, Shield, Globe, Layers, Users } from 'lucide-react';

interface SeoLandingViewProps {
  meta: SeoPageMetadata;
  onStartFreeTrial: () => void;
}

export default function SeoLandingView({ meta, onStartFreeTrial }: SeoLandingViewProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const isPt = meta.lang === 'pt-BR';

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white">
      <SeoHead meta={meta} />

      {/* Top SEO Header Navigation */}
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

          <div className="flex items-center gap-4">
            <a 
              href={meta.alternateUrl ? (isPt ? meta.alternateUrl.en : meta.alternateUrl.pt) : (isPt ? '/en' : '/')} 
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-panel-card px-2.5 py-1 rounded-md border border-panel-border"
            >
              <Globe size={13} />
              <span>{isPt ? 'English (EN)' : 'Português (PT)'}</span>
            </a>

            <button
              onClick={onStartFreeTrial}
              className="bg-accent-purple hover:bg-accent-purple-dark text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isPt ? 'Criar Conta Grátis' : 'Start Free Trial'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-12 text-left">
        
        {/* Breadcrumbs */}
        {meta.breadcrumbs && <Breadcrumbs items={meta.breadcrumbs} lang={meta.lang} />}

        {/* Hero Section */}
        <section className="text-center space-y-6 pt-4 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple rounded-full text-xs font-mono font-bold">
            <Zap size={14} className="text-accent-orange animate-pulse" />
            <span>{isPt ? 'PLANEJADOR DE REDES SOCIAIS COM IA' : 'AI SOCIAL MEDIA CONTENT PLANNER'}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight max-w-4xl mx-auto">
            {meta.h1}
          </h1>

          <p className="text-base md:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {meta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartFreeTrial}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent-purple hover:bg-accent-purple-dark text-white font-display font-extrabold text-sm shadow-xl shadow-accent-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{isPt ? 'Começar Gratuitamente Agora' : 'Get Started For Free'}</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#recursos"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-panel-card hover:bg-zinc-800 text-zinc-300 font-bold text-sm border border-panel-border transition-all flex items-center justify-center gap-2"
            >
              <span>{isPt ? 'Ver Recursos & Funcionalidades' : 'Explore Features'}</span>
            </a>
          </div>

          {/* Social Proof Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-mono border-t border-panel-border/50 max-w-xl mx-auto">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              {isPt ? 'Sem Cartão de Crédito' : 'No Credit Card Needed'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              {isPt ? 'Aprovação com 1 Clique' : '1-Click Client Approval'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              {isPt ? 'Suporte a Reels & Shorts' : 'Reels & Shorts Scripting'}
            </span>
          </div>
        </section>

        {/* Dynamic Rich Text Content Blocks */}
        {meta.contentBlocks && meta.contentBlocks.length > 0 && (
          <section id="recursos" className="space-y-8 bg-panel-card/40 p-6 md:p-8 rounded-2xl border border-panel-border">
            {meta.contentBlocks.map((block, idx) => (
              <div key={idx} className="space-y-4">
                <h2 className="text-xl md:text-2xl font-display font-bold text-white border-b border-panel-border/60 pb-2">
                  {block.h2}
                </h2>
                <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                  {block.text}
                </p>
                {block.bullets && block.bullets.length > 0 && (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {block.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 p-3 rounded-lg bg-panel-black/60 border border-panel-border text-xs md:text-sm text-zinc-200">
                        <CheckCircle2 size={16} className="text-accent-purple flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Feature Highlights Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display font-black text-white">
              {isPt ? 'Por que o Planner Amplifica é a escolha certa?' : 'Why Choose Planner Amplifica?'}
            </h2>
            <p className="text-xs text-zinc-400">
              {isPt ? 'Recursos desenvolvidos sob medida para alta produtividade editorial.' : 'Tailored features designed for peak editorial productivity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-panel-card border border-panel-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isPt ? 'Roteiros & Ganchos com IA' : 'AI Scripts & Hooks'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt 
                  ? 'Gere estruturas de Reels, Shorts e carrosséis com ganchos magnéticos ajustados para cada nicho.'
                  : 'Generate Reels, Shorts, and carousel structures with magnetic hooks tailored to any niche.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-panel-card border border-panel-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-orange/10 text-accent-orange flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isPt ? 'Visão em Calendário & Grid' : 'Calendar & Feed Grid View'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt
                  ? 'Organize posts no calendário interativo e veja a prévia estética do feed do Instagram antes de publicar.'
                  : 'Organize posts on an interactive calendar and preview your Instagram feed grid before publishing.'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-panel-card border border-panel-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isPt ? 'Aprovação de Clientes sem Login' : 'No-Login Client Approval'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isPt
                  ? 'Envie um link público para seus clientes revisarem e aprovarem o planejamento sem complicações.'
                  : 'Share a public link for clients to review and approve content without passwords or headaches.'}
              </p>
            </div>
          </div>
        </section>

        {/* Accordion FAQ Section */}
        {meta.faqs && meta.faqs.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-black text-white">
                {isPt ? 'Perguntas Frequentes (FAQ)' : 'Frequently Asked Questions'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isPt ? 'Tire suas dúvidas sobre o planejamento e gestão com o Planner Amplifica.' : 'Got questions? We have answers.'}
              </p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              {meta.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="rounded-xl bg-panel-card border border-panel-border overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp size={16} className="text-accent-purple" /> : <ChevronDown size={16} className="text-zinc-500" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-zinc-300 leading-relaxed border-t border-panel-border/40 bg-panel-black/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-accent-purple/20 via-panel-card to-accent-orange/20 border border-accent-purple/30 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-black text-white">
              {isPt ? 'Pronto para Revolucionar suas Redes Sociais?' : 'Ready to Transform Your Social Media?'}
            </h2>
            <p className="text-xs md:text-sm text-zinc-300">
              {isPt 
                ? 'Junte-se a milhares de criadores e agências que organizam seu calendário com o Planner Amplifica.'
                : 'Join thousands of creators and agencies streamlining their editorial calendar with Planner Amplifica.'}
            </p>
          </div>

          <button
            onClick={onStartFreeTrial}
            className="px-8 py-4 rounded-xl bg-white text-black font-display font-black text-sm hover:bg-zinc-200 transition-all shadow-xl inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="text-accent-purple" />
            <span>{isPt ? 'Começar Gratuitamente' : 'Start Free Trial Now'}</span>
            <ArrowRight size={16} />
          </button>
        </section>

      </main>

      {/* Internal Link Mesh Directory */}
      <SeoInternalLinks currentLang={meta.lang} />
    </div>
  );
}
