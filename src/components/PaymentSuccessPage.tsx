import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Layers, 
  Calendar, 
  Printer, 
  MessageSquare, 
  Zap, 
  Home, 
  Crown, 
  Award, 
  Check 
} from 'lucide-react';

interface PaymentSuccessPageProps {
  initialPlan?: 'free' | 'starter' | 'basic' | 'pro' | 'growth';
  initialCycle?: 'monthly' | 'quarterly';
  currentUser: User | null;
  onGoToPlanner: () => void;
  onUpdateUserPlan: (plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth', cycle?: 'monthly' | 'quarterly') => void;
  onOpenTeamModal?: () => void;
  onBackToHome?: () => void;
}

export default function PaymentSuccessPage({
  initialPlan = 'pro',
  initialCycle = 'monthly',
  currentUser,
  onGoToPlanner,
  onUpdateUserPlan,
  onOpenTeamModal,
  onBackToHome,
}: PaymentSuccessPageProps) {
  const { t } = useLanguage();
  const [activePlan, setActivePlan] = useState<'free' | 'starter' | 'basic' | 'pro' | 'growth'>(initialPlan);
  const [activeCycle, setActiveCycle] = useState<'monthly' | 'quarterly'>(initialCycle);
  const [transactionId, setTransactionId] = useState(() => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const sessId = urlParams.get('session_id');
    return sessId ? `STRIPE-${sessId.slice(0, 16)}...` : `TX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  });
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [confirmationDate] = useState(() => {
    const now = new Date();
    return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  });

  // Verify Stripe Session if session_id parameter is present in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const planParam = urlParams.get('plan');
    const cycleParam = urlParams.get('cycle');

    if (planParam && ['free', 'starter', 'basic', 'pro', 'growth'].includes(planParam)) {
      setActivePlan(planParam as any);
    }
    if (cycleParam && ['monthly', 'quarterly'].includes(cycleParam)) {
      setActiveCycle(cycleParam as any);
    }

    if (sessionId) {
      fetch(`/api/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.session) {
            setTransactionId(data.session.id);
            setStripeStatus(data.session.payment_status === 'paid' ? 'Stripe Verificado' : data.session.payment_status);
            if (data.session.plan && ['free', 'starter', 'basic', 'pro', 'growth'].includes(data.session.plan)) {
              setActivePlan(data.session.plan);
            }
            if (data.session.cycle && ['monthly', 'quarterly'].includes(data.session.cycle)) {
              setActiveCycle(data.session.cycle);
            }
          }
        })
        .catch(err => {
          console.info('Could not verify stripe session:', err);
        });
    }
  }, []);

  // Auto-upgrade user account plan on mount or plan change
  useEffect(() => {
    if (currentUser) {
      onUpdateUserPlan(activePlan, activeCycle);
    }
  }, [activePlan, activeCycle, currentUser?.id]);

  // Price calculations
  const getPriceDisplay = () => {
    if (activePlan === 'free') return 'R$ 0,00';
    if (activePlan === 'starter') {
      return activeCycle === 'quarterly' ? 'R$ 42,00' : 'R$ 14,99';
    }
    if (activePlan === 'basic') {
      return activeCycle === 'quarterly' ? 'R$ 84,00' : 'R$ 29,00';
    }
    if (activePlan === 'pro') {
      return activeCycle === 'quarterly' ? 'R$ 144,00' : 'R$ 49,00';
    }
    if (activePlan === 'growth') {
      return activeCycle === 'quarterly' ? 'R$ 224,00' : 'R$ 79,00';
    }
    return 'R$ 0,00';
  };

  const getPlanTitle = () => {
    switch (activePlan) {
      case 'starter':
        return t('planStarterTitleSuccess', 'Plano Starter Ativado com Sucesso!');
      case 'basic':
        return t('planBasicTitleSuccess', 'Plano Basic Ativado com Sucesso!');
      case 'pro':
        return t('planProTitleSuccess', 'Plano Pro Ativado com Sucesso!');
      case 'growth':
        return t('planGrowthTitleSuccess', 'Plano Growth PRO Ativado com Sucesso!');
      case 'free':
      default:
        return t('planFreeTitleSuccess', 'Plano Gratuito Ativado!');
    }
  };

  const getPlanBadge = () => {
    switch (activePlan) {
      case 'starter':
        return { label: t('starterPlanTitle', 'Plano Starter'), color: 'bg-blue-600 text-white border-blue-500/30' };
      case 'basic':
        return { label: t('planBasicTitle', 'Plano Basic'), color: 'bg-accent-purple text-white border-accent-purple/30' };
      case 'pro':
        return { label: t('planProTitle', 'Plano Pro'), color: 'bg-gradient-to-r from-accent-purple to-accent-orange text-white border-white/20' };
      case 'growth':
        return { label: t('planGrowthTitle', 'Growth PRO'), color: 'bg-emerald-500 text-black font-extrabold border-emerald-400/30' };
      case 'free':
      default:
        return { label: t('planFreeTitle', 'Plano Gratuito'), color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const getPlanFeatures = () => {
    switch (activePlan) {
      case 'starter':
        return [
          { title: t('starterFeat1', 'Até 4 Clientes/Marcas'), desc: 'Adicione marcas e canais com limite expandido' },
          { title: t('starterFeat2', 'Até 2 Membros de Equipe'), desc: 'Convide colaboradores com permissões' },
          { title: t('starterFeat3', 'Calendário editorial e Kanban'), desc: 'Organização visual completa de publicações' },
          { title: t('starterFeat4', 'Link de aprovação sem login'), desc: 'Envie links públicos para clientes aprovarem' }
        ];
      case 'basic':
        return [
          { title: t('basicFeat1', 'Até 8 Clientes/Marcas'), desc: 'Adicione marcas e canais sem nenhuma restrição' },
          { title: t('basicFeat2', 'Até 3 Membros de Equipe'), desc: 'Convide colaboradores com permissões' },
          { title: t('basicFeat3', 'Permissões Personalizadas'), desc: 'Controle quem pode criar, editar ou excluir' },
          { title: t('basicFeat4', 'Roteiros & IA Avançada'), desc: 'Acesso total aos geradores estratégicos de conteúdo' },
          { title: t('clientPortal', 'Portal de Aprovação'), desc: 'Envie links diretos para clientes aprovarem posts' }
        ];
      case 'pro':
        return [
          { title: t('proFeat1', 'Até 14 Clientes/Marcas'), desc: 'Gerencie quantas marcas você ou sua agência desejar' },
          { title: t('proFeat2', 'Até 5 Membros de Equipe'), desc: 'Ideal para equipes em expansão e redatores' },
          { title: t('proFeat3', 'Permissões Completas'), desc: 'Personalização avançada por membro' },
          { title: t('proFeat4', 'Suporte Dedicado VIP'), desc: 'Atendimento prioritário via WhatsApp' },
          { title: 'IA Roteirista Sem Limites', desc: 'Geração irrestrita de ganchos e scripts' }
        ];
      case 'growth':
        return [
          { title: t('growthFeat1', 'Até 25 Clientes/Marcas'), desc: 'Acomode grandes portfólios corporativos' },
          { title: t('growthFeat2', 'Até 8 Membros de Equipe'), desc: 'Estrutura completa para agências consolidadas' },
          { title: t('growthFeat3', 'Painel de Controle Total'), desc: 'Auditoria de acessos e sincronização SQLite' },
          { title: t('growthFeat4', 'Prioridade Máxima de Suporte'), desc: 'Canal direto exclusivo com engenheiros' },
          { title: 'Backup & Sincronização em Nuvem', desc: 'Segurança absoluta para seus dados estratégicos' }
        ];
      case 'free':
      default:
        return [
          { title: t('freeFeat1', 'Até 2 Clientes/Marcas'), desc: 'Organização básica para creators solo' },
          { title: t('freeFeat2', '1 Membro de Equipe'), desc: 'Gerenciamento individual' },
          { title: t('freeFeat3', 'Calendário Editorial'), desc: 'Visão quinzenal e mensal' },
          { title: t('freeFeat4', 'Gestão Visual Kanban'), desc: 'Controle de rascunhos e agendamentos' }
        ];
    }
  };

  const badgeInfo = getPlanBadge();
  const features = getPlanFeatures();

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 flex flex-col font-sans selection:bg-accent-purple selection:text-white print:bg-white print:text-black">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="border-b border-panel-border/80 bg-panel-black/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-purple via-accent-purple-glow to-accent-orange p-0.5 shadow-lg shadow-accent-purple/20">
            <div className="w-full h-full bg-panel-black rounded-[10px] flex items-center justify-center">
              <Sparkles size={18} className="text-accent-orange" />
            </div>
          </div>
          <div>
            <span className="text-base font-display font-black tracking-tight text-white uppercase block leading-none">
              Planner<span className="text-zinc-500 font-normal">SaaS</span>
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
              • {t('paymentMethodValue', 'Pagamento Aprovado')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Home size={14} />
              <span>{t('backToHome', 'Início')}</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8">
        
        {/* HERO VICTORY BANNER */}
        <div className="p-8 md:p-10 bg-gradient-to-b from-panel-card via-panel-black to-panel-card border border-panel-border rounded-3xl text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-radial from-accent-purple/15 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center space-y-4">
            {/* Animated Glow Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
                <CheckCircle2 size={44} className="text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 bg-accent-orange p-1.5 rounded-full text-black shadow-lg">
                <Sparkles size={16} />
              </div>
            </div>

            {/* Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wider border ${badgeInfo.color}`}>
              {badgeInfo.label} • {activeCycle === 'monthly' ? t('month', 'Mensal') : t('3months', ' Trimestral')}
            </span>

            <h1 className="text-3xl md:text-4xl font-display font-black text-white leading-tight max-w-xl">
              {getPlanTitle()}
            </h1>

            <p className="text-xs md:text-sm text-zinc-400 max-w-lg leading-relaxed">
              {t('paymentSuccessSub', 'Sua assinatura foi ativada e seu workspace já possui todos os recursos liberados.')}
            </p>
          </div>
        </div>

        {/* ORDER & SUBSCRIPTION SUMMARY CARD */}
        <div className="p-6 md:p-8 bg-panel-card border border-panel-border rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-panel-border/60 pb-4">
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-accent-purple" />
              <span>{t('orderSummary', 'Resumo do Pedido & Assinatura')}</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase">
              • Status: {stripeStatus || 'Aprovado'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('transactionId', 'ID da Transação')}</span>
              <p className="font-mono font-bold text-white">{transactionId}</p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('paymentDate', 'Data de Confirmação')}</span>
              <p className="font-medium text-white">{confirmationDate}</p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('amountPaid', 'Valor Pago')}</span>
              <p className="font-display font-black text-accent-orange text-sm">{getPriceDisplay()}</p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('paymentMethod', 'Forma de Pagamento')}</span>
              <p className="font-medium text-zinc-200">{t('paymentMethodValue', 'Cartão de Crédito / PIX (Aprovado)')}</p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('billingCycleLabel', 'Ciclo de Cobrança')}</span>
              <p className="font-medium text-zinc-200">
                {activeCycle === 'monthly' ? t('billingMonthly', 'Faturamento Mensal') : t('billingQuarterly', 'Plano de 3 Meses (-10%)')}
              </p>
            </div>

            <div className="p-3.5 bg-zinc-900/80 border border-panel-border/50 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{t('accountOwner', 'Titular da Conta')}</span>
              <p className="font-medium text-white truncate">{currentUser ? currentUser.email : 'usuario@planner.com'}</p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 text-center font-mono pt-2">
            {t('receiptFooterNote', 'O recibo oficial e os detalhes da cobrança também foram enviados para o seu e-mail de cadastro.')}
          </p>
        </div>

        {/* UNLOCKED FEATURES CHECKLIST */}
        <div className="p-6 md:p-8 bg-panel-card border border-panel-border rounded-2xl shadow-xl space-y-6">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <Crown size={18} className="text-accent-orange" />
            <span>{t('unlockedFeatures', 'Recursos Liberados no seu Workspace')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, idx) => (
              <div key={idx} className="p-4 bg-zinc-900/60 border border-panel-border/60 rounded-xl flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5 flex-shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-display">{feat.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRIMARY ACTIONS BAR */}
        <div className="p-6 bg-zinc-950 border border-panel-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onGoToPlanner}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-display font-extrabold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>{t('goToPlanner', 'Acessar Meu Planner de Conteúdo')}</span>
              <ArrowRight size={16} />
            </button>

            {onOpenTeamModal && currentUser && (
              <button
                onClick={onOpenTeamModal}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl font-display font-bold text-xs bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Users size={15} className="text-accent-purple" />
                <span>{t('manageTeam', 'Gerenciar Equipe')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintReceipt}
              className="px-3.5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title={t('downloadReceipt', 'Imprimir Comprovante / Recibo')}
            >
              <Printer size={15} />
              <span className="hidden md:inline">{t('downloadReceipt', 'Imprimir Recibo')}</span>
            </button>

            <a
              href="https://wa.me/5517991951381?text=Ol%C3%A1!%20Acabei%20de%20assinar%20o%20Planner%20e%20gostaria%20de%20suporte%20VIP."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare size={15} />
              <span className="hidden md:inline">{t('contactVipSupport', 'Suporte VIP')}</span>
            </a>
          </div>
        </div>

        {/* PLAN TESTING / PREVIEW SWITCHER BAR */}
        <div className="p-4 bg-panel-card/60 border border-panel-border/50 rounded-xl text-center space-y-3 print:hidden">
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
            🧪 {t('switchPlanPreview', 'Simular Visualização de Outro Plano')}:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(['free', 'starter', 'basic', 'pro', 'growth'] as const).map((planKey) => (
              <button
                key={planKey}
                onClick={() => setActivePlan(planKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer uppercase ${
                  activePlan === planKey
                    ? 'bg-accent-purple text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-panel-border'
                }`}
              >
                {planKey}
              </button>
            ))}

            <div className="w-px h-5 bg-panel-border mx-1" />

            <button
              onClick={() => setActiveCycle(activeCycle === 'monthly' ? 'quarterly' : 'monthly')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-accent-orange border border-panel-border cursor-pointer"
            >
              Cycle: {activeCycle === 'monthly' ? 'Mensal' : 'Trimestral'}
            </button>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-panel-border/80 bg-panel-black py-4 text-center text-[11px] text-zinc-600 font-mono print:hidden">
        <p>Planner de Conteúdo Multicanal • Página de Redirecionamento Pós-Pagamento</p>
      </footer>

    </div>
  );
}
