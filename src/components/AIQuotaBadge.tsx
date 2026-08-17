import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, AlertTriangle, ShieldCheck, Zap, Info, ArrowUpRight, Infinity as InfinityIcon } from 'lucide-react';
import { checkAIQuota, AIQuotaStatus } from '../services/aiUsageService';

interface AIQuotaBadgeProps {
  userPlan?: string;
  isTeamMember?: boolean;
  userId?: string;
  onOpenUpgrade?: () => void;
  className?: string;
}

export default function AIQuotaBadge({
  userPlan = 'free',
  isTeamMember = false,
  userId,
  onOpenUpgrade,
  className = '',
}: AIQuotaBadgeProps) {
  const [quota, setQuota] = useState<AIQuotaStatus>(() => checkAIQuota(userPlan, isTeamMember, userId));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setQuota(checkAIQuota(userPlan, isTeamMember, userId));
    const interval = setInterval(() => {
      setQuota(checkAIQuota(userPlan, isTeamMember, userId));
    }, 15000);
    return () => clearInterval(interval);
  }, [userPlan, isTeamMember, userId]);

  const plan = userPlan.toLowerCase();
  const hasAIPlan = ['basic', 'pro', 'growth', 'enterprise', 'admin'].includes(plan);

  if (!hasAIPlan) {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-[11px] font-medium transition-all cursor-pointer group"
          title="IA disponível a partir do Plano Basic"
        >
          <Sparkles size={12} className="text-amber-400 group-hover:scale-110 transition-transform" />
          <span>IA a partir do <strong>Basic</strong></span>
          <ArrowUpRight size={11} className="text-amber-400 opacity-70" />
        </button>
      </div>
    );
  }

  const isUnlimited = !!quota.isUnlimited;
  const isLow5h = !isUnlimited && quota.remaining5h <= 3;
  const isBlocked = !quota.allowed;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
          isBlocked
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : isUnlimited
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
            : isLow5h
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-accent-purple/10 border-accent-purple/25 text-purple-200 hover:bg-accent-purple/15'
        }`}
      >
        <Sparkles size={12} className={isBlocked ? 'text-red-400' : isUnlimited ? 'text-emerald-400' : 'text-accent-purple'} />
        {isUnlimited ? (
          <span className="flex items-center gap-1">
            <strong>IA Sem Limites</strong>
            <span className="text-[10px] text-emerald-400/80 font-mono">({quota.count5h} req/5h)</span>
          </span>
        ) : (
          <span>
            <strong>{quota.remaining5h}</strong>/{quota.max5h} req (5h)
          </span>
        )}
        <Info size={11} className="opacity-60 hover:opacity-100" />
      </button>

      {/* Popover com detalhamento completo dos limites e barras de uso */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-panel-bg/95 backdrop-blur-md border border-panel-border shadow-2xl z-50 text-left animate-fade-in text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-panel-border/60">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles size={13} className={isUnlimited ? 'text-emerald-400' : 'text-accent-purple'} />
              <span>{isUnlimited ? 'IA Sem Limites (Growth)' : 'Cota de Inteligência Artificial'}</span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-zinc-500 hover:text-white text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {/* Limite 5 Horas */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-300 flex items-center gap-1">
                  <Clock size={11} className={isUnlimited ? 'text-emerald-400' : 'text-accent-purple'} /> Janela 5h:
                </span>
                <span className="font-bold text-white">
                  {quota.count5h} {isUnlimited ? 'usadas (ilimitado)' : `/ ${quota.max5h} (${quota.remaining5h} restantes)`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isUnlimited ? 'bg-emerald-400' : quota.count5h >= quota.max5h ? 'bg-red-500' : 'bg-accent-purple'
                  }`}
                  style={{ width: `${Math.min(100, isUnlimited ? Math.max(10, (quota.count5h / 200) * 100) : (quota.count5h / quota.max5h) * 100)}%` }}
                />
              </div>
              {!isUnlimited && quota.count5h > 0 && (
                <p className="text-[10px] text-zinc-500 mt-0.5">Renova {quota.resetTimeFormatted}</p>
              )}
            </div>

            {/* Limite Semanal */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-300">Semana (7 dias):</span>
                <span className="font-bold text-white">
                  {quota.countWeek} {isUnlimited ? 'usadas' : `/ ${quota.maxWeek}`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${Math.min(100, isUnlimited ? Math.max(5, (quota.countWeek / 5000) * 100) : (quota.countWeek / quota.maxWeek) * 100)}%` }}
                />
              </div>
            </div>

            {/* Limite Mensal */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-300">Mês (30 dias):</span>
                <span className="font-bold text-white">
                  {quota.countMonth} {isUnlimited ? 'usadas' : `/ ${quota.maxMonth}`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${Math.min(100, isUnlimited ? Math.max(5, (quota.countMonth / 20000) * 100) : (quota.countMonth / quota.maxMonth) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-panel-border/60 text-[10px] text-zinc-400 flex items-center justify-between">
            <span className="capitalize">Plano ativo: <strong className="text-zinc-200">{userPlan}</strong></span>
            {!isUnlimited && onOpenUpgrade && (
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  onOpenUpgrade();
                }}
                className="text-accent-purple hover:underline font-bold cursor-pointer"
              >
                Ver Planos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
