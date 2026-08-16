import React, { useState, useEffect } from 'react';
import { Check, Zap, Sparkles, Shield, ArrowRight, Loader2, Globe } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan?: (plan: 'basic' | 'pro' | 'growth', cycle: 'monthly' | 'quarterly') => void;
  className?: string;
  userEmail?: string;
  userName?: string;
}

export default function PricingSection({
  onSelectPlan,
  className = '',
  userEmail = '',
  userName = '',
}: PricingSectionProps) {
  const [cycle, setCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [currency, setCurrency] = useState<'brl' | 'usd'>('brl');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect currency based on browser locale
  useEffect(() => {
    try {
      const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'pt-BR';
      if (!lang.toLowerCase().startsWith('pt')) {
        setCurrency('usd');
      } else {
        setCurrency('brl');
      }
    } catch (e) {
      setCurrency('brl');
    }
  }, []);

  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic',
      badge: 'Essencial',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      description: 'Ideal para criadores individuais e pequenos negócios que querem organização.',
      prices: {
        brl: {
          monthly: 29.00,
          quarterly: 84.00,
          equiv: 28.00,
          symbol: 'R$',
        },
        usd: {
          monthly: 5.99,
          quarterly: 16.99,
          equiv: 5.66,
          symbol: '$',
        },
      },
      features: [
        'Até 8 Clientes / Marcas cadastrados',
        'Até 3 Membros na equipe com permissões',
        'Calendário Multicanal (Instagram, TikTok, YouTube)',
        'Kanban de Produção & Pipeline de Aprovação',
        'Upload de Roteiros e Mídias',
        'Link Público de Aprovação sem login para clientes',
        'Exportação de Relatórios em PDF',
      ],
      popular: false,
      buttonColor: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-panel-border',
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      badge: 'Mais Popular',
      badgeColor: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
      description: 'Perfeito para creators em escala, agências e times de marketing ágeis.',
      prices: {
        brl: {
          monthly: 49.00,
          quarterly: 144.00,
          equiv: 48.00,
          symbol: 'R$',
        },
        usd: {
          monthly: 9.99,
          quarterly: 28.99,
          equiv: 9.66,
          symbol: '$',
        },
      },
      features: [
        'Até 14 Clientes / Marcas cadastrados',
        'Até 5 Membros na equipe',
        'Todas as funções do plano Basic',
        'Gerador de Roteiros com Inteligência Artificial',
        'Criador de Carrosséis Estratégicos com IA',
        'Central de Referências & Hub de Inspirações',
        'Métricas Estratégicas e Acompanhamento de Metas',
        'Suporte Prioritário via WhatsApp e E-mail',
      ],
      popular: true,
      buttonColor: 'bg-accent-purple hover:bg-accent-purple/90 text-white shadow-lg shadow-accent-purple/25',
    },
    {
      id: 'growth' as const,
      name: 'Growth PRO',
      badge: 'Escala Total',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Potência máxima para agências consagradas e grandes operações de conteúdo.',
      prices: {
        brl: {
          monthly: 79.00,
          quarterly: 224.00,
          equiv: 74.66,
          symbol: 'R$',
        },
        usd: {
          monthly: 15.99,
          quarterly: 45.99,
          equiv: 15.33,
          symbol: '$',
        },
      },
      features: [
        'Até 20 Clientes / Marcas cadastrados',
        'Até 10 Membros na equipe com controle total',
        'Tudo do Plano Pro incluído',
        'Geração de Roteiros e Copys com IA Ilimitada',
        'Biblioteca Avançada de Hashtags & Brand Kits',
        'Customização White-label nos Links de Aprovação',
        'Gerente de Contas Dedicado',
        'SLA de Atendimento Garantido em até 2 horas',
      ],
      popular: false,
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
    },
  ];

  const handleSubscribe = async (planId: 'basic' | 'pro' | 'growth') => {
    if (onSelectPlan) {
      onSelectPlan(planId, cycle);
      return;
    }

    try {
      setLoadingPlan(planId);
      setErrorMessage(null);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          cycle,
          currency,
          customer: {
            name: userName || 'Cliente Planner SaaS',
            email: userEmail || 'cliente@planner.com',
            country: currency === 'brl' ? 'BR' : 'US',
            currency,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Não foi possível iniciar o checkout da Stripe.');
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setErrorMessage(err?.message || 'Erro ao conectar ao Stripe Checkout. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className={`py-12 ${className}`} id="planos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-semibold mb-4">
          <Sparkles size={14} />
          <span>Planos Transparentes e Sem Surpresas</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Escolha o Plano Ideal para a sua Produção
        </h2>
        <p className="text-zinc-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
          Eleve a produtividade dos seus conteúdos e aprove clientes com velocidade profissional. Cancele quando quiser.
        </p>

        {/* Toggles: Ciclo (Mensal / Trimestral) + Moeda (BRL / USD) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {/* Ciclo Toggle */}
          <div className="inline-flex rounded-xl bg-zinc-900 border border-panel-border p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cycle === 'monthly'
                  ? 'bg-accent-purple text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle('quarterly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                cycle === 'quarterly'
                  ? 'bg-accent-purple text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Plano Trimestral (3 Meses)</span>
              <span className="text-[9px] bg-accent-orange text-black font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                -10% OFF
              </span>
            </button>
          </div>

          {/* Moeda Toggle */}
          <div className="inline-flex rounded-xl bg-zinc-900 border border-panel-border p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setCurrency('brl')}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'brl'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🇧🇷 BRL (R$)</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrency('usd')}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'usd'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🇺🇸 USD ($)</span>
            </button>
          </div>
        </div>

        {/* Stripe Trust Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Shield size={14} className="text-emerald-400" />
          <span>Checkout 100% Criptografado e Seguro via Stripe</span>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs max-w-md mx-auto">
            {errorMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
          {plans.map((plan) => {
            const priceInfo = plan.prices[currency];
            const currentPrice = cycle === 'monthly' ? priceInfo.monthly : priceInfo.quarterly;
            const formattedPrice = currency === 'brl' 
              ? `R$ ${currentPrice.toFixed(2).replace('.', ',')}`
              : `$${currentPrice.toFixed(2)}`;
            const formattedEquiv = currency === 'brl'
              ? `R$ ${priceInfo.equiv.toFixed(2).replace('.', ',')}`
              : `$${priceInfo.equiv.toFixed(2)}`;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-zinc-900/90 border flex flex-col p-6 sm:p-8 transition-all hover:translate-y-[-2px] ${
                  plan.popular
                    ? 'border-accent-purple shadow-xl shadow-accent-purple/10 ring-1 ring-accent-purple'
                    : 'border-panel-border/80 hover:border-zinc-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-purple text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Mais Escolhido
                  </div>
                )}

                {/* Top Info */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-2 min-h-[36px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      {formattedPrice}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      /{cycle === 'monthly' ? 'mês' : 'trimestre'}
                    </span>
                  </div>

                  {cycle === 'quarterly' && (
                    <p className="text-[11px] text-emerald-400 font-mono font-bold mt-1.5">
                      Equivale a {formattedEquiv}/mês no plano trimestral
                    </p>
                  )}
                </div>

                {/* Action CTA Button */}
                <button
                  type="button"
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonColor}`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Conectando ao Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Assinar Plano {plan.name}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Features List */}
                <div className="mt-8 pt-6 border-t border-panel-border/60 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-3">
                      Recursos inclusos:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] text-zinc-500 text-center mt-6">
                    Acesso imediato após confirmação
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
