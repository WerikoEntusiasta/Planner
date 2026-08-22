import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, QrCode, Check, Copy, ExternalLink, 
  RefreshCw, ShieldCheck, Zap, Wifi, Layers, X, Sparkles 
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { motion } from 'motion/react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidAppModal({ isOpen, onClose }: AndroidAppModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const appUrl = window.location.origin;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone/PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions alert or copy
      copyLink();
    }
  };

  const copyLink = async () => {
    const success = await copyToClipboard(appUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#121218] border border-[#24242D] max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Glow Header effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-emerald-500/15 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between relative z-10 border-b border-[#24242D] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/30 text-emerald-400">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white font-display">
                  Aplicativo Android (Sincronizado)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin text-emerald-400" />
                  <span>Sync em Tempo Real</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Instale no seu celular Android com o mesmo banco de dados da versão Web
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1C26] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sincronização em Tempo Real Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
          <div className="p-3 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <RefreshCw size={15} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white font-display">100% Sincronizado</h4>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                Tudo o que criar no Android atualiza no PC instantaneamente.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Zap size={15} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white font-display">App Nativo (PWA)</h4>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                Ícone na tela inicial, abre em tela cheia e sem barras do navegador.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#17171F] border border-[#24242D] flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <ShieldCheck size={15} />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white font-display">Mesma Conta</h4>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                Faça login com seu email e senha e acesse seus clientes.
              </p>
            </div>
          </div>
        </div>

        {/* Como Instalar no Android (Passo a Passo) */}
        <div className="p-4 rounded-2xl bg-[#17171F] border border-[#24242D] space-y-3 relative z-10">
          <div className="text-xs font-bold text-white font-display flex items-center justify-between">
            <span>Como instalar no seu Android em 3 passos:</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Sem precisar da Play Store
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </div>
              <p className="text-[11px] leading-relaxed">
                Abra o link do aplicativo no <strong>Google Chrome</strong> do seu smartphone Android.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </div>
              <p className="text-[11px] leading-relaxed">
                Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                3
              </div>
              <p className="text-[11px] leading-relaxed">
                Pronto! O ícone do <strong>Planner</strong> aparecerá na tela do seu celular como um app independente com acesso instantâneo.
              </p>
            </div>
          </div>
        </div>

        {/* Link do App & Ações */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Link de Acesso para o Celular:</span>
            {copiedLink && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check size={12} /> Link Copiado!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2.5 text-xs text-zinc-300 font-mono truncate select-all">
              {appUrl}
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="px-3.5 py-2.5 rounded-xl bg-[#1C1C26] hover:bg-[#252533] border border-[#24242D] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Copiar link do App"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Direct Install Button (if browser supports PWA prompt) */}
          {deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <Download size={16} />
              <span>Instalar Aplicativo no Dispositivo Agora</span>
            </button>
          )}

          {isInstalled && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
              <Check size={14} />
              <span>Você já está executando o modo Aplicativo Instalado!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#24242D] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Compatível com Android 8.0+ e todos os navegadores modernos</span>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </motion.div>
    </div>
  );
}
