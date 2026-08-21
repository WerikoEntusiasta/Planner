import React from 'react';
import { Sparkles, Workflow, Rocket, Clock, CheckCircle, Bell, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

export type ComingSoonFeatureType = 'carousel_ai' | 'integrations' | 'general';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: ComingSoonFeatureType;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  featureType,
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  const contentMap = {
    carousel_ai: {
      badge: 'EM BREVE',
      badgeColor: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
      icon: Sparkles,
      iconBg: 'from-purple-600/30 to-pink-600/30 border-purple-500/40 text-purple-400',
      title: 'Criador de Carrossel com IA',
      subtitle: 'Gere sequências completas de carrosséis de alta conversão para Instagram e LinkedIn em segundos com Inteligência Artificial.',
      highlights: [
        {
          title: 'Design Automático & Layouts 1080x1350',
          desc: 'A IA gera o roteiro magnético (gancho, desenvolvimento e CTA) já formatado visualmente em slides prontos para exportação em alta resolução.'
        },
        {
          title: 'Exportação em Imagem (PNG/ZIP) e Código',
          desc: 'Baixe todos os slides em lote ou copie o código de estilização adaptado à paleta de cores da sua marca com 1 clique.'
        },
        {
          title: 'Integração Direta com o Calendário',
          desc: 'Transforme o carrossel gerado diretamente em um post agendado no seu fluxo editorial sem retrabalho.'
        }
      ],
      eta: 'Lançamento em fase final de testes e refinamento de qualidade.'
    },
    integrations: {
      badge: 'EM BREVE',
      badgeColor: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
      icon: Workflow,
      iconBg: 'from-orange-600/30 to-amber-600/30 border-orange-500/40 text-orange-400',
      title: 'Central de Integrações e Publicação Automática',
      subtitle: 'Conecte suas contas oficiais do Instagram, TikTok e YouTube para publicação direta e sincronização automática de métricas.',
      highlights: [
        {
          title: 'Publicação e Agendamento Direto',
          desc: 'Seus posts aprovados serão disparados automaticamente nas redes sociais oficiais sem necessidade de lembretes manuais.'
        },
        {
          title: 'Sincronização de Métricas Reais',
          desc: 'Acompanhe alcance, engajamento, curtidas e comentários direto no dashboard sem sair do Content Planner.'
        },
        {
          title: 'Conexão Segura com a Meta & Google Graph API',
          desc: 'Integração 100% em conformidade com as políticas oficiais das plataformas, garantindo segurança total dos dados da agência e clientes.'
        }
      ],
      eta: 'Aguardando validação dos tokens de produção nas APIs oficiais da Meta e Google.'
    },
    general: {
      badge: 'EM BREVE',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      icon: Rocket,
      iconBg: 'from-blue-600/30 to-indigo-600/30 border-blue-500/40 text-blue-400',
      title: 'Novo Recurso em Desenvolvimento',
      subtitle: 'Estamos construindo uma funcionalidade incrível para potencializar a sua produção de conteúdo.',
      highlights: [
        {
          title: 'Novidades Constantes',
          desc: 'Nossa equipe está trabalhando a todo vapor para trazer novidades de ponta toda semana.'
        }
      ],
      eta: 'Chegando muito em breve na sua conta.'
    }
  };

  const feature = contentMap[featureType] || contentMap.general;
  const FeatureIcon = feature.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xl bg-[#121218] border border-panel-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-accent-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-accent-orange/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 border-b border-panel-border/80 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br border ${feature.iconBg} shadow-lg flex-shrink-0`}>
              <FeatureIcon size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${feature.badgeColor}`}>
                  {feature.badge}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                  <Clock size={12} className="text-zinc-500" />
                  Em desenvolvimento
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">
                {feature.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {feature.subtitle}
          </p>

          <div className="space-y-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Zap size={14} className="text-accent-purple" />
              O que este recurso trará para você:
            </div>

            <div className="space-y-2.5">
              {feature.highlights.map((h, index) => (
                <div 
                  key={index}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 flex items-start gap-3 hover:border-zinc-700 transition-all"
                >
                  <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{h.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Note */}
          <div className="p-3.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center gap-3">
            <Bell size={18} className="text-accent-purple flex-shrink-0" />
            <div className="text-xs text-purple-200">
              <span className="font-semibold text-white">Status da Atualização:</span> {feature.eta}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative p-4 px-6 border-t border-panel-border/80 bg-[#0d0d12] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Você será notificado assim que for liberado!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent-purple to-accent-orange text-white text-xs font-bold shadow-lg hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Entendi, aguardar lançamento</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
