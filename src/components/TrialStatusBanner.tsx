/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Clock, Lock, Download, CreditCard, ChevronRight, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { TrialStatus, exportWorkspaceData, exportPostsCSV } from '../utils/trialUtils';
import { User, Client, Post, WeeklyGoal } from '../types';

interface TrialStatusBannerProps {
  trialStatus: TrialStatus;
  currentUser?: User | null;
  clients: Client[];
  posts: Post[];
  goals: WeeklyGoal[];
  onOpenPricingModal: () => void;
}

export default function TrialStatusBanner({
  trialStatus,
  currentUser,
  clients,
  posts,
  goals,
  onOpenPricingModal,
}: TrialStatusBannerProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // If user is on lifetime free or is a paid subscriber, no banner is needed
  if (trialStatus.isLifetimeFree || !trialStatus.isTrial) {
    return null;
  }

  const handleDownloadBackup = () => {
    setIsExporting(true);
    try {
      exportWorkspaceData({
        user: currentUser,
        clients,
        posts,
        goals,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Error exporting backup:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    try {
      exportPostsCSV(posts, clients);
    } catch (e) {
      console.error('Error exporting CSV:', e);
    }
  };

  // EXPIRED TRIAL: Lock Notice & Call To Action
  if (trialStatus.isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-950/90 via-amber-950/90 to-red-950/90 border-b border-red-500/30 px-4 py-3 sm:px-6 text-white shadow-xl flex-shrink-0 animate-fade-in">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Message */}
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
              <Lock size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded">
                  Modo Somente Visualização
                </span>
                <span className="text-xs font-bold text-red-200">
                  Período de teste grátis de 15 dias encerrado ({trialStatus.plan.toUpperCase()})
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Seus conteúdos e clientes estão preservados! Para criar ou editar novos posts, ative sua assinatura. Você também pode exportar todos os seus dados.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
            {/* Download Backup Button */}
            <div className="relative inline-flex items-center gap-1">
              <button
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
                title="Baixar backup completo de posts e clientes (JSON)"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-emerald-300">Backup Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className="text-accent-orange" />
                    <span>Baixar Meus Dados (JSON)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-all shadow-sm cursor-pointer"
                title="Exportar tabela de posts em CSV"
              >
                <FileText size={13} className="text-blue-400" />
                <span>CSV</span>
              </button>
            </div>

            {/* Subscribe CTA */}
            <button
              onClick={onOpenPricingModal}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <CreditCard size={14} />
              <span>Ativar Assinatura & Desbloquear</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ACTIVE TRIAL: Countdown Notice
  return (
    <div className="bg-gradient-to-r from-accent-purple/20 via-zinc-900 to-accent-purple/15 border-b border-accent-purple/30 px-4 py-2 sm:px-6 text-zinc-200 shadow-md flex-shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Trial Badge & Days left */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-purple/20 border border-accent-purple/40 text-accent-purple text-[10px] font-mono font-bold uppercase">
            <Sparkles size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
            Teste Grátis 15 Dias ({trialStatus.plan.toUpperCase()})
          </span>
          <div className="flex items-center gap-1 text-zinc-300 font-medium">
            <Clock size={13} className="text-accent-orange flex-shrink-0" />
            <span>
              Restam <strong className="text-accent-orange font-bold font-mono">{trialStatus.daysLeft} {trialStatus.daysLeft === 1 ? 'dia' : 'dias'}</strong> de teste gratuito sem cartão.
            </span>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="text-[11px] font-mono text-zinc-400 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            title="Fazer backup dos seus dados"
          >
            <Download size={12} />
            <span>Fazer Backup</span>
          </button>
          <button
            onClick={onOpenPricingModal}
            className="px-3 py-1 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-[11px] font-bold transition-all shadow cursor-pointer flex items-center gap-1"
          >
            <span>Assinar Plano Definitivo</span>
            <ChevronRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}
