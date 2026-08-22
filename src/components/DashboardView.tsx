import React, { useState } from 'react';
import { Post, Platform, FunnelStage, ContentFormat } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Sparkles, BarChart2, TrendingUp, Target, Award, Info, AlertCircle, RefreshCw, Zap, Users, ShieldCheck, Share2 } from 'lucide-react';

interface DashboardViewProps {
  posts: Post[];
}

export default function DashboardView({ posts }: DashboardViewProps) {
  const { t } = useLanguage();
  const [selectedMetricTab, setSelectedMetricTab] = useState<'overview' | 'formats' | 'funnel' | 'efficiency'>('overview');

  // 1. DATA COMPUTATION & AGGREGATION
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published');
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const productionPosts = posts.filter(p => p.status === 'production' || (p.productionStage && p.productionStage !== 'published'));

  // Calculate overdue posts (date in past and not published)
  const todayStr = '2026-06-14'; // Simulation baseline date
  const overduePosts = posts.filter(p => p.scheduledDate < todayStr && p.status !== 'published');

  // Weekly & Monthly production calculation
  const weeklyProduction = posts.filter(p => {
    return p.scheduledDate >= '2026-06-08' && p.scheduledDate <= '2026-06-14';
  });

  const monthlyProduction = posts.filter(p => {
    return p.scheduledDate && p.scheduledDate.startsWith('2026-06');
  });

  // Platform Counts
  const platformData = [
    { name: 'Instagram', rascunho: 0, agendado: 0, publicado: 0, total: 0 },
    { name: 'TikTok', rascunho: 0, agendado: 0, publicado: 0, total: 0 },
    { name: 'YouTube', rascunho: 0, agendado: 0, publicado: 0, total: 0 },
  ];

  posts.forEach(p => {
    const idx = p.platform === 'instagram' ? 0 : p.platform === 'tiktok' ? 1 : 2;
    platformData[idx].total += 1;
    if (p.status === 'draft') platformData[idx].rascunho += 1;
    else if (p.status === 'scheduled') platformData[idx].agendado += 1;
    else if (p.status === 'published') platformData[idx].publicado += 1;
  });

  // Funnel Stage Counts
  const funnelCounts = { TOFU: 0, MOFU: 0, BOFU: 0 };
  posts.forEach(p => {
    if (funnelCounts[p.funnelStage] !== undefined) {
      funnelCounts[p.funnelStage] += 1;
    }
  });

  const funnelData = [
    { name: getTranslatedStage('TOFU', t), value: funnelCounts.TOFU, color: '#F59E0B' }, // Amber
    { name: getTranslatedStage('MOFU', t), value: funnelCounts.MOFU, color: '#8B5CF6' }, // Purple
    { name: getTranslatedStage('BOFU', t), value: funnelCounts.BOFU, color: '#F97316' }, // Orange
  ];

  // Quality / Completeness score calculation (Strategic Metric)
  const calculatePostScore = (p: Post): number => {
    let score = 30; // base score for having a title
    if (p.description && p.description.trim().length > 10) score += 20;
    if (p.hookText && p.hookText.trim().length > 5) score += 15;
    if (p.scriptText && p.scriptText.trim().length > 10) score += 20;
    if (p.hashtags && p.hashtags.length > 0) score += 10;
    if (p.visualIdea && p.visualIdea.trim().length > 5) score += 5;
    return score;
  };

  const averageScore = totalPosts > 0
    ? Math.round(posts.reduce((sum, p) => sum + calculatePostScore(p), 0) / totalPosts)
    : 85;

  // Format Performance Industry Benchmarks
  const formatReachMultiplier: Record<ContentFormat, { name: string; reach: number; engagement: number }> = {
    reels: { name: getTranslatedFormat('reels', t), reach: 2450, engagement: 8.9 },
    shorts: { name: getTranslatedFormat('shorts', t), reach: 1950, engagement: 7.6 },
    video: { name: getTranslatedFormat('video', t), reach: 1320, engagement: 9.8 },
    carousel: { name: getTranslatedFormat('carousel', t), reach: 1780, engagement: 12.4 },
    stories: { name: getTranslatedFormat('stories', t), reach: 520, engagement: 18.2 },
    live: { name: 'Live', reach: 890, engagement: 24.1 },
    email: { name: 'Email Marketing', reach: 950, engagement: 26.5 },
    ad: { name: 'Anúncio Pago', reach: 6200, engagement: 5.2 },
    landing_page: { name: 'Landing Page', reach: 1450, engagement: 16.0 },
  };

  const formatStats = Object.entries(formatReachMultiplier).map(([key, benchmark]) => {
    const formatCount = posts.filter(p => p.format === key).length;
    return {
      formatKey: key,
      format: benchmark.name,
      posts: formatCount,
      alcanceEstimado: formatCount * benchmark.reach,
      engajamentoMedio: benchmark.engagement,
    };
  }).filter(item => item.posts > 0 || totalPosts === 0);

  const totalEstimatedReach = formatStats.reduce((sum, item) => sum + item.alcanceEstimado, 0) || (totalPosts * 1850);
  const averageEngagementRate = formatStats.length > 0
    ? (formatStats.reduce((sum, item) => sum + item.engajamentoMedio, 0) / formatStats.length).toFixed(1)
    : '11.8';

  // Consistency timeline - group scheduled posts by date
  const dateMap: Record<string, number> = {};
  posts.forEach(p => {
    if (p.scheduledDate) {
      dateMap[p.scheduledDate] = (dateMap[p.scheduledDate] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(dateMap).sort();
  const timelineData = sortedDates.map(date => {
    const parts = date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
    return {
      data: formattedDate,
      posts: dateMap[date],
    };
  });

  const displayTimelineData = timelineData.length > 0 ? timelineData : [
    { data: 'Seg', posts: 1 },
    { data: 'Ter', posts: 2 },
    { data: 'Qua', posts: 1 },
    { data: 'Qui', posts: 3 },
    { data: 'Sex', posts: 2 },
    { data: 'Sáb', posts: 1 },
    { data: 'Dom', posts: 1 },
  ];

  // Workflow specific metrics computation
  const scriptsTotal = posts.filter(p => p.scriptText && p.scriptText.trim().length > 0).length;
  const scriptsPending = posts.filter(p => p.approvalStatus === 'pending' || (p.productionStage === 'script' && p.approvalStatus !== 'approved')).length;
  const scriptsApproved = posts.filter(p => p.approvalStatus === 'approved' || p.productionStage === 'approved').length;

  const creativesTotal = posts.filter(p => p.visualIdea || p.coverThumbnail || p.format === 'carousel' || p.format === 'video' || p.format === 'reels').length;
  const creativesProduction = posts.filter(p => p.productionStage === 'recording' || p.productionStage === 'editing' || p.status === 'production').length;
  const creativesApproved = posts.filter(p => p.approvalStatus === 'approved').length;

  const scheduledOAuthCount = posts.filter(p => p.status === 'scheduled' && p.connectedAccountId).length;
  const publishedCount = publishedPosts.length;
  const overdueCount = overduePosts.length;

  // Funnel Health percentages
  const tofuPercent = totalPosts > 0 ? Math.round((funnelCounts.TOFU / totalPosts) * 100) : 45;
  const mofuPercent = totalPosts > 0 ? Math.round((funnelCounts.MOFU / totalPosts) * 100) : 35;
  const bofuPercent = totalPosts > 0 ? Math.round((funnelCounts.BOFU / totalPosts) * 100) : 20;

  let funnelHealthText = 'Seu funil está equilibrado! Excelente distribuição estratégica.';
  let funnelHealthType: 'success' | 'warning' | 'info' = 'success';

  if (totalPosts > 0) {
    if (tofuPercent < 35) {
      funnelHealthText = 'Alerta: Pouco conteúdo de atração (TOFU). Crie mais posts de topo de funil para atrair novos seguidores.';
      funnelHealthType = 'warning';
    } else if (bofuPercent === 0) {
      funnelHealthText = 'Aviso: Você não tem posts de vendas/conversão (BOFU). Seus seguidores podem não saber o que você vende!';
      funnelHealthType = 'warning';
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HERO BANNER */}
      <div className="p-6 bg-gradient-to-r from-panel-card to-panel-black rounded-2xl border border-panel-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-accent-purple-glow to-transparent pointer-events-none" />
        <div className="text-left space-y-1.5 max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-2 bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-[10px] font-mono rounded">
            <BarChart2 size={11} /> {t('performanceAndMetrics', 'DESEMPENHO E MÉTRICAS')}
          </div>
          <h2 className="text-lg md:text-xl font-display font-black text-white">
            {t('strategicAnalysisTitle', 'Análise Estratégica do Seu Conteúdo')}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('strategicAnalysisSub', 'Monitore o equilíbrio do seu funil de vendas, compare a distribuição por canal, projeções de alcance orgânico e a consistência editorial.')}
          </p>
        </div>
        <div className="flex items-center gap-3 z-10 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-panel-border text-xs font-mono text-zinc-300 flex items-center gap-2">
            <Zap size={13} className="text-amber-400 animate-pulse" />
            <span>Score Editorial: <strong className="text-white">{averageScore}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500">{t('realtimeUpdated', 'Tempo Real')}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>
      </div>

      {/* METRIC TAB SELECTOR */}
      <div className="flex items-center gap-2 border-b border-panel-border pb-3 overflow-x-auto">
        <button
          onClick={() => setSelectedMetricTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedMetricTab === 'overview'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <BarChart2 size={14} />
          <span>Visão Geral & KPIs</span>
        </button>
        <button
          onClick={() => setSelectedMetricTab('formats')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedMetricTab === 'formats'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <TrendingUp size={14} />
          <span>Performance por Formato & Alcance</span>
        </button>
        <button
          onClick={() => setSelectedMetricTab('funnel')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedMetricTab === 'funnel'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <Target size={14} />
          <span>Funil Estratégico (TOFU/MOFU/BOFU)</span>
        </button>
        <button
          onClick={() => setSelectedMetricTab('efficiency')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedMetricTab === 'efficiency'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Saúde Editorial & Qualidade</span>
        </button>
      </div>

      {/* 2. GENERAL ADVANCED KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{t('plannedPosts', 'Posts Planejados')}</span>
            <span className="p-1.5 rounded-lg bg-accent-purple/10 text-accent-purple">
              <TrendingUp size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white">{totalPosts}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">{publishedPosts.length} {t('posted', 'postados')}</span>
              <span className="text-[9px] font-mono text-amber-400 font-semibold">{scheduledPosts.length} {t('scheduled', 'agendados')}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Estimated Reach */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Alcance Orgânico Projetado</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Share2 size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-emerald-400">
              {totalEstimatedReach.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">impressões</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              Taxa de Engajamento Média: <strong className="text-white">{averageEngagementRate}%</strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Weekly Production */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Produção da Semana</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Sparkles size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white">{weeklyProduction.length}</div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              Peças agendadas na semana atual
            </p>
          </div>
        </div>

        {/* KPI 4: Overdue / Quality */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Atrasados / Pendentes</span>
            <span className={`p-1.5 rounded-lg ${overduePosts.length > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <AlertCircle size={14} />
            </span>
          </div>
          <div>
            <div className={`text-2xl font-display font-black ${overduePosts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {overduePosts.length}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              {overduePosts.length > 0 ? 'Requer atenção imediata da equipe' : 'Tudo em dia no cronograma!'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. FUNNEL HEALTH STATUS ALERTER */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        funnelHealthType === 'success' 
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
          : funnelHealthType === 'warning' 
            ? 'bg-accent-orange/5 border-accent-orange/20 text-accent-orange' 
            : 'bg-accent-purple/5 border-accent-purple/20 text-accent-purple'
      }`}>
        <AlertCircle className="shrink-0 mt-0.5" size={16} />
        <div className="space-y-0.5 w-full">
          <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            {t('funnelEditorialHealth', 'Saúde Editorial do Funil')}
            <span className="px-1.5 py-0.2 text-[8px] font-mono rounded bg-white/10 text-white uppercase">{t('diagnosis', 'Diagnóstico')}</span>
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {funnelHealthText}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
            <div className="flex justify-between sm:block">
              <span>{t('attractionTofu', 'Atração (TOFU):')}</span> <strong className="text-white">{tofuPercent}%</strong> (Ideal: 50%)
            </div>
            <div className="flex justify-between sm:block">
              <span>{t('nurturingMofu', 'Nutrição (MOFU):')}</span> <strong className="text-white">{mofuPercent}%</strong> (Ideal: 30%)
            </div>
            <div className="flex justify-between sm:block">
              <span>{t('salesBofu', 'Venda (BOFU):')}</span> <strong className="text-white">{bofuPercent}%</strong> (Ideal: 20%)
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONAL WORKFLOW BREAKDOWN: SCRIPTS vs CREATIVES vs SCHEDULING/PUBLISHED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WORKFLOW 1: ROTEIROS & APROVAÇÃO */}
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-purple" />
              Roteiros & Aprovação
            </h3>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">Escritos</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-panel-border/60 text-center">
            <div className="p-2 rounded-xl bg-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 block">Total</span>
              <span className="text-base font-bold text-white font-mono">{scriptsTotal}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-mono text-amber-400 block">Em Aprovação</span>
              <span className="text-base font-bold text-amber-400 font-mono">{scriptsPending}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 block">Aprovados</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{scriptsApproved}</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Controle de criação textual e validação de ganchos e roteiros com o cliente.
          </p>
        </div>

        {/* WORKFLOW 2: CRIATIVOS & APROVAÇÃO */}
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-orange" />
              Criativos & Design
            </h3>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">Visuais</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-panel-border/60 text-center">
            <div className="p-2 rounded-xl bg-zinc-900/60">
              <span className="text-[10px] font-mono text-zinc-500 block">Total</span>
              <span className="text-base font-bold text-white font-mono">{creativesTotal}</span>
            </div>
            <div className="p-2 rounded-xl bg-accent-orange/10 border border-accent-orange/20">
              <span className="text-[10px] font-mono text-accent-orange block">Em Produção</span>
              <span className="text-base font-bold text-accent-orange font-mono">{creativesProduction}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 block">Aprovados</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{creativesApproved}</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Produção de carrosséis, vídeos, capas e aprovação visual por link único.
          </p>
        </div>

        {/* WORKFLOW 3: AGENDAMENTO & POSTADOS */}
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Agendados & Postados
            </h3>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">Publicação</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-panel-border/60 text-center">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-mono text-blue-400 block">Agendados</span>
              <span className="text-base font-bold text-blue-400 font-mono">{scheduledPosts.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20" title="Com conta Meta OAuth vinculada para disparo automático">
              <span className="text-[10px] font-mono text-purple-400 block">Auto-OAuth</span>
              <span className="text-base font-bold text-purple-400 font-mono">{scheduledOAuthCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 block">Publicados</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{publishedCount}</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">
            Disparos automáticos via Meta API e acompanhamento de posts já no ar.
          </p>
        </div>
      </div>

      {/* 4. CHARTS & DEEP METRICS SECTION */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'formats') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHART 1: PLATFORM DISTRIBUTION */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-white font-display">{t('presenceByChannel', 'Presença por Canal e Status')}</h3>
                <p className="text-[10px] text-zinc-500 font-mono">{t('volumeBySocial', 'Volume de postagens por rede social')}</p>
              </div>
              <span className="text-[10px] bg-zinc-900 border border-panel-border text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">{t('channels', 'Canais')}</span>
            </div>
            
            <div className="h-[260px] w-full flex items-center justify-center">
              {totalPosts === 0 ? (
                <div className="text-center p-6 text-zinc-500 space-y-1">
                  <Info size={16} className="mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs font-mono">{t('noPostDataToRender', 'Sem dados de postagens para renderizar')}</p>
                  <p className="text-[10px]">{t('createCardToViewMetrics', 'Crie um cartão para visualizar as métricas')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="rascunho" name={t('statusDraft', 'Rascunho')} fill="#71717a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="agendado" name={t('statusScheduled', 'Agendado')} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="publicado" name={t('posted', 'Postado')} fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CHART 2: TIMELINE CONSISTENCY */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-white font-display">{t('editorialConsistencyTimeline', 'Cronograma de Consistência Editorial')}</h3>
                <p className="text-[10px] text-zinc-500 font-mono">{t('postDensityByDate', 'Densidade de postagens por data programada')}</p>
              </div>
              <span className="text-[10px] bg-accent-purple/10 border border-accent-purple/30 text-accent-purple px-2 py-0.5 rounded font-mono uppercase">{t('frequency', 'Frequência')}</span>
            </div>

            <div className="h-[260px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="data" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Area type="monotone" dataKey="posts" name={t('plannedPosts', 'Posts Planejados')} stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. FUNNEL STAGE SECTION */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'funnel') && (
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white font-display">{t('strategicFunnelDistribution', 'Distribuição Estratégica de Funil')}</h3>
              <p className="text-[10px] text-zinc-500 font-mono">{t('plannedPercentByPhase', 'Percentual planejado por fase do funil')}</p>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-panel-border text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">{t('funnel', 'Funil')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[220px] w-full flex items-center justify-center">
              {totalPosts === 0 ? (
                <div className="text-center p-6 text-zinc-500 space-y-1">
                  <Info size={16} className="mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs font-mono">{t('noFunnelDataToRender', 'Sem dados de funil para renderizar')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={funnelData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="space-y-3">
              {funnelData.map((item, idx) => {
                const count = item.value;
                const percent = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950/60 border border-panel-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <span className="text-xs text-white font-semibold block">{item.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {idx === 0 ? 'Atração de novos públicos' : idx === 1 ? 'Relacionamento & Engajamento' : 'Conversão & Vendas'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-white font-bold font-mono">{count} posts</span>
                      <span className="text-[10px] text-zinc-400 font-mono block">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. FORMAT PERFORMANCE BREAKDOWN TABLE */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'formats') && (
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white font-display">Performance Detalhada por Formato de Conteúdo</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Métricas projetadas com base em benchmarks de engajamento</p>
            </div>
            <span className="text-[10px] bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase">Alcance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-panel-border text-zinc-500 font-mono text-[10px] uppercase">
                  <th className="pb-3 font-medium">Formato</th>
                  <th className="pb-3 font-medium text-center">Volume</th>
                  <th className="pb-3 font-medium text-right">Alcance Estimado</th>
                  <th className="pb-3 font-medium text-right">Taxa de Engajamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border/40 text-zinc-300">
                {formatStats.map((st) => (
                  <tr key={st.formatKey} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                      {st.format}
                    </td>
                    <td className="py-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-panel-border text-white">
                        {st.posts}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-emerald-400 font-semibold">
                      {st.alcanceEstimado.toLocaleString('pt-BR')} imp.
                    </td>
                    <td className="py-3 text-right font-mono text-amber-400 font-semibold">
                      {st.engajamentoMedio}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. STRATEGIC TIPS BANNER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-panel-card border border-panel-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 items-start">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Info size={16} />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">{t('howToOptimizePerformance', 'Como otimizar seu desempenho?')}</p>
            <p className="text-[11px] text-zinc-400 leading-normal max-w-xl">
              {t('performanceOptimizationTip', 'Crie posts equilibrados preenchendo todos os campos de roteiro (gancho inicial, corpo do script e hashtags de suporte). A consistência no calendário é avaliada pela regularidade de postagens agendadas por semana.')}
            </p>
          </div>
        </div>
        <a 
          href="https://wa.me/5517991951381?text=Ol%C3%A1!%20Gostaria%20de%20dicas%20estrat%C3%A9gicas%20para%20melhorar%20meu%20funil%20no%20Planner%20de%20Conte%C3%BAdo."
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-accent-orange hover:text-white transition-all whitespace-nowrap border-b border-dashed border-accent-orange/40 hover:border-white pb-0.5 cursor-pointer shrink-0"
        >
          {t('scheduleFreeMentorship', 'Agendar Mentoria Grátis')}
        </a>
      </div>
    </div>
  );
}
