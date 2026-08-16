import React from 'react';
import { Post, Platform, FunnelStage, ContentFormat } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Sparkles, BarChart2, TrendingUp, Target, Award, Info, AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardViewProps {
  posts: Post[];
}

export default function DashboardView({ posts }: DashboardViewProps) {
  const { t } = useLanguage();

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
    // Posts in June 2026 current week (08-14)
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
  // Each post gets a score from 0 to 100 based on fill completeness
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
    : 0;

  // Determine top platform
  const maxPlatform = [...platformData].sort((a, b) => b.total - a.total)[0];
  const dominantPlatform = maxPlatform?.total > 0 ? maxPlatform.name : 'Nenhum';

  // Determine funnel focus and health check
  const maxFunnel = Object.entries(funnelCounts).sort((a, b) => b[1] - a[1])[0];
  const dominantFunnel = maxFunnel?.[1] > 0 ? maxFunnel[0] : 'Nenhum';

  // Funnel Health Alert
  // Ideal ratio: 50% TOFU, 30% MOFU, 20% BOFU
  const tofuPercent = totalPosts > 0 ? (funnelCounts.TOFU / totalPosts) * 100 : 0;
  const mofuPercent = totalPosts > 0 ? (funnelCounts.MOFU / totalPosts) * 100 : 0;
  const bofuPercent = totalPosts > 0 ? (funnelCounts.BOFU / totalPosts) * 100 : 0;

  let funnelHealthText = 'Seu funil está equilibrado! Excelente distribuição estratégica.';
  let funnelHealthType: 'success' | 'warning' | 'info' = 'success';

  if (totalPosts > 0) {
    if (tofuPercent < 35) {
      funnelHealthText = 'Alerta: Pouco conteúdo de atração (TOFU). Crie mais posts de topo de funil para atrair novos seguidores.';
      funnelHealthType = 'warning';
    } else if (bofuPercent === 0) {
      funnelHealthText = 'Aviso: Você não tem posts de vendas/conversão (BOFU). Seus seguidores podem não saber o que você vende!';
      funnelHealthType = 'warning';
    } else if (mofuPercent < 15) {
      funnelHealthText = 'Dica: Aumente seus conteúdos de nutrição (MOFU) para estreitar laços com sua audiência.';
      funnelHealthType = 'info';
    }
  } else {
    funnelHealthText = 'Adicione alguns posts no planejador para analisar a saúde do seu funil editorial.';
    funnelHealthType = 'info';
  }

  // Format Performance Industry Benchmarks
  // Combine real counts with average reach multiplier
  const formatReachMultiplier: Record<ContentFormat, { name: string; reach: number; engagement: number }> = {
    reels: { name: getTranslatedFormat('reels', t), reach: 2200, engagement: 8.5 },
    shorts: { name: getTranslatedFormat('shorts', t), reach: 1800, engagement: 7.2 },
    video: { name: getTranslatedFormat('video', t), reach: 1200, engagement: 9.8 },
    carousel: { name: getTranslatedFormat('carousel', t), reach: 1500, engagement: 11.2 },
    stories: { name: getTranslatedFormat('stories', t), reach: 450, engagement: 18.5 },
    live: { name: 'Live', reach: 600, engagement: 22.0 },
    email: { name: 'Email Marketing', reach: 800, engagement: 25.0 },
    ad: { name: 'Anúncio Pago', reach: 5000, engagement: 4.5 },
    landing_page: { name: 'Landing Page', reach: 1200, engagement: 15.0 },
  };

  const formatStats = Object.entries(formatReachMultiplier).map(([key, benchmark]) => {
    const formatCount = posts.filter(p => p.format === key).length;
    return {
      format: benchmark.name,
      posts: formatCount,
      alcanceEstimado: formatCount * benchmark.reach,
      engajamentoMedio: benchmark.engagement,
    };
  }).filter(item => item.posts > 0 || totalPosts === 0);

  // Consistency timeline - group scheduled posts by date
  const dateMap: Record<string, number> = {};
  posts.forEach(p => {
    if (p.scheduledDate) {
      dateMap[p.scheduledDate] = (dateMap[p.scheduledDate] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(dateMap).sort();
  const timelineData = sortedDates.map(date => {
    // Format YYYY-MM-DD to DD/MM
    const parts = date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
    return {
      data: formattedDate,
      posts: dateMap[date],
    };
  });

  // If empty timeline, mock a beautiful layout pattern
  const displayTimelineData = timelineData.length > 0 ? timelineData : [
    { data: 'Seg', posts: 1 },
    { data: 'Ter', posts: 2 },
    { data: 'Qua', posts: 1 },
    { data: 'Qui', posts: 3 },
    { data: 'Sex', posts: 2 },
    { data: 'Sáb', posts: 0 },
    { data: 'Dom', posts: 1 },
  ];

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
            {t('strategicAnalysisSub', 'Monitore o equilíbrio do seu funil de vendas, compare a distribuição por canal e veja a consistência de suas postagens agendadas.')}
          </p>
        </div>
        <div className="flex items-center gap-2 z-10 shrink-0">
          <span className="text-xs font-mono text-zinc-500">{t('realtimeUpdated', 'Atualizado em tempo real')}</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* 2. GENERAL KPI GRID */}
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

        {/* KPI 2 */}
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

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Produção do Mês</span>
            <span className="p-1.5 rounded-lg bg-accent-orange/10 text-accent-orange">
              <Target size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white">{monthlyProduction.length}</div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              Total entregue / previsto no mês
            </p>
          </div>
        </div>

        {/* KPI 4 */}
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
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            {t('funnelEditorialHealth', 'Saúde Editorial do Funil')}
            <span className="px-1.5 py-0.2 text-[8px] font-mono rounded bg-white/10 text-white uppercase">{t('diagnosis', 'Diagnóstico')}</span>
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {funnelHealthText}
          </p>
          {totalPosts > 0 && (
            <div className="flex gap-4 mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-400">
              <span>{t('attractionTofu', 'Atração (TOFU):')} <strong className="text-white">{Math.round(tofuPercent)}%</strong> (Ideal: 50%)</span>
              <span>{t('nurturingMofu', 'Nutrição (MOFU):')} <strong className="text-white">{Math.round(mofuPercent)}%</strong> (Ideal: 30%)</span>
              <span>{t('salesBofu', 'Venda (BOFU):')} <strong className="text-white">{Math.round(bofuPercent)}%</strong> (Ideal: 20%)</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. CHARTS GRID SECTION */}
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

        {/* CHART 2: FUNNEL STAGE Balance */}
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white font-display">{t('strategicFunnelDistribution', 'Distribuição Estratégica de Funil')}</h3>
              <p className="text-[10px] text-zinc-500 font-mono">{t('plannedPercentByPhase', 'Percentual planejado por fase do funil')}</p>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-panel-border text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">{t('funnel', 'Funil')}</span>
          </div>

          <div className="h-[260px] w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {totalPosts === 0 ? (
              <div className="text-center p-6 text-zinc-500 space-y-1">
                <Info size={16} className="mx-auto text-zinc-600 mb-1" />
                <p className="text-xs font-mono">{t('noFunnelDataToRender', 'Sem dados de funil para renderizar')}</p>
                <p className="text-[10px]">{t('createCardToViewMetrics', 'Crie um cartão para visualizar as métricas')}</p>
              </div>
            ) : (
              <>
                <div className="w-1/2 h-full min-h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={funnelData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
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
                </div>
                
                {/* Custom Legends */}
                <div className="flex-1 space-y-3 w-full sm:w-auto">
                  {funnelData.map((item, idx) => {
                    const count = item.value;
                    const percent = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-panel-border/30">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-zinc-300 font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-white font-bold font-mono">{count} posts</span>
                          <span className="text-[10px] text-zinc-500 font-mono block">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CHART 3: BENCHMARK PERFORMANCE BY FORMAT */}
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white font-display">{t('reachEstimateByFormat', 'Estimativa de Alcance por Formato')}</h3>
              <p className="text-[10px] text-zinc-500 font-mono">{t('organicReachProjection', 'Projeção de alcance orgânico acumulado por tipo')}</p>
            </div>
            <span className="text-[10px] bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase">{t('engagement', 'Engajamento')}</span>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {totalPosts === 0 ? (
              <div className="text-center p-6 text-zinc-500 space-y-1">
                <Info size={16} className="mx-auto text-zinc-600 mb-1" />
                <p className="text-xs font-mono">{t('noFormatDataToRender', 'Sem dados de formatos para renderizar')}</p>
                <p className="text-[10px]">{t('useFormatsToSeeEstimates', 'Utilize diferentes formatos para ver estimativas')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayTimelineData} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} hide />
                  <YAxis dataKey="data" type="category" stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                  <Bar dataKey="posts" name={t('activePosts', 'Posts Ativos')} fill="#F97316" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: TIMELINE CONSISTENCY (Agendamento no Tempo) */}
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

      {/* 5. STRATEGIC TIPS BANNER */}
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
