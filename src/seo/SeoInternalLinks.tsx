import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Layers, Rocket, FileText, CheckCircle2, Shield } from 'lucide-react';

interface SeoInternalLinksProps {
  currentLang?: 'pt-BR' | 'en';
}

export default function SeoInternalLinks({ currentLang = 'pt-BR' }: SeoInternalLinksProps) {
  const isPt = currentLang === 'pt-BR';

  return (
    <section className="mt-16 pt-12 border-t border-panel-border bg-panel-black text-left font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs font-mono font-bold">
            <Sparkles size={12} />
            {isPt ? 'MAPA DO PLANNER AMPLIFICA' : 'PLANNER AMPLIFICA DIRECTORY'}
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black text-white">
            {isPt ? 'Explore Nossas Soluções de Conteúdo e Ferramentas' : 'Explore Our Content Solutions & Tools'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto">
            {isPt
              ? 'Conheça nossos calendários, templates, ideias por segmento e comparativos para alavancar suas redes sociais.'
              : 'Discover our calendars, templates, niche content ideas, and software comparisons to boost your social media.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs text-zinc-300">
          
          {/* Column 1: Core Landings */}
          <div className="p-4 rounded-xl bg-panel-card/60 border border-panel-border/80 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-accent-purple">
              <Rocket size={14} />
              {isPt ? 'Principais Soluções' : 'Main Solutions'}
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="/planner-de-conteudo" className="hover:text-accent-orange transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-purple" />
                  Planner de Conteúdo
                </a>
              </li>
              <li>
                <a href="/calendario-editorial" className="hover:text-accent-orange transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-purple" />
                  Calendário Editorial
                </a>
              </li>
              <li>
                <a href="/calendario-de-conteudo" className="hover:text-accent-orange transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-purple" />
                  Calendário de Conteúdo
                </a>
              </li>
              <li>
                <a href="/planner-instagram" className="hover:text-accent-orange transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-purple" />
                  Planner Instagram (Feed & Reels)
                </a>
              </li>
              <li>
                <a href="/planner-com-ia" className="hover:text-accent-orange transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-purple" />
                  IA para Criar Conteúdo
                </a>
              </li>
              <li>
                <a href="/en/content-planner" className="hover:text-accent-orange transition-colors flex items-center gap-1 text-zinc-400">
                  <ArrowRight size={10} className="text-accent-purple" />
                  AI Content Planner (English)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Programmatic Niche Ideas */}
          <div className="p-4 rounded-xl bg-panel-card/60 border border-panel-border/80 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-accent-orange">
              <FileText size={14} />
              {isPt ? 'Ideias por Nicho' : 'Ideas by Niche'}
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="/ideias/nutricionistas" className="hover:text-accent-purple transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Posts para Nutricionistas
                </a>
              </li>
              <li>
                <a href="/ideias/advogados" className="hover:text-accent-purple transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Posts para Advogados
                </a>
              </li>
              <li>
                <a href="/ideias/dentistas" className="hover:text-accent-purple transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Posts para Dentistas
                </a>
              </li>
              <li>
                <a href="/ideias/psicologos" className="hover:text-accent-purple transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Posts para Psicólogos
                </a>
              </li>
              <li>
                <a href="/ideias/imobiliarias" className="hover:text-accent-purple transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Posts para Imobiliárias
                </a>
              </li>
              <li>
                <a href="/en/ideas/realtors" className="hover:text-accent-purple transition-colors flex items-center gap-1 text-zinc-400">
                  <ArrowRight size={10} className="text-accent-orange" />
                  Content Ideas for Realtors (EN)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Features & Templates */}
          <div className="p-4 rounded-xl bg-panel-card/60 border border-panel-border/80 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-emerald-400">
              <Layers size={14} />
              {isPt ? 'Templates & Recursos' : 'Templates & Features'}
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="/templates/calendario-editorial" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Template Calendário Editorial
                </a>
              </li>
              <li>
                <a href="/templates/planner-instagram" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Template Planner Instagram
                </a>
              </li>
              <li>
                <a href="/funcionalidade/planejamento-com-ia" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Planejamento com IA
                </a>
              </li>
              <li>
                <a href="/funcionalidade/aprovacao" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Aprovação de Clientes
                </a>
              </li>
              <li>
                <a href="/funcionalidade/campanhas" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Gestão de Campanhas
                </a>
              </li>
              <li>
                <a href="/en/templates/content-calendar-template" className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-zinc-400">
                  <ArrowRight size={10} className="text-emerald-400" />
                  Free Content Calendar Template
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Comparisons & Blog */}
          <div className="p-4 rounded-xl bg-panel-card/60 border border-panel-border/80 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-accent-blue">
              <BookOpen size={14} />
              {isPt ? 'Comparativos & Blog' : 'Comparisons & Blog'}
            </h3>
            <ul className="space-y-2 font-medium">
              <li>
                <a href="/comparar/planner-amplifica-vs-notion" className="hover:text-accent-blue transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-blue" />
                  Planner Amplifica vs Notion
                </a>
              </li>
              <li>
                <a href="/comparar/planner-amplifica-vs-trello" className="hover:text-accent-blue transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-blue" />
                  Planner Amplifica vs Trello
                </a>
              </li>
              <li>
                <a href="/comparar/planner-amplifica-vs-clickup" className="hover:text-accent-blue transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-blue" />
                  Planner Amplifica vs ClickUp
                </a>
              </li>
              <li>
                <a href="/comparar/planner-amplifica-vs-buffer" className="hover:text-accent-blue transition-colors flex items-center gap-1">
                  <ArrowRight size={10} className="text-accent-blue" />
                  Planner Amplifica vs Buffer
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-accent-blue transition-colors flex items-center gap-1 font-bold text-accent-orange">
                  <ArrowRight size={10} className="text-accent-orange" />
                  {isPt ? 'Blog & Artigos Recentes' : 'Blog & Latest Articles'}
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="text-center text-[10px] text-zinc-500 font-mono py-4 border-t border-panel-border/40">
          <p>© 2026 Planner Amplifica — Amplifica Group. {isPt ? 'Todos os direitos reservados.' : 'All rights reserved.'}</p>
        </div>

      </div>
    </section>
  );
}
