import React from 'react';
import { X, Award, AlertTriangle, CheckCircle, PieChart, Sparkles, Zap, ArrowRight, Activity, Flame, Lightbulb } from 'lucide-react';
import { Post } from '../types';

interface CalendarAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onQuickAddSuggestedPost?: (funnel: 'TOFU' | 'MOFU' | 'BOFU', format: string) => void;
}

export default function CalendarAnalysisModal({
  isOpen,
  onClose,
  posts,
  onQuickAddSuggestedPost
}: CalendarAnalysisModalProps) {
  if (!isOpen) return null;

  const total = posts.length;

  // Formats counts
  const reelsCount = posts.filter(p => p.format === 'reels' || p.format === 'shorts').length;
  const storiesCount = posts.filter(p => p.format === 'stories').length;
  const carouselCount = posts.filter(p => p.format === 'carousel').length;
  const videoCount = posts.filter(p => p.format === 'video').length;

  // Funnel counts
  const tofuCount = posts.filter(p => p.funnelStage === 'TOFU').length;
  const mofuCount = posts.filter(p => p.funnelStage === 'MOFU').length;
  const bofuCount = posts.filter(p => p.funnelStage === 'BOFU').length;

  // Calculate Score (0 to 100)
  let score = 50; // base score

  if (total >= 4) score += 15;
  if (total >= 8) score += 10;

  // Check format diversity
  const uniqueFormats = new Set(posts.map(p => p.format)).size;
  if (uniqueFormats >= 2) score += 10;
  if (uniqueFormats >= 3) score += 5;

  // Check funnel balance (ideal: TOFU ~50%, MOFU ~30%, BOFU ~20%)
  const tofuPct = total > 0 ? (tofuCount / total) * 100 : 0;
  const mofuPct = total > 0 ? (mofuCount / total) * 100 : 0;
  const bofuPct = total > 0 ? (bofuCount / total) * 100 : 0;

  if (tofuPct >= 30 && tofuPct <= 60) score += 10;
  if (mofuPct >= 20 && mofuPct <= 40) score += 5;
  if (bofuPct > 0 && bofuPct <= 35) score += 5;

  score = Math.min(100, score);

  // Formulate diagnostics and warnings
  const warnings: string[] = [];
  const recommendations: { title: string; desc: string; funnel: 'TOFU' | 'MOFU' | 'BOFU'; format: string }[] = [];

  if (bofuPct > 45) {
    warnings.push('⚠️ Seu calendário está com excesso de posts de Venda/Conversão (BOFU). Isso pode sobrecarregar a audiência!');
    recommendations.push({
      title: 'Adicionar Reels de Atração (TOFU)',
      desc: 'Crie um conteúdo leve focado em dor/desejo do público para aumentar o alcance orgânico.',
      funnel: 'TOFU',
      format: 'reels'
    });
  }

  if (tofuPct < 25) {
    warnings.push('⚠️ Faltam conteúdos de Atração/Topo de Funil (TOFU) para trazer novos seguidores.');
    recommendations.push({
      title: 'Criar Carrossel Educativo (TOFU)',
      desc: 'Mostre 3 dicas rápidas do seu nicho para atrair público qualificado.',
      funnel: 'TOFU',
      format: 'carousel'
    });
  }

  if (mofuPct < 15) {
    warnings.push('⚠️ Pouco conteúdo de Autoridade/Meio de Funil (MOFU). Nutra a audiência com bastidores e provas sociais.');
    recommendations.push({
      title: 'Postar Bastidores nos Stories/Vídeo (MOFU)',
      desc: 'Mostre como você produz ou atende clientes para gerar autoridade imediata.',
      funnel: 'MOFU',
      format: 'video'
    });
  }

  if (storiesCount === 0) {
    warnings.push('💡 Você não tem Stories agendados para manter contato diário e humanizar a marca.');
    recommendations.push({
      title: 'Agendar Sequência de Stories (MOFU)',
      desc: 'Abra caixinha de perguntas ou enquetes para aquecer os seguidores.',
      funnel: 'MOFU',
      format: 'stories'
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel-card border border-panel-border rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-panel-border pb-4">
          <div className="p-3 bg-gradient-to-tr from-accent-purple to-accent-orange text-white rounded-xl shadow-lg">
            <Award size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Análise & Score de Qualidade do Calendário
            </h3>
            <p className="text-xs text-zinc-400">
              Diagnóstico algorítmico sobre a saúde do seu cronograma de postagens.
            </p>
          </div>
        </div>

        {/* Score & Main Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Score gauge */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-panel-border flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Score do Calendário</span>
            <div className="relative flex items-center justify-center">
              <span className={`text-4xl font-black font-mono ${
                score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {score}
              </span>
              <span className="text-xs text-zinc-500 font-mono">/100</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {score >= 80 ? 'Excelente Equilíbrio!' : score >= 60 ? 'Bom, com Ajustes' : 'Necessita Atenção'}
            </span>
          </div>

          {/* Formats stats */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-panel-border space-y-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block border-b border-panel-border/50 pb-1">
              Distribuição por Formatos
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-300">
                <span>🎬 Reels / Shorts:</span>
                <span className="font-bold text-accent-purple">{reelsCount}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>📱 Stories:</span>
                <span className="font-bold text-accent-orange">{storiesCount}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>🖼️ Carrosséis:</span>
                <span className="font-bold text-accent-blue">{carouselCount}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>📹 Vídeos Longos:</span>
                <span className="font-bold text-emerald-400">{videoCount}</span>
              </div>
            </div>
          </div>

          {/* Funnel distribution */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-panel-border space-y-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block border-b border-panel-border/50 pb-1">
              Equilíbrio do Funil
            </span>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-blue-400 font-bold">TOFU (Atração):</span>
                  <span>{Math.round(tofuPct)}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${tofuPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-purple-400 font-bold">MOFU (Nutrição):</span>
                  <span>{Math.round(mofuPct)}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${mofuPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-emerald-400 font-bold">BOFU (Venda):</span>
                  <span>{Math.round(bofuPct)}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${bofuPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings & Suggestions List */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
            <Lightbulb size={14} className="text-yellow-400" /> Diagnóstico do Algoritmo & Recomendações
          </h4>

          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warn, i) => (
                <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-sans">
                  {warn}
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-zinc-950 p-3 rounded-xl border border-panel-border space-y-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1">
                    <Zap size={13} className="text-yellow-400 fill-yellow-400" /> {rec.title}
                  </h5>
                  <p className="text-[11px] text-zinc-400">{rec.desc}</p>
                  <button
                    onClick={() => {
                      if (onQuickAddSuggestedPost) {
                        onQuickAddSuggestedPost(rec.funnel, rec.format);
                      }
                      onClose();
                    }}
                    className="w-full py-1.5 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple font-bold text-[11px] rounded-lg border border-accent-purple/30 transition-all flex items-center justify-center gap-1"
                  >
                    Adicionar este Post Sugerido <ArrowRight size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={16} /> Excelente trabalho! Seu calendário possui uma excelente distribuição entre topo, meio e fundo de funil!
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-panel-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
