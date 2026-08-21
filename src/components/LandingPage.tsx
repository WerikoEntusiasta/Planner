import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { 
  Calendar, 
  Layers, 
  LayoutGrid, 
  Target, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  LogIn, 
  UserPlus, 
  Shield, 
  Globe, 
  Zap, 
  Check, 
  Instagram, 
  Youtube, 
  Video,
  ChevronLeft,
  ChevronRight,
  Users,
  CreditCard,
  ExternalLink,
  Key,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LegalTextsDialog from './LegalTextsDialog';

interface LandingPageProps {
  onLogin: (user: User) => void;
  onEnterAdminMode: () => void;
  initialAuthOpen?: boolean;
  initialTab?: 'login' | 'register';
}

export default function LandingPage({ 
  onLogin, 
  onEnterAdminMode, 
  initialAuthOpen = false, 
  initialTab = 'login' 
}: LandingPageProps) {
  const { t } = useLanguage();
  const [isAuthOpen, setIsAuthOpen] = useState(initialAuthOpen);
  const [isLoginTab, setIsLoginTab] = useState(initialTab === 'login');

  useEffect(() => {
    if (initialAuthOpen) {
      setIsAuthOpen(true);
      setIsLoginTab(initialTab === 'login');
    }
  }, [initialAuthOpen, initialTab]);
  
  // Invite states
  const [invitedByHostId, setInvitedByHostId] = useState<string | null>(null);
  const [invitedByHostName, setInvitedByHostName] = useState<string | null>(null);
  const [invitePermissions, setInvitePermissions] = useState<NonNullable<User['permissions']>>({
    createCards: true,
    editCards: true,
    deleteCards: true,
    manageClients: true
  });
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'basic' | 'pro' | 'growth'>('free');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState<'brl' | 'usd'>(() => {
    if (typeof window !== 'undefined' && (navigator.language.startsWith('en') || !navigator.language.startsWith('pt'))) {
      return 'usd';
    }
    return 'brl';
  });
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy' | null>(null);
  const [isRedirectingCheckout, setIsRedirectingCheckout] = useState(false);
  const [isStripeConfigModalOpen, setIsStripeConfigModalOpen] = useState(false);
  const [pendingPlanForCheckout, setPendingPlanForCheckout] = useState<'starter' | 'basic' | 'pro' | 'growth' | null>(null);
  const [stripeSecretKeyInput, setStripeSecretKeyInput] = useState('');
  const [stripePublishableKeyInput, setStripePublishableKeyInput] = useState('');
  const [isSavingStripeKey, setIsSavingStripeKey] = useState(false);
  const [stripeConfigError, setStripeConfigError] = useState('');
  const [stripeConfigSuccess, setStripeConfigSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check Stripe configuration on mount
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  useEffect(() => {
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isConfigured) {
          setIsStripeConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Stripe External Checkout redirect
  const handleStripeCheckout = async (plan: 'starter' | 'basic' | 'pro' | 'growth') => {
    setIsRedirectingCheckout(true);
    setError('');
    setPendingPlanForCheckout(plan);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          cycle: selectedBillingCycle,
          currency: selectedCurrency,
          customer: {
            name: name.trim() || 'Cliente Planner SaaS',
            email: email.trim() || 'cliente@planner.com',
            phone: phone.trim() || '11999999999',
            currency: selectedCurrency,
            country: selectedCurrency === 'brl' ? 'BR' : 'US'
          }
        })
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Redireciona o usuário diretamente para a página de checkout da Stripe
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = data.checkoutUrl;
          } else {
            window.location.href = data.checkoutUrl;
          }
        } catch {
          window.location.href = data.checkoutUrl;
        }
        return;
      } else if (data.notConfigured || data.invalidKey) {
        setIsRedirectingCheckout(false);
        setStripeConfigError(data.error || 'A chave do Stripe configurada não é válida. Ela deve começar com sk_test_ ou sk_live_.');
        setIsStripeConfigModalOpen(true);
      } else {
        setIsRedirectingCheckout(false);
        setError(data.error || 'Não foi possível gerar a sessão do Stripe.');
      }
    } catch (err: any) {
      console.error('Stripe checkout call error:', err);
      setIsRedirectingCheckout(false);
      setError(err.message || 'Erro de conexão ao gerar o checkout do Stripe.');
    }
  };

  const handleSaveStripeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStripeKey(true);
    setStripeConfigError('');
    setStripeConfigSuccess('');

    try {
      const res = await fetch('/api/admin/stripe-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: stripeSecretKeyInput,
          publishableKey: stripePublishableKeyInput
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao validar e salvar as chaves do Stripe.');
      }

      setStripeConfigSuccess('Chaves da Stripe salvas e verificadas com sucesso!');
      setIsStripeConfigured(true);

      setTimeout(() => {
        setIsStripeConfigModalOpen(false);
        if (pendingPlanForCheckout) {
          handleStripeCheckout(pendingPlanForCheckout);
        }
      }, 1000);
    } catch (err: any) {
      setStripeConfigError(err.message || 'Erro ao conectar à API da Stripe.');
    } finally {
      setIsSavingStripeKey(false);
    }
  };

  // Carousel active mockup screen state
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideImages, setSlideImages] = useState<Record<number, string>>({});

  // Load custom slide images from localStorage on mount
  React.useEffect(() => {
    const loaded: Record<number, string> = {};
    for (let i = 0; i < 4; i++) {
      const img = localStorage.getItem(`carousel_slide_${i}_img`);
      if (img) {
        loaded[i] = img;
      }
    }
    setSlideImages(loaded);
  }, []);

  // Auto-advance slides every 5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Check URL/hash for team invitation and parse pre-configured permissions
  React.useEffect(() => {
    const checkInvite = async () => {
      const params = new URLSearchParams(window.location.search);
      let inviteId = params.get('invite');
      if (!inviteId) {
        const hash = window.location.hash;
        if (hash && hash.includes('invite=')) {
          inviteId = hash.split('invite=')[1]?.split('&')[0];
        }
      }

      if (inviteId) {
        // Parse permissions from invite URL if present, defaulting to true
        const canCreate = params.get('create') !== 'false';
        const canEdit = params.get('edit') !== 'false';
        const canDelete = params.get('delete') !== 'false';
        const canManage = params.get('manage') !== 'false';

        setInvitePermissions({
          createCards: canCreate,
          editCards: canEdit,
          deleteCards: canDelete,
          manageClients: canManage
        });

        // Try local storage first
        const users = getRegisteredUsers();
        const localHost = users.find(u => u.id === inviteId);
        if (localHost) {
          setInvitedByHostId(localHost.id);
          setInvitedByHostName(localHost.name);
          setIsLoginTab(false); // Go directly to signup
          setIsAuthOpen(true); // Open modal automatically
        } else {
          // If not in localStorage (e.g. opened in different browser or incognito), fetch from server
          try {
            const res = await fetch(`/api/auth/invite-info/${encodeURIComponent(inviteId)}`);
            const data = await res.json();
            if (res.ok && data.success && data.host) {
              setInvitedByHostId(data.host.id);
              setInvitedByHostName(data.host.name);
              setIsLoginTab(false); // Go directly to signup
              setIsAuthOpen(true); // Open modal automatically
            } else {
              // Fallback with just the ID
              setInvitedByHostId(inviteId);
              setInvitedByHostName('Administrador');
              setIsLoginTab(false);
              setIsAuthOpen(true);
            }
          } catch (e) {
            setInvitedByHostId(inviteId);
            setInvitedByHostName('Administrador');
            setIsLoginTab(false);
            setIsAuthOpen(true);
          }
        }
      } else if (params.get('signup') === 'true' || params.get('register') === 'true' || params.get('tab') === 'register' || params.get('tab') === 'signup') {
        setIsLoginTab(false);
        setIsAuthOpen(true);
      } else if (params.get('auth') === 'open' || params.get('login') === 'true') {
        setIsLoginTab(true);
        setIsAuthOpen(true);
      }
    };

    checkInvite();
  }, []);

  // Read registered users from local storage
  const getRegisteredUsers = (): User[] => {
    const saved = localStorage.getItem('creator_planner_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const envAdminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL;
    const envAdminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD;

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password;

    const users = getRegisteredUsers();

    if (isLoginTab) {
      // 1. Try server-side authentication first
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: inputEmail,
            password: inputPass
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          if (data.isAdmin) {
            if (data.token) {
              localStorage.setItem('planner_admin_token', data.token);
            }
            setSuccess(t('adminAccessDetected', 'Acesso administrativo detectado! Entrando no Painel...'));
            setTimeout(() => {
              onEnterAdminMode();
            }, 800);
            return;
          }

          if (data.token) {
            localStorage.setItem('planner_user_token', data.token);
          }
          setSuccess(t('loginSuccessRedirecting', 'Login realizado com sucesso! Redirecionando...'));
          if (data.user) {
            // Synchronize database users to localStorage
            const currentLocalUsers = getRegisteredUsers();
            if (!currentLocalUsers.some(u => u.id === data.user.id)) {
              localStorage.setItem('creator_planner_registered_users', JSON.stringify([...currentLocalUsers, data.user]));
            }
            setTimeout(() => {
              onLogin(data.user);
            }, 800);
            return;
          }
        } else {
          // Explicit credential failure or error on server (e.g. status 400, 401, 500)
          setError(data.error || t('invalidEmailOrPassword', 'E-mail ou senha incorretos.'));
          return;
        }
      } catch (err) {
        console.warn('Server auth offline or failed, falling back to local simulation:', err);
      }

      // 2. Fallback to local check for Admin Credentials (build-time variables)
      if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail.toLowerCase() && inputPass === envAdminPassword) {
        setSuccess(t('adminAccessLocal', 'Acesso administrativo detectado! Entrando no Painel (Local)...'));
        setTimeout(() => {
          onEnterAdminMode();
        }, 800);
        return;
      }

      // 3. Fallback to local user check in localStorage
      const user = users.find(u => u.email.toLowerCase() === inputEmail);
      if (!user) {
        setError(t('emailNotRegistered', 'E-mail não cadastrado. Crie uma conta clicando na aba "Cadastrar"!'));
        return;
      }
      
      // Check password
      if (user.password !== password) {
        setError(t('incorrectPassword', 'Senha incorreta. Tente novamente.'));
        return;
      }

      // Log in
      setSuccess(t('loginSuccessLocal', 'Login realizado com sucesso (Local)! Redirecionando...'));
      setTimeout(() => {
        onLogin(user);
      }, 800);
    } else {
      // Validate inputs
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        setError(t('fillAllFields', 'Por favor, preencha todos os campos.'));
        return;
      }

      if (!lgpdConsent) {
        setError(t('agreeTermsRequired', 'Você precisa concordar com os Termos de Uso e Política de Privacidade para prosseguir.'));
        return;
      }

      // Check if email already registered or matches admin email
      if (envAdminEmail && inputEmail === envAdminEmail.toLowerCase()) {
        setError(t('emailReservedAdmin', 'Este e-mail está reservado para o administrador.'));
        return;
      }

      if (users.some(u => u.email.toLowerCase() === inputEmail)) {
        setError(t('emailAlreadyRegistered', 'Este e-mail já está cadastrado. Tente fazer login.'));
        return;
      }

      let isInvitee = false;
      let hostId: string | undefined = undefined;
      let permissionsObj = undefined;

      if (invitedByHostId) {
        isInvitee = true;
        hostId = invitedByHostId;
        permissionsObj = invitePermissions; // Use the configured permissions from the invite URL
      }

      // 1. Try server-side registration first
      try {
        const planToRegister = isInvitee ? 'free' : selectedPlan;
        const now = new Date();
        const trialStart = planToRegister === 'free' ? undefined : now.toISOString();
        const trialEnd = planToRegister === 'free' ? undefined : new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
        const isPaidUser = isInvitee || planToRegister === 'free';

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: inputEmail,
            phone: phone.trim(),
            password: password,
            plan: planToRegister,
            isTeamMember: isInvitee,
            invitedByUserId: hostId,
            permissions: permissionsObj
          })
        });

        const data = await response.json();
        if (response.ok && data.success && data.user) {
          if (data.token) {
            localStorage.setItem('planner_user_token', data.token);
          }
          const registeredUser = {
            ...data.user,
            plan: isInvitee ? undefined : selectedPlan,
            billingCycle: isInvitee ? undefined : (selectedPlan === 'free' ? 'monthly' : selectedBillingCycle),
            isTeamMember: isInvitee ? true : undefined,
            invitedByUserId: hostId,
            permissions: permissionsObj,
            trialStartDate: data.user.trialStartDate || trialStart,
            trialEndDate: data.user.trialEndDate || trialEnd,
            isPaid: data.user.isPaid !== undefined ? data.user.isPaid : isPaidUser
          };

          const updatedUsers = [...users, registeredUser];
          localStorage.setItem('creator_planner_registered_users', JSON.stringify(updatedUsers));

          // Trigger access / account stats increment
          const accountsCount = parseInt(localStorage.getItem('saas_accounts_count') || '0', 10);
          localStorage.setItem('saas_accounts_count', (accountsCount + 1).toString());

          setSuccess(isInvitee ? t('teamMemberRegisteredLogin', 'Membro da equipe cadastrado com sucesso! Fazendo login...') : t('accountCreatedLogin', 'Conta criada com sucesso! Fazendo login...'));
          setTimeout(() => {
            onLogin(registeredUser);
          }, 1000);
          return;
        } else if (data.error) {
          setError(data.error);
          return;
        }
      } catch (err) {
        console.warn('Server registration offline or failed, falling back to local creation:', err);
      }

      // 2. Fallback to offline creation
      const now = new Date();
      const trialStart = (isInvitee || selectedPlan === 'free') ? undefined : now.toISOString();
      const trialEnd = (isInvitee || selectedPlan === 'free') ? undefined : new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
      const isPaidUser = isInvitee || selectedPlan === 'free';

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
        createdAt: now.toISOString(),
        plan: isInvitee ? undefined : selectedPlan,
        billingCycle: isInvitee ? undefined : (selectedPlan === 'free' ? 'monthly' : selectedBillingCycle),
        isTeamMember: isInvitee ? true : undefined,
        invitedByUserId: hostId,
        permissions: permissionsObj,
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        isPaid: isPaidUser
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('creator_planner_registered_users', JSON.stringify(updatedUsers));

      // Trigger access / account stats increment
      const accountsCount = parseInt(localStorage.getItem('saas_accounts_count') || '0', 10);
      localStorage.setItem('saas_accounts_count', (accountsCount + 1).toString());

      setSuccess(isInvitee ? t('teamMemberRegisteredLogin', 'Membro da equipe cadastrado com sucesso! Fazendo login...') : t('accountCreatedLogin', 'Conta criada com sucesso! Fazendo login...'));
      setTimeout(() => {
        onLogin(newUser);
      }, 1000);
    }
  };

  const openAuth = (loginMode: boolean) => {
    setIsLoginTab(loginMode);
    setError('');
    setSuccess('');
    setIsAuthOpen(true);
  };

  const handleEnterDemoMode = () => {
    onLogin({
      id: 'demo_user',
      name: t('demoVisitorName', 'Visitante Demo'),
      email: 'demo@planner.com',
      phone: '(11) 99999-9999',
      createdAt: new Date().toISOString(),
      plan: 'pro'
    });
  };

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 font-sans selection:bg-accent-purple selection:text-white relative overflow-x-hidden">
      
      {/* Background Visual Atmosphere Glowing Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-accent-purple/10 via-accent-orange/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] -right-40 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[1400px] -left-40 w-[400px] h-[400px] bg-accent-orange/5 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. STICKY TOP HEADER NAV */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-panel-black/85 border-b border-panel-border/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-panel-card border border-panel-border/80 flex items-center justify-center">
              <div className="flex space-x-[2px] items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
              </div>
            </div>
            <span className="text-sm font-display font-black tracking-tight text-white uppercase">
              {t('appNameBrand', 'Planner')}<span className="text-zinc-500 font-normal">SaaS</span>
            </span>
          </div>

          {/* Quick nav links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-all">{t('featuresNav', 'Recursos')}</a>
            <a href="#workflow" className="hover:text-white transition-all">{t('workflowNav', 'Como Funciona')}</a>
            <a href="#pricing" className="hover:text-white transition-all">{t('pricingNav', 'Planos')}</a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <LanguageSelector variant="landing" />
            <button
              onClick={() => openAuth(true)}
              className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              {t('login', 'Entrar')}
            </button>
            <button
              onClick={() => openAuth(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-black transition-all cursor-pointer shadow-md"
            >
              {t('startFree', 'Começar Grátis')}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO PRESENTATION SECTION */}
      <section className="relative pt-12 md:pt-20 pb-16 px-6 max-w-7xl mx-auto text-center z-10">
        
        {/* Floating badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-panel-border text-[10px] font-mono tracking-widest uppercase text-accent-purple font-extrabold mb-6 shadow-md"
        >
          <Sparkles size={11} className="text-accent-orange animate-pulse" />
          {t('landingDefinitivePlanner', 'O planejador de conteúdo definitivo')}
        </motion.div>

        {/* Mega Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto text-white"
        >
          {t('landingHeroTitleLine1', 'Seu Conteúdo Planejado.')}<br />
          <span className="gradient-title">{t('landingHeroTitleLine2', 'Suas Conversões Multiplicadas.')}</span>
        </motion.h1>

        {/* Subtitle description */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mt-6 font-medium leading-relaxed"
        >
          {t('landingHeroSub', 'Gerencie múltiplos canais e marcas em um único dashboard unificado. Agende posts, acompanhe metas de produção semanais e domine o funil de atração no Instagram, TikTok e YouTube.')}
        </motion.p>

        {/* CTA Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <button
            onClick={() => openAuth(false)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-95 shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all transform hover:-translate-y-[1px] active:translate-y-0 cursor-pointer select-none"
          >
            {t('landingStartNowFree', 'Começar Agora Grátis')}
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={handleEnterDemoMode}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-xs font-bold text-white border-2 border-dashed border-accent-purple/80 hover:border-accent-purple hover:bg-accent-purple/5 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-accent-orange animate-pulse" />
            {t('landingTryDemoNoLogin', 'Experimentar Demo Sem Login')}
          </button>

          <a
            href="#features"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white border border-panel-border/80 hover:border-zinc-700 bg-panel-card/30 transition-all cursor-pointer"
          >
            {t('landingExploreFeatures', 'Explorar Recursos')}
          </a>
        </motion.div>

        {/* 3. DYNAMIC INTERACTIVE PREVIEW MOCKUP CAROUSEL */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 md:mt-24 max-w-5xl mx-auto p-2 bg-zinc-950 border border-panel-border rounded-3xl shadow-2xl relative"
        >
          {/* Decorative frame dots */}
          <div className="absolute top-4 left-5 flex space-x-1.5 z-20">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
          </div>

          {/* Carousel Manual Tab Selectors */}
          <div className="absolute top-3 right-5 hidden md:flex items-center gap-1.5 z-20">
            {[
              { id: 0, label: t('tabKanban', 'Quadro Kanban') },
              { id: 1, label: t('tabCalendar', 'Calendário Editorial') },
              { id: 2, label: t('tabActiveGoals', 'Metas Ativas') },
              { id: 3, label: t('tabTeam', 'Equipe & Colaboração') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSlide(tab.id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeSlide === tab.id
                    ? 'bg-accent-purple text-white border border-accent-purple/30 shadow-md'
                    : 'bg-zinc-900 text-zinc-400 border border-panel-border hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-panel-black rounded-[20px] border border-panel-border/40 overflow-hidden relative aspect-[16/11] md:aspect-[16/9] flex flex-col p-4 md:p-6 text-left">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-panel-border pb-3 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-[10px] text-accent-purple font-mono font-bold">M</span>
                <span className="text-zinc-200 font-bold">
                  {activeSlide === 0 && t('workspaceKanban', 'Workspace: Fluxo de Postagens (Kanban)')}
                  {activeSlide === 1 && t('workspaceCalendar', 'Workspace: Calendário Editorial Integrado')}
                  {activeSlide === 2 && t('workspaceGoals', 'Workspace: Metas Semanais & Métricas')}
                  {activeSlide === 3 && t('workspaceTeam', 'Workspace: Membros & Colaboração de Equipes')}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-extrabold uppercase animate-pulse">{t('livePreview', '● Live Preview')}</span>
              </div>
            </div>

            {/* Slide Area with Smooth Transitions */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <AnimatePresence mode="wait">
                {slideImages[activeSlide] && (
                  <motion.div
                    key={`custom-slide-${activeSlide}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-zinc-950 border border-panel-border/30 relative animate-fade-in"
                  >
                    <img 
                      src={slideImages[activeSlide]} 
                      alt={`${t('slideLabel', 'Slide')} ${activeSlide + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                )}

                {(activeSlide === 0 && !slideImages[0]) && (
                  <motion.div
                    key="kanban-slide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden"
                  >
                    {/* Kanban Column 1 (Rascunhos) */}
                    <div className="bg-panel-card border border-panel-border rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400 font-mono mb-2">
                          <span>{t('ideasDrafts', '💡 Ideias / Rascunhos')}</span>
                          <span className="text-zinc-600 bg-zinc-900 border border-panel-border px-1.5 py-0.5 rounded">3</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-panel-border/60 text-[11px] leading-snug space-y-2">
                            <p className="font-bold text-white">{t('demoKanbanCard1Title', '5 Ferramentas secretas de design que utilizo diariamente')}</p>
                            <div className="flex justify-between items-center">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-accent-purple flex items-center gap-0.5">
                                <Instagram size={8} /> {t('formatReels', 'Reels')}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">{t('today', 'Hoje')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-ping" />
                        {t('updated1m', 'Atualizado há 1m')}
                      </div>
                    </div>

                    {/* Kanban Column 2 (Em Produção) */}
                    <div className="bg-panel-card border border-panel-border rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400 font-mono mb-2">
                          <span>{t('inProduction', '🎬 Em Produção')}</span>
                          <span className="text-zinc-600 bg-zinc-900 border border-panel-border px-1.5 py-0.5 rounded">1</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-panel-border/60 text-[11px] leading-snug space-y-2">
                            <p className="font-bold text-white">{t('demoKanbanCard2Title', 'Como escalar seu negócio SaaS do zero absoluto')}</p>
                            <div className="flex justify-between items-center">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-accent-orange flex items-center gap-0.5">
                                <Youtube size={8} /> {t('formatVideo', 'Longo')}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">{t('tomorrow', 'Amanhã')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-orange animate-pulse" />
                        {t('editingScript', 'Editando roteiro...')}
                      </div>
                    </div>

                    {/* Kanban Column 3 (Agendados) */}
                    <div className="bg-panel-card border border-panel-border rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400 font-mono mb-2">
                          <span>{t('scheduledCol', '🗓️ Agendados')}</span>
                          <span className="text-zinc-600 bg-zinc-900 border border-panel-border px-1.5 py-0.5 rounded">2</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] leading-snug space-y-2">
                            <p className="font-bold text-zinc-100">{t('demoKanbanCard3Title', 'Tutorial de Copywriting de Alta Conversão')}</p>
                            <div className="flex justify-between items-center">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-zinc-300 flex items-center gap-0.5">
                                <Video size={8} /> {t('formatShorts', 'Short')}
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">12/07</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-4 font-semibold">
                        <CheckCircle2 size={10} /> {t('integratedReady', 'Integrado e pronto')}
                      </div>
                    </div>
                  </motion.div>
                )}

                {(activeSlide === 1 && !slideImages[1]) && (
                  <motion.div
                    key="calendar-slide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-300">{t('weeklyMonthlyGrid', 'Grade Visual Semanal / Mensal')}</span>
                        <p className="text-[9px] text-zinc-500">{t('smartMappingSub', 'Mapeamento inteligente de frequência e consistência multicanal')}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-accent-purple/10 border border-accent-purple/20 text-accent-purple font-mono text-[9px] font-bold uppercase">{t('july2026', 'Julho 2026')}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5 flex-1 overflow-hidden">
                      {[
                        { day: '06', posts: [] },
                        { day: '07', posts: [{ type: 'instagram', label: ' ' + t('reelsShortcutLabel', 'Reels: 5 Atalhos Secretos'), color: 'border-accent-purple bg-accent-purple/5 text-accent-purple text-left' }] },
                        { day: '08', posts: [] },
                        { day: '09', posts: [{ type: 'youtube', label: ' ' + t('videoScaleSaasLabel', 'Vídeo: Escalar SaaS'), color: 'border-accent-orange bg-accent-orange/5 text-accent-orange text-left' }] },
                        { day: '10', posts: [] },
                        { day: '13', posts: [] },
                        { day: '14', posts: [{ type: 'tiktok', label: ' ' + t('shortViralHooksLabel', 'Short: Ganchos Virais'), color: 'border-zinc-500 bg-zinc-900 text-zinc-200 text-left' }] },
                        { day: '15', posts: [] },
                        { day: '16', posts: [{ type: 'instagram', label: ' ' + t('reelsCopyTutorialLabel', 'Reels: Tutorial de Copy'), color: 'border-accent-purple bg-accent-purple/5 text-accent-purple text-left' }] },
                        { day: '17', posts: [] },
                      ].map((item, i) => (
                        <div key={i} className="bg-panel-card border border-panel-border rounded-xl p-2 flex flex-col justify-between h-full min-h-[60px] relative">
                          <span className="text-[9px] font-bold font-mono text-zinc-500">{item.day}</span>
                          {item.posts.length > 0 ? (
                            <div className={`mt-1 p-1 rounded border text-[8px] font-medium leading-normal truncate ${item.posts[0].color}`}>
                              {item.posts[0].label}
                            </div>
                          ) : (
                            <div className="mt-1 border border-dashed border-panel-border/30 rounded p-1 flex items-center justify-center text-[9px] text-zinc-700">
                              {t('emptySlot', '+ Vazio')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {(activeSlide === 2 && !slideImages[2]) && (
                  <motion.div
                    key="goals-slide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-300">{t('activeProductionGoals', 'Metas Ativas de Produção')}</span>
                        <p className="text-[9px] text-zinc-500 font-medium">{t('realtimeProgressSub', 'Progresso em tempo real integrado às publicações agendadas')}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">{t('monitoredConsistency', 'Consistência Monitorada')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      {/* Instagram */}
                      <div className="bg-panel-card border border-panel-border rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold font-mono text-accent-purple flex items-center gap-1 uppercase">
                              <Instagram size={10} /> Instagram Reels
                            </span>
                            <span className="text-[10px] font-bold text-zinc-300 font-mono">3 / 4</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-panel-border/50">
                            <div className="h-full bg-gradient-to-r from-accent-purple to-pink-500 rounded-full" style={{ width: '75%' }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-4">
                          <span>{t('missing1Post', 'Falta 1 publicação')}</span>
                          <span className="text-accent-purple font-mono font-bold">{t('completed75', '75% Concluído')}</span>
                        </div>
                      </div>

                      {/* TikTok */}
                      <div className="bg-panel-card border border-panel-border rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold font-mono text-zinc-300 flex items-center gap-1 uppercase">
                              <Video size={10} /> TikTok Shorts
                            </span>
                            <span className="text-[10px] font-bold text-zinc-300 font-mono">2 / 2</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-panel-border/50">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-emerald-400 font-semibold mt-4">
                          <span>{t('weeklyGoalReached', 'Meta semanal batida!')}</span>
                          <span className="font-mono font-bold">{t('completed100', '100% Concluído')}</span>
                        </div>
                      </div>

                      {/* YouTube */}
                      <div className="bg-panel-card border border-panel-border rounded-xl p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold font-mono text-accent-orange flex items-center gap-1 uppercase">
                              <Youtube size={10} /> YouTube Longos
                            </span>
                            <span className="text-[10px] font-bold text-zinc-300 font-mono">1 / 2</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-panel-border/50">
                            <div className="h-full bg-accent-orange rounded-full" style={{ width: '50%' }} />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-4">
                          <span>{t('videoInEditing', 'Vídeo em edição')}</span>
                          <span className="text-accent-orange font-mono font-bold">{t('completed50', '50% Concluído')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {(activeSlide === 3 && !slideImages[3]) && (
                  <motion.div
                    key="team-slide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-300">{t('unifiedTeamTitle', 'Equipe Multiusuário Unificada')}</span>
                        <p className="text-[9px] text-zinc-500">{t('unifiedTeamSub', 'Adicione colaboradores com acesso transparente e controle de marcas')}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-accent-purple/10 border border-accent-purple/20 text-accent-purple font-mono text-[9px] font-bold">{t('equalAccess', 'Acesso Igualitário')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      {/* Member 1 */}
                      <div className="bg-panel-card border border-panel-border rounded-xl p-3 flex flex-col justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple text-xs font-bold font-mono">W</div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-none">Werik Playstore</h4>
                            <span className="text-[9px] text-zinc-500 mt-1 block">werik@gmail.com</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 text-[8px] font-bold font-mono uppercase">{t('owner', 'Proprietário')}</span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">{t('activeStatus', '• Ativo')}</span>
                        </div>
                      </div>

                      {/* Member 2 */}
                      <div className="bg-panel-card border border-panel-border rounded-xl p-3 flex flex-col justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent-orange/20 border border-accent-orange/30 flex items-center justify-center text-accent-orange text-xs font-bold font-mono">AP</div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-none">Ana Paula</h4>
                            <span className="text-[9px] text-zinc-500 mt-1 block">anapaula@social.com</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-[8px] font-bold font-mono uppercase">{t('collaborator', 'Colaborador')}</span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">{t('activeStatus', '• Ativo')}</span>
                        </div>
                      </div>

                      {/* Invites Box */}
                      <div className="bg-panel-card/50 border border-dashed border-panel-border rounded-xl p-3 flex flex-col justify-between text-center items-center">
                        <div className="p-1.5 rounded-full bg-zinc-900 border border-panel-border text-zinc-500 mt-0.5">
                          <Users size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-300 font-bold">{t('inviteByLink', 'Convidar por Link Seguro')}</p>
                          <p className="text-[8px] text-zinc-500 mt-0.5 leading-normal max-w-[150px] mx-auto">{t('inviteByLinkSub', 'Colaboradores têm o mesmo poder para criar, editar e planejar!')}</p>
                        </div>
                        <span className="text-[8px] font-mono font-bold uppercase text-accent-purple mt-1 animate-pulse">{t('linkGenerated', 'Link Gerado')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Dots Carousel Indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-4 z-20">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    activeSlide === idx ? 'bg-accent-purple w-5' : 'bg-zinc-800'
                  }`}
                  title={`${t('slideLabel', 'Slide')} ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrow Navigators */}
            <button
              onClick={() => setActiveSlide((prev) => (prev - 1 + 4) % 4)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-xl bg-zinc-900/80 border border-panel-border text-zinc-400 hover:text-white transition-all cursor-pointer shadow-lg hover:border-zinc-700"
              title={t('previous', 'Anterior')}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % 4)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 p-2 rounded-xl bg-zinc-900/80 border border-panel-border text-zinc-400 hover:text-white transition-all cursor-pointer shadow-lg hover:border-zinc-700"
              title={t('next', 'Próximo')}
            >
              <ChevronRight size={14} />
            </button>

            {/* Bottom floating decoration */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel-black to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </section>

      {/* 4. PLATFORM CORE FEATURES GRID */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-panel-border/50 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-extrabold text-white">
            {t('featuresMainTitle', 'Planejamento sem fricção. Execução profissional.')}
          </h2>
          <p className="text-sm text-zinc-400 mt-3">
            {t('featuresMainSub', 'Ferramentas robustas construídas especificamente para produtores de conteúdo, social media e agências que buscam resultados reais.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple mb-5 group-hover:scale-105 transition-transform">
              <Calendar size={18} />
            </div>
            <h3 className="text-sm font-display font-bold text-white">
              {t('feat1Title', 'Grade de Calendário Visual')}
            </h3>
            <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
              {t('feat1Desc', 'Tenha controle absoluto das datas de postagem. Visualize de forma mensal ou semanal toda a sua consistência de publicação com filtros de canal.')}
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple mb-5 group-hover:scale-105 transition-transform">
              <LayoutGrid size={18} />
            </div>
            <h3 className="text-sm font-display font-bold text-white">
              {t('feat2Title', 'Funil Kanban Integrado')}
            </h3>
            <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
              {t('feat2Desc', 'Arraste e solte seus cards pelas colunas de ideias, produção, agendado e publicado. Acompanhe o fluxo de entrega de cada peça.')}
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange mb-5 group-hover:scale-105 transition-transform">
              <Layers size={18} />
            </div>
            <h3 className="text-sm font-display font-bold text-white">
              {t('feat3Title', 'Múltiplas Marcas & Clientes')}
            </h3>
            <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
              {t('feat3Desc', 'Isolamento completo. Crie workspaces separados para gerenciar clientes diferentes de forma totalmente limpa e organizada em segundos.')}
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg hover:border-zinc-700 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange mb-5 group-hover:scale-105 transition-transform">
              <Target size={18} />
            </div>
            <h3 className="text-sm font-display font-bold text-white">
              {t('feat4Title', 'Metas de Produção Ativas')}
            </h3>
            <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
              {t('feat4Desc', 'Defina quantos vídeos ou posts você deseja criar por semana por canal e acompanhe o progresso automático através de barras de conclusão.')}
            </p>
          </div>

        </div>
      </section>

      {/* 5. STEP-BY-STEP WORKFLOW SECTION */}
      <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto border-t border-panel-border/50 relative z-10 bg-panel-card/10 rounded-3xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-accent-orange tracking-widest bg-accent-orange/10 px-3 py-1 rounded-full">
              {t('howItWorks', 'Como Funciona')}
            </span>
            <h2 className="text-3xl font-display font-extrabold text-white mt-5">
              {t('workflowTitle', 'Do rascunho de ideias à publicação, sem complicação')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-4 leading-relaxed">
              {t('workflowSub', 'Desenvolvemos um fluxo de trabalho que elimina o cansaço mental do planejamento de posts. Chega de usar blocos de notas confusos ou planilhas difíceis de atualizar.')}
            </p>

            <div className="space-y-6 mt-8">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-xs font-bold font-mono text-accent-purple flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t('step1Title', 'Crie sua Conta Gratuita')}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t('step1Desc', 'Crie seu acesso corporativo em segundos sem precisar de cartão de crédito.')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-xs font-bold font-mono text-accent-purple flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t('step2Title', 'Defina Seus Canais e Marcas')}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t('step2Desc', 'Cadastre as marcas ou canais que você gerencia e defina metas semanais.')}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-xs font-bold font-mono text-accent-purple flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t('step3Title', 'Domine os Algoritmos')}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t('step3Desc', 'Agende, acompanhe a esteira de design/edição e veja sua consistência disparar!')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-zinc-950 border border-panel-border rounded-3xl relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
              <Globe size={180} />
            </div>
            
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-accent-orange" />
              {t('whyUsePlanner', 'Por que usar o nosso Planner?')}
            </h3>
            
            <ul className="space-y-4 mt-6">
              {[
                t('benefit1', 'Ambiente extremamente rápido e responsivo'),
                t('benefit2', 'Simplicidade de arrastar e soltar (Kanban)'),
                t('benefit3', 'Gráfico de calendário unificado para todos os clientes'),
                t('benefit4', 'Zero distrações e carregamento instantâneo'),
                t('benefit5', 'Isolamento total de dados de marcas'),
                t('benefit6', 'Durable Cloud Storage com sincronização local')
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <span className="p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
                    <Check size={12} />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-panel-border/50 text-center relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl font-display font-extrabold text-white">
            {t('pricingTitle', 'Planos sob medida para o seu momento')}
          </h2>
          <p className="text-xs text-zinc-400 mt-3">
            {t('pricingSub', 'Comece de forma gratuita e escale conforme sua demanda por gerenciamento de marcas aumenta.')}
          </p>
        </div>

        {/* Faturamento Toggle (Mensal / Trimestral 10% Off) + Moeda Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
          <div className="inline-flex rounded-xl bg-zinc-900 border border-panel-border/80 p-1">
            <button
              onClick={() => setSelectedBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBillingCycle === 'monthly'
                  ? 'bg-accent-purple text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('monthlyBilling', 'Faturamento Mensal')}
            </button>
            
            <button
              onClick={() => setSelectedBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBillingCycle === 'quarterly'
                  ? 'bg-accent-purple text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{t('quarterlyBilling', 'Plano de 3 Meses')}</span>
              <span className="text-[9px] bg-accent-orange text-black font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                -10% OFF
              </span>
            </button>
          </div>

          {/* Currency Toggle (BRL / USD) */}
          <div className="inline-flex rounded-xl bg-zinc-900 border border-panel-border/80 p-1">
            <button
              onClick={() => setSelectedCurrency('brl')}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCurrency === 'brl'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Preços em Reais Brasileiros (BRL)"
            >
              <span>🇧🇷 BRL (R$)</span>
            </button>
            <button
              onClick={() => setSelectedCurrency('usd')}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCurrency === 'usd'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Prices in US Dollars (USD)"
            >
              <span>🇺🇸 USD ($)</span>
            </button>
          </div>
        </div>

        {/* Stripe Security Trust Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 mb-10 shadow-sm">
          <Shield size={13} className="text-emerald-400" />
          <span>{t('securePaymentStripe', 'Pagamento 100% Seguro via Stripe (Cartão de Crédito)')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-[1400px] mx-auto text-left">
          
          {/* Card Plano Free */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-zinc-400">{t('freePlanTitle', 'Plano Gratuito')}</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-zinc-400">{t('badgeFree', 'Grátis')}</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-white mt-4">
                {selectedCurrency === 'brl' ? 'R$ 0' : '$0'}<span className="text-xs font-normal text-zinc-500"> / {t('always', 'sempre')}</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{t('freePlanSub', 'Ideal para criadores individuais iniciando seus planners.')}</p>
              
              <ul className="space-y-3 mt-6 border-t border-panel-border/50 pt-4">
                {[
                  t('freeFeat1', 'Até 2 Clientes/Marcas'),
                  t('freeFeat2', '1 Membro de Equipe'),
                  t('freeFeat3', 'Calendário editorial'),
                  t('freeFeat4', 'Gestão visual Kanban')
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 size={13} className="text-zinc-500" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setSelectedPlan('free');
                setIsAuthOpen(true);
                setIsLoginTab(false);
              }}
              className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-850 hover:bg-zinc-800 border border-panel-border text-white transition-all cursor-pointer text-center font-display"
            >
              {t('startFree', 'Começar Grátis')}
            </button>
          </div>

          {/* Card Plano Starter */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-blue-400">{t('starterPlanTitle', 'Plano Starter')}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-[9px] font-bold text-blue-400 border border-blue-500/10">Iniciante</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-white mt-4">
                {selectedCurrency === 'brl' 
                  ? (selectedBillingCycle === 'monthly' ? 'R$ 14,99' : 'R$ 42,00')
                  : (selectedBillingCycle === 'monthly' ? '$3.99' : '$10.99')
                }
                <span className="text-xs font-normal text-zinc-500">
                  {selectedBillingCycle === 'monthly' ? ' / ' + t('month', 'mês') : ' / ' + t('3months', '3 meses')}
                </span>
                {selectedBillingCycle === 'quarterly' && (
                  <span className="block text-[10px] text-emerald-400 font-mono font-bold mt-1.5 leading-tight">
                    {selectedCurrency === 'brl' 
                      ? 'Equivale a R$ 14,00/mês' 
                      : 'Equivalent to $3.66/month'
                    }
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{t('starterPlanSub', 'Ideal para freelancers e criadores solo com primeiros clientes.')}</p>
              
              <ul className="space-y-3 mt-6 border-t border-panel-border/50 pt-4">
                {[
                  t('starterFeat1', 'Até 4 Clientes/Marcas'),
                  t('starterFeat2', 'Até 2 Membros de Equipe'),
                  t('starterFeat3', 'Calendário Multicanal (Insta, TikTok, YT, In)'),
                  t('starterFeat4', 'Kanban de Produção & Pipeline de Status'),
                  t('starterFeat5', 'Link Público de Aprovação sem login'),
                  t('starterFeat6', 'Upload Manual de Mídias e Roteiros'),
                  t('starterFeat7', 'Metas Estratégicas & Checklist por Marca'),
                  t('starterFeat8', 'Exportação da Grade em PDF')
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('starter')}
              disabled={isRedirectingCheckout}
              className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white transition-all cursor-pointer text-center font-display flex items-center justify-center gap-1.5"
            >
              <Zap size={14} className="text-blue-400" />
              <span>{isRedirectingCheckout ? t('processingCheckoutStripe', 'Gerando Checkout do Stripe...') : t('checkoutStripeStarter', 'Assinar Plano Starter')}</span>
            </button>
          </div>

          {/* Card Plano Basic */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-accent-purple">{t('basicPlanTitle', 'Plano Basic')}</span>
                <span className="px-2 py-0.5 rounded bg-accent-purple/15 text-[9px] font-bold text-accent-purple border border-accent-purple/10">{t('badgePopular', 'Popular')}</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-white mt-4">
                {selectedCurrency === 'brl' 
                  ? (selectedBillingCycle === 'monthly' ? 'R$ 29,00' : 'R$ 84,00')
                  : (selectedBillingCycle === 'monthly' ? '$5.99' : '$16.99')
                }
                <span className="text-xs font-normal text-zinc-500">
                  {selectedBillingCycle === 'monthly' ? ' / ' + t('month', 'mês') : ' / ' + t('3months', '3 meses')}
                </span>
                {selectedBillingCycle === 'quarterly' && (
                  <span className="block text-[10px] text-emerald-400 font-mono font-bold mt-1.5 leading-tight">
                    {selectedCurrency === 'brl' 
                      ? 'Equivale a R$ 28,00/mês' 
                      : 'Equivalent to $5.66/month'
                    }
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{t('basicPlanSub', 'Excelente para pequenas marcas que precisam expandir.')}</p>
              
              <ul className="space-y-3 mt-6 border-t border-panel-border/50 pt-4">
                {[
                  t('basicFeat1', 'Até 8 Clientes/Marcas'),
                  t('basicFeat2', 'Até 3 Membros de Equipe'),
                  t('basicFeat3', 'Acesso IA de planejamento com limites'),
                  t('basicFeat4', 'Criador de Carrosséis & Posts com IA'),
                  t('basicFeat5', 'Exportação de Carrosséis em ZIP e PNG HD'),
                  t('basicFeat6', 'Calendário Multicanal & Kanban de Produção'),
                  t('basicFeat7', 'Link Público de Aprovação sem login'),
                  t('basicFeat8', 'Upload Manual de Mídias e Roteiros'),
                  t('basicFeat9', 'Metas Estratégicas & Checklist por Marca'),
                  t('basicFeat10', 'Exportação da Grade e Relatórios em PDF')
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 size={13} className="text-accent-purple shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('basic')}
              disabled={isRedirectingCheckout}
              className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 text-white transition-all cursor-pointer text-center font-display flex items-center justify-center gap-1.5"
            >
              <Zap size={14} className="text-accent-purple" />
              <span>{isRedirectingCheckout ? t('processingCheckoutStripe', 'Gerando Checkout do Stripe...') : t('checkoutStripeBasic', 'Assinar Plano Basic')}</span>
            </button>
          </div>

          {/* Card Plano Pro */}
          <div className="p-6 bg-panel-card border-2 border-accent-purple rounded-2xl shadow-2xl relative flex flex-col justify-between">
            <div className="absolute -top-3 right-4 px-2 py-0.5 rounded bg-accent-purple text-[8px] font-mono uppercase tracking-wider font-extrabold text-white shadow-md">
              {t('badgeRecommended', 'Mais Recomendado')}
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-accent-orange">{t('proPlanTitle', 'Plano Pro')}</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-white mt-4">
                {selectedCurrency === 'brl' 
                  ? (selectedBillingCycle === 'monthly' ? 'R$ 49,00' : 'R$ 144,00')
                  : (selectedBillingCycle === 'monthly' ? '$9.99' : '$28.99')
                }
                <span className="text-xs font-normal text-zinc-500">
                  {selectedBillingCycle === 'monthly' ? ' / ' + t('month', 'mês') : ' / ' + t('3months', '3 meses')}
                </span>
                {selectedBillingCycle === 'quarterly' && (
                  <span className="block text-[10px] text-emerald-400 font-mono font-bold mt-1.5 leading-tight">
                    {selectedCurrency === 'brl' 
                      ? 'Equivale a R$ 48,00/mês' 
                      : 'Equivalent to $9.66/month'
                    }
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{t('proPlanSub', 'Perfeito para profissionais liberais e social media autônomos.')}</p>
              
              <ul className="space-y-3 mt-6 border-t border-panel-border/50 pt-4">
                {[
                  t('proFeat1', 'Até 14 Clientes/Marcas'),
                  t('proFeat2', 'Até 5 Membros de Equipe'),
                  t('proFeat3', 'IA de planejamento com limites'),
                  t('proFeat4', 'Criador de Carrosséis & Posts com IA'),
                  t('proFeat5', 'Exportação de Carrosséis em ZIP e PNG HD'),
                  t('proFeat6', 'Central de Referências & Hub de Inspirações'),
                  t('proFeat7', 'Diagnóstico & Análise Estratégica do Calendário com IA'),
                  t('proFeat8', 'Calendário Multicanal & Kanban de Produção'),
                  t('proFeat9', 'Link Público de Aprovação com Feedback em Tempo Real'),
                  t('proFeat10', 'Upload Manual de Mídias e Roteiros'),
                  t('proFeat11', 'Metas Estratégicas & Métricas de Frequência'),
                  t('proFeat12', 'Exportação da Grade e Relatórios em PDF'),
                  t('proFeat13', 'Suporte Prioritário via WhatsApp e E-mail')
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 size={13} className="text-accent-orange shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('pro')}
              disabled={isRedirectingCheckout}
              className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 transition-all cursor-pointer text-center font-display shadow-md shadow-accent-purple/15 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} className="text-white" />
              <span>{isRedirectingCheckout ? t('processingCheckoutStripe', 'Gerando Checkout do Stripe...') : t('checkoutStripePro', 'Assinar Plano Pro')}</span>
            </button>
          </div>

          {/* Card Plano Growth PRO */}
          <div className="p-6 bg-panel-card border border-panel-border rounded-2xl shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-emerald-400">{t('growthPlanTitle', 'Growth PRO')}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/15">{t('badgeScale', 'Escala')}</span>
              </div>
              <h3 className="text-3xl font-display font-extrabold text-white mt-4">
                {selectedCurrency === 'brl' 
                  ? (selectedBillingCycle === 'monthly' ? 'R$ 79,00' : 'R$ 224,00')
                  : (selectedBillingCycle === 'monthly' ? '$15.99' : '$45.99')
                }
                <span className="text-xs font-normal text-zinc-500">
                  {selectedBillingCycle === 'monthly' ? ' / ' + t('month', 'mês') : ' / ' + t('3months', '3 meses')}
                </span>
                {selectedBillingCycle === 'quarterly' && (
                  <span className="block text-[10px] text-emerald-400 font-mono font-bold mt-1.5 leading-tight">
                    {selectedCurrency === 'brl' 
                      ? 'Equivale a R$ 74,66/mês' 
                      : 'Equivalent to $15.33/month'
                    }
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{t('growthPlanSub', 'O plano definitivo para agências de marketing consolidadas.')}</p>
              
              <ul className="space-y-3 mt-6 border-t border-panel-border/50 pt-4">
                {[
                  t('growthFeat1', 'Até 25 Clientes/Marcas'),
                  t('growthFeat2', 'Até 8 Membros de Equipe com controle total'),
                  t('growthFeat3', 'IA de planejamento sem limites'),
                  t('growthFeat4', 'Criador de Carrosséis & Posts com IA'),
                  t('growthFeat5', 'Exportação de Carrosséis em ZIP e PNG HD'),
                  t('growthFeat6', 'Central de Referências & Hub de Inspirações'),
                  t('growthFeat7', 'Diagnóstico & Análise Estratégica do Calendário com IA'),
                  t('growthFeat8', 'Calendário Multicanal & Kanban de Produção'),
                  t('growthFeat9', 'Links Públicos de Aprovação Ilimitados'),
                  t('growthFeat10', 'Upload Manual de Mídias e Roteiros'),
                  t('growthFeat11', 'Metas Estratégicas & Métricas de Frequência'),
                  t('growthFeat12', 'Exportação Completa de Relatórios em PDF'),
                  t('growthFeat13', 'Suporte Prioritário Dedicado')
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStripeCheckout('growth')}
              disabled={isRedirectingCheckout}
              className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-white transition-all cursor-pointer text-center font-display flex items-center justify-center gap-1.5"
            >
              <Zap size={14} className="text-emerald-400" />
              <span>{isRedirectingCheckout ? t('processingCheckoutStripe', 'Gerando Checkout do Stripe...') : t('checkoutStripeGrowth', 'Assinar Growth PRO')}</span>
            </button>
          </div>

        </div>

      </section>

      {/* 7. CTA BOTTOM BANNER */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center relative z-10 border-t border-panel-border/50">
        <div className="p-8 md:p-12 bg-zinc-950 border border-panel-border rounded-3xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-[200px] h-[200px] bg-accent-purple/10 rounded-full blur-[60px]" />
          
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white leading-tight">
            {t('ctaBottomTitle', 'Pronto para colocar ordem na sua grade de conteúdos?')}
          </h2>
          <p className="text-xs text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
            {t('ctaBottomSub', 'Junte-se a milhares de produtores de conteúdo e agências digitais que usam nossa metodologia para dominar os canais sociais.')}
          </p>

          <button
            onClick={() => openAuth(false)}
            className="mt-8 px-8 py-3.5 rounded-xl font-display font-bold text-xs bg-zinc-100 hover:bg-white text-black transition-all cursor-pointer shadow-lg inline-flex items-center gap-2"
          >
            {t('ctaBottomButton', 'Fazer Cadastro Gratuito')}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 8. FOOTER METADATA */}
      <footer className="border-t border-panel-border py-8 text-center text-[11px] text-zinc-600 font-mono relative z-10 px-6 space-y-3">
        <div className="flex justify-center items-center">
          <LanguageSelector variant="landing" />
        </div>
        <p>© 2026 {t('multichannelPlanner', 'Planner de Conteúdo')} SaaS. {t('footerRights', 'Todos os direitos reservados.')}</p>
        <p className="mt-1">{t('footerSub', 'Construído para performance corporativa de criadores independentes.')}</p>
      </footer>

      {/* 9. GLASSMORPHIC AUTH MODAL SCREEN OVERLAY */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative"
            >
              {/* Close button */}
              <button
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Logo icon inside modal */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative p-2.5 rounded-xl bg-panel-card border border-panel-border flex items-center justify-center mb-3">
                  <div className="flex space-x-[2px] items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
                  </div>
                </div>
                <h3 className="text-xl font-display font-extrabold text-white">
                  {isLoginTab ? t('modalAccessTitle', 'Acessar Planner') : t('modalCreateTitle', 'Crie sua Conta Gratuita')}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {t('modalSub', 'Gerencie seus múltiplos canais e atinja suas metas de conteúdo')}
                </p>
              </div>

              {/* Toggle tabs */}
              <div className="flex bg-zinc-900/60 border border-panel-border/60 p-1.5 rounded-xl mb-6">
                <button
                  onClick={() => {
                    setIsLoginTab(true);
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isLoginTab 
                      ? 'bg-zinc-800 text-white shadow' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LogIn size={13} />
                  {t('login', 'Entrar')}
                </button>
                <button
                  onClick={() => {
                    setIsLoginTab(false);
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isLoginTab 
                      ? 'bg-zinc-800 text-white shadow' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <UserPlus size={13} />
                  {t('register', 'Cadastrar')}
                </button>
              </div>

              {/* Action Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                
                {invitedByHostId && invitedByHostName && !isLoginTab && (
                  <div className="p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-semibold leading-relaxed flex items-start gap-2">
                    <Sparkles size={14} className="text-accent-orange animate-pulse flex-shrink-0 mt-0.5" />
                    <span>
                      {t('invitedByTeamMsgPrefix', 'Você foi convidado por')} <strong className="text-white">{invitedByHostName}</strong> {t('invitedByTeamMsgSuffix', 'para se juntar à equipe! Seu cadastro é totalmente gratuito e herdará os acessos do anfitrião.')}
                    </span>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium leading-relaxed">
                    {success}
                  </div>
                )}

                {/* Name field for signup */}
                {!isLoginTab && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                      {t('fullName', 'Nome completo')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <UserIcon size={14} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={t('fullNamePlaceholder', 'Seu nome ou marca')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                    {t('emailAddress', 'E-mail de acesso')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Mail size={14} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder={t('emailPlaceholder', 'nome@empresa.com')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone field for signup */}
                {!isLoginTab && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                      {t('phoneWhatsapp', 'WhatsApp / Celular')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder={t('phonePlaceholder', '(11) 99999-9999')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                    {t('passwordAccess', 'Senha de acesso')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder={t('passwordPlaceholder', '******')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {!isLoginTab && !invitedByHostId && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                      {t('initialPlan', 'Plano de Uso Inicial')}
                    </label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as any)}
                      className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="free">Plano Gratuito • Vitalício (Até 2 Marcas)</option>
                      <option value="starter">Plano Starter • 15 Dias Grátis sem cartão (Até 4 Marcas)</option>
                      <option value="basic">Plano Basic • 15 Dias Grátis sem cartão (Até 8 Marcas + IA)</option>
                      <option value="pro">Plano Pro • 15 Dias Grátis sem cartão (Até 14 Marcas + IA Total)</option>
                      <option value="growth">Plano Growth PRO • 15 Dias Grátis sem cartão (Até 25 Marcas)</option>
                    </select>
                    <p className="text-[10px] text-accent-orange font-mono">
                      🔥 15 dias de teste grátis sem cartão de crédito em qualquer plano pago.
                    </p>
                  </div>
                )}

                {/* LGPD Consent Checkbox */}
                {!isLoginTab && (
                  <div className="flex items-start gap-2.5 py-1.5 text-left animate-fade-in">
                    <input
                      type="checkbox"
                      id="lgpd-consent-checkbox"
                      required
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-accent-purple focus:ring-accent-purple"
                    />
                    <label htmlFor="lgpd-consent-checkbox" className="text-[11px] text-zinc-400 leading-normal select-none">
                      {t('lgpdIagreeWith', 'Li e concordo com os')}{' '}
                      <button
                        type="button"
                        onClick={() => setActiveLegalTab('terms')}
                        className="text-accent-orange font-bold hover:underline transition-all cursor-pointer inline bg-transparent p-0 border-none align-baseline text-[11px]"
                      >
                        {t('termsOfUse', 'Termos de Uso')}
                      </button>{' '}
                      {t('lgpdAndThe', 'e a')}{' '}
                      <button
                        type="button"
                        onClick={() => setActiveLegalTab('privacy')}
                        className="text-accent-orange font-bold hover:underline transition-all cursor-pointer inline bg-transparent p-0 border-none align-baseline text-[11px]"
                      >
                        {t('privacyPolicy', 'Política de Privacidade')}
                      </button>{' '}
                      {t('lgpdDeclaration', '(LGPD - Lei 13.709). Declaro estar ciente de que meus dados cadastrais serão coletados para o funcionamento da plataforma.')}
                    </label>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 shadow-md transition-all cursor-pointer mt-2"
                >
                  {isLoginTab ? t('loginButton', 'Entrar na Conta') : invitedByHostId ? t('completeTeamSignup', 'Concluir Cadastro de Equipe') : t('signupButton', 'Criar Conta e Iniciar')}
                </button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-panel-border/50"></div>
                </div>
                <span className="relative bg-panel-card px-3 text-[10px] font-mono text-zinc-500 uppercase">{t('orPrefer', 'Ou se preferir')}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAuthOpen(false);
                  handleEnterDemoMode();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white border border-panel-border hover:border-zinc-700 bg-zinc-900/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} className="text-accent-orange animate-pulse" />
                {t('tryDemoNoSignup', 'Experimentar Modo Demo (Sem Cadastro)')}
              </button>

              <div className="mt-5 pt-4 border-t border-panel-border/40 text-center">
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {t('lgpdPrivacyNotice', 'Sua privacidade está garantida em conformidade com as diretrizes da LGPD brasileira.')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STRIPE KEY CONFIGURATION MODAL (For Owner / Admin setup) */}
      <AnimatePresence>
        {isStripeConfigModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel-card border border-panel-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setIsStripeConfigModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-purple/10 border border-accent-purple/30 rounded-xl flex items-center justify-center text-accent-purple">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Configurar Gateway Stripe
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Insira suas chaves da Stripe para habilitar o checkout automático em tempo real.
                  </p>
                </div>
              </div>

              {stripeConfigError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{stripeConfigError}</span>
                </div>
              )}

              {stripeConfigSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                  <Check size={16} className="shrink-0 mt-0.5" />
                  <span>{stripeConfigSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveStripeConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-300">
                    Chave Secreta da Stripe (STRIPE_SECRET_KEY) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="sk_test_... ou sk_live_..."
                    value={stripeSecretKeyInput}
                    onChange={(e) => setStripeSecretKeyInput(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-panel-border focus:border-accent-purple rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Obtenha no painel da Stripe em: <strong>Desenvolvedores &gt; Chaves de API</strong>. Começa com <code>sk_test_</code> ou <code>sk_live_</code>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase text-zinc-300">
                    Chave Publicável da Stripe (STRIPE_PUBLISHABLE_KEY)
                  </label>
                  <input
                    type="text"
                    placeholder="pk_test_... ou pk_live_..."
                    value={stripePublishableKeyInput}
                    onChange={(e) => setStripePublishableKeyInput(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-panel-border focus:border-accent-purple rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsStripeConfigModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white border border-panel-border bg-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStripeKey || !stripeSecretKeyInput.trim()}
                    className="flex-1 py-2.5 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isSavingStripeKey ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Validando com a Stripe...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Salvar & Ativar Stripe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalTextsDialog
        isOpen={activeLegalTab !== null}
        type={activeLegalTab}
        onClose={() => setActiveLegalTab(null)}
      />

    </div>
  );
}
