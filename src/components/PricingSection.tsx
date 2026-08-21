import React, { useState, useEffect } from 'react';
import { Check, Zap, Sparkles, Shield, ArrowRight, Loader2, Globe, Tag, Percent, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { Coupon } from '../types';

interface PricingSectionProps {
  onSelectPlan?: (plan: 'starter' | 'basic' | 'pro' | 'growth', cycle: 'monthly' | 'quarterly') => void;
  className?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
}

interface AppliedCouponInfo {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountPercent: number;
  discountAmount: number;
  description?: string;
  isFree?: boolean;
}

export default function PricingSection({
  onSelectPlan,
  className = '',
  userEmail = '',
  userName = '',
  userId = '',
}: PricingSectionProps) {
  const [cycle, setCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [currency, setCurrency] = useState<'brl' | 'usd'>('brl');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Coupon states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCouponInputOpen, setIsCouponInputOpen] = useState(false);

  // Auto-detect currency based on browser locale and check URL for coupon
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

    // Check URL parameters for coupon (e.g., ?cupom=LANCA20 or ?coupon=PROMO50)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCoupon = params.get('cupom') || params.get('coupon') || params.get('cupom_desconto');
      if (urlCoupon) {
        setCouponCodeInput(urlCoupon.toUpperCase().trim());
        setIsCouponInputOpen(true);
        validateAndApplyCoupon(urlCoupon.toUpperCase().trim(), false);
      }
    } catch (e) {}
  }, []);

  const validateAndApplyCoupon = async (codeToValidate: string, showFeedback = true) => {
    const cleanCode = (codeToValidate || couponCodeInput).trim().toUpperCase();
    if (!cleanCode) {
      if (showFeedback) {
        setCouponFeedback({ type: 'error', text: 'Por favor, digite o código do cupom.' });
      }
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponFeedback(null);

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          plan: 'pro',
          cycle,
          currency
        }),
      });

      const data = await response.json();

      if (data.success && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          description: data.coupon.description,
          isFree: data.isFree
        });
        setCouponCodeInput(data.coupon.code);
        if (showFeedback) {
          setCouponFeedback({
            type: 'success',
            text: `🎉 Cupom "${data.coupon.code}" aplicado com sucesso! ${data.coupon.discountType === 'percent' ? `${data.coupon.discountValue}% de desconto` : `desconto aplicado`} em todos os planos.`
          });
        }
      } else {
        setAppliedCoupon(null);
        if (showFeedback) {
          setCouponFeedback({
            type: 'error',
            text: data.error || 'Cupom inválido ou expirado.'
          });
        }
      }
    } catch (err: any) {
      if (showFeedback) {
        setCouponFeedback({
          type: 'error',
          text: 'Erro ao validar cupom. Tente novamente.'
        });
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponFeedback(null);
  };

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      badge: 'Iniciante',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Ideal para criadores e freelancers expandindo seus primeiros clientes.',
      prices: {
        brl: {
          monthly: 14.99,
          quarterly: 42.00,
          equiv: 14.00,
          symbol: 'R$',
        },
        usd: {
          monthly: 3.99,
          quarterly: 10.99,
          equiv: 3.66,
          symbol: '$',
        },
      },
      features: [
        'Até 4 Clientes / Marcas cadastrados',
        'Até 2 Membros na equipe com permissões',
        'Calendário Multicanal (Instagram, TikTok, YouTube, LinkedIn)',
        'Kanban de Produção & Pipeline de Status',
        'Link Público de Aprovação sem login para clientes',
        'Upload Manual de Mídias e Roteiros',
        'Metas Estratégicas & Checklist por Marca',
        'Exportação da Grade em PDF',
      ],
      popular: false,
      buttonColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
    },
    {
      id: 'basic' as const,
      name: 'Basic',
      badge: 'Essencial com IA',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      description: 'Ideal para criadores e pequenos negócios com acesso liberado ao motor de Inteligência Artificial.',
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
        'Acesso IA de planejamento com limites',
        'Criador de Carrosséis & Posts com IA',
        'Exportação de Carrosséis em ZIP e PNG HD',
        'Calendário Multicanal & Kanban de Produção',
        'Link Público de Aprovação sem login para clientes',
        'Upload Manual de Mídias e Roteiros',
        'Metas Estratégicas & Checklist por Marca',
        'Exportação da Grade e Relatórios em PDF',
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
        'Até 5 Membros na equipe com permissões',
        'IA de planejamento com limites',
        'Criador de Carrosséis & Posts com IA',
        'Exportação de Carrosséis em ZIP e PNG HD',
        'Central de Referências & Hub de Inspirações',
        'Diagnóstico & Análise Estratégica do Calendário com IA',
        'Calendário Multicanal & Kanban de Produção',
        'Link Público de Aprovação com Feedback em Tempo Real',
        'Upload Manual de Mídias e Roteiros',
        'Metas Estratégicas & Métricas de Frequência',
        'Exportação da Grade e Relatórios em PDF',
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
        'Até 25 Clientes / Marcas cadastrados',
        'Até 8 Membros na equipe com controle total',
        'IA de planejamento sem limites',
        'Criador de Carrosséis & Posts com IA',
        'Exportação de Carrosséis em ZIP e PNG HD',
        'Central de Referências & Hub de Inspirações',
        'Diagnóstico & Análise Estratégica do Calendário com IA',
        'Calendário Multicanal & Kanban de Produção',
        'Links Públicos de Aprovação Ilimitados',
        'Upload Manual de Mídias e Roteiros',
        'Metas Estratégicas & Métricas de Frequência',
        'Exportação Completa de Relatórios em PDF',
        'Suporte Prioritário Dedicado',
      ],
      popular: false,
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
    },
  ];

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedCoupon) return originalPrice;
    if (appliedCoupon.discountType === 'percent') {
      const discount = (originalPrice * appliedCoupon.discountValue) / 100;
      return Math.max(0, originalPrice - discount);
    } else {
      return Math.max(0, originalPrice - appliedCoupon.discountValue);
    }
  };

  const handleSubscribe = async (planId: 'starter' | 'basic' | 'pro' | 'growth') => {
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
          userId: userId || undefined,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
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

        {/* 15 Days Free Trial Announcement Banner */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-purple/20 via-accent-orange/20 to-accent-purple/20 border border-accent-purple/40 text-white text-xs font-semibold shadow-lg">
          <Sparkles size={15} className="text-accent-orange animate-pulse" />
          <span>🔥 <strong>15 Dias de Teste Grátis</strong> para qualquer plano pago • <strong>Sem cartão de crédito</strong> • Plano Gratuito Vitalício</span>
        </div>

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

        {/* Coupon Bar & Input */}
        <div className="mt-6 max-w-md mx-auto">
          {!appliedCoupon ? (
            <div>
              {!isCouponInputOpen ? (
                <button
                  type="button"
                  onClick={() => setIsCouponInputOpen(true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-accent-purple hover:text-accent-purple/80 transition-colors py-1 px-3 rounded-lg hover:bg-accent-purple/10 cursor-pointer"
                >
                  <Tag size={13} />
                  <span>Possui um cupom de desconto? Clique aqui</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-1.5 bg-zinc-900/90 border border-panel-border rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          validateAndApplyCoupon(couponCodeInput);
                        }
                      }}
                      placeholder="Ex: LANCA20, CREATOR10..."
                      className="w-full bg-zinc-950 border border-panel-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white uppercase font-mono tracking-wider placeholder:text-zinc-600 focus:outline-none focus:border-accent-purple"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isValidatingCoupon || !couponCodeInput.trim()}
                    onClick={() => validateAndApplyCoupon(couponCodeInput)}
                    className="px-3 py-1.5 rounded-lg bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span>Aplicar</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCouponInputOpen(false);
                      setCouponFeedback(null);
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
                    title="Fechar"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs shadow-md">
              <div className="flex items-center gap-2 text-left">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <span className="font-mono font-bold text-emerald-300 uppercase tracking-wide">
                    Cupom {appliedCoupon.code}
                  </span>
                  <span className="text-zinc-300 ml-1.5 text-[11px]">
                    ({appliedCoupon.discountType === 'percent' ? `-${appliedCoupon.discountValue}% OFF` : `-${currency === 'brl' ? 'R$' : '$'} ${appliedCoupon.discountValue.toFixed(2)} OFF`})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 transition-all cursor-pointer"
              >
                Remover
              </button>
            </div>
          )}

          {/* Coupon Feedback alert */}
          {couponFeedback && (
            <div
              className={`mt-2 p-2 rounded-lg text-xs flex items-center justify-center gap-1.5 ${
                couponFeedback.type === 'success'
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-950/50 text-red-300 border border-red-500/30'
              }`}
            >
              {couponFeedback.type === 'success' ? (
                <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle size={13} className="shrink-0 text-red-400" />
              )}
              <span>{couponFeedback.text}</span>
            </div>
          )}
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
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto text-left">
          {plans.map((plan) => {
            const priceInfo = plan.prices[currency];
            const originalPrice = cycle === 'monthly' ? priceInfo.monthly : priceInfo.quarterly;
            const finalPrice = calculateDiscountedPrice(originalPrice);
            const hasDiscount = appliedCoupon && finalPrice < originalPrice;
            const isFree = hasDiscount && finalPrice === 0;

            const formattedOriginalPrice = currency === 'brl' 
              ? `R$ ${originalPrice.toFixed(2).replace('.', ',')}`
              : `$${originalPrice.toFixed(2)}`;

            const formattedFinalPrice = isFree 
              ? 'GRÁTIS'
              : (currency === 'brl' 
                  ? `R$ ${finalPrice.toFixed(2).replace('.', ',')}`
                  : `$${finalPrice.toFixed(2)}`);

            const savingsAmount = originalPrice - finalPrice;
            const formattedSavings = currency === 'brl'
              ? `R$ ${savingsAmount.toFixed(2).replace('.', ',')}`
              : `$${savingsAmount.toFixed(2)}`;

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
                  {hasDiscount && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500 line-through font-mono">
                        {formattedOriginalPrice}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                        Economize {formattedSavings}
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl sm:text-4xl font-extrabold ${hasDiscount ? 'text-emerald-400' : 'text-white'}`}>
                      {formattedFinalPrice}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-zinc-400 font-medium">
                        /{cycle === 'monthly' ? 'mês' : 'trimestre'}
                      </span>
                    )}
                  </div>

                  {cycle === 'quarterly' && !isFree && (
                    <p className="text-[11px] text-emerald-400 font-mono font-bold mt-1.5">
                      Equivale a {currency === 'brl' ? `R$ ${(finalPrice / 3).toFixed(2).replace('.', ',')}` : `$${(finalPrice / 3).toFixed(2)}`}/mês no plano trimestral
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
                      <span>{isFree ? `Resgatar Plano ${plan.name} Grátis` : `Assinar Plano ${plan.name}`}</span>
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

