import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, ShieldCheck, HelpCircle } from 'lucide-react';

interface PaymentCancelledPageProps {
  onReturnHome: () => void;
  onRetryPayment?: () => void;
}

export default function PaymentCancelledPage({
  onReturnHome,
  onRetryPayment,
}: PaymentCancelledPageProps) {
  return (
    <div className="min-h-screen bg-app-bg text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-panel-bg border border-panel-border/80 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 text-accent-orange flex items-center justify-center mx-auto mb-6">
          <XCircle size={36} />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Pagamento Não Concluído
        </h1>
        
        <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
          O processo de checkout na Stripe foi cancelado ou não foi finalizado. Nenhuma cobrança foi efetuada em seu cartão.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-zinc-900/80 border border-panel-border text-left text-xs space-y-2 text-zinc-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck size={14} />
            <span>Seus dados continuam 100% seguros</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Você pode tentar novamente com outro cartão ou escolher outro plano a qualquer momento.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {onRetryPayment && (
            <button
              type="button"
              onClick={onRetryPayment}
              className="w-full py-3 px-4 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-accent-purple/20"
            >
              <RefreshCw size={14} />
              <span>Tentar Novamente</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-panel-border"
          >
            <ArrowLeft size={14} />
            <span>Voltar para o Início</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-panel-border/50 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <HelpCircle size={13} />
          <span>Precisa de ajuda? Fale com nosso suporte.</span>
        </div>
      </div>
    </div>
  );
}
