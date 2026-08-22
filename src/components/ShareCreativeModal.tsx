import React, { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, ExternalLink, ShieldCheck, Sparkles, 
  MessageCircle, X, Download, Lock, CheckCircle2, Layers, 
  AlignLeft, ImageIcon, Eye, Smartphone
} from 'lucide-react';
import { Creative, Client } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface ShareCreativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatives: Creative[];
  clients: Client[];
  initialCreative?: Creative | null;
  initialClientId?: string;
  initialFocus?: 'all' | 'visual' | 'caption';
  initialMode?: 'single' | 'hub';
}

export default function ShareCreativeModal({
  isOpen,
  onClose,
  creatives,
  clients,
  initialCreative,
  initialClientId,
  initialFocus = 'all',
  initialMode = 'single'
}: ShareCreativeModalProps) {
  const [selectedMode, setSelectedMode] = useState<'single' | 'hub'>(initialMode);
  const [selectedFocus, setSelectedFocus] = useState<'all' | 'visual' | 'caption'>(initialFocus);
  const [selectedCreativeId, setSelectedCreativeId] = useState<string>(initialCreative?.id || creatives[0]?.id || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || initialCreative?.clientId || 'all');
  const [allowMediaDownload, setAllowMediaDownload] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialCreative) {
      setSelectedCreativeId(initialCreative.id);
      if (initialCreative.clientId) {
        setSelectedClientId(initialCreative.clientId);
      }
      setSelectedMode('single');
    } else if (initialClientId) {
      setSelectedClientId(initialClientId);
      setSelectedMode('hub');
    }
  }, [initialCreative, initialClientId, isOpen]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const currentCreative = creatives.find(c => c.id === selectedCreativeId) || creatives[0];
  const targetClient = clients.find(c => c.id === selectedClientId);
  const clientName = targetClient?.name || currentCreative?.clientName || 'Cliente';

  // Build the dynamic share URL
  let shareUrl = '';
  const downloadParam = `allowDownload=${allowMediaDownload ? '1' : '0'}`;
  const focusParam = selectedFocus !== 'all' ? `&focus=${selectedFocus}` : '';

  if (selectedMode === 'single' && currentCreative) {
    const token = currentCreative.shareToken || currentCreative.id;
    shareUrl = `${origin}/aprovar?creativeToken=${encodeURIComponent(token)}&${downloadParam}${focusParam}`;
  } else {
    const resolvedClient = selectedClientId || 'all';
    shareUrl = `${origin}/aprovar?client=${encodeURIComponent(resolvedClient)}&mode=hub&${downloadParam}${focusParam}`;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessageText = selectedMode === 'single' && currentCreative
    ? (selectedFocus === 'caption'
        ? `Olá ${clientName}! Segue a legenda do post "${currentCreative.title}" para você revisar e aprovar:\n\n✍️ ${shareUrl}`
        : `Olá ${clientName}! Preparei a prévia do criativo "${currentCreative.title}" para sua aprovação:\n\n🔗 ${shareUrl}` +
          (allowMediaDownload ? `\n\n📥 O download das mídias originais está liberado nesta página.` : ''))
    : (selectedFocus === 'caption'
        ? `Olá ${clientName}! Seguem as legendas dos conteúdos da nossa central para você revisar e aprovar:\n\n✍️ ${shareUrl}`
        : `Olá ${clientName}! Segue o link geral da nossa Central de Criativos para você aprovar os posts e carrosséis:\n\n🔗 ${shareUrl}` +
          (allowMediaDownload ? `\n\n📥 O download das mídias originais está liberado nesta página.` : ''));

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessageText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xl bg-[#121218] border border-[#24242D] rounded-3xl shadow-2xl overflow-hidden animate-scale-up text-zinc-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-purple-600/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className="p-6 border-b border-[#24242D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Share2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Link Seguro do Cliente
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-[11px] text-zinc-400 font-mono">Sem login/senha</span>
              </div>
              <h3 className="text-lg font-display font-bold text-white tracking-tight mt-0.5">
                Compartilhar Link de Aprovação
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* 1. SELEÇÃO DE ESCOPO (CRIATIVO INDIVIDUAL vs CENTRAL GERAL) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              O que você deseja compartilhar?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMode('single')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedMode === 'single'
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedMode === 'single' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <ImageIcon size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">Criativo Individual</span>
                  <span className="text-[10px] text-zinc-400">1 post ou carrossel específico</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('hub')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedMode === 'hub'
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedMode === 'hub' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Layers size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white">Central Completa</span>
                  <span className="text-[10px] text-zinc-400">Galeria com todos os posts</span>
                </div>
              </button>
            </div>
          </div>

          {/* 1.1 SELECT SPECIFIC CREATIVE (IF SINGLE MODE) */}
          {selectedMode === 'single' && creatives.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Selecione o Criativo:
              </label>
              <select
                value={selectedCreativeId}
                onChange={(e) => setSelectedCreativeId(e.target.value)}
                className="w-full bg-[#17171F] border border-[#24242D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {creatives.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.format?.toUpperCase() || 'POST'}] {c.title} {c.clientName ? `— ${c.clientName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1.2 SELECT CLIENT (IF HUB MODE) */}
          {selectedMode === 'hub' && clients.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Filtrar por Cliente / Marca:
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-[#17171F] border border-[#24242D] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">Todas as Marcas (Galeria Geral)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    Marca: {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. FOCUS FILTER (VISUAL + COPY vs APENAS LEGENDAS) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Foco da Revisão do Cliente:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFocus('all')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedFocus === 'all'
                    ? 'bg-zinc-800 text-white border-purple-500 shadow-sm'
                    : 'bg-[#17171F] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Eye size={13} />
                <span>Completo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFocus('visual')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedFocus === 'visual'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm'
                    : 'bg-[#17171F] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <ImageIcon size={13} />
                <span>Mídias</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFocus('caption')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedFocus === 'caption'
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-[#17171F] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <AlignLeft size={13} />
                <span>Legendas</span>
              </button>
            </div>
          </div>

          {/* 3. MEDIA DOWNLOAD PERMISSION SWITCH (KEY USER FEATURE) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-[#151520] to-zinc-900 border border-purple-500/25 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border transition-all ${
                  allowMediaDownload 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                }`}>
                  {allowMediaDownload ? <Download size={20} /> : <Lock size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white font-display">
                      Permitir Download de Mídias pelo Cliente
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      allowMediaDownload 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {allowMediaDownload ? 'Liberado' : 'Bloqueado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    O cliente poderá baixar as fotos, vídeos e carrosséis em alta resolução?
                  </p>
                </div>
              </div>

              {/* Interactive iOS/Material Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={allowMediaDownload}
                onClick={() => setAllowMediaDownload(prev => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  allowMediaDownload ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    allowMediaDownload ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Explanation box */}
            <div className="text-[10px] font-mono p-2.5 rounded-xl border flex items-center gap-2 bg-black/40 border-zinc-800">
              {allowMediaDownload ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">
                    O cliente verá botões para baixar cada slide ou o arquivo original direto na tela de aprovação.
                  </span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-zinc-400">
                    Apenas visualização em tela. Os botões de download estarão ocultos para proteger suas mídias.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 4. DIRECT LINK INPUT & COPY */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Link Gerado para Envio:
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-950 border border-zinc-800">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-zinc-300 font-mono focus:outline-none px-2 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* 5. WHATSAPP ONE-CLICK ACTION */}
          <div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle size={17} />
              <span>Enviar pelo WhatsApp para o Cliente</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* 6. SECURITY & ENCRYPTION NOTE */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3 text-[11px] text-zinc-400">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span>
              O link é público e dinâmico. O cliente aprova em tempo real sem precisar de senha ou instalar nada.
            </span>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 px-6 border-t border-[#24242D] bg-[#0d0d12] flex items-center justify-between">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors font-semibold"
          >
            <ExternalLink size={13} />
            <span>Testar / Abrir Link como Cliente</span>
          </a>

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
