/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Platform, ContentFormat, FunnelStage, PostStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost } from '../utils/postTranslations';
import { ArrowLeft, Sparkles, Calendar, Clock, Hash, FileText, Layers, CheckCircle2, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface PostEditorViewProps {
  onBack: () => void;
  onSave: (post: Post) => void;
  onDelete?: (id: string) => void;
  postToEdit?: Post | null;
  initialDate?: string;
  clientId: string;
  clientName: string;
  readOnly?: boolean;
  onOpenPricing?: () => void;
  onOpenIntegrationsModal?: () => void;
}

export default function PostEditorView({
  onBack,
  onSave,
  onDelete,
  postToEdit,
  initialDate,
  clientId,
  clientName,
  readOnly,
  onOpenPricing,
  onOpenIntegrationsModal
}: PostEditorViewProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [format, setFormat] = useState<ContentFormat>('reels');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOFU');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [description, setDescription] = useState('');
  const [hashtagsRaw, setHashtagsRaw] = useState('');
  const [hookText, setHookText] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [visualIdea, setVisualIdea] = useState('');
  const [coverThumbnail, setCoverThumbnail] = useState('');
  const [connectedAccountId, setConnectedAccountId] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Fetch connected client accounts for OAuth scheduling
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        const currentUserStr = localStorage.getItem('planner_current_user');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const userId = currentUser ? currentUser.id : 'user_1';

        const res = await fetch('/api/connected-accounts', {
          headers: {
            'x-user-id': userId,
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
        const data = await res.json();
        if (data.success) {
          setConnectedAccounts(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching connected accounts:', err);
      }
    };
    fetchConnectedAccounts();
  }, []);

  // Auto-adjust default format based on chosen platform
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
      setScheduledTime(translated.scheduledTime || '18:00');
      setDescription(translated.description || '');
      setHashtagsRaw(translated.hashtags ? translated.hashtags.join(', ') : '');
      setHookText(translated.hookText || '');
      setScriptText(translated.scriptText || '');
      setCtaText(translated.ctaText || '');
      setVisualIdea(translated.visualIdea || '');
      setCoverThumbnail(translated.coverThumbnail || '');
      setConnectedAccountId(translated.connectedAccountId || '');
    } else {
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
      setConnectedAccountId('');
    }
  }, [postToEdit, initialDate]);

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
  };

  const handleGenerateLegendAI = () => {
    setDescription(`🚀 Descubra como transformar seus resultados com essas dicas práticas sobre ${title || 'conteúdo'}. Salve este post para consultar depois e envie para um amigo!`);
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
      clientId: postToEdit ? postToEdit.clientId : clientId,
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
      connectedAccountId: connectedAccountId || undefined,
    };

    onSave(postData);
    onBack();
  };

  const getPlatformColors = () => {
    switch (platform) {
      case 'instagram':
        return {
          border: 'border-accent-purple/50',
          glow: 'shadow-[0_0_25px_rgba(139,92,246,0.1)]',
          badge: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
          btn: 'bg-accent-purple hover:bg-accent-purple-dark text-white'
        };
      case 'youtube':
        return {
          border: 'border-accent-orange/50',
          glow: 'shadow-[0_0_25px_rgba(255,107,0,0.1)]',
          badge: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
          btn: 'bg-accent-orange hover:bg-accent-orange-dark text-white'
        };
      case 'tiktok':
        return {
          border: 'border-zinc-500',
          glow: 'shadow-[0_0_25px_rgba(255,255,255,0.05)]',
          badge: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          btn: 'bg-white hover:bg-zinc-200 text-black'
        };
    }
  };

  const colors = getPlatformColors();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-panel-black text-zinc-100 animate-fade-in">
      
      {/* Top Header Navigation Bar */}
      <div className="border-b border-panel-border bg-panel-card px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-panel-black border border-panel-border text-zinc-300 hover:text-white hover:border-zinc-600 transition-all cursor-pointer text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Planner</span>
          </button>
          
          <div className="h-6 w-[1px] bg-panel-border hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badge}`}>
                {postToEdit ? 'Modo de Edição de Conteúdo' : 'Novo Planejamento Multicanal'}
              </span>
              <span className="text-xs text-zinc-500 font-mono">• {clientName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-black text-white mt-0.5">
              {title.trim() || (postToEdit ? 'Editar Publicação' : 'Planejar Nova Ideia Passo a Passo')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-panel-black border border-panel-border text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer hidden md:block"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl font-display font-bold text-xs transition-all shadow-lg cursor-pointer ${colors.btn}`}
          >
            {postToEdit ? 'Atualizar no Calendário' : 'Salvar no Calendário'}
          </button>
        </div>
      </div>

      {/* Main Spacious Form Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          {/* PASSO 1: CANAL, FORMATO & FUNIL */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase text-accent-purple">
              <span className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple text-xs font-black">1</span>
              <span>Canal, Formato & Etapa do Funil</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Canal */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Rede Social / Canal</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-panel-black rounded-xl border border-panel-border">
                  {(['instagram', 'tiktok', 'youtube'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`text-xs py-2.5 px-2 rounded-lg font-medium capitalize transition-all cursor-pointer text-center ${
                        platform === p 
                          ? p === 'instagram' 
                            ? 'bg-accent-purple text-white font-bold shadow-md' 
                            : p === 'youtube'
                              ? 'bg-accent-orange text-white font-bold shadow-md'
                              : 'bg-white text-black font-bold shadow-md'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      {p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'Instagram'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formato */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Formato de Conteúdo</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ContentFormat)}
                  className="w-full bg-panel-black text-zinc-200 border border-panel-border rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-500 capitalize cursor-pointer font-medium"
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

              {/* Etapa do Funil */}
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Etapa do Funil de Vendas</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-panel-black rounded-xl border border-panel-border">
                  {(['TOFU', 'MOFU', 'BOFU'] as FunnelStage[]).map((stage) => {
                    const label = stage === 'TOFU' ? 'Atração' : stage === 'MOFU' ? 'Retenção' : 'Conversão';
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setFunnelStage(stage)}
                        className={`text-xs py-2 px-1 rounded-lg font-medium transition-all cursor-pointer text-center ${
                          funnelStage === stage 
                            ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="block font-mono leading-none font-bold">{stage}</span>
                        <span className="text-[9px] opacity-75 leading-none block mt-1">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. IDEIA DO CONTEÚDO */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-accent-orange tracking-wider">2. Ideia do Conteúdo</h3>
                <p className="text-xs text-zinc-400 mt-0.5">O que quero falar?</p>
              </div>
              <button
                type="button"
                onClick={handleImproveIdeaAI}
                className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles size={14} className="text-purple-400" />
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
                className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-accent-purple placeholder-zinc-600 shadow-inner"
              />
            </div>
          </div>

          {/* 3. ROTEIRO DO CONTEÚDO */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Roteiro</h3>
                <p className="text-xs text-zinc-400">O que será falado no conteúdo</p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-accent-purple/20 text-accent-purple px-2.5 py-1 rounded-full border border-accent-purple/30">Etapa 3</span>
            </div>

            {/* Gancho */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-200">Gancho</label>
                  <p className="text-[11px] text-zinc-400">Campo maior — primeiros segundos para prender a atenção.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateHookAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} className="text-purple-400" />
                  <span>Reimaginar com IA</span>
                </button>
              </div>
              <input 
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                placeholder="Ex: Você está cometendo esses 3 erros e nem percebe..."
                className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
              />
            </div>

            {/* Desenvolvimento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-200">Desenvolvimento</label>
                  <p className="text-[11px] text-zinc-400">Campo grande — parte principal do roteiro.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDevAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} className="text-purple-400" />
                  <span>Reimaginar com IA</span>
                </button>
              </div>
              <textarea 
                rows={5}
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Explique o que será apresentado no conteúdo, os pontos principais, exemplos ou argumentos..."
                className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600 resize-none leading-relaxed"
              />
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-zinc-200">CTA — Chamada para ação</label>
                  <p className="text-[11px] text-zinc-400">Campo menor — ação final desejada.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCtaAI}
                  className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} className="text-purple-400" />
                  <span>Reimaginar com IA</span>
                </button>
              </div>
              <input 
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ex: Salve este conteúdo e compartilhe com alguém que precisa ver isso."
                className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
              />
            </div>

            {/* Melhorar com IA & Salvar */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGenerateCompleteScriptAI}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} className="text-white" />
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
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Direção Criativa</h3>
              <p className="text-xs text-zinc-400">Como o conteúdo será apresentado visualmente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Ideia visual</label>
                <input 
                  type="text"
                  value={visualIdea}
                  onChange={(e) => setVisualIdea(e.target.value)}
                  placeholder="Ex: Pessoa falando diretamente para a câmera em ambiente profissional..."
                  className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">Capa / Thumbnail</label>
                <input 
                  type="text"
                  value={coverThumbnail}
                  onChange={(e) => setCoverThumbnail(e.target.value)}
                  placeholder="Ex: Texto grande destacando o principal benefício..."
                  className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* 5. LEGENDA */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Legenda</h3>
                <p className="text-xs text-zinc-400">Texto complementar para a publicação</p>
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
              placeholder="Escreva ou gere a legenda completa da postagem..."
              className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600 resize-none leading-relaxed font-medium"
            />
          </div>

          {/* 6. HASHTAGS */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Hashtags</h3>
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
              className="w-full bg-panel-black text-white border border-panel-border rounded-xl p-3.5 text-xs focus:outline-none focus:border-accent-purple placeholder-zinc-600 font-mono"
            />
            <p className="text-[10px] text-zinc-500 font-mono">O caractere # será formatado automaticamente.</p>
          </div>

          {/* 7. DATA, HORÁRIO & STATUS */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase text-emerald-400">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-black">7</span>
              <span>Data, Horário de Pico & Status de Publicação</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Data de Publicação</label>
                <input 
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-panel-black text-zinc-200 border border-panel-border rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-500 cursor-pointer font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Horário de Pico</label>
                <input 
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-panel-black text-zinc-200 border border-panel-border rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-500 cursor-pointer font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Status do Conteúdo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="w-full bg-panel-black text-zinc-300 border border-panel-border p-3 rounded-xl text-xs focus:outline-none focus:border-zinc-500 capitalize cursor-pointer font-medium"
                >
                  <option value="draft">📁 Rascunho / Sem roteiro</option>
                  <option value="production">⚙️ Em Produção / Gravando</option>
                  <option value="scheduled">⏰ Agendado / Redigido</option>
                  <option value="published">✅ Publicado / Concluído</option>
                </select>
              </div>
            </div>

            {/* Connected Client Account for OAuth Auto-Publishing */}
            <div className="pt-4 border-t border-panel-border/60">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Conta do Cliente Conectada (Publicação Automática via OAuth)
                </label>
                {onOpenIntegrationsModal && (
                  <button
                    type="button"
                    onClick={onOpenIntegrationsModal}
                    className="text-xs text-accent-purple hover:text-purple-400 font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <LinkIcon size={13} />
                    <span>Conectar nova conta (Meta OAuth)</span>
                  </button>
                )}
              </div>
              <select
                value={connectedAccountId}
                onChange={(e) => setConnectedAccountId(e.target.value)}
                className="w-full bg-panel-black text-zinc-200 border border-panel-border p-3 rounded-xl text-xs focus:outline-none focus:border-accent-purple font-medium cursor-pointer"
              >
                <option value="">Nenhuma conta vinculada (Apenas agendamento interno)</option>
                {connectedAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.provider.toUpperCase()}: {acc.name} (@{acc.username}) {acc.status === 'active' ? '🟢 Ativa' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                Ao vincular uma conta do cliente via OAuth, o sistema enviará o post para publicação automática na data e horário programados.
              </p>
            </div>
          </div>

          {/* Client Approval Link Box if editing */}
          {postToEdit && (
            <div className="p-6 rounded-2xl bg-panel-card border border-panel-border shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="block text-xs font-mono font-bold uppercase text-accent-orange mb-1">
                    🔗 Compartilhar para Aprovação do Cliente
                  </span>
                  <p className="text-xs text-zinc-400">
                    Gere um link exclusivo para o cliente revisar este roteiro e enviar feedback.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const approveLink = `${window.location.origin}/?approvePostId=${postToEdit.id}`;
                    const success = await copyToClipboard(approveLink);
                    if (success) {
                      alert('Link de aprovação copiado com sucesso!');
                    } else {
                      prompt('Copie o link de aprovação:', approveLink);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <LinkIcon size={14} /> Copiar Link de Aprovação
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-panel-border">
            <div>
              {postToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir permanentemente este post?')) {
                      onDelete(postToEdit.id);
                      onBack();
                    }
                  }}
                  className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trash2 size={14} /> Excluir Post
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-panel-card border border-panel-border text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                {readOnly ? 'Voltar' : 'Cancelar'}
              </button>
              {readOnly ? (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="px-8 py-3 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-95 transition-all shadow-lg cursor-pointer"
                >
                  🔒 Ativar Plano para Salvar
                </button>
              ) : (
                <button
                  type="submit"
                  className={`px-8 py-3 rounded-xl font-display font-bold text-sm transition-all shadow-lg cursor-pointer ${colors.btn}`}
                >
                  {postToEdit ? 'Atualizar no Calendário' : 'Salvar no Calendário'}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}
