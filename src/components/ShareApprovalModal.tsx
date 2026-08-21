import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, ShieldCheck, Sparkles, MessageCircle, X } from 'lucide-react';
import { Post, Client } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface ShareApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  client?: Client;
}

export default function ShareApprovalModal({
  isOpen,
  onClose,
  posts,
  client,
}: ShareApprovalModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string>(posts[0]?.id || '');

  if (!isOpen) return null;

  const origin = window.location.origin;
  const currentPost = posts.find(p => p.id === selectedPostId) || posts[0];
  const postApprovalUrl = currentPost ? `${origin}/?approvePostId=${currentPost.id}` : '';
  const clientName = client?.name || 'Cliente';

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      localStorage.setItem('planner_onboarding_link_copied', 'true');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá ${clientName}! Segue o link para revisar e aprovar o novo roteiro de conteúdo: ${postApprovalUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-[#121218] border border-panel-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-orange/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-panel-border/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-orange/15 border border-accent-orange/30 text-accent-orange">
              <Share2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Sem Necessidade de Senha
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-white tracking-tight mt-0.5">
                Compartilhar para Aprovação do Cliente
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Seu cliente poderá visualizar o roteiro completo, gancho, legenda e aprovar ou solicitar ajustes com 1 clique direto pelo celular ou computador.
          </p>

          {/* Select Post if multiple */}
          {posts.length > 1 && (
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Selecione o Conteúdo para Compartilhar:
              </label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full bg-panel-card border border-panel-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent-orange"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.platform.toUpperCase()}] {p.title} ({p.scheduledDate || 'Sem data'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Direct Link Box */}
          {postApprovalUrl && (
            <div className="space-y-2">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Link Direto de Aprovação:
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={postApprovalUrl}
                  className="flex-1 bg-transparent text-xs text-zinc-300 font-mono focus:outline-none px-2 truncate"
                />
                <button
                  onClick={() => handleCopy(postApprovalUrl, 'post_link')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  {copiedId === 'post_link' ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp One-Click Action */}
          {postApprovalUrl && (
            <div className="pt-2">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Enviar pelo WhatsApp para o Cliente</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Security & Feature bullet */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3 text-[11px] text-zinc-400">
            <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
            <span>
              O link é criptografado e seguro. Notificações de aprovação são registradas em tempo real no seu calendário.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-panel-border/80 bg-[#0d0d12] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
