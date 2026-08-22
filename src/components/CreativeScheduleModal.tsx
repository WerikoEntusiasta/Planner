import React, { useState } from 'react';
import { Creative } from '../types';
import { motion } from 'motion/react';
import { Calendar, Clock, X, Check, ArrowRight } from 'lucide-react';

interface CreativeScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  creative: Creative | null;
  onConfirmSchedule: (creative: Creative, scheduledDate: string, scheduledTime: string) => void;
}

export default function CreativeScheduleModal({
  isOpen,
  onClose,
  creative,
  onConfirmSchedule
}: CreativeScheduleModalProps) {
  const [date, setDate] = useState<string>(() => {
    if (creative?.scheduledDate) return creative.scheduledDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [time, setTime] = useState<string>(() => {
    return creative?.scheduledTime || '18:00';
  });

  if (!isOpen || !creative) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    onConfirmSchedule(creative, date, time);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#121218] border border-[#24242D] max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#24242D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-display">
                Agendar Publicação
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                {creative.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-[#17171F] border border-[#24242D] rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Cliente / Formato</span>
            <div className="text-xs text-white flex items-center justify-between">
              <span className="font-semibold">{creative.clientName || 'Cliente'}</span>
              <span className="text-zinc-400 capitalize">{creative.format} • {creative.platform}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-purple-400" />
                <span>Data</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-purple-400" />
                <span>Horário</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-[#17171F] border border-[#24242D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          <p className="text-[11px] text-zinc-400">
            💡 Ao agendar, o criativo será movido para o submenu <strong>Agendados</strong>, mantendo sua esteira de aprovação limpa.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24242D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#17171F] hover:bg-[#20202B] text-zinc-300 border border-[#24242D] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Check size={14} />
              <span>Confirmar Agendamento</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
