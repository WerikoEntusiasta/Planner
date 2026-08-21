/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Platform, ContentFormat, FunnelStage, PostStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat, getTranslatedStage, getTranslatedStatus } from '../utils/postTranslations';
import { X, Sparkles, AlertCircle, CheckCircle, Calendar, Clock, Hash, FileText, Layers, Video } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface PostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  onDelete?: (id: string) => void;
  postToEdit?: Post | null;
  initialDate?: string; // Pre-fills date if created via calendar click
}

export default function PostDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  postToEdit,
  initialDate
}: PostDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [format, setFormat] = useState<ContentFormat>('reels');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOFU');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [hashtagsRaw, setHashtagsRaw] = useState('');
  const [hookText, setHookText] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [visualIdea, setVisualIdea] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [coverThumbnail, setCoverThumbnail] = useState('');

  // Auto-adjust default format based on chosen platform to assist rapid entry
  useEffect(() => {
    if (!postToEdit) {
      if (platform === 'youtube') setFormat('video');
      else if (platform === 'tiktok') setFormat('shorts');
      else setFormat('reels');
    }
  }, [platform, postToEdit]);

  // Sync edits or defaults
  useEffect(() => {
    if (postToEdit) {
      const translated = getTranslatedPost(postToEdit, t);
      setTitle(translated.title);
      setPlatform(translated.platform);
      setFormat(translated.format);
      setFunnelStage(translated.funnelStage);
      setStatus(translated.status);
      setScheduledDate(translated.scheduledDate);
      setScheduledTime(translated.scheduledTime || '12:00');
      setDescription(translated.description || '');
      setHashtagsRaw(translated.hashtags ? translated.hashtags.join(', ') : '');
      setHookText(translated.hookText || '');
      setScriptText(translated.scriptText || '');
      setCtaText(translated.ctaText || '');
      setVisualIdea(translated.visualIdea || '');
      setCoverThumbnail(translated.coverThumbnail || '');
    } else {
      // Reset to healthy blank/creation state
      setTitle('');
      setPlatform('instagram');
      setFormat('reels');
      setFunnelStage('TOFU');
      setStatus('draft');
      setScheduledDate(initialDate || new Date().toISOString().split('T')[0]);
      setScheduledTime('18:00');
      setDescription('');
      setHashtagsRaw('');
      setHookText('');
      setScriptText('');
      setCtaText('');
      setVisualIdea('');
      setCoverThumbnail('');
    }
  }, [postToEdit, isOpen, initialDate]);

  if (!isOpen) return null;

  const handleImproveIdeaAI = () => {
    const topic = title.trim() || 'estratégia';
    const improved = [
      `7 erros de ${topic} que fazem empresas perder clientes todos os meses`,
      `O método definitivo para destravar ${topic} em 5 passos práticos`,
      `Por que o modelo tradicional de ${topic} falha (e como fazer do jeito certo)`
    ];
    setTitle(improved[Math.floor(Math.random() * improved.length)]);
  };

  const handleGenerateHookAI = () => {
    const topicStr = title.trim() || 'estratégia de crescimento';
    const hooksByFunnel = {
      TOFU: [
        `Você está cometendo esses 3 erros críticos com ${topicStr} e nem percebeu ainda.`,
        `O maior mito sobre ${topicStr} que todo mundo repete, mas que está te fazendo perder tempo.`,
        `Por que 90% das pessoas falham ao tentar ${topicStr} pela primeira vez?`
      ],
      MOFU: [
        `A diferença exata entre quem tem resultados com ${topicStr} e quem continua estagnado.`,
        `O método passo a passo que utilizamos para destravar ${topicStr} em poucos dias.`,
        `Como analisar ${topicStr} da forma correta antes de tomar qualquer decisão.`
      ],
      BOFU: [
        `Se você quer resolver ${topicStr} de vez e sem testes frustrantes, preste muita atenção nisso.`,
        `O que falta para você implementar ${topicStr} com segurança ainda esta semana?`,
        `Pare de adiar: veja como garantir resultados reais com ${topicStr} agora.`
      ]
    };
    const pool = hooksByFunnel[funnelStage] || hooksByFunnel.TOFU;
    setHookText(pool[Math.floor(Math.random() * pool.length)]);
  };

  const handleGenerateDevAI = () => {
    const topicStr = title.trim() || 'esse tema';
    if (platform === 'instagram' && format === 'carousel') {
      setScriptText(`Slide 1: O problema real que ninguém fala sobre ${topicStr}.\nSlide 2: Por que as soluções tradicionais não funcionam mais.\nSlide 3: O princípio fundamental que muda tudo.\nSlide 4: Passo prático para aplicar hoje mesmo.\nSlide 5: Resumo e direcionamento.`);
    } else if (platform === 'tiktok') {
      setScriptText(`1. Contexto imediato: direto ao ponto, sem enrolação.\n2. A virada de chave: revele o segredo ou o contraste.\n3. Aplicação rápida: mostre como o espectador pode testar isso agora.`);
    } else {
      setScriptText(`1. Diagnóstico: Identifique o obstáculo central em relação a ${topicStr}.\n2. Fundamentação: Explique o conceito ou método com clareza e autoridade.\n3. Execução: Apresente o plano de ação prático e os critérios de sucesso.`);
    }
  };

  const handleGenerateCtaAI = () => {
    const ctasByFunnel = {
      TOFU: `Salve este conteúdo para consultar depois e envie para alguém que precisa saber disso.`,
      MOFU: `Qual desses pontos faz mais sentido para o seu momento atual? Comente aqui embaixo.`,
      BOFU: `Clique no link da bio ou envie uma mensagem para dar o próximo passo.`
    };
    setCtaText(ctasByFunnel[funnelStage] || ctasByFunnel.TOFU);
  };

  const handleGenerateCompleteScriptAI = () => {
    handleGenerateHookAI();
    handleGenerateDevAI();
    handleGenerateCtaAI();
    if (!visualIdea) {
      setVisualIdea(platform === 'instagram' ? 'Especialista em plano médio, gráficos dinâmicos na tela destacando os pontos principais.' : 'Câmera dinâmica, cortes secos, ritmo ágil mantendo a atenção visual.');
    }
    if (!coverThumbnail) {
      setCoverThumbnail(`Texto forte em destaque: "O segredo de ${title || 'sucesso'}" com contraste elevado.`);
    }
  };

  const handleGenerateLegendAI = () => {
    setDescription(`Dominar ${title || 'essa estratégia'} é o divisor de águas para quem busca consistência e resultados reais.\n\nMuitos ignoram os fundamentos, mas são eles que sustentam o crescimento a longo prazo.\n\n👇 Qual a sua maior dificuldade nesse ponto hoje? Deixe nos comentários.`);
  };

  const handleGenerateHashtagsAI = () => {
    const tags = ['estrategia', 'crescimento', 'marketing', 'negocios', platform, format];
    setHashtagsRaw(tags.join(', '));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedHashtags = hashtagsRaw
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter((tag) => tag.length > 0);

    const postData: Post = {
      id: postToEdit ? postToEdit.id : `post_${Date.now()}`,
      clientId: postToEdit ? postToEdit.clientId : '',
      title: title.trim(),
      platform,
      format,
      funnelStage,
      status,
      scheduledDate,
      scheduledTime,
      description: description.trim(),
      hashtags: parsedHashtags,
      hookText: hookText.trim(),
      scriptText: scriptText.trim(),
      ctaText: ctaText.trim(),
      visualIdea: visualIdea.trim(),
      coverThumbnail: coverThumbnail.trim(),
      approvalStatus: postToEdit ? postToEdit.approvalStatus : undefined,
      approvalFeedback: postToEdit ? postToEdit.approvalFeedback : undefined,
      approvalDate: postToEdit ? postToEdit.approvalDate : undefined,
    };

    onSave(postData);
    onClose();
  };

  // Dynamically calculate platform aura classes
  const getPlatformColors = () => {
    switch (platform) {
      case 'instagram':
        return {
          border: 'border-accent-purple/50 focus-within:border-accent-purple',
          glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
          badge: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
          btn: 'bg-accent-purple hover:bg-accent-purple-dark text-white'
        };
      case 'youtube':
        return {
          border: 'border-accent-orange/50 focus-within:border-accent-orange',
          glow: 'shadow-[0_0_15px_rgba(255,107,0,0.15)]',
          badge: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
          btn: 'bg-accent-orange hover:bg-accent-orange-dark text-white'
        };
      case 'tiktok':
        return {
          border: 'border-zinc-500 focus-within:border-white',
          glow: 'shadow-[0_0_15px_rgba(255,255,255,0.07)]',
          badge: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          btn: 'bg-white hover:bg-zinc-200 text-black'
        };
    }
  };

  const colors = getPlatformColors();

  return (
    <div id="dialog-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="dialog-container"
        className={`w-full max-w-3xl bg-panel-card border border-panel-border rounded-2xl overflow-hidden transition-all duration-300 ${colors.glow} ${colors.border}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-panel-border bg-panel-card">
          <div>
            <span className={`inline-block text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border mb-1.5 ${colors.badge}`}>
              {postToEdit ? 'Editar Conteúdo' : 'Novo Planejamento'}
            </span>
            <h3 className="text-xl font-display font-semibold text-white">
              {title || (postToEdit ? 'Modificar Post' : 'Planejar Nova Ideia Passo a Passo')}
            </h3>
          </div>
          <button 
            id="close-dialog-btn"
            onClick={onClose} 
            className="p-1 px-1.5 rounded-lg bg-panel-black hover:bg-zinc-800 border border-panel-border text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form - Organized with generous spacing and clear hierarchy */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          
          {/* 1. CANAL & FORMATO & FUNIL */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Canal e formato</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* CANAL (Platform) */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Rede Social</label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-panel-card rounded-lg border border-panel-border">
                  {(['instagram', 'tiktok', 'youtube'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`text-xs py-1.5 px-1 rounded-md font-medium capitalize transition-all cursor-pointer text-center ${
                        platform === p 
                          ? p === 'instagram' 
                            ? 'bg-accent-purple text-white font-bold' 
                            : p === 'youtube'
                              ? 'bg-accent-orange text-white font-bold'
                              : 'bg-white text-black font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'Instagram'}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORMAT */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Formato</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ContentFormat)}
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-500 capitalize cursor-pointer"
                >
                  {platform === 'instagram' && (
                    <>
                      <option value="reels">Reels</option>
                      <option value="carousel">Carrossel</option>
                      <option value="stories">Stories</option>
                      <option value="live">Live</option>
                    </>
                  )}
                  {platform === 'tiktok' && (
                    <>
                      <option value="shorts">TikTok Curto</option>
                      <option value="live">TikTok Live</option>
                      <option value="video">TikTok Longo</option>
                    </>
                  )}
                  {platform === 'youtube' && (
                    <>
                      <option value="video">Vídeo Longo</option>
                      <option value="shorts">YouTube Shorts</option>
                      <option value="live">Live / Transmissão</option>
                    </>
                  )}
                </select>
              </div>

              {/* FUNNEL STAGE */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Funil de Vendas</label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-panel-card rounded-lg border border-panel-border">
                  {(['TOFU', 'MOFU', 'BOFU'] as FunnelStage[]).map((stage) => {
                    const label = stage === 'TOFU' ? 'Atração' : stage === 'MOFU' ? 'Retenção' : 'Conversão';
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setFunnelStage(stage)}
                        className={`text-[10px] py-1.5 px-0.5 rounded-md font-medium transition-all cursor-pointer text-center ${
                          funnelStage === stage 
                            ? 'bg-zinc-800 text-white font-bold border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={`${stage}: ${label}`}
                      >
                        <span className="block font-mono leading-none">{stage}</span>
                        <span className="text-[7px] opacity-75 leading-none block mt-0.5">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. IDEIA DO CONTEÚDO */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ideia do conteúdo</h4>
                <p className="text-[11px] text-zinc-400">O que quero falar?</p>
              </div>
              <button
                type="button"
                onClick={handleImproveIdeaAI}
                className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles size={13} />
                <span>Reimaginar com IA</span>
              </button>
            </div>
            <div>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 7 erros de design que fazem empresas perder clientes"
                className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent-purple placeholder-zinc-600 font-medium"
              />
            </div>
          </div>

          {/* 3. ROTEIRO DO CONTEÚDO */}
          <div className="p-5 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-white">Roteiro</h3>
              <span className="text-xs text-zinc-400">O que será falado</span>
            </div>

            {/* 1. Gancho */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">Gancho</label>
                <button
                  type="button"
                  onClick={handleGenerateHookAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Gerar com IA</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Prenda a atenção nos primeiros segundos.</p>
              <input 
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                placeholder="Ex: Você está cometendo esses 3 erros e nem percebe..."
                className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
              />
            </div>

            {/* 2. Desenvolvimento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">Desenvolvimento</label>
                <button
                  type="button"
                  onClick={handleGenerateDevAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Gerar com IA</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Explique o que será apresentado no conteúdo, os pontos principais, exemplos ou argumentos...</p>
              <textarea 
                rows={4}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Explique o que será apresentado no conteúdo, os pontos principais, exemplos ou argumentos..."
                className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600 resize-none"
              />
            </div>

            {/* 3. CTA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">CTA — Chamada para ação</label>
                <button
                  type="button"
                  onClick={handleGenerateCtaAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Gerar com IA</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Defina o que você quer que a pessoa faça depois de consumir o conteúdo.</p>
              <input 
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ex: Salve este conteúdo e compartilhe com alguém que precisa ver isso."
                className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
              />
            </div>

            {/* Melhorar com IA & Salvar */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGenerateCompleteScriptAI}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Reimaginar com IA</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const saveBtn = document.getElementById('save-post-btn') as HTMLButtonElement;
                  if (saveBtn) saveBtn.click();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-panel-black hover:bg-zinc-800 text-zinc-200 border border-panel-border transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Salvar</span>
              </button>
            </div>
          </div>

          {/* 4. DIREÇÃO CRIATIVA */}
          <div className="p-5 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-4">
            <div>
              <h3 className="text-sm font-display font-bold text-white">Direção criativa</h3>
              <p className="text-xs text-zinc-400">Como será apresentado visualmente</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1">Ideia visual</label>
                <input 
                  type="text"
                  value={visualIdea}
                  onChange={(e) => setVisualIdea(e.target.value)}
                  placeholder="Ex: Pessoa falando diretamente para a câmera em ambiente profissional..."
                  className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1">Capa / Thumbnail</label>
                <input 
                  type="text"
                  value={coverThumbnail}
                  onChange={(e) => setCoverThumbnail(e.target.value)}
                  placeholder="Ex: Texto grande destacando o principal benefício..."
                  className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* 5. LEGENDA */}
          <div className="p-5 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white">Legenda</h3>
                <p className="text-xs text-zinc-400">Texto da legenda para a postagem</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateLegendAI}
                className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles size={13} />
                <span>Gerar legenda com IA</span>
              </button>
            </div>

            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escreva ou gere a legenda da postagem..."
              className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600 resize-none"
            />
          </div>

          {/* 6. HASHTAGS */}
          <div className="p-5 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white">Hashtags</h3>
                <p className="text-xs text-zinc-400">Hashtags estratégicas (separadas por vírgula)</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateHashtagsAI}
                className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles size={13} />
                <span>Gerar hashtags com IA</span>
              </button>
            </div>

            <input 
              type="text"
              value={hashtagsRaw}
              onChange={(e) => setHashtagsRaw(e.target.value)}
              placeholder="Ex: marketing, reels, dicascriativas"
              className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
            />
            <p className="text-[10px] text-zinc-500 font-mono">O caractere # será adicionado automaticamente.</p>
          </div>

          {/* Client Approval Link Generator Section */}
          {postToEdit && (
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-panel-border space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <span className="block text-[10px] font-mono font-bold uppercase text-accent-orange">
                    🔗 Portal do Cliente & Aprovação
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      postToEdit.approvalStatus === 'approved'
                        ? 'bg-emerald-500'
                        : postToEdit.approvalStatus === 'rejected'
                        ? 'bg-red-500'
                        : postToEdit.approvalStatus === 'pending'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-zinc-600'
                    }`} />
                    <span className="text-xs text-white font-bold">
                      {postToEdit.approvalStatus === 'approved' && 'Aprovado pelo Cliente'}
                      {postToEdit.approvalStatus === 'rejected' && 'Ajustes Solicitados pelo Cliente'}
                      {postToEdit.approvalStatus === 'pending' && 'Aguardando Avaliação do Cliente'}
                      {(!postToEdit.approvalStatus || postToEdit.approvalStatus === 'draft') && 'Não enviado para aprovação'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const approveLink = `${window.location.origin}${window.location.pathname}?approvePostId=${postToEdit.id}`;
                    await copyToClipboard(approveLink);
                    
                    onSave({
                      ...postToEdit,
                      title: title.trim() || postToEdit.title,
                      platform,
                      format,
                      funnelStage,
                      status,
                      scheduledDate,
                      scheduledTime,
                      description: description.trim(),
                      hookText: hookText.trim(),
                      scriptText: scriptText.trim(),
                      ctaText: ctaText.trim(),
                      visualIdea: visualIdea.trim(),
                      coverThumbnail: coverThumbnail.trim(),
                      approvalStatus: 'pending'
                    });
                    
                    alert('Link de aprovação copiado com sucesso! O post foi marcado como "Aguardando Avaliação do Cliente".');
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  🔗 Copiar Link de Aprovação
                </button>
              </div>

              {postToEdit.approvalFeedback && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-panel-border text-xs text-zinc-300 space-y-1">
                  <span className="block text-[9px] font-mono font-bold uppercase text-accent-purple">
                    💬 Observações do Cliente:
                  </span>
                  <p className="italic font-medium">"{postToEdit.approvalFeedback}"</p>
                  {postToEdit.approvalDate && (
                    <span className="block text-[9px] text-zinc-500 font-mono">Avaliado em: {postToEdit.approvalDate}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 7. AGENDAMENTO & STATUS */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Data, horário e status</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Data</label>
                <input 
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Horário</label>
                <input 
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Status do Conteúdo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="w-full bg-panel-card text-zinc-300 border border-panel-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-zinc-500 capitalize cursor-pointer"
                >
                  <option value="draft">📁 Rascunho / Sem roteiro</option>
                  <option value="production">⚙️ Em Produção / Gravando</option>
                  <option value="scheduled">⏰ Agendado / Redigido</option>
                  <option value="published">✅ Publicado / Concluído</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-panel-border bg-panel-card">
            <div>
              {postToEdit && onDelete && (
                <button
                  type="button"
                  id="delete-post-btn"
                  onClick={() => {
                    if (confirm('Tem certeza de que deseja excluir esse planejamento de conteúdo?')) {
                      onDelete(postToEdit.id);
                      onClose();
                    }
                  }}
                  className="text-xs px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-lg transition-all cursor-pointer"
                >
                  Excluir Post
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-dialog-btn"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-panel-black hover:bg-zinc-800 text-xs text-zinc-300 border border-panel-border transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="save-post-btn"
                className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all tracking-wider shadow-sm select-none cursor-pointer ${colors.btn}`}
              >
                {postToEdit ? 'Atualizar Planejamento' : 'Salvar no Calendário'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

