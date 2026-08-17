import React from 'react';
import { X, Sparkles, AlertTriangle, Clock, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { AIQuotaStatus } from '../services/aiUsageService';

interface AILimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaStatus: AIQuotaStatus | null;
  onOpenPricing: () => void;
}

export default function AILimitModal({
  isOpen,
  onClose,
  quotaStatus,
  onOpenPricing,
}: AILimitModalProps) {
  if (!isOpen || !quotaStatus) return null;

  const isPlanRequired = quotaStatus.reason === 'plan_required';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-panel-bg border border-panel-border rounded-2xl p-6 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {isPlanRequired ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 text-accent-purple flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="animate-pulse" />
            </div>

            <h3 className="text-xl font-bold font-display text-white mb-2">
              Desbloqueie a Inteligência Artificial
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              O acesso ao Gerador de Carrosséis com IA, Roteirizador Avançado e Análise Estratégica está disponível a partir do <strong className="text-accent-purple">Plano Basic</strong> (R$ 29,00/mês).
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-panel-border text-left mb-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Zap size={14} className="text-amber-400" />
                <span>O que está incluso a partir do Basic:</span>
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1.5 pl-5 list-disc">
                <li><strong className="text-zinc-300">20 requisições</strong> a cada 5 horas</li>
                <li><strong className="text-zinc-300">500 requisições</strong> por semana</li>
                <li><strong className="text-zinc-300">2.000 requisições</strong> por mês</li>
                <li>Geração de Carrosséis, Ganchos e Roteiros virais</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="w-full py-3 px-4 rounded-xl font-display font-bold text-xs bg-accent-purple hover:bg-accent-purple/90 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-accent-purple/20"
              >
                <span>Fazer Upgrade para Basic</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-panel-border transition-colors cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} />
            </div>

            <h3 className="text-xl font-bold font-display text-white mb-2">
              Limite de IA Atingido
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {quotaStatus.message}
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-panel-border text-left mb-6 text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Janela de 5 horas:</span>
                <span className="font-bold text-white">{quotaStatus.count5h} / {quotaStatus.max5h}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Semanal (7 dias):</span>
                <span className="font-bold text-white">{quotaStatus.countWeek} / {quotaStatus.maxWeek}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Mensal (30 dias):</span>
                <span className="font-bold text-white">{quotaStatus.countMonth} / {quotaStatus.maxMonth}</span>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                Os limites garantem alta disponibilidade e tempos de resposta rápidos para todos os usuários.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="w-full py-3 px-4 rounded-xl font-display font-bold text-xs bg-accent-purple hover:bg-accent-purple/90 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-accent-purple/20"
              >
                <span>Fazer Upgrade de Cota</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl font-display font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
