import React, { useState } from 'react';
import { Sparkles, Bot, Flame, Send, Plus, Check, RefreshCw, Lightbulb, Zap, ArrowRight, Calendar, Layers } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { FunnelStage, Platform, ContentFormat, Post } from '../types';

interface GeneratedIdea {
  id: string;
  title: string;
  hookText: string;
  scriptText: string;
  visualIdea: string;
  funnelStage: FunnelStage;
  platform: Platform;
  format: ContentFormat;
  hashtags: string[];
  scheduledDate: string;
}

interface IAChatSuggesterProps {
  onCreatePostFromAI?: (idea: Partial<Post> | Partial<Post>[]) => void;
}

export default function IAChatSuggester({ onCreatePostFromAI }: IAChatSuggesterProps) {
  const { t } = useLanguage();
  const [generationMode, setGenerationMode] = useState<'single' | 'weekly' | 'monthly'>('single');
  const [mediaCount, setMediaCount] = useState<number>(5);
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('curioso');
  const [stage, setStage] = useState<FunnelStage>('TOFU');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [createdIdeaId, setCreatedIdeaId] = useState<string | null>(null);
  const [allApplied, setAllApplied] = useState(false);

  const handleGenerateIdeas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCreatedIdeaId(null);
    setAllApplied(false);

    setTimeout(() => {
      const count = generationMode === 'single' ? 1 : mediaCount;
      const newIdeas: GeneratedIdea[] = [];
      const platforms: Platform[] = ['instagram', 'tiktok', 'youtube'];
      const formats: ContentFormat[] = ['reels', 'carousel', 'stories', 'shorts'];
      const stages: FunnelStage[] = ['TOFU', 'MOFU', 'BOFU'];

      const today = new Date();

      for (let i = 0; i < count; i++) {
        const itemDate = new Date(today);
        itemDate.setDate(today.getDate() + i);
        const dateStr = itemDate.toISOString().split('T')[0];

        const pf = platforms[i % platforms.length];
        const fmt = formats[i % formats.length];
        const fnStage = generationMode === 'single' ? stage : stages[i % stages.length];

        let titleTemplate = '';
        let hookTemplate = '';

        if (i === 0) {
          titleTemplate = `Estratégia Principal: ${topic}`;
          hookTemplate = `Como dominar ${topic} do zero ao avançado nesta temporada! 🔥`;
        } else if (i % 3 === 0) {
          titleTemplate = `Guia Passo a Passo: ${topic} (${i + 1})`;
          hookTemplate = `O erro número 1 que todo mundo comete em ${topic} e como evitar 💡`;
        } else if (i % 3 === 1) {
          titleTemplate = `Bastidores & Dicas Práticas sobre ${topic}`;
          hookTemplate = `Tudo o que você precisa saber sobre ${topic} explicado em 30 segundos ⚡`;
        } else {
          titleTemplate = `Estudo de Caso & Resultados: ${topic}`;
          hookTemplate = `Veja os resultados reais alcançados aplicando ${topic} hoje mesmo 🚀`;
        }

        newIdeas.push({
          id: `ai_${Date.now()}_${i}`,
          title: titleTemplate,
          hookText: hookTemplate,
          scriptText: `Roteiro otimizado para ${topic}. Detalhes: ${details || 'Foco em conversão e engajamento'}. Apresente a dor, a solução prática e finalize com uma chamada para ação clara.`,
          visualIdea: `Gravação dinâmica com legendas em destaque, transições rápidas e paleta temática sincronizada.`,
          funnelStage: fnStage,
          platform: pf,
          format: fmt,
          hashtags: [topic.replace(/\s+/g, ''), 'Marketing', 'Estrategia', 'ConteudoDigital'],
          scheduledDate: dateStr
        });
      }

      setIdeas(newIdeas);
      setIsGenerating(false);
    }, 900);
  };

  const handleApplyIdea = (idea: GeneratedIdea) => {
    setCreatedIdeaId(idea.id);
    if (onCreatePostFromAI) {
      onCreatePostFromAI({
        title: idea.title,
        hookText: idea.hookText,
        scriptText: idea.scriptText,
        visualIdea: idea.visualIdea,
        funnelStage: idea.funnelStage,
        platform: idea.platform,
        format: idea.format,
        hashtags: idea.hashtags,
        status: 'draft',
        scheduledDate: idea.scheduledDate,
        scheduledTime: '18:00'
      });
    }
  };

  const handleApplyAll = () => {
    setAllApplied(true);
    if (onCreatePostFromAI && ideas.length > 0) {
      onCreatePostFromAI(ideas.map(idea => ({
        title: idea.title,
        hookText: idea.hookText,
        scriptText: idea.scriptText,
        visualIdea: idea.visualIdea,
        funnelStage: idea.funnelStage,
        platform: idea.platform,
        format: idea.format,
        hashtags: idea.hashtags,
        status: 'draft',
        scheduledDate: idea.scheduledDate,
        scheduledTime: '18:00'
      })));
    }
  };

  return (
    <div className="bg-panel-card border border-panel-border p-6 rounded-2xl relative overflow-hidden group shadow-2xl h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent-purple/15 rounded-full blur-3xl pointer-events-none group-hover:bg-accent-purple/25 transition-all duration-500" />
      
      <div>
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-panel-border/40 pb-4 mb-4">
          <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
            <Bot size={16} className="text-accent-purple animate-pulse" />
            IA Criativa & Planejamento
          </h4>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-black bg-accent-orange/15 text-accent-orange border border-accent-orange/30 uppercase tracking-wider">
            <Flame size={12} className="animate-bounce" /> Gemini AI
          </span>
        </div>

        {/* MODE TABS */}
        <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-panel-border mb-4">
          <button
            type="button"
            onClick={() => setGenerationMode('single')}
            className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              generationMode === 'single' ? 'bg-accent-purple text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap size={11} /> 1 Roteiro
          </button>
          <button
            type="button"
            onClick={() => { setGenerationMode('weekly'); setMediaCount(5); }}
            className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              generationMode === 'weekly' ? 'bg-accent-purple text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar size={11} /> Semanal
          </button>
          <button
            type="button"
            onClick={() => { setGenerationMode('monthly'); setMediaCount(15); }}
            className={`py-2 px-2 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              generationMode === 'monthly' ? 'bg-accent-purple text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={11} /> Mensal
          </button>
        </div>

        {/* FORM AREA */}
        <form onSubmit={handleGenerateIdeas} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-1.5">
              Nicho, Produto ou Tema do Post:
            </label>
            <input
              type="text"
              placeholder="Ex: Lançamento de Curso, Black Friday, Consultoria..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple transition-all font-sans"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400">
                Detalhes e Contexto Adicional:
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {details.length}/1000
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={1000}
              placeholder="Adicione objetivos, público-alvo ou referências (até 1.000 caracteres)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple transition-all font-sans resize-none"
            />
          </div>

          {generationMode !== 'single' && (
            <div>
              <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                Quantidade de Mídia ({generationMode === 'weekly' ? 'por Semana' : 'por Mês'}):
              </label>
              <select
                value={mediaCount}
                onChange={(e) => setMediaCount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-purple font-mono"
              >
                {generationMode === 'weekly' ? (
                  <>
                    <option value={3}>3 Posts / Reels (Leve)</option>
                    <option value={5}>5 Posts / Reels (Recomendado)</option>
                    <option value={7}>7 Posts / Reels (Intensivo)</option>
                    <option value={10}>10 Posts / Reels (Diário + Extras)</option>
                  </>
                ) : (
                  <>
                    <option value={10}>10 Posts (Consistente)</option>
                    <option value={15}>15 Posts (Ideal para Crescimento)</option>
                    <option value={20}>20 Posts (Frequência Alta)</option>
                    <option value={30}>30 Posts (Cobertura Diária)</option>
                  </>
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                Tom do Gancho:
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-purple font-mono"
              >
                <option value="curioso">Curioso / Retenção</option>
                <option value="informativo">Informativo / Direto</option>
                <option value="polemico">Contra-intuitivo</option>
                <option value="vendas">Persuasivo / Vendas</option>
              </select>
            </div>

            {generationMode === 'single' ? (
              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  Etapa do Funil:
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as FunnelStage)}
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-purple font-mono"
                >
                  <option value="TOFU">TOFU (Topo)</option>
                  <option value="MOFU">MOFU (Meio)</option>
                  <option value="BOFU">BOFU (Fundo)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  Distribuição:
                </label>
                <div className="bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-[11px] text-zinc-300 font-mono flex items-center justify-between">
                  <span>Funil Automatizado</span>
                  <span className="text-accent-orange font-bold">TOFU/MOFU/BOFU</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!topic.trim() || isGenerating}
            className="w-full py-3 px-4 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-600 hover:to-accent-purple text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 border border-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin text-purple-200" />
                Gerando {generationMode === 'single' ? 'Roteiro' : generationMode === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}...
              </>
            ) : (
              <>
                <Zap size={14} className="text-yellow-300 fill-yellow-300" />
                {generationMode === 'single' ? 'Gerar Roteiro com IA' : generationMode === 'weekly' ? `Gerar ${mediaCount} Posts (Semanal)` : `Gerar ${mediaCount} Posts (Mensal)`}
              </>
            )}
          </button>
        </form>

        {/* GENERATED RESULTS */}
        {ideas.length > 0 && (
          <div className="mt-4 pt-3 border-t border-panel-border/50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Lightbulb size={13} className="text-yellow-400" /> {ideas.length} Conteúdos Gerados:
              </span>
              {generationMode !== 'single' && (
                <button
                  type="button"
                  onClick={handleApplyAll}
                  disabled={allApplied}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    allApplied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-accent-orange text-black hover:bg-orange-400'
                  }`}
                >
                  {allApplied ? <Check size={11} /> : <Plus size={11} />} {allApplied ? 'Adicionados!' : 'Adicionar Todos ao Grid'}
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-3 bg-zinc-950 rounded-xl border border-panel-border hover:border-accent-purple/50 transition-all space-y-1.5 group/card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-bold text-white group-hover/card:text-purple-300 transition-colors line-clamp-1">
                      {idea.title}
                    </h5>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0 ${
                      idea.funnelStage === 'TOFU' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                      idea.funnelStage === 'MOFU' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {idea.funnelStage}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 italic bg-zinc-900/80 p-2 rounded-lg border border-panel-border/40 line-clamp-2">
                    "{idea.hookText}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400 font-mono">
                    <span>{idea.platform} • {idea.format} • {idea.scheduledDate}</span>

                    <button
                      onClick={() => handleApplyIdea(idea)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        createdIdeaId === idea.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-accent-purple text-white hover:bg-purple-600'
                      }`}
                    >
                      {createdIdeaId === idea.id ? <Check size={11} /> : <Plus size={11} />}
                      {createdIdeaId === idea.id ? 'Criado' : 'Criar Post'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-3 border-t border-panel-border/40 text-[10px] font-mono text-zinc-500 mt-2">
        Google Gemini AI • Assistente Criativo Multicanal
      </div>
    </div>
  );
}
