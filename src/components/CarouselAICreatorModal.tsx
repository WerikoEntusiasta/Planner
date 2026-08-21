import React, { useState, useRef } from 'react';
import { X, Sparkles, Layout, Download, Copy, Check, Sliders, Smartphone, Monitor, Layers, ArrowRight, ArrowLeft, RefreshCw, Code, Eye, Palette } from 'lucide-react';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { Post, Platform, ContentFormat } from '../types';
import AIQuotaBadge from './AIQuotaBadge';
import AILimitModal from './AILimitModal';
import { checkAIQuota, consumeAIQuota, AIQuotaStatus } from '../services/aiUsageService';
import { copyToClipboard } from '../utils/clipboard';

interface CarouselAICreatorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCreatePost?: (postData: Partial<Post>) => void;
  isPageView?: boolean;
  userPlan?: string;
  isTeamMember?: boolean;
  userId?: string;
  onOpenPricing?: () => void;
}

interface SlideItem {
  slideNumber: number;
  title: string;
  subtitle: string;
  codeSnippet: string;
  bgGradient: string;
  accentColor: string;
}

const DEFAULT_PALETTE = [
  '#a855f7', // Roxo principal
  '#f97316', // Laranja vibrante
  '#2563eb', // Azul royal
  '#10b981', // Verde esmeralda
  '#ec4899', // Pink magenta
  '#eab308', // Amarelo dourado
  '#06b6d4', // Ciano
  '#8b5cf6', // Roxo escuro
  '#f43f5e', // Vermelho rosado
  '#ffffff'  // Branco puro
];

const hexToRgb = (hex: string) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Number(x) || 0)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

export default function CarouselAICreatorModal({
  isOpen,
  onClose,
  onCreatePost,
  isPageView,
  userPlan = 'free',
  isTeamMember = false,
  userId,
  onOpenPricing
}: CarouselAICreatorModalProps) {
  const [format, setFormat] = useState<'1080x1350' | '1080x1920' | '1080x1080' | '1920x1080'>('1080x1350');
  const [topic, setTopic] = useState('');
  const [detailedPrompt, setDetailedPrompt] = useState('');
  const [goal, setGoal] = useState('Atrair seguidores e gerar engajamento');
  const [brandName, setBrandName] = useState('@suamarca');
  const [slideCount, setSlideCount] = useState<number>(4);
  const [themeStyle, setThemeStyle] = useState<'dark-neon' | 'minimal-clean' | 'sunset-vibrant' | 'emerald-luxury' | 'cyberpunk' | 'custom'>('dark-neon');
  const [customThemePrompt, setCustomThemePrompt] = useState('Estilo sofisticado com tipografia moderna, fundo escuro e detalhes marcantes');
  
  // AI Limit & Quota state
  const [quotaStatus, setQuotaStatus] = useState<AIQuotaStatus | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Content Mode: AI or Manual
  const [contentMode, setContentMode] = useState<'ai' | 'manual'>('ai');
  const [manualSlides, setManualSlides] = useState<{ title: string; subtitle: string }[]>([
    { title: 'Título do Slide 1', subtitle: 'Subtítulo ou texto explicativo do slide 1.' },
    { title: 'Título do Slide 2', subtitle: 'Subtítulo ou texto explicativo do slide 2.' },
    { title: 'Título do Slide 3', subtitle: 'Subtítulo ou texto explicativo do slide 3.' },
    { title: 'Título do Slide 4', subtitle: 'Subtítulo ou texto explicativo do slide 4.' }
  ]);
  
  // Custom color palette state (up to 10 colors)
  const [paletteColors, setPaletteColors] = useState<string[]>(DEFAULT_PALETTE);
  const [selectedAccentColor, setSelectedAccentColor] = useState<string>('#a855f7');
  const [colorInputMode, setColorInputMode] = useState<'hex' | 'rgb'>('hex');

  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [savedToGrid, setSavedToGrid] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  if (!isPageView && !isOpen) return null;

  const handleUpdateColor = (index: number, val: string) => {
    const updated = [...paletteColors];
    updated[index] = val;
    setPaletteColors(updated);
    setSelectedAccentColor(val);
  };

  const handleUpdateColorRgb = (index: number, channel: 'r' | 'g' | 'b', valStr: string) => {
    const num = parseInt(valStr, 10) || 0;
    const currentHex = paletteColors[index] || '#000000';
    const rgb = hexToRgb(currentHex);
    rgb[channel] = Math.max(0, Math.min(255, num));
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    handleUpdateColor(index, newHex);
  };

  const handleAddColor = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
    const updated = [...paletteColors, randomColor];
    setPaletteColors(updated);
    setSelectedAccentColor(randomColor);
  };

  const handleRemoveColor = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (paletteColors.length <= 1) return;
    const updated = paletteColors.filter((_, i) => i !== index);
    setPaletteColors(updated);
    if (!updated.includes(selectedAccentColor)) {
      setSelectedAccentColor(updated[0]);
    }
  };

  const handleUpdateManualSlideCount = (count: number) => {
    setSlideCount(count);
    const updated = [...manualSlides];
    if (count > updated.length) {
      for (let i = updated.length; i < count; i++) {
        updated.push({ title: `Título do Slide ${i + 1}`, subtitle: `Texto descritivo do slide ${i + 1}.` });
      }
    } else {
      updated.length = count;
    }
    setManualSlides(updated);
  };

  const handleUpdateManualSlideText = (index: number, field: 'title' | 'subtitle', val: string) => {
    const updated = [...manualSlides];
    updated[index][field] = val;
    setManualSlides(updated);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (contentMode === 'ai') {
      if (!topic.trim()) return;

      // Validate AI quota and plan
      const quotaCheck = checkAIQuota(userPlan, isTeamMember, userId);
      if (!quotaCheck.allowed) {
        setQuotaStatus(quotaCheck);
        setIsLimitModalOpen(true);
        return;
      }

      // Consume 1 AI request from quota
      const consumeResult = consumeAIQuota(userPlan, isTeamMember, userId, 1);
      if (!consumeResult.success) {
        setQuotaStatus(consumeResult.status);
        setIsLimitModalOpen(true);
        return;
      }
    }

    setIsGenerating(true);
    setSavedToGrid(false);

    setTimeout(() => {
      const generated: SlideItem[] = [];
      const total = contentMode === 'manual' ? manualSlides.length : slideCount;

      let bgG = 'from-zinc-950 via-purple-950/40 to-zinc-950';
      const accent = selectedAccentColor;
      const customLower = customThemePrompt.toLowerCase();

      if (themeStyle === 'minimal-clean') {
        bgG = 'from-zinc-50 via-white to-zinc-100';
      } else if (themeStyle === 'sunset-vibrant') {
        bgG = 'from-zinc-950 via-orange-950/50 to-zinc-950';
      } else if (themeStyle === 'emerald-luxury') {
        bgG = 'from-zinc-950 via-emerald-950/40 to-zinc-950';
      } else if (themeStyle === 'cyberpunk') {
        bgG = 'from-zinc-950 via-pink-950/50 to-zinc-950';
      } else if (themeStyle === 'custom') {
        if (customLower.includes('branco') || customLower.includes('claro') || customLower.includes('white') || customLower.includes('light') || customLower.includes('gelo')) {
          bgG = 'from-zinc-100 via-white to-slate-100';
        } else if (customLower.includes('azul') || customLower.includes('blue')) {
          bgG = 'from-zinc-950 via-blue-950/50 to-zinc-950';
        } else if (customLower.includes('verde') || customLower.includes('green') || customLower.includes('emerald')) {
          bgG = 'from-zinc-950 via-emerald-950/50 to-zinc-950';
        } else {
          bgG = 'from-zinc-950 via-zinc-900 to-zinc-950';
        }
      } else {
        bgG = 'from-zinc-950 via-zinc-900 to-zinc-950';
      }

      for (let i = 0; i < total; i++) {
        let slideTitle = '';
        let slideSub = '';

        if (contentMode === 'manual') {
          slideTitle = manualSlides[i]?.title || `Slide ${i + 1}`;
          slideSub = manualSlides[i]?.subtitle || '';
        } else {
          const detail = detailedPrompt.trim();
          if (i === 0) {
            slideTitle = `O Guia Definitivo de ${topic || 'Tema'}`;
            slideSub = detail ? `Foco: ${detail.slice(0, 100)}... Deslize para ver os pontos principais 👇` : `Descubra o método definitivo usado por especialistas para dominar ${topic || 'este tema'} em 2026. Deslize para ver 👇`;
          } else if (i === total - 1) {
            slideTitle = `Pronto para Transformar seus Resultados?`;
            slideSub = `Comente "EU QUERO" abaixo ou clique no link da bio para começar hoje mesmo em ${topic || 'ação'}! 🚀`;
          } else {
            slideTitle = `Passo ${i}: ${detail ? `Estratégia para ${topic || 'Sucesso'}` : 'Estratégia Prática'}`;
            slideSub = detail && i === 1 ? detail : `Como aplicar o conceito ${i} de forma simples e direta no seu dia a dia com ${topic || 'prática'}.`;
          }
        }

        const effectiveTopic = contentMode === 'manual' ? (topic.trim() || 'Carrossel') : (topic || 'Conteúdo');

        let cardBg = 'linear-gradient(135deg, #09090b 0%, #18181b 100%)';
        let textColor = '#ffffff';
        let subColor = '#d4d4d8';
        let titleGradient = 'linear-gradient(to right, #ffffff, #a1a1aa)';
        let cardBorder = `2px solid ${accent}40`;
        let footerBorder = '#27272a';
        let footerColor = '#71717a';

        if (themeStyle === 'minimal-clean') {
          bgG = 'from-zinc-50 via-white to-zinc-100';
          cardBg = 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)';
          textColor = '#0f172a';
          subColor = '#475569';
          titleGradient = 'none';
          cardBorder = '2px solid #e2e8f0';
          footerBorder = '#e2e8f0';
          footerColor = '#64748b';
        } else if (themeStyle === 'sunset-vibrant') {
          bgG = 'from-zinc-950 via-orange-950/50 to-zinc-950';
          cardBg = 'linear-gradient(135deg, #1c0a03 0%, #3d1203 100%)';
          textColor = '#ffffff';
          subColor = '#fed7aa';
          titleGradient = 'linear-gradient(to right, #ffffff, #fdba74)';
          cardBorder = `2px solid #f9731660`;
          footerBorder = '#431407';
          footerColor = '#fdba74';
        } else if (themeStyle === 'emerald-luxury') {
          bgG = 'from-zinc-950 via-emerald-950/40 to-zinc-950';
          cardBg = 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)';
          textColor = '#ffffff';
          subColor = '#a7f3d0';
          titleGradient = 'linear-gradient(to right, #ffffff, #6ee7b7)';
          cardBorder = `2px solid #10b98160`;
          footerBorder = '#065f46';
          footerColor = '#6ee7b7';
        } else if (themeStyle === 'cyberpunk') {
          bgG = 'from-zinc-950 via-pink-950/50 to-zinc-950';
          cardBg = 'linear-gradient(135deg, #180218 0%, #3b0764 100%)';
          textColor = '#ffffff';
          subColor = '#fbcfe8';
          titleGradient = 'linear-gradient(to right, #ffffff, #f472b6)';
          cardBorder = `2px solid #ec489960`;
          footerBorder = '#581c87';
          footerColor = '#f472b6';
        } else if (themeStyle === 'custom') {
          if (customLower.includes('branco') || customLower.includes('claro') || customLower.includes('white') || customLower.includes('light') || customLower.includes('gelo')) {
            cardBg = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
            textColor = '#0f172a';
            subColor = '#475569';
            titleGradient = 'none';
            cardBorder = `2px solid ${accent}`;
            footerBorder = '#e2e8f0';
            footerColor = '#64748b';
          } else if (customLower.includes('azul') || customLower.includes('blue')) {
            cardBg = 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)';
            textColor = '#ffffff';
            subColor = '#bfdbfe';
            titleGradient = `linear-gradient(to right, #ffffff, ${accent})`;
            cardBorder = `2px solid ${accent}`;
            footerBorder = '#1e40af';
            footerColor = '#93c5fd';
          } else if (customLower.includes('verde') || customLower.includes('green') || customLower.includes('emerald')) {
            cardBg = 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)';
            textColor = '#ffffff';
            subColor = '#a7f3d0';
            titleGradient = `linear-gradient(to right, #ffffff, ${accent})`;
            cardBorder = `2px solid ${accent}`;
            footerBorder = '#065f46';
            footerColor = '#6ee7b7';
          } else {
            cardBg = 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)';
            textColor = '#ffffff';
            subColor = '#e2e8f0';
            titleGradient = `linear-gradient(to right, #ffffff, ${accent})`;
            cardBorder = `2px solid ${accent}`;
            footerBorder = '#312e81';
            footerColor = '#cbd5e1';
          }
        } else {
          bgG = 'from-zinc-950 via-zinc-900 to-zinc-950';
          cardBg = 'linear-gradient(135deg, #09090b 0%, #18181b 100%)';
        }

        const htmlCode = `<!DOCTYPE html>
<html>
<head>
<style>
  .carousel-card {
    width: 100%;
    height: 100%;
    background: ${cardBg};
    color: ${textColor};
    font-family: 'Inter', sans-serif;
    padding: 60px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    border: ${cardBorder};
    border-radius: 24px;
    position: relative;
    overflow: hidden;
  }
  .badge {
    background: ${accent}25;
    color: ${accent};
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: bold;
    width: fit-content;
    border: 1px solid ${accent}50;
  }
  .title {
    font-size: 44px;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 20px;
    ${themeStyle === 'minimal-clean' ? `color: ${textColor};` : `background: ${titleGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;`}
  }
  .subtitle {
    font-size: 22px;
    color: ${subColor};
    line-height: 1.5;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid ${footerBorder};
    padding-top: 24px;
    font-size: 14px;
    color: ${footerColor};
  }
</style>
</head>
<body>
  <div class="carousel-card">
    <div>
      <div class="badge">Slide ${i + 1} de ${total} • ${effectiveTopic}</div>
    </div>
    <div>
      <h1 class="title">${slideTitle}</h1>
      <p class="subtitle">${slideSub}</p>
    </div>
    <div class="footer">
      <span>${brandName || '@suamarca'}</span>
      <span>Arraste para o lado 👉</span>
    </div>
  </div>
</body>
</html>`;

        generated.push({
          slideNumber: i + 1,
          title: slideTitle,
          subtitle: slideSub,
          codeSnippet: htmlCode,
          bgGradient: bgG,
          accentColor: accent
        });
      }

      setSlides(generated);
      setCurrentSlideIndex(0);
      setIsGenerating(false);
    }, 800);
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadSlide = async () => {
    if (!previewRef.current || !currentSlide) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `slide-${currentSlide.slideNumber}-${topic.replace(/\s+/g, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (slides.length === 0) return;
    try {
      setIsDownloading(true);
      const zip = new JSZip();
      const folderName = `carrossel-${topic.replace(/\s+/g, '_').toLowerCase() || 'post'}`;
      const folder = zip.folder(folderName);

      const originalIndex = currentSlideIndex;
      const originalView = viewMode;
      setViewMode('preview');

      for (let i = 0; i < slides.length; i++) {
        setCurrentSlideIndex(i);
        await new Promise(resolve => setTimeout(resolve, 250));
        if (previewRef.current) {
          const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: null });
          const dataUri = canvas.toDataURL('image/png');
          const base64Data = dataUri.replace(/^data:image\/png;base64,/, '');
          folder?.file(`slide-${i + 1}.png`, base64Data, { base64: true });
        }
      }

      setCurrentSlideIndex(originalIndex);
      setViewMode(originalView);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToPlanner = () => {
    if (!onCreatePost || slides.length === 0) return;
    setSavedToGrid(true);
    const combinedScript = slides.map(s => `[Slide ${s.slideNumber}] ${s.title}\n${s.subtitle}`).join('\n\n');
    onCreatePost({
      title: `Carrossel IA: ${topic}`,
      description: combinedScript,
      platform: 'instagram',
      format: 'carousel',
      funnelStage: 'MOFU',
      status: 'draft',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '18:00',
      hashtags: [topic.replace(/\s+/g, ''), 'Carrossel', 'MarketingDigital', 'Conteudo']
    });
  };

  // Dimensions mapping for preview box
  let aspectClass = 'aspect-[4/5] max-w-md';
  let dimensionLabel = '1080x1350 (Retrato 4:5)';
  if (format === '1080x1920') {
    aspectClass = 'aspect-[9/16] max-w-xs';
    dimensionLabel = '1080x1920 (Story / Reels Vertical)';
  } else if (format === '1080x1080') {
    aspectClass = 'aspect-square max-w-md';
    dimensionLabel = '1080x1080 (Quadrado 1:1)';
  } else if (format === '1920x1080') {
    aspectClass = 'aspect-video max-w-xl';
    dimensionLabel = '1920x1080 (Horizontal / YouTube)';
  }

  const currentSlide = slides[currentSlideIndex];

  const content = (
    <div className={`relative w-full ${isPageView ? 'h-full' : 'max-w-6xl max-h-[95vh] h-[90vh]'} bg-panel-card border border-panel-border rounded-3xl shadow-2xl flex flex-col overflow-hidden`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border bg-panel-black gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-display font-bold text-white">
                  Criação de Carrossel & Posts com IA
                </h3>
                <AIQuotaBadge
                  userPlan={userPlan}
                  isTeamMember={isTeamMember}
                  userId={userId}
                  onOpenUpgrade={onOpenPricing}
                />
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Gere carrosséis visuais profissionais prontos para publicação nos formatos ideais
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* LEFT: FORM CONTROLS (5 cols) */}
          <div className="lg:col-span-5 p-6 border-r border-panel-border bg-zinc-950/50 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              
              <div>
                <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  1. Formato de Saída:
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-accent-purple"
                >
                  <option value="1080x1350">1080x1350 (Retrato Instagram 4:5)</option>
                  <option value="1080x1920">1080x1920 (Story / Reels Vertical)</option>
                  <option value="1080x1080">1080x1080 (Quadrado 1:1)</option>
                  <option value="1920x1080">1920x1080 (Horizontal / YouTube)</option>
                </select>
                <span className="block text-[10px] font-mono text-zinc-500 mt-1">
                  Renderizador configurado para proporção: {dimensionLabel}
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  2. Nicho, Produto ou Tema do Carrossel:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Inteligência Artificial nos Negócios, Dieta Cetogênica..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple font-sans"
                  required
                />
              </div>

              {/* CONTENT MODE TOGGLE: AI vs MANUAL */}
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-panel-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-accent-purple" />
                    Modo de Conteúdo:
                  </label>
                  <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-panel-border">
                    <button
                      type="button"
                      onClick={() => setContentMode('ai')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        contentMode === 'ai' ? 'bg-accent-purple text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Gerar com IA
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode('manual')}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        contentMode === 'manual' ? 'bg-accent-purple text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Digitar Manual
                    </button>
                  </div>
                </div>

                {contentMode === 'ai' ? (
                  <div>
                    <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                      Descrição Detalhada / Instruções para a IA (Opcional):
                    </label>
                    <textarea
                      placeholder="Descreva pontos específicos que deseja abordar, tom de voz, público-alvo ou exemplos para a IA estruturar o carrossel..."
                      value={detailedPrompt}
                      onChange={(e) => setDetailedPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent-purple font-sans resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">Personalize os títulos e textos de cada slide:</span>
                      <select
                        value={manualSlides.length}
                        onChange={(e) => handleUpdateManualSlideCount(Number(e.target.value))}
                        className="bg-zinc-950 border border-panel-border rounded-lg px-2 py-1 text-[11px] text-zinc-200 font-mono"
                      >
                        <option value={3}>3 Slides</option>
                        <option value={4}>4 Slides</option>
                        <option value={5}>5 Slides</option>
                        <option value={6}>6 Slides</option>
                      </select>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {manualSlides.map((s, idx) => (
                        <div key={idx} className="bg-zinc-950 p-2.5 rounded-xl border border-panel-border space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-accent-purple font-bold">
                            <span>Slide {idx + 1}</span>
                          </div>
                          <input
                            type="text"
                            placeholder={`Título do Slide ${idx + 1}`}
                            value={s.title}
                            onChange={(e) => handleUpdateManualSlideText(idx, 'title', e.target.value)}
                            className="w-full bg-zinc-900 border border-panel-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent-purple font-sans font-semibold"
                          />
                          <textarea
                            placeholder={`Subtítulo / Texto do Slide ${idx + 1}`}
                            value={s.subtitle}
                            onChange={(e) => handleUpdateManualSlideText(idx, 'subtitle', e.target.value)}
                            rows={2}
                            className="w-full bg-zinc-900 border border-panel-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent-purple font-sans resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  Sua Marca / @Handle (Rodapé):
                </label>
                <input
                  type="text"
                  placeholder="Ex: @suamarca ou suaempresa.com"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                    3. Quantidade de Slides:
                  </label>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-accent-purple"
                  >
                    <option value={3}>3 Slides (Rápido)</option>
                    <option value={4}>4 Slides (Padrão)</option>
                    <option value={5}>5 Slides (Ideal)</option>
                    <option value={6}>6 Slides (Completo)</option>
                    <option value={8}>8 Slides (Aprofundado)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                    4. Estilo Visual (5 Opções + Customizado):
                  </label>
                  <select
                    value={themeStyle}
                    onChange={(e) => setThemeStyle(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-accent-purple"
                  >
                    <option value="dark-neon">1. Dark Neon & Roxo (Elegante & Tecnológico)</option>
                    <option value="minimal-clean">2. Minimalista Clean (Fundo Claro & Tipografia Limpa)</option>
                    <option value="sunset-vibrant">3. Sunset Laranja (Vibrante & Chamativo)</option>
                    <option value="emerald-luxury">4. Emerald Luxo (Sóbrio & Sofisticado)</option>
                    <option value="cyberpunk">5. Cyberpunk Neon (Futurista & Contrastante)</option>
                    <option value="custom">6. Personalizado (Digitar estilo manual)</option>
                  </select>

                  {themeStyle === 'custom' && (
                    <div className="pt-1 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Descreva seu estilo visual personalizado (ex: Estilo corporativo azul marinho com linhas douradas)..."
                        value={customThemePrompt}
                        onChange={(e) => setCustomThemePrompt(e.target.value)}
                        className="w-full bg-zinc-950 border border-accent-purple rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-sans focus:outline-none shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* COLOR PALETTE SELECTOR (UP TO 10 COLORS WITH HEX & RGB OPTIONS) */}
              <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-panel-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Palette size={13} className="text-accent-purple" />
                    Seletor de Cores (HEX & RGB):
                  </label>
                  <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-panel-border">
                    <button
                      type="button"
                      onClick={() => setColorInputMode('hex')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        colorInputMode === 'hex' ? 'bg-accent-purple text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      HEX
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorInputMode('rgb')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        colorInputMode === 'rgb' ? 'bg-accent-purple text-white shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      RGB
                    </button>
                  </div>
                </div>

                {/* Swatches grid (unlimited colors + add button) */}
                <div className="grid grid-cols-2 gap-2">
                  {paletteColors.map((colorHex, idx) => {
                    const rgb = hexToRgb(colorHex);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedAccentColor(colorHex)}
                        className={`relative group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          selectedAccentColor === colorHex 
                            ? 'border-accent-purple bg-accent-purple/20 shadow-md ring-1 ring-accent-purple' 
                            : 'border-panel-border bg-zinc-950 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                          {/* Color swatch square with native color picker circle */}
                          <div 
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner flex-shrink-0 relative overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: colorHex }}
                            title="Clique para abrir o círculo RGB/Seletor"
                          >
                            <input
                              type="color"
                              value={colorHex}
                              onChange={(e) => handleUpdateColor(idx, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="w-2 h-2 rounded-full border border-white/80 shadow" />
                          </div>

                          {/* Inputs based on mode */}
                          {colorInputMode === 'hex' ? (
                            <input
                              type="text"
                              value={colorHex}
                              onChange={(e) => handleUpdateColor(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none uppercase font-bold"
                            />
                          ) : (
                            <div className="flex items-center gap-1 w-full text-[10px] font-mono text-zinc-300" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5 bg-zinc-900 px-1 py-0.5 rounded border border-panel-border">
                                <span className="text-red-400 text-[9px]">R</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={rgb.r}
                                  onChange={(e) => handleUpdateColorRgb(idx, 'r', e.target.value)}
                                  className="w-7 bg-transparent text-white text-center focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-0.5 bg-zinc-900 px-1 py-0.5 rounded border border-panel-border">
                                <span className="text-emerald-400 text-[9px]">G</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={rgb.g}
                                  onChange={(e) => handleUpdateColorRgb(idx, 'g', e.target.value)}
                                  className="w-7 bg-transparent text-white text-center focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-0.5 bg-zinc-900 px-1 py-0.5 rounded border border-panel-border">
                                <span className="text-blue-400 text-[9px]">B</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={255}
                                  value={rgb.b}
                                  onChange={(e) => handleUpdateColorRgb(idx, 'b', e.target.value)}
                                  className="w-7 bg-transparent text-white text-center focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {paletteColors.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveColor(idx, e)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition-colors ml-1"
                            title="Remover cor"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddColor}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-panel-border rounded-xl text-xs font-mono text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Palette size={13} className="text-accent-purple" />
                  + Adicionar Cor ao Branding
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-semibold text-zinc-400 mb-1.5">
                  5. Objetivo do Conteúdo:
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!topic.trim() || isGenerating}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-600 hover:to-accent-purple text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 border border-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-purple-200" />
                    Gerando Carrossel com HTML/CSS & IA...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-yellow-300 fill-yellow-300" />
                    Gerar Carrossel / Post Completo
                  </>
                )}
              </button>
            </form>

            {slides.length > 0 && (
              <div className="pt-4 border-t border-panel-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-300">Ações de Exportação:</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Pronto</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSaveToPlanner}
                    disabled={savedToGrid}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      savedToGrid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-accent-orange text-black hover:bg-orange-400'
                    }`}
                  >
                    {savedToGrid ? <Check size={14} /> : <Layout size={14} />}
                    {savedToGrid ? 'Salvo no Grid!' : 'Enviar ao Planner'}
                  </button>

                  <button
                    onClick={handleDownloadSlide}
                    className="py-2 px-3 rounded-xl bg-accent-purple hover:bg-purple-600 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download size={14} /> Baixar Arte Atual
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadAll}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} className="text-accent-purple" /> Baixar Carrossel (ZIP)
                  </button>

                  <button
                    onClick={() => currentSlide && handleCopyCode(currentSlide.codeSnippet)}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar Código'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: RENDERED PREVIEW & CODE INSPECTOR (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col items-center justify-between bg-zinc-900/30 relative">
            
            {slides.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-panel-border flex items-center justify-center text-zinc-500 shadow-xl">
                  <Layers size={32} />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">Nenhum carrossel gerado ainda</h4>
                <p className="text-xs text-zinc-500 max-w-sm font-mono">
                  Preencha o tema ao lado, escolha entre os estilos visuais e a paleta de cores para gerar seu carrossel com renderizador HTML/CSS.
                </p>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center justify-between space-y-4">
                
                {/* TOP TOOLBAR FOR PREVIEW (WITHOUT PROMINENT CODE TOGGLE) */}
                <div className="w-full flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-panel-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5 px-2">
                      <Eye size={14} className="text-accent-purple" /> Pré-visualização do Carrossel
                    </span>
                  </div>

                  {/* SLIDE NAVIGATOR */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer border border-panel-border"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Slide {currentSlideIndex + 1} de {slides.length}
                    </span>
                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === slides.length - 1}
                      className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer border border-panel-border"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* VIEW CONTAINER */}
                <div className="flex-1 w-full flex items-center justify-center p-2 relative">
                  {viewMode === 'preview' ? (
                    <div ref={previewRef} className={`w-full ${aspectClass} rounded-2xl shadow-2xl overflow-hidden border-2 border-zinc-700 relative flex flex-col justify-between p-8 bg-gradient-to-br ${currentSlide.bgGradient} transition-all`}>
                      
                      {/* Badge */}
                      <div className="flex items-center justify-between">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border"
                          style={{ backgroundColor: `${currentSlide.accentColor}25`, color: currentSlide.accentColor, borderColor: `${currentSlide.accentColor}50` }}
                        >
                          Slide {currentSlide.slideNumber} • {topic}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">{format}</span>
                      </div>

                      {/* Center content */}
                      <div className="space-y-3 my-auto">
                        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                          {currentSlide.title}
                        </h2>
                        <p className="text-sm lg:text-base text-zinc-300 leading-relaxed font-sans">
                          {currentSlide.subtitle}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                        <span>{brandName || '@suamarca'}</span>
                        <span className="flex items-center gap-1 font-bold text-white">
                          Arraste para o lado <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full max-h-[380px] bg-zinc-950 border border-panel-border rounded-xl p-4 overflow-auto font-mono text-xs text-emerald-400">
                      <pre>{currentSlide.codeSnippet}</pre>
                    </div>
                  )}

                  {/* DISCREET CODE / PREVIEW TOGGLE IN BOTTOM RIGHT CORNER OF PREVIEW AREA */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <button
                      onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
                      title="Alternar para ver código HTML/CSS"
                    >
                      {viewMode === 'preview' ? (
                        <>
                          <Code size={12} className="text-accent-purple" /> Ver Código HTML
                        </>
                      ) : (
                        <>
                          <Eye size={12} className="text-accent-purple" /> Ver Pré-visualização
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* THUMBNAILS BAR */}
                <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                  {slides.map((s, idx) => (
                    <button
                      key={s.slideNumber}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`flex-shrink-0 w-16 h-20 rounded-xl border-2 p-2 flex flex-col justify-between text-left transition-all cursor-pointer ${
                        currentSlideIndex === idx
                          ? 'border-accent-purple bg-accent-purple/20 scale-105 shadow-md'
                          : 'border-panel-border bg-zinc-950 hover:border-zinc-700 opacity-70'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-zinc-400">#{s.slideNumber}</span>
                      <span className="text-[9px] font-bold text-white truncate">{s.title}</span>
                    </button>
                  ))}
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
  );

  return (
    <>
      {isPageView ? (
        <div className="w-full h-full pb-10">{content}</div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          {content}
        </div>
      )}

      <AILimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        quotaStatus={quotaStatus}
        onOpenPricing={() => {
          setIsLimitModalOpen(false);
          if (onOpenPricing) onOpenPricing();
        }}
      />
    </>
  );
}
