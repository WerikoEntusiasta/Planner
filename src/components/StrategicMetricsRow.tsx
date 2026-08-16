/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Post, WeeklyGoal, Platform } from '../types';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface StrategicMetricsRowProps {
  posts: Post[];
  goals: WeeklyGoal[];
  onToggleGoal: (id: string) => void;
  onAddGoal: (title: string, platform: Platform) => void;
}

export default function StrategicMetricsRow({
  posts,
  goals,
  onToggleGoal,
  onAddGoal,
}: StrategicMetricsRowProps) {
  const { t } = useLanguage();
  const [newGoalText, setNewGoalText] = useState('');
  const [selectedGoalPlatform, setSelectedGoalPlatform] = useState<Platform>('instagram');

  const total = posts.length || 1;
  const instagramCount = posts.filter(p => p.platform === 'instagram').length;
  const tiktokCount = posts.filter(p => p.platform === 'tiktok').length;
  const youtubeCount = posts.filter(p => p.platform === 'youtube').length;

  const instagramPercentage = Math.round((instagramCount / total) * 100);
  const tiktokPercentage = Math.round((tiktokCount / total) * 100);
  const youtubePercentage = Math.round((youtubeCount / total) * 100);

  const tofuCount = posts.filter(p => p.funnelStage === 'TOFU').length;
  const mofuCount = posts.filter(p => p.funnelStage === 'MOFU').length;
  const bofuCount = posts.filter(p => p.funnelStage === 'BOFU').length;

  const tofuPercentage = Math.round((tofuCount / total) * 100);
  const mofuPercentage = Math.round((mofuCount / total) * 100);
  const bofuPercentage = Math.round((bofuCount / total) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. MARKETING FUNNEL STATUS */}
      <div className="bg-panel-card border border-panel-border p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-20 h-20 bg-accent-orange/10 rounded-full blur-xl" />
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <TrendingUp size={13} className="text-accent-orange" />
            {t('funnelMetrics', 'Métricas de Funil (Estratégia)')}
          </h4>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">{t('topAttraction', 'TOFU (Topo/Atração)')}</span>
                <span className="font-mono text-zinc-400 font-extrabold">{tofuPercentage}%</span>
              </div>
              <div className="w-full bg-panel-black h-1.5 rounded-full overflow-hidden border border-panel-border/30">
                <div className="bg-gradient-to-r from-accent-purple to-zinc-200 h-full rounded-full transition-all duration-500" style={{ width: `${tofuPercentage}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">{t('midNurturing', 'MOFU (Meio/Engajamento)')}</span>
                <span className="font-mono text-zinc-400 font-extrabold">{mofuPercentage}%</span>
              </div>
              <div className="w-full bg-panel-black h-1.5 rounded-full overflow-hidden border border-panel-border/30">
                <div className="bg-accent-purple h-full rounded-full transition-all duration-500" style={{ width: `${mofuPercentage}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-300 font-medium">{t('botConversion', 'BOFU (Fundo/Conversão)')}</span>
                <span className="font-mono text-zinc-400 font-extrabold">{bofuPercentage}%</span>
              </div>
              <div className="w-full bg-panel-black h-1.5 rounded-full overflow-hidden border border-panel-border/30">
                <div className="bg-accent-orange h-full rounded-full transition-all duration-500" style={{ width: `${bofuPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-zinc-500 font-mono mt-3 uppercase leading-relaxed border-t border-panel-border/40 pt-2">
          {t('funnelTip', '💡 Dica: Mantenha 50% TOFU, 30% MOFU e 20% BOFU para atrair e converter.')}
        </p>
      </div>

      {/* 2. CHANNELS DISTRIBUTION LIST */}
      <div className="bg-panel-card border border-panel-border p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-purple/10 rounded-full blur-2xl" />
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Target size={13} className="text-accent-purple" />
            {t('mediaRatio', 'Relação de Mídia')}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-accent-purple/10 text-accent-purple border border-accent-purple/20 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-zinc-300">Instagram</span>
                  <span className="font-mono text-[10px] text-zinc-400">{instagramCount} ({instagramPercentage}%)</span>
                </div>
                <div className="w-full bg-panel-black h-1 rounded-full mt-1">
                  <div className="bg-accent-purple h-full rounded-full" style={{ width: `${instagramPercentage}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-white/10 text-white border border-white/25 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-zinc-300">TikTok</span>
                  <span className="font-mono text-[10px] text-zinc-400">{tiktokCount} ({tiktokPercentage}%)</span>
                </div>
                <div className="w-full bg-panel-black h-1 rounded-full mt-1">
                  <div className="bg-white h-full rounded-full" style={{ width: `${tiktokPercentage}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-accent-orange/10 text-accent-orange border border-accent-orange/20 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                </svg>
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-zinc-300">YouTube</span>
                  <span className="font-mono text-[10px] text-zinc-400">{youtubeCount} ({youtubePercentage}%)</span>
                </div>
                <div className="w-full bg-panel-black h-1 rounded-full mt-1">
                  <div className="bg-accent-orange h-full rounded-full" style={{ width: `${youtubePercentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono mt-3 uppercase border-t border-panel-border/40 pt-2">
          Distribuição multiplataforma ativa
        </div>
      </div>

      {/* 3. WEEKLY CREATIVE GOALS */}
      <div className="bg-panel-card border border-panel-border p-5 rounded-2xl flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={13} className="text-accent-purple" />
            {t('weeklyGoals', 'Metas Semanais')}
          </h4>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {goals.map((g) => {
              const isCompleted = g.completed;
              return (
                <div
                  key={g.id}
                  onClick={() => onToggleGoal(g.id)}
                  className="flex items-center justify-between p-2 rounded-xl border border-panel-border/60 bg-panel-black/40 hover:bg-panel-black/80 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-left truncate">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center ${isCompleted ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'border-zinc-600'}`}>
                      {isCompleted && <span className="w-2 h-2 rounded-full bg-accent-purple" />}
                    </span>
                    <span className={`text-xs truncate ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {g.title}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    g.platform === 'instagram' ? 'text-accent-purple bg-accent-purple/10' : g.platform === 'youtube' ? 'text-accent-orange bg-accent-orange/10' : 'text-white bg-zinc-800'
                  }`}>
                    {g.platform === 'instagram' ? 'IG' : g.platform === 'youtube' ? 'YT' : 'TT'}
                  </span>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="text-center py-2 text-zinc-500 text-xs">
                {t('noGoals', 'Nenhuma meta definida.')}
              </div>
            )}
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newGoalText.trim()) {
              onAddGoal(newGoalText.trim(), selectedGoalPlatform);
              setNewGoalText('');
            }
          }} 
          className="mt-3 pt-2 border-t border-panel-border/40 space-y-2"
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedGoalPlatform('instagram')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                selectedGoalPlatform === 'instagram' ? 'bg-accent-purple text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-panel-border'
              }`}
            >
              IG
            </button>
            <button
              type="button"
              onClick={() => setSelectedGoalPlatform('tiktok')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                selectedGoalPlatform === 'tiktok' ? 'bg-white text-zinc-950 shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-panel-border'
              }`}
            >
              TT
            </button>
            <button
              type="button"
              onClick={() => setSelectedGoalPlatform('youtube')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                selectedGoalPlatform === 'youtube' ? 'bg-accent-orange text-white shadow-sm' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-panel-border'
              }`}
            >
              YT
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nova meta semanal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              className="flex-1 bg-zinc-900 border border-panel-border rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-purple"
            />
            <button
              type="submit"
              disabled={!newGoalText.trim()}
              className="px-3 py-1 rounded-lg bg-zinc-800 border border-panel-border text-white text-xs font-bold hover:bg-zinc-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
