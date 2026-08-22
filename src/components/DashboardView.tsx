import React, { useState, useEffect, useMemo } from 'react';
import { Post, Platform, FunnelStage, ContentFormat, Creative, Client, User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTranslatedFormat, getTranslatedStage } from '../utils/postTranslations';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Sparkles, BarChart2, TrendingUp, Target, ShieldCheck, 
  RefreshCw, Zap, Image as ImageIcon, CheckCircle2, Clock, 
  MessageSquare, AlignLeft, Share2, Plus, Calendar, Filter,
  Layers, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';

interface DashboardViewProps {
  posts: Post[];
  allPosts?: Post[];
  clients?: Client[];
  activeClient?: Client;
  activeClientId?: string;
  onSelectClient?: (clientId: string) => void;
  onNewPostClick?: () => void;
  currentUser?: User | null;
}

export default function DashboardView({ 
  posts = [], 
  allPosts = [], 
  clients = [],
  activeClient,
  activeClientId,
  onSelectClient,
  onNewPostClick,
  currentUser 
}: DashboardViewProps) {
  const { t } = useLanguage();
  const [selectedMetricTab, setSelectedMetricTab] = useState<'overview' | 'creatives' | 'formats' | 'funnel' | 'efficiency'>('overview');
  const [selectedClientId, setSelectedClientId] = useState<string>(activeClientId || 'all');
  const [timeRange, setTimeRange] = useState<'all' | 'month' | '30days' | 'week'>('all');
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoadingCreatives, setIsLoadingCreatives] = useState(false);

  // Sync selectedClientId with prop if changed externally
  useEffect(() => {
    if (activeClientId && activeClientId !== 'all') {
      setSelectedClientId(activeClientId);
    }
  }, [activeClientId]);

  // Load Creatives from API with fallback to localStorage
  const loadCreatives = async () => {
    if (!currentUser) return;
    setIsLoadingCreatives(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const clientQuery = selectedClientId && selectedClientId !== 'all' ? `?clientId=${selectedClientId}` : '';
      const res = await fetch(`/api/creatives${clientQuery}`, {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-password': currentUser.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.creatives)) {
        setCreatives(data.creatives);
        try {
          localStorage.setItem('creator_planner_creatives', JSON.stringify(data.creatives));
        } catch (e) {}
      } else {
        const local = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
        if (Array.isArray(local)) {
          setCreatives(selectedClientId && selectedClientId !== 'all' ? local.filter((c: any) => c.clientId === selectedClientId) : local);
        }
      }
    } catch (e) {
      console.warn('Dashboard creatives load fallback:', e);
      const local = JSON.parse(localStorage.getItem('creator_planner_creatives') || '[]');
      if (Array.isArray(local)) {
        setCreatives(selectedClientId && selectedClientId !== 'all' ? local.filter((c: any) => c.clientId === selectedClientId) : local);
      }
    } finally {
      setIsLoadingCreatives(false);
    }
  };

  useEffect(() => {
    loadCreatives();
  }, [currentUser, selectedClientId]);

  // 1. FILTER POSTS BY CLIENT & TIME RANGE
  const rawPosts = allPosts.length > 0 ? allPosts : posts;

  const filteredPosts = useMemo(() => {
    return rawPosts.filter(p => {
      // Client filter
      if (selectedClientId && selectedClientId !== 'all' && p.clientId !== selectedClientId) {
        return false;
      }

      // Time range filter
      if (timeRange !== 'all' && p.scheduledDate) {
        const now = new Date();
        const postDate = new Date(p.scheduledDate + 'T00:00:00');
        
        if (timeRange === 'week') {
          const diffDays = (postDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -7 || diffDays > 7) return false;
        } else if (timeRange === '30days') {
          const diffDays = (postDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays < -30 || diffDays > 30) return false;
        } else if (timeRange === 'month') {
          const currentYearMonth = now.toISOString().substring(0, 7);
          if (!p.scheduledDate.startsWith(currentYearMonth)) return false;
        }
      }

      return true;
    });
  }, [rawPosts, selectedClientId, timeRange]);

  // 2. CORE AGGREGATED METRICS
  const totalPosts = filteredPosts.length;
  const publishedPosts = filteredPosts.filter(p => p.status === 'published');
  const scheduledPosts = filteredPosts.filter(p => p.status === 'scheduled');
  const draftPosts = filteredPosts.filter(p => p.status === 'draft');
  const productionPosts = filteredPosts.filter(p => p.status === 'production' || (p.productionStage && p.productionStage !== 'published' && p.productionStage !== 'scheduled'));

  // Approval status for texts/scripts
  const scriptsWithContent = filteredPosts.filter(p => (p.scriptText && p.scriptText.trim().length > 0) || (p.hookText && p.hookText.trim().length > 0));
  const scriptsApproved = filteredPosts.filter(p => p.approvalStatus === 'approved');
  const scriptsPending = filteredPosts.filter(p => p.approvalStatus === 'pending' || (p.productionStage === 'script' && p.approvalStatus !== 'approved'));
  const scriptsDraft = filteredPosts.filter(p => p.approvalStatus === 'draft' || !p.approvalStatus);

  // Creative & Media Metrics (from creative hub)
  const clientCreatives = selectedClientId && selectedClientId !== 'all' 
    ? creatives.filter(c => c.clientId === selectedClientId) 
    : creatives;

  const totalCreatives = clientCreatives.length;
  const pendingVisualCreatives = clientCreatives.filter(c => c.status === 'pending_approval' || !c.status).length;
  const approvedVisualCreatives = clientCreatives.filter(c => c.status === 'approved').length;
  const changesRequestedCreatives = clientCreatives.filter(c => c.status === 'changes_requested').length;
  
  const pendingCaptions = clientCreatives.filter(c => (c.description || (c.assets && c.assets.some(a => a.caption))) && c.captionStatus === 'pending_approval').length;
  const approvedCaptions = clientCreatives.filter(c => c.captionStatus === 'approved').length;
  const changesRequestedCaptions = clientCreatives.filter(c => c.captionStatus === 'changes_requested').length;
  const withoutCaption = clientCreatives.filter(c => !c.description && (!c.assets || !c.assets.some(a => a.caption))).length;

  const totalVisualDecided = approvedVisualCreatives + changesRequestedCreatives;
  const visualApprovalRate = totalVisualDecided > 0 ? Math.round((approvedVisualCreatives / totalVisualDecided) * 100) : (totalCreatives > 0 ? 100 : 0);

  const totalCaptionDecided = approvedCaptions + changesRequestedCaptions;
  const captionApprovalRate = totalCaptionDecided > 0 ? Math.round((approvedCaptions / totalCaptionDecided) * 100) : (totalCreatives > withoutCaption ? 100 : 0);

  // Funnel Data
  const tofuCount = filteredPosts.filter(p => p.funnelStage === 'TOFU').length;
  const mofuCount = filteredPosts.filter(p => p.funnelStage === 'MOFU').length;
  const bofuCount = filteredPosts.filter(p => p.funnelStage === 'BOFU').length;

  const tofuPercent = totalPosts > 0 ? Math.round((tofuCount / totalPosts) * 100) : 0;
  const mofuPercent = totalPosts > 0 ? Math.round((mofuCount / totalPosts) * 100) : 0;
  const bofuPercent = totalPosts > 0 ? Math.round((bofuCount / totalPosts) * 100) : 0;

  const funnelData = [
    { name: getTranslatedStage('TOFU', t) || 'TOFU (Atração)', value: tofuCount, color: '#F59E0B' }, // Amber
    { name: getTranslatedStage('MOFU', t) || 'MOFU (Nutrição)', value: mofuCount, color: '#8B5CF6' }, // Purple
    { name: getTranslatedStage('BOFU', t) || 'BOFU (Conversão)', value: bofuCount, color: '#F97316' }, // Orange
  ];

  // Platform Data
  const instagramPosts = filteredPosts.filter(p => p.platform === 'instagram');
  const tiktokPosts = filteredPosts.filter(p => p.platform === 'tiktok');
  const youtubePosts = filteredPosts.filter(p => p.platform === 'youtube');

  const platformData = [
    { 
      name: 'Instagram', 
      rascunho: instagramPosts.filter(p => p.status === 'draft').length,
      producao: instagramPosts.filter(p => p.status === 'production').length,
      agendado: instagramPosts.filter(p => p.status === 'scheduled').length,
      publicado: instagramPosts.filter(p => p.status === 'published').length,
      total: instagramPosts.length 
    },
    { 
      name: 'TikTok', 
      rascunho: tiktokPosts.filter(p => p.status === 'draft').length,
      producao: tiktokPosts.filter(p => p.status === 'production').length,
      agendado: tiktokPosts.filter(p => p.status === 'scheduled').length,
      publicado: tiktokPosts.filter(p => p.status === 'published').length,
      total: tiktokPosts.length 
    },
    { 
      name: 'YouTube', 
      rascunho: youtubePosts.filter(p => p.status === 'draft').length,
      producao: youtubePosts.filter(p => p.status === 'production').length,
      agendado: youtubePosts.filter(p => p.status === 'scheduled').length,
      publicado: youtubePosts.filter(p => p.status === 'published').length,
      total: youtubePosts.length 
    },
  ];

  // Quality & Editorial Completeness Score
  const calculatePostScore = (p: Post): number => {
    let score = 25; // Base for existing post
    if (p.title && p.title.trim().length > 3) score += 15;
    if (p.description && p.description.trim().length > 10) score += 15;
    if (p.hookText && p.hookText.trim().length > 5) score += 15;
    if (p.scriptText && p.scriptText.trim().length > 10) score += 15;
    if (p.hashtags && p.hashtags.length > 0) score += 10;
    if (p.visualIdea && p.visualIdea.trim().length > 5) score += 5;
    return Math.min(score, 100);
  };

  const averageScore = totalPosts > 0
    ? Math.round(filteredPosts.reduce((sum, p) => sum + calculatePostScore(p), 0) / totalPosts)
    : 85;

  // Format Benchmarks
  const formatReachMultiplier: Record<ContentFormat, { name: string; reach: number; engagement: number }> = {
    reels: { name: getTranslatedFormat('reels', t) || 'Reels', reach: 2450, engagement: 8.9 },
    shorts: { name: getTranslatedFormat('shorts', t) || 'Shorts', reach: 1950, engagement: 7.6 },
    video: { name: getTranslatedFormat('video', t) || 'Vídeo Longo', reach: 1320, engagement: 9.8 },
    carousel: { name: getTranslatedFormat('carousel', t) || 'Carrossel', reach: 1780, engagement: 12.4 },
    stories: { name: getTranslatedFormat('stories', t) || 'Stories', reach: 520, engagement: 18.2 },
    live: { name: 'Live', reach: 890, engagement: 24.1 },
    email: { name: 'Email Marketing', reach: 950, engagement: 26.5 },
    ad: { name: 'Anúncio Pago', reach: 6200, engagement: 5.2 },
    landing_page: { name: 'Landing Page', reach: 1450, engagement: 16.0 },
  };

  const formatStats = Object.entries(formatReachMultiplier).map(([key, benchmark]) => {
    const formatCount = filteredPosts.filter(p => p.format === key).length;
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
  filteredPosts.forEach(p => {
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

  // Client name display
  const currentClientObj = clients.find(c => c.id === selectedClientId) || activeClient;
  const clientDisplayName = selectedClientId === 'all' 
    ? 'Todas as Marcas' 
    : (currentClientObj?.name || 'Marca Selecionada');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HERO HEADER WITH CLIENT & DATE FILTER BAR */}
      <div className="p-6 bg-gradient-to-r from-panel-card to-panel-black rounded-2xl border border-panel-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-accent-purple-glow to-transparent pointer-events-none" />
        
        <div className="text-left space-y-2 max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-[10px] font-mono rounded-lg">
            <BarChart2 size={12} /> {t('performanceAndMetrics', 'PAINEL DE DESEMPENHO E MÉTRICAS')}
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black text-white flex items-center gap-2">
            <span>{clientDisplayName}</span>
            {selectedClientId === 'all' && (
              <span className="text-xs font-mono font-normal bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-panel-border">
                Visão Global
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Acompanhe o volume de conteúdos, saúde do funil de conversão, taxa de aprovação de criativos e estimativa de alcance em tempo real.
          </p>
        </div>
        
        {/* CONTROLS: CLIENT SELECTOR + TIME RANGE + REFRESH */}
        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0 w-full md:w-auto justify-start md:justify-end">
          {/* Brand/Client Selector */}
          {clients.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-panel-border rounded-xl px-3 py-1.5 text-xs text-zinc-300">
              <Filter size={12} className="text-accent-purple" />
              <select
                value={selectedClientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClientId(val);
                  if (onSelectClient && val !== 'all') {
                    onSelectClient(val);
                  }
                }}
                aria-label="Filtrar por marca ou cliente"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs pr-2"
              >
                <option value="all" className="bg-zinc-900 text-white">Todas as Marcas ({rawPosts.length})</option>
                {clients.map(c => {
                  const count = rawPosts.filter(p => p.clientId === c.id).length;
                  return (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-panel-border rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                timeRange === 'all' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                timeRange === 'month' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                timeRange === 'week' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadCreatives}
            className="p-2 rounded-xl bg-zinc-900 border border-panel-border text-zinc-400 hover:text-white hover:border-accent-purple transition-all cursor-pointer"
            title="Recarregar métricas"
          >
            <RefreshCw size={14} className={isLoadingCreatives ? "animate-spin text-accent-purple" : ""} />
          </button>
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
          onClick={() => setSelectedMetricTab('creatives')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedMetricTab === 'creatives'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <ImageIcon size={14} />
          <span>Criativos & Aprovação ({totalCreatives})</span>
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
          <span>Formatos & Alcance</span>
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
          <span>Qualidade & Roteiros</span>
        </button>
      </div>

      {/* 2. TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Posts */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Posts no Período</span>
            <span className="p-1.5 rounded-lg bg-accent-purple/10 text-accent-purple">
              <TrendingUp size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white">{totalPosts}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">{publishedPosts.length} postados</span>
              <span className="text-[9px] font-mono text-blue-400 font-semibold">{scheduledPosts.length} agendados</span>
              <span className="text-[9px] font-mono text-amber-400 font-semibold">{draftPosts.length} rascunhos</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Alcance Estimado */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Alcance Estimado</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Share2 size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-emerald-400">
              {totalEstimatedReach.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">imp.</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              Engajamento Médio: <strong className="text-white">{averageEngagementRate}%</strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Criativos e Mídias */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Peças & Criativos</span>
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <ImageIcon size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white">{totalCreatives}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-blue-400 font-semibold">{approvedVisualCreatives} aprovados</span>
              <span className="text-[9px] font-mono text-amber-400 font-semibold">{pendingVisualCreatives} pendentes</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Score Editorial */}
        <div className="p-4 rounded-xl bg-panel-card border border-panel-border/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Score Editorial</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Zap size={14} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-amber-400">{averageScore}%</div>
            <p className="text-[9px] font-mono text-zinc-400 mt-1">
              {scriptsWithContent.length} de {totalPosts} posts com roteiro completo
            </p>
          </div>
        </div>
      </div>

      {/* 3. CREATIVES & CAPTION APPROVAL METRICS ROW */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'creatives') && (
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-panel-border/60 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                <ImageIcon size={14} className="text-pink-400" />
                Status de Aprovação de Criativos & Legendas
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                Validação visual e textual enviadas para o cliente via portal público de aprovação
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Aprovação Visual: <strong>{visualApprovalRate}%</strong>
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Aprovação Legendas: <strong>{captionApprovalRate}%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* 1. Total Criativos */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-1 flex items-center gap-1">
                <Layers size={11} /> Total Peças
              </span>
              <div className="text-xl font-bold font-display text-white">{totalCreatives}</div>
            </div>

            {/* 2. Visual Pendente */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-orange-400 block mb-1 flex items-center gap-1">
                <Clock size={11} /> Mídia Pendente
              </span>
              <div className="text-xl font-bold font-display text-orange-400">{pendingVisualCreatives}</div>
            </div>

            {/* 3. Visual Aprovado */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-blue-400 block mb-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Mídia Aprovada
              </span>
              <div className="text-xl font-bold font-display text-blue-400">{approvedVisualCreatives}</div>
            </div>

            {/* 4. Ajuste Criativo */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-1 flex items-center gap-1">
                <MessageSquare size={11} /> Ajuste Mídia
              </span>
              <div className="text-xl font-bold font-display text-amber-400">{changesRequestedCreatives}</div>
            </div>

            {/* 5. Legenda Pendente */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-1 flex items-center gap-1">
                <Clock size={11} className={pendingCaptions > 0 ? "animate-pulse" : ""} /> Legenda Pendente
              </span>
              <div className="text-xl font-bold font-display text-amber-400">{pendingCaptions}</div>
            </div>

            {/* 6. Legenda Aprovada */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Legenda Aprovada
              </span>
              <div className="text-xl font-bold font-display text-emerald-400">{approvedCaptions}</div>
            </div>

            {/* 7. Ajuste Legenda */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block mb-1 flex items-center gap-1">
                <MessageSquare size={11} /> Ajuste Legenda
              </span>
              <div className="text-xl font-bold font-display text-amber-400">{changesRequestedCaptions}</div>
            </div>

            {/* 8. Sem Legenda */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                <AlignLeft size={11} /> Sem Legenda
              </span>
              <div className="text-xl font-bold font-display text-zinc-400">{withoutCaption}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHARTS: PLATFORM PRESENCE & TIMELINE */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'formats') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHART 1: PLATFORM DISTRIBUTION */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-white font-display">Presença por Canal e Status</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Volume de postagens por rede social</p>
              </div>
              <span className="text-[10px] bg-zinc-900 border border-panel-border text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">Canais</span>
            </div>
            
            <div className="h-64 min-h-[260px] w-full flex items-center justify-center">
              {totalPosts === 0 ? (
                <div className="text-center p-6 text-zinc-500 space-y-2">
                  <BarChart2 size={24} className="mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs font-mono">Nenhum post registrado nesta seleção</p>
                  {onNewPostClick && (
                    <button
                      onClick={onNewPostClick}
                      className="mt-2 px-3 py-1 rounded-lg bg-accent-purple text-white text-xs font-bold hover:opacity-90 transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Criar Primeiro Card
                    </button>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260} minWidth={100} minHeight={240}>
                  <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="rascunho" name="Rascunho" fill="#71717a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="agendado" name="Agendado" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="publicado" name="Publicado" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CHART 2: TIMELINE DENSITY */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-white font-display">Cronograma de Consistência Editorial</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Densidade de postagens programadas no calendário</p>
              </div>
              <span className="text-[10px] bg-accent-purple/10 border border-accent-purple/30 text-accent-purple px-2 py-0.5 rounded font-mono uppercase">Frequência</span>
            </div>

            <div className="h-64 min-h-[260px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260} minWidth={100} minHeight={240}>
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
                  <Area type="monotone" dataKey="posts" name="Posts Agendados" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. FUNNEL DISTRIBUTION */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'funnel') && (
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-white font-display">Distribuição Estratégica de Funil</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Divisão percentual entre Atração (TOFU), Nutrição (MOFU) e Vendas (BOFU)</p>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-panel-border text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">Funil</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-60 min-h-[240px] w-full flex items-center justify-center">
              {totalPosts === 0 ? (
                <div className="text-center p-6 text-zinc-500 space-y-1">
                  <Target size={24} className="mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs font-mono">Sem dados de funil para renderizar</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240} minWidth={100} minHeight={220}>
                  <PieChart>
                    <Pie
                      data={funnelData.filter(d => d.value > 0).length > 0 ? funnelData.filter(d => d.value > 0) : funnelData}
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
                          {idx === 0 ? 'Atração de novos públicos (Ideal: 50%)' : idx === 1 ? 'Relacionamento & Engajamento (Ideal: 30%)' : 'Conversão & Vendas (Ideal: 20%)'}
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

      {/* 6. FORMAT PERFORMANCE TABLE */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'formats') && (
        <div className="p-5 rounded-2xl bg-panel-card border border-panel-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white font-display">Performance Projetada por Formato</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Estimativa baseada em benchmarks consolidados de engajamento social</p>
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

      {/* 7. WORKFLOW & EDITORIAL HEALTH SECTION */}
      {(selectedMetricTab === 'overview' || selectedMetricTab === 'efficiency') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WORKFLOW 1: ROTEIROS */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-purple" />
                Roteiros & Textos
              </h3>
              <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">Escritos</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-panel-border/60 text-center">
              <div className="p-2 rounded-xl bg-zinc-900/60">
                <span className="text-[10px] font-mono text-zinc-500 block">Total</span>
                <span className="text-base font-bold text-white font-mono">{scriptsWithContent.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-mono text-amber-400 block">Em Aprovação</span>
                <span className="text-base font-bold text-amber-400 font-mono">{scriptsPending.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 block">Aprovados</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{scriptsApproved.length}</span>
              </div>
            </div>
          </div>

          {/* WORKFLOW 2: CRIATIVOS */}
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
                <span className="text-base font-bold text-white font-mono">{totalCreatives}</span>
              </div>
              <div className="p-2 rounded-xl bg-accent-orange/10 border border-accent-orange/20">
                <span className="text-[10px] font-mono text-accent-orange block">Pendentes</span>
                <span className="text-base font-bold text-accent-orange font-mono">{pendingVisualCreatives}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 block">Aprovados</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{approvedVisualCreatives}</span>
              </div>
            </div>
          </div>

          {/* WORKFLOW 3: PUBLICAÇÃO */}
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
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-mono text-amber-400 block">Rascunhos</span>
                <span className="text-base font-bold text-amber-400 font-mono">{draftPosts.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 block">Publicados</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{publishedPosts.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
