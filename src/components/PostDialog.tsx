/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Platform, ContentFormat, FunnelStage, PostStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat, getTranslatedStage, getTranslatedStatus } from '../utils/postTranslations';
import { X, Sparkles, AlertCircle, CheckCircle, Calendar, Clock, Hash, FileText, Layers, Video } from 'lucide-react';

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
      setVisualIdea(translated.visualIdea || '');
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
      setVisualIdea('');
    }
  }, [postToEdit, isOpen, initialDate]);

  if (!isOpen) return null;

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
      visualIdea: visualIdea.trim(),
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
        <div className="flex items-center justify-between p-5 border-b border-panel-border bg-gradient-to-r from-panel-card via-panel-black to-panel-card">
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

        {/* Content Form - Organized in logical numbered steps */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* PASSO 1: CANAL & FORMATO & FUNIL */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-accent-purple">
              <span className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple text-[10px]">1</span>
              <span>Canal, Formato & Etapa do Funil</span>
            </div>

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

          {/* PASSO 2: TÍTULO & ASSUNTO */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-accent-orange">
              <span className="w-5 h-5 rounded-full bg-accent-orange/20 flex items-center justify-center text-accent-orange text-[10px]">2</span>
              <span>Título / Gancho Principal do Post</span>
            </div>
            <div>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 7 erros fatais de design que matam o engajamento"
                className="w-full bg-panel-card text-white border border-panel-border rounded-lg p-3 text-sm focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
              />
            </div>
          </div>

          {/* PASSO 3: ROTEIRO & DESCRIÇÃO */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-accent-purple">
              <span className="w-5 h-5 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple text-[10px]">3</span>
              <span>Arquitetura de Roteiro & Detalhes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Descrição / Direcionamento</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qual o objetivo desse post? Qual dor da persona atacaremos aqui?"
                  className="w-full bg-panel-card text-zinc-300 border border-panel-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Hashtags Estratégicas</label>
                <textarea 
                  rows={3}
                  value={hashtagsRaw}
                  onChange={(e) => setHashtagsRaw(e.target.value)}
                  placeholder="Ex: marketing, reels, dicascriativas (separadas por vírgula)"
                  className="w-full bg-panel-card text-zinc-300 border border-panel-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-500 resize-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">O caractere # será adicionado automaticamente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                  Gancho (Primeiros 3s)
                </label>
                <input 
                  type="text"
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  placeholder="Ex: Você está cometendo este erro..."
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                  Linha de Roteiro / CTA
                </label>
                <input 
                  type="text"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Passo a passo ou chamada para ação"
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                  Ideia Visual / Capa
                </label>
                <input 
                  type="text"
                  value={visualIdea}
                  onChange={(e) => setVisualIdea(e.target.value)}
                  placeholder="Ex: Cores vibrantes, texto grande"
                  className="w-full bg-panel-card text-zinc-200 border border-panel-border rounded-lg p-2 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
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
                    
                    try {
                      await navigator.clipboard.writeText(approveLink);
                    } catch (err) {
                      console.error('Failed to copy: ', err);
                      const textArea = document.createElement("textarea");
                      textArea.value = approveLink;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                      } catch (fallbackErr) {
                        alert('Erro ao copiar link. Por favor, copie manualmente: ' + approveLink);
                        document.body.removeChild(textArea);
                        return;
                      }
                      document.body.removeChild(textArea);
                    }
                    
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
                      visualIdea: visualIdea.trim(),
                      approvalStatus: 'pending'
                    });
                    
                    alert('Link de aprovação copiado com sucesso! O post foi marcado como "Aguardando Avaliação do Cliente".');
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
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

          {/* PASSO 4: AGENDAMENTO & STATUS */}
          <div className="p-4 rounded-xl bg-panel-black/60 border border-panel-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px]">4</span>
              <span>Data, Horário de Pico & Status</span>
            </div>

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
                className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all tracking-wider shadow-md select-none cursor-pointer ${colors.btn}`}
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

