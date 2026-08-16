import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertTriangle, ArrowRight, X, Heart } from 'lucide-react';

interface DemoNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

export default function DemoNoticeModal({ isOpen, onClose, onSignUp }: DemoNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-full max-w-lg bg-panel-card border border-panel-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col p-6 md:p-8"
        >
          {/* Subtle top ambient glowing border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-purple via-accent-orange to-accent-purple" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          {/* Icon Header */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple mb-5">
            <Sparkles size={28} className="text-accent-orange animate-pulse" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-display font-black text-center text-white leading-tight">
            Seja Bem-vindo ao Modo Demo!
          </h3>
          <p className="text-xs text-zinc-400 text-center mt-1.5 font-mono">
            Ambiente Sandbox de Testes
          </p>

          {/* Message Box */}
          <div className="mt-6 space-y-4 text-zinc-300 text-xs md:text-sm leading-relaxed">
            <p>
              Você acabou de entrar no painel como um <strong className="text-accent-orange font-bold">Visitante Demo</strong>. Sinta-se livre para simular e testar todos os recursos premium do nosso Planner de Conteúdo!
            </p>

            <div className="bg-zinc-950/80 border border-panel-border/60 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="text-accent-orange shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-white font-bold text-xs">Aviso de Persistência:</p>
                <p className="text-zinc-400 text-[11px] leading-normal mt-1">
                  Os dados criados aqui são <span className="text-accent-orange font-semibold">100% temporários e locais</span>. Se você atualizar, recarregar ou sair desta aba do navegador, tudo que você criou será perdido.
                </p>
              </div>
            </div>

            <p className="text-zinc-400 text-center text-[11px]">
              Quer gerenciar seus canais e clientes de verdade, salvando seus dados com segurança em nosso banco de dados em nuvem?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onClose();
                onSignUp();
              }}
              className="w-full py-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-accent-purple to-accent-orange hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-purple/10 hover:scale-[1.01]"
            >
              Começar Agora de Graça
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-panel-border hover:border-zinc-700 bg-zinc-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Continuar Testando no Painel
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-zinc-600 flex items-center justify-center gap-1">
              Desenvolvido com <Heart size={10} className="text-accent-purple fill-current" /> para criadores inteligentes.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
