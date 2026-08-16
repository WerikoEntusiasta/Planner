/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Post, Platform, HolidayEvent } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedPost, getTranslatedFormat } from '../utils/postTranslations';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Settings, Download, Printer, Share2, Award, Sparkles, Rocket } from 'lucide-react';
import CalendarAnalysisModal from './CalendarAnalysisModal';

interface CalendarViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onAddPostToDate: (dateStr: string) => void;
  onOpenCampaignsModal?: () => void;
}

const SMART_HOLIDAYS: HolidayEvent[] = [
  { id: 'h1', date: '06-12', title: 'Dia dos Namorados', category: 'comemorativa', suggestionHook: 'Procurando o presente perfeito? Confira nossa seleção especial!', funnelStage: 'BOFU' },
  { id: 'h2', date: '08-09', title: 'Dia dos Pais', category: 'comemorativa', suggestionHook: 'Dia dos Pais chegando! 3 ideias de presentes memoráveis.', funnelStage: 'BOFU' },
  { id: 'h3', date: '09-15', title: 'Dia do Cliente', category: 'comemorativa', suggestionHook: 'Nosso agradecimento especial para quem faz nossa história acontecer!', funnelStage: 'MOFU' },
  { id: 'h4', date: '10-12', title: 'Dia das Crianças', category: 'comemorativa', suggestionHook: 'Alegria e ofertas especiais para comemorar em família!', funnelStage: 'TOFU' },
  { id: 'h5', date: '11-27', title: 'Black Friday 2026', category: 'lancamento', suggestionHook: 'A maior oferta do ano está prestes a começar! Cadastre-se na lista VIP.', funnelStage: 'BOFU' },
  { id: 'h6', date: '12-25', title: 'Natal', category: 'comemorativa', suggestionHook: 'Desejamos boas festas e um ano novo repleto de conquistas!', funnelStage: 'TOFU' },
];

export default function CalendarView({
  posts,
  onPostClick,
  onAddPostToDate,
  onOpenCampaignsModal
}: CalendarViewProps) {
  const { t } = useLanguage();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, so 5 = June
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedHolidayAlert, setSelectedHolidayAlert] = useState<HolidayEvent | null>(SMART_HOLIDAYS[1]);

  const monthNames = [
    t('january', 'Janeiro'),
    t('february', 'Fevereiro'),
    t('march', 'Março'),
    t('april', 'Abril'),
    t('may', 'Maio'),
    t('june', 'Junho'),
    t('july', 'Julho'),
    t('august', 'Agosto'),
    t('september', 'Setembro'),
    t('october', 'Outubro'),
    t('november', 'Novembro'),
    t('december', 'Dezembro')
  ];

  const daysOfWeek = [
    t('sun', 'Dom'),
    t('mon', 'Seg'),
    t('tue', 'Ter'),
    t('wed', 'Qua'),
    t('thu', 'Qui'),
    t('fri', 'Sex'),
    t('sat', 'Sáb')
  ];

  // Fetch count of days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Fetch weekday of first day in month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Format date helper YYYY-MM-DD
  const formatDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Filter posts that belong to a specific day
  const getPostsForDay = (day: number) => {
    const formattedStr = formatDateString(day);
    return posts.filter(p => p.scheduledDate === formattedStr);
  };

  // Platform badges builder
  const renderMiniBadge = (post: Post) => {
    const translatedPost = getTranslatedPost(post, t);
    let platformBg = '';
    let iconLabel = '';

    switch (post.platform) {
      case 'instagram':
        platformBg = 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple-light hover:bg-accent-purple/35';
        iconLabel = 'IG';
        break;
      case 'youtube':
        platformBg = 'bg-accent-orange/20 border-accent-orange/40 text-accent-orange hover:bg-accent-orange/35';
        iconLabel = 'YT';
        break;
      case 'tiktok':
        platformBg = 'bg-white/10 border-zinc-700 text-zinc-100 hover:bg-white/20';
        iconLabel = 'TT';
        break;
    }

    return (
      <div
        key={post.id}
        onClick={(e) => {
          e.stopPropagation(); // Prevents opening date dialog
          onPostClick(post);
        }}
        className={`flex items-center gap-1 p-1 px-1.5 rounded-md border text-[10px] sm:text-xs font-medium cursor-pointer transition-all truncate group-hover:shadow ${platformBg}`}
        title={`${post.platform} [${getTranslatedFormat(post.format, t)}]: ${translatedPost.title}`}
      >
        <span className="font-mono font-bold uppercase text-[8px] sm:text-[9px] scale-90 tracking-tighter opacity-75">{iconLabel}</span>
        <span className="truncate leading-none">{translatedPost.title}</span>
        <span className="ml-auto font-mono text-[9px] opacity-60 shrink-0">{post.scheduledTime}</span>
      </div>
    );
  };

  // Generate blank grids spacer and days grid
  const renderCells = () => {
    const cells = [];

    // Prior month days for padding
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const priorDay = prevMonthDays - i;
      cells.push(
        <div
          key={`prev-pad-${priorDay}`}
          className="bg-panel-card/10 border border-panel-border/30 p-2 min-h-[90px] sm:min-h-[120px] opacity-25 text-left text-xs text-zinc-600 select-none cursor-not-allowed"
        >
          {priorDay}
        </div>
      );
    }

    // Active month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = currentYear === 2026 && currentMonth === 5 && day === 14; // Highlight June 14, 2026 (User Current Local Date)
      const dateStr = formatDateString(day);
      const dayPosts = getPostsForDay(day);

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => onAddPostToDate(dateStr)}
          className={`bg-panel-card hover:bg-panel-card-hover border border-panel-border/60 p-2 min-h-[90px] sm:min-h-[120px] transition-all flex flex-col justify-between text-left group cursor-pointer relative ${
            isToday ? 'outline outline-2 outline-offset-1 outline-accent-purple/80 bg-gradient-to-tr from-panel-card via-panel-card to-accent-purple/5' : ''
          }`}
        >
          {/* Day number and rapid creator icon */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold ${isToday ? 'bg-accent-purple text-white px-2 py-0.5 rounded-full shadow-md font-black' : 'text-zinc-400'}`}>
              {day}
            </span>
            <span className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-zinc-500 hover:text-white transition-all">
              <Plus size={12} />
            </span>
          </div>

          {/* Planned Posts list on this day */}
          <div className="flex-1 mt-2 space-y-1 overflow-y-auto max-h-[80px] sm:max-h-[100px] scrollbar-thin">
            {dayPosts.map(p => renderMiniBadge(p))}
          </div>
        </div>
      );
    }

    // Next month padding to balance grid rows
    const totalBoxesSoFar = cells.length;
    const remainingTo42 = 42 - totalBoxesSoFar;
    for (let i = 1; i <= remainingTo42; i++) {
      cells.push(
        <div
          key={`next-pad-${i}`}
          className="bg-panel-card/10 border border-panel-border/30 p-2 min-h-[90px] sm:min-h-[120px] opacity-25 text-left text-xs text-zinc-600 select-none cursor-not-allowed"
        >
          {i}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="bg-panel-card border border-panel-border rounded-2xl p-5 space-y-4 select-none">
      
      {/* Smart Proactive Holiday Alert Banner */}
      {selectedHolidayAlert && (
        <div className="bg-gradient-to-r from-accent-purple/20 via-zinc-900 to-accent-orange/20 border border-accent-purple/30 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-yellow-400/10 text-yellow-400 rounded-lg border border-yellow-400/20">
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <div>
              <span className="text-[10px] font-mono font-bold text-accent-orange uppercase tracking-wider block">
                Calendário Inteligente • Data Comemorativa em Destaque
              </span>
              <h4 className="text-xs font-bold text-white">
                {selectedHolidayAlert.title} está chegando no calendário!
              </h4>
              <p className="text-[11px] text-zinc-300 italic">
                "{selectedHolidayAlert.suggestionHook}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenCampaignsModal && (
              <button
                onClick={onOpenCampaignsModal}
                className="px-3 py-1.5 bg-accent-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                <Rocket size={13} /> Criar Campanha
              </button>
            )}
            <button
              onClick={() => onAddPostToDate(`2026-${selectedHolidayAlert.date}`)}
              className="px-3 py-1.5 bg-accent-purple hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
            >
              <Plus size={13} /> Gerar Post
            </button>
          </div>
        </div>
      )}

      {/* Calendar Controller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-panel-border/60">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-gradient-to-tr from-accent-purple to-accent-orange text-white rounded-xl shadow border border-panel-border">
            <CalIcon size={16} />
          </span>
          <div>
            <h3 className="text-base font-display font-black text-white leading-none">
              {t('calendar', 'Calendário Editorial')}
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">{t('clickDayTip', 'Clique em qualquer dia para criar posts rápidos')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-accent-purple/20 to-accent-orange/20 hover:from-accent-purple/30 hover:to-accent-orange/30 text-white text-xs font-bold rounded-xl border border-accent-purple/40 flex items-center gap-1.5 transition-all shadow-md"
            title="Ver Score do Calendário e Diagnóstico de Equilíbrio"
          >
            <Award size={14} className="text-yellow-400" />
            Score do Calendário
          </button>

          <button
            onClick={() => {
              if (posts.length === 0) return alert('Nenhum post agendado para exportar.');
              let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Planner Social Media//PT\n";
              posts.forEach(p => {
                const cleanDate = (p.scheduledDate || '2026-06-01').replace(/-/g, '');
                const timeStr = (p.scheduledTime || '18:00').replace(':', '') + '00';
                icsContent += `BEGIN:VEVENT\nSUMMARY:[${p.platform.toUpperCase()}] ${p.title}\nDESCRIPTION:${p.hookText || p.description || ''}\nDTSTART:${cleanDate}T${timeStr}\nEND:VEVENT\n`;
              });
              icsContent += "END:VCALENDAR";

              const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'cronograma_posts_planner.ics');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-panel-border flex items-center gap-1.5 transition-all"
            title="Sincronizar com Google Calendar ou Apple Calendar"
          >
            <Download size={13} className="text-accent-purple" />
            Exportar .ICS
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-panel-border flex items-center gap-1.5 transition-all"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer size={13} className="text-accent-blue" />
            PDF / Imprimir
          </button>

          {/* Navigation togglers */}
          <div className="flex items-center gap-1 p-0.5 bg-panel-black rounded-lg border border-panel-border">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-xs font-display font-medium text-white px-3 min-w-[100px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-widest bg-panel-black/50 py-2 rounded-lg border border-panel-border/30">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Numeric Date Grids */}
      <div className="grid grid-cols-7 gap-1.5">
        {renderCells()}
      </div>

      {/* Calendar Score & Diagnostic Modal */}
      <CalendarAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        posts={posts}
        onQuickAddSuggestedPost={(funnel, format) => {
          onAddPostToDate('2026-06-15');
        }}
      />

    </div>
  );
}
