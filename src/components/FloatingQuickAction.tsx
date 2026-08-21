import React, { useState } from 'react';
import { Plus, Sparkles, Share2, Palette, Rocket, X, FileText, ChevronUp } from 'lucide-react';

interface FloatingQuickActionProps {
  onNewPost: () => void;
  onOpenApprovalLink: () => void;
  onOpenBrandKit: () => void;
  onOpenCampaigns: () => void;
  onOpenReferenceHub: () => void;
}

export default function FloatingQuickAction({
  onNewPost,
  onOpenApprovalLink,
  onOpenBrandKit,
  onOpenCampaigns,
  onOpenReferenceHub,
}: FloatingQuickActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none print:hidden">
      {/* Expanded Menu Actions */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 mb-2 animate-fade-in">
          {/* 1. New Post */}
          <button
            onClick={() => {
              setIsOpen(false);
              onNewPost();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-accent-purple to-accent-orange text-white text-xs font-bold shadow-xl hover:opacity-90 transition-all cursor-pointer border border-white/10 group"
          >
            <span className="font-medium group-hover:underline">Criar Post / Roteiro</span>
            <div className="p-1 rounded-lg bg-white/20">
              <Plus size={14} strokeWidth={3} />
            </div>
          </button>

          {/* 2. Client Approval Link */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenApprovalLink();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-200 hover:text-white text-xs font-medium shadow-xl hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-700 group"
          >
            <span className="group-hover:underline">Link de Aprovação do Cliente</span>
            <div className="p-1 rounded-lg bg-accent-orange/20 text-accent-orange">
              <Share2 size={14} />
            </div>
          </button>

          {/* 3. Brand Kit */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenBrandKit();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-200 hover:text-white text-xs font-medium shadow-xl hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-700 group"
          >
            <span className="group-hover:underline">Kit de Marca & Cores</span>
            <div className="p-1 rounded-lg bg-accent-blue/20 text-accent-blue">
              <Palette size={14} />
            </div>
          </button>

          {/* 4. Campaigns */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCampaigns();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-zinc-200 hover:text-white text-xs font-medium shadow-xl hover:bg-zinc-800 transition-all cursor-pointer border border-zinc-700 group"
          >
            <span className="group-hover:underline">Campanhas Multicanal</span>
            <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400">
              <Rocket size={14} />
            </div>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3.5 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20 ${
          isOpen
            ? 'bg-zinc-800 text-white rotate-45 hover:bg-zinc-700 scale-105 ring-4 ring-accent-purple/30'
            : 'bg-gradient-to-tr from-accent-purple via-pink-500 to-accent-orange text-white hover:scale-110 active:scale-95 shadow-accent-purple/30'
        }`}
        title={isOpen ? "Fechar Menu Rápido" : "Ações Rápidas (+ Criar)"}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
