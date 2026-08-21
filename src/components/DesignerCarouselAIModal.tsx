import React, { useState } from 'react';
import { 
  Sparkles, X, Copy, Check, Download, Layers, ArrowRight, 
  ArrowLeft, RefreshCw, Wand2, Palette, FileText, Lightbulb, 
  Target, MessageSquare, Flame, CheckCircle2, ChevronRight,
  Eye, BookOpen, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../utils/clipboard';
import { Client, User } from '../types';

export interface GeneratedSlide {
  slideNumber: number;
  slideType: string;
  headline: string;
  body: string;
  visualDirection: string;
}

export interface GeneratedCarouselData {
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  slides: GeneratedSlide[];
}

interface DesignerCarouselAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClientId?: string;
  currentUser?: User | null;
  onApplyToCreative?: (carousel: GeneratedCarouselData) => void;
}

const QUICK_TOPIC_SUGGESTIONS = [
  '5 Erros no Tráfego Pago que Queimam seu Dinheiro',
  'Guia Passo a Passo: Como Criar uma Oferta Irresistível',
  '3 Técnicas de Design que Aumentam a Retenção de Carrosséis',
  'Como Estruturar um Funil de Vendas no Instagram do Zero',
  'O Segredo dos Perfis que Vendem Todos os Dias sem Parecer Vendedor',
  'Checklist Definitivo para Criar Conteúdo em Menos de 1 Hora'
];

const TONE_OPTIONS = [
  { id: 'educativo', label: 'Educativo & Didático', icon: '🎓' },
  { id: 'provocativo', label: 'Provocativo & Direto', icon: '⚡' },
  { id: 'autoridade', label: 'Autoridade & Especialista', icon: '👑' },
  { id: 'vendedor', label: 'Vendedor & Persuasivo', icon: '💰' },
  { id: 'storytelling', label: 'Storytelling & Curioso', icon: '📖' }
];

const GOAL_OPTIONS = [
  { id: 'salvamentos', label: 'Salvamentos & Compartilhamentos', icon: '💾' },
  { id: 'engajamento', label: 'Engajamento & Comentários', icon: '💬' },
  { id: 'vendas', label: 'Vendas & Geração de Leads', icon: '🎯' },
  { id: 'atracao', label: 'Topo de Funil / Atração de Seguidores', icon: '🚀' }
];

export default function DesignerCarouselAIModal({
  isOpen,
  onClose,
  clients,
  activeClientId,
  currentUser,
  onApplyToCreative
}: DesignerCarouselAIModalProps) {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('educativo');
  const [goal, setGoal] = useState('salvamentos');
  const [slideCount, setSlideCount] = useState<number>(6);
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || (clients[0]?.id || ''));
  const [niche, setNiche] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCarousel, setGeneratedCarousel] = useState<GeneratedCarouselData | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [copiedSlideIndex, setCopiedSlideIndex] = useState<number | null>(null);
  const [copiedFullScript, setCopiedFullScript] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Por favor, informe o tema do carrossel.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const response = await fetch('/api/ai/carousel-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.id ? { 'x-user-id': currentUser.id } : {}),
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          topic: topic.trim(),
          targetAudience: targetAudience.trim() || 'Público interessado em resultados',
          tone: TONE_OPTIONS.find(t => t.id === tone)?.label || tone,
          goal: GOAL_OPTIONS.find(g => g.id === goal)?.label || goal,
          slideCount,
          brandName: currentClient?.name || 'Sua Marca',
          niche: niche.trim() || 'Marketing & Negócios'
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.carousel) {
        setGeneratedCarousel(data.carousel);
        setActiveSlideIndex(0);
      } else {
        throw new Error(data.error || 'Erro ao gerar textos do carrossel.');
      }
    } catch (err: any) {
      console.error('Error generating carousel AI copy:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao gerar os textos. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySlide = async (slide: GeneratedSlide, index: number) => {
    const text = `--- SLIDE ${slide.slideNumber} (${slide.slideType}) ---\nHEADLINE: ${slide.headline}\nCONTEÚDO: ${slide.body}\nDIRECIONAMENTO VISUAL (DESIGNER): ${slide.visualDirection}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedSlideIndex(index);
      setTimeout(() => setCopiedSlideIndex(null), 2000);
    }
  };

  const handleCopyCaption = async () => {
    if (!generatedCarousel) return;
    const text = `${generatedCarousel.caption}\n\n${generatedCarousel.hashtags.join(' ')}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };

  const formatFullScript = (): string => {
    if (!generatedCarousel) return '';
    let text = `=========================================\n`;
    text += `ROTEIRO COMPLETO DE CARROSSEL PARA DESIGNER\n`;
    text += `=========================================\n`;
    text += `TÍTULO: ${generatedCarousel.title}\n`;
    text += `GANCHO DA CAPA: ${generatedCarousel.hook}\n`;
    text += `TOTAL DE SLIDES: ${generatedCarousel.slides.length}\n`;
    text += `MARCA: ${currentClient?.name || 'Marca'}\n`;
    text += `=========================================\n\n`;

    generatedCarousel.slides.forEach(slide => {
      text += `[SLIDE ${slide.slideNumber} - ${slide.slideType.toUpperCase()}]\n`;
      text += `HEADLINE: ${slide.headline}\n`;
      text += `TEXTO:\n${slide.body}\n`;
      text += `DIRECIONAMENTO VISUAL PARA O DESIGNER:\n🎨 ${slide.visualDirection}\n\n`;
      text += `-----------------------------------------\n\n`;
    });

    text += `LEGENDA SUGERIDA PARA O POST:\n${generatedCarousel.caption}\n\n`;
    text += `HASHTAGS:\n${generatedCarousel.hashtags.join(' ')}\n`;
    return text;
  };

  const handleCopyFullScript = async () => {
    const fullText = formatFullScript();
    const success = await copyToClipboard(fullText);
    if (success) {
      setCopiedFullScript(true);
      setTimeout(() => setCopiedFullScript(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedCarousel) return;
    const text = formatFullScript();
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `roteiro-carrossel-${(generatedCarousel.title || 'design').toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleApply = () => {
    if (!generatedCarousel) return;
    if (onApplyToCreative) {
      onApplyToCreative(generatedCarousel);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#14141f] border border-purple-500/30 max-w-4xl w-full rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin relative"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-orange-500 text-white shadow-lg shadow-purple-600/20">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white font-display">
                  Gerador de Textos para Carrosséis com IA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold uppercase">
                  Designer Studio
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gere ganchos magnéticos, copies slide a slide e direcionamentos visuais diagramáveis para designers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* BODY: FORM OR RESULT */}
        {!generatedCarousel ? (
          /* FORM VIEW */
          <form onSubmit={handleGenerate} className="space-y-6 relative z-10">
            {/* 1. TOPIC INPUT */}
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-zinc-300 mb-2">
                1. Tema ou Ideia Principal do Carrossel *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 5 Erros que impedem seu perfil de crescer no Instagram..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Quick suggestions pills */}
              <div className="mt-2.5">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5 font-bold">
                  Sugestões Rápidas de Ganchos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOPIC_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(sug)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-500/40 text-[11px] text-zinc-400 hover:text-purple-300 transition-all cursor-pointer text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. CLIENT / BRAND & NICHE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Cliente / Marca
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-zinc-300 mb-1.5">
                  Público-Alvo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Empreendedores, Designers, Donos de E-commerce..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* 3. TONE OF VOICE */}
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-zinc-300 mb-2">
                2. Tom de Voz da Copy
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TONE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTone(opt.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      tone === opt.id
                        ? 'bg-purple-600/20 border-purple-500 text-white font-bold shadow-lg shadow-purple-600/10'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base block mb-0.5">{opt.icon}</span>
                    <span className="text-[11px] block leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. GOAL & SLIDE COUNT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-zinc-300 mb-2">
                  3. Objetivo do Carrossel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGoal(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        goal === opt.id
                          ? 'bg-orange-600/20 border-orange-500 text-white font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{opt.icon}</span>
                        <span className="text-[11px] leading-tight line-clamp-1">{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase font-bold text-zinc-300">
                    4. Quantidade de Slides: <span className="text-purple-400 font-extrabold">{slideCount} slides</span>
                  </label>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>4 slides (Rápido)</span>
                    <span>6-8 slides (Recomendado)</span>
                    <span>12 slides (Guia Completo)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="w-full py-4 rounded-2xl font-display font-bold text-sm bg-gradient-to-r from-purple-600 via-purple-500 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white shadow-xl shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Criando Roteiro Estratégico com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Gerar Roteiro Completo para Carrossel</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* RESULT VIEW */
          <div className="space-y-6 relative z-10 animate-fade-in">
            
            {/* RESULT HEADER SUMMARY */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold uppercase">
                    {generatedCarousel.slides.length} Slides Prontos
                  </span>
                  <span className="text-zinc-500 text-xs">•</span>
                  <span className="text-zinc-400 text-xs font-medium">
                    {currentClient?.name || 'Marca'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {generatedCarousel.title}
                </h3>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyFullScript}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    copiedFullScript
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
                  }`}
                  title="Copiar todo o carrossel formatado para colar no Figma / Canva / Photoshop"
                >
                  {copiedFullScript ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedFullScript ? 'Roteiro Copiado!' : 'Copiar Roteiro Completo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                  title="Baixar em formato .TXT"
                >
                  <Download size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setGeneratedCarousel(null)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                  title="Criar novo roteiro"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* SLIDE NAVIGATION TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {generatedCarousel.slides.map((slide, idx) => {
                const isActive = activeSlideIndex === idx;
                return (
                  <button
                    key={slide.slideNumber}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>#{slide.slideNumber}</span>
                    <span className="text-[10px] opacity-80 max-w-[90px] truncate">{slide.slideType}</span>
                  </button>
                );
              })}
            </div>

            {/* ACTIVE SLIDE DETAIL CARD (ENFASE VISUAL PARA O DESIGNER) */}
            {generatedCarousel.slides[activeSlideIndex] && (
              <div className="bg-gradient-to-b from-[#181826] to-[#12121a] border border-purple-500/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                
                {/* SLIDE HEADER & BADGE */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-mono font-extrabold flex items-center justify-center text-sm">
                      {generatedCarousel.slides[activeSlideIndex].slideNumber}
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider block">
                        {generatedCarousel.slides[activeSlideIndex].slideType}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Slide {activeSlideIndex + 1} de {generatedCarousel.slides.length}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySlide(generatedCarousel.slides[activeSlideIndex], activeSlideIndex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedSlideIndex === activeSlideIndex
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {copiedSlideIndex === activeSlideIndex ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSlideIndex === activeSlideIndex ? 'Copiado!' : 'Copiar este Slide'}</span>
                  </button>
                </div>

                {/* SLIDE CONTENT */}
                <div className="space-y-4">
                  {/* Headline */}
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block mb-1">
                      Título do Slide (Headline de Impacto)
                    </span>
                    <h4 className="text-lg md:text-xl font-display font-black text-white tracking-tight">
                      {generatedCarousel.slides[activeSlideIndex].headline}
                    </h4>
                  </div>

                  {/* Body Text */}
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block mb-1">
                      Conteúdo Diagramável (Texto do Slide)
                    </span>
                    <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl text-xs md:text-sm text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                      {generatedCarousel.slides[activeSlideIndex].body}
                    </div>
                  </div>

                  {/* DESIGNER VISUAL DIRECTION BOX */}
                  <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-mono font-bold uppercase">
                      <Palette size={14} className="text-purple-400" />
                      <span>Direcionamento Visual para o Designer:</span>
                    </div>
                    <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
                      {generatedCarousel.slides[activeSlideIndex].visualDirection}
                    </p>
                  </div>
                </div>

                {/* PREV / NEXT NAVIGATION */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                  <button
                    type="button"
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Slide Anterior</span>
                  </button>

                  <button
                    type="button"
                    disabled={activeSlideIndex === generatedCarousel.slides.length - 1}
                    onClick={() => setActiveSlideIndex(prev => Math.min(generatedCarousel.slides.length - 1, prev + 1))}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Próximo Slide</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* INSTAGRAM CAPTION & HASHTAGS CARD */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 md:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase">
                  <MessageSquare size={14} className="text-orange-400" />
                  <span>Legenda Completa para o Instagram</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedCaption
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {copiedCaption ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}</span>
                </button>
              </div>

              <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans max-h-48 overflow-y-auto">
                {generatedCarousel.caption}
                {'\n\n'}
                <span className="text-purple-400 font-medium">
                  {generatedCarousel.hashtags.join(' ')}
                </span>
              </div>
            </div>

            {/* FINAL ACTION BAR: APPLY TO CREATIVE */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGeneratedCarousel(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Gerar Novas Variações</span>
              </button>

              {onApplyToCreative && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display font-bold text-sm bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white shadow-xl shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Criar Criativo com este Roteiro</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

          </div>
        )}

      </motion.div>
    </div>
  );
}
