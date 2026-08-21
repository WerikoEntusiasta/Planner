/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Download, CreditCard, CheckCircle2, Shield, Sparkles, X, FileText } from 'lucide-react';
import { User, Client, Post, WeeklyGoal } from '../types';
import { exportWorkspaceData, exportPostsCSV, TrialStatus } from '../utils/trialUtils';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  clients: Client[];
  posts: Post[];
  goals: WeeklyGoal[];
  onOpenPricing: () => void;
  trialStatus: TrialStatus;
}

export default function TrialExpiredModal({
  isOpen,
  onClose,
  currentUser,
  clients,
  posts,
  goals,
  onOpenPricing,
  trialStatus,
}: TrialExpiredModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    exportWorkspaceData({
      user: currentUser,
      clients,
      posts,
      goals,
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleDownloadCSV = () => {
    exportPostsCSV(posts, clients);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 sm:p-8 relative text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border/40 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-accent-orange shadow-lg">
          <Lock size={28} className="animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold mb-2 uppercase">
          Período de Teste Grátis Encerrado
        </div>

        <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
          Seu workspace está em Modo de Apenas Visualização
        </h3>

        <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed max-w-md mx-auto">
          Os <strong>15 dias de teste grátis</strong> do plano <strong>{trialStatus.plan.toUpperCase()}</strong> chegaram ao fim. Todas as suas postagens, marcas e planejamentos estão 100% salvos e seguros!
        </p>

        {/* Stats summary of preserved data */}
        <div className="my-5 p-3.5 bg-zinc-900/80 border border-panel-border rounded-xl grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <span className="block text-base font-bold text-white">{clients.length}</span>
            <span className="text-[10px] text-zinc-400">Marcas</span>
          </div>
          <div>
            <span className="block text-base font-bold text-accent-purple">{posts.length}</span>
            <span className="text-[10px] text-zinc-400">Posts Salvos</span>
          </div>
          <div>
            <span className="block text-base font-bold text-emerald-400">{goals.length}</span>
            <span className="text-[10px] text-zinc-400">Metas</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Unlock Subscription Button */}
          <button
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard size={18} />
            <span>Ativar Assinatura & Desbloquear Edição</span>
          </button>

          {/* Download Data Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span className="text-emerald-300">Backup Baixado!</span>
                </>
              ) : (
                <>
                  <Download size={15} className="text-accent-orange" />
                  <span>Baixar Meus Dados (JSON)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCSV}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Baixar planilha CSV"
            >
              <FileText size={14} className="text-blue-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Assurance Notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <Shield size={12} className="text-emerald-500" />
          <span>Seus dados nunca serão apagados ou perdidos.</span>
        </div>

      </motion.div>
    </div>
  );
}
