import React, { useState } from 'react';
import { Post } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { Check, X, Send, Sparkles, AlertCircle, Calendar, Smartphone, Instagram, Youtube, Clapperboard, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ClientApprovalPageProps {
  postId: string;
  onBackToApp?: () => void;
}

export default function ClientApprovalPage({ postId, onBackToApp }: ClientApprovalPageProps) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('creator_planner_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const rawPost = posts.find(p => p.id === postId);
  const post = rawPost ? getTranslatedPost(rawPost, t) : undefined;
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState<'approved' | 'rejected' | null>(null);

  if (!post) {
    return (
      <div className="min-h-screen bg-panel-black text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 animate-bounce">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-display font-black">{t('invalidLink', 'Link de Aprovação Inválido')}</h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm">
          {t('invalidLinkDesc', 'Este conteúdo não foi localizado ou pode ter sido removido pelo criador do roteiro.')}
        </p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="mt-6 px-5 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
          >
            {t('backToApp', 'Voltar para o App')}
          </button>
        )}
      </div>
    );
  }

  const handleApprovalAction = (action: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    
    // Update local storage and component state
    const updatedPosts = posts.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          approvalStatus: action,
          approvalFeedback: feedbackText.trim() || undefined,
          approvalDate: new Date().toLocaleDateString('pt-BR'),
          // Auto transition general status if approved/rejected
          status: action === 'approved' ? 'scheduled' as const : 'draft' as const
        };
      }
      return p;
    });

    setPosts(updatedPosts);
    localStorage.setItem('creator_planner_posts', JSON.stringify(updatedPosts));

    // Call server to update database
    fetch('/api/posts/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: post.id,
        status: action,
        feedback: feedbackText.trim()
      })
    }).catch(err => console.error('Failed to sync approval to server:', err));

    // Register simple activity log if admin log system exists
    try {
      const logs = JSON.parse(localStorage.getItem('creator_planner_admin_logs') || '[]');
      const newLog = {
        id: `log_${Date.now()}`,
        text: `O cliente avaliou o roteiro "${post.title}" como ${action === 'approved' ? 'APROVADO' : 'REPROVADO'}.`,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      localStorage.setItem('creator_planner_admin_logs', JSON.stringify([newLog, ...logs]));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessScreen(action);
    }, 850);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="text-pink-500" size={16} />;
      case 'youtube':
        return <Youtube className="text-red-500" size={16} />;
      case 'tiktok':
        return <Clapperboard className="text-emerald-400" size={16} />;
      default:
        return <Smartphone size={16} />;
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-panel-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-panel-card border border-panel-border p-8 rounded-2xl shadow-2xl space-y-6"
        >
          <div className="flex justify-center">
            {showSuccessScreen === 'approved' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Check size={32} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <X size={32} strokeWidth={2.5} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-black text-white">
              {showSuccessScreen === 'approved' ? 'Roteiro Aprovado!' : 'Feedback Enviado!'}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {showSuccessScreen === 'approved'
                ? 'Muito obrigado! O roteiro foi marcado como aprovado no painel do criador. Agora ele está pronto para a produção/agendamento.'
                : 'O criador foi notificado dos ajustes solicitados. Seu feedback foi registrado e ele fará as correções em breve.'}
            </p>
          </div>

          {feedbackText.trim() && (
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-panel-border/40 text-left text-xs text-zinc-300">
              <span className="block font-mono font-bold text-accent-purple mb-1">Seu comentário enviado:</span>
              <p className="italic font-medium leading-relaxed">"{feedbackText}"</p>
            </div>
          )}

          <div className="pt-2 border-t border-panel-border/30 text-[10px] font-mono text-zinc-500">
            Enviado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-panel-black text-white flex flex-col font-sans select-text selection:bg-accent-purple selection:text-white">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-panel-card/95 backdrop-blur border-b border-panel-border/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center text-accent-purple font-display font-extrabold text-sm">
            AP
          </div>
          <div>
            <h1 className="text-sm font-display font-black tracking-wide text-white uppercase">Portal do Cliente</h1>
            <p className="text-[10px] text-zinc-400">Aprovação e feedback de conteúdo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-accent-purple/15 text-accent-purple border border-accent-purple/20 flex items-center gap-1.5">
            <Sparkles size={11} className="animate-pulse" />
            Link Ativo
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-panel-border text-[11px] font-mono capitalize">
              {getPlatformIcon(post.platform)}
              {post.platform}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-panel-border text-[11px] font-mono capitalize text-zinc-300">
              {getTranslatedFormat(post.format, t)}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-accent-orange/10 border border-accent-orange/20 text-[11px] font-mono text-accent-orange font-bold">
              Funil: {getTranslatedStage(post.funnelStage, t)}
            </span>

            {post.approvalStatus && (
              <span className={`px-2.5 py-1 rounded-md border text-[11px] font-mono font-bold uppercase ${
                post.approvalStatus === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : post.approvalStatus === 'rejected'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                Status: {post.approvalStatus === 'approved' ? 'Aprovado' : post.approvalStatus === 'rejected' ? 'Ajustes Solicitados' : 'Pendente'}
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">
            {post.title}
          </h2>
          <p className="text-xs text-zinc-400">
            Analise os detalhes do roteiro, a ideia visual e o texto principal descritos abaixo antes de aprovar ou solicitar ajustes.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Main scripting content details */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Hook Text section */}
            {post.hookText && (
              <div className="bg-panel-card border border-panel-border rounded-xl p-5 md:p-6 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-orange" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-orange">
                  🪝 O Gancho Inicial (Primeiros 3s)
                </h3>
                <p className="text-sm text-zinc-100 font-semibold leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-lg border border-panel-border/30 italic">
                  "{post.hookText}"
                </p>
              </div>
            )}

            {/* Script Text section */}
            <div className="bg-panel-card border border-panel-border rounded-xl p-5 md:p-6 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-purple">
                📝 Roteiro Completo / Linha de Fala
              </h3>
              {post.scriptText ? (
                <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-5 rounded-lg border border-panel-border/30 font-medium">
                  {post.scriptText}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Roteiro ainda não detalhado pelo criador de conteúdo.</p>
              )}
            </div>

            {/* Visual Idea section */}
            {post.visualIdea && (
              <div className="bg-panel-card border border-panel-border rounded-xl p-5 md:p-6 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  🎬 Direção e Ideia Visual
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/20 p-4 rounded-lg border border-panel-border/20">
                  {post.visualIdea}
                </p>
              </div>
            )}

            {/* Copy / Details information */}
            {(post.description || (post.hashtags && post.hashtags.length > 0)) && (
              <div className="bg-panel-card/70 border border-panel-border/80 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  📋 Descrição da Legenda & Hashtags
                </h4>
                {post.description && (
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/10 p-3 rounded-lg">
                    {post.description}
                  </p>
                )}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-accent-purple bg-accent-purple/5 px-2 py-0.5 rounded border border-accent-purple/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right column: Action decision and feedback widget */}
          <div className="md:col-span-4 space-y-6 sticky top-24">
            
            {/* Feedback & Actions container */}
            <div className="bg-panel-card border border-panel-border rounded-xl p-5 md:p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-purple/5 rounded-full blur-xl" />
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Decisão do Roteiro
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Escreva um comentário ou correção opcional antes de responder.
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-zinc-500">
                  Observações / Ajustes desejados:
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Ex: Gostei muito, mas mude o gancho para citar o valor... ou aprove direto!"
                  className="w-full h-28 bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-purple transition-all resize-none"
                />
              </div>

              {/* Approval CTAs */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleApprovalAction('approved')}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={2.5} />
                  {isSubmitting ? 'Enviando...' : 'Aprovar Roteiro'}
                </button>

                <button
                  onClick={() => handleApprovalAction('rejected')}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-panel-border hover:border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X size={14} strokeWidth={2.5} />
                  {isSubmitting ? 'Enviando...' : 'Reprovar / Pedir Ajustes'}
                </button>
              </div>

              <div className="border-t border-panel-border/30 pt-3.5 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <HelpCircle size={11} />
                <span>As alterações são instantâneas.</span>
              </div>
            </div>

            {/* General tips */}
            <div className="p-4 bg-panel-card/40 border border-panel-border rounded-xl text-left text-xs leading-relaxed text-zinc-400 space-y-1">
              <span className="block font-semibold text-white">💡 Como funciona?</span>
              <p className="text-[11px]">
                Ao clicar em aprovar ou reprovar, o status do card será atualizado em tempo real na tela do seu gestor de conteúdo, informando se pode ser gravado ou se precisa de revisão.
              </p>
            </div>

          </div>

        </div>
      </main>

      <footer className="border-t border-panel-border/80 bg-panel-card py-6 text-center text-[11px] text-zinc-600 font-mono">
        <p>Desenvolvido de forma colaborativa com o Planejador de Conteúdo Multicanal</p>
      </footer>
    </div>
  );
}
