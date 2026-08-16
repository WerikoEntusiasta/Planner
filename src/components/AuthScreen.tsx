import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { Mail, Lock, User as UserIcon, Phone, LogIn, UserPlus, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import LegalTextsDialog from './LegalTextsDialog';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onEnterAdminMode: () => void;
}

export default function AuthScreen({ onLogin, onEnterAdminMode }: AuthScreenProps) {
  const { t } = useLanguage();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // LGPD consent state
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy' | null>(null);

  // Read registered users from local storage (kept as sync fallback/reference if server fails)
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

    if (isLoginTab) {
      // Check for Admin Credentials first if defined in env
      if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail.toLowerCase() && inputPass === envAdminPassword) {
        setSuccess('Acesso administrativo detectado! Entrando no Painel...');
        setTimeout(() => {
          onEnterAdminMode();
        }, 800);
        return;
      }

      // Secure Server-Side Login
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inputEmail, password: inputPass })
        });
        const data = await res.json();
        
        if (data.success && data.user) {
          setSuccess('Login realizado com sucesso! Carregando seu painel seguro...');
          
          // Also sync to localStorage registered users as local fallback
          const localUsers = getRegisteredUsers();
          if (!localUsers.some(u => u.id === data.user.id)) {
            localStorage.setItem('creator_planner_registered_users', JSON.stringify([...localUsers, data.user]));
          }

          setTimeout(() => {
            onLogin(data.user);
          }, 800);
        } else {
          setError(data.error || 'E-mail ou senha incorretos.');
        }
      } catch (err) {
        console.error('Server auth offline, using local simulation fallback:', err);
        // Fallback to local simulation if offline
        const users = getRegisteredUsers();
        const user = users.find(u => u.email.toLowerCase() === inputEmail);
        if (!user) {
          setError('E-mail não cadastrado. Crie uma conta clicando na aba "Cadastrar"!');
          return;
        }
        if (user.password !== password) {
          setError('Senha incorreta. Tente novamente.');
          return;
        }
        setSuccess('Login simulado (Offline)! Redirecionando...');
        setTimeout(() => {
          onLogin(user);
        }, 800);
      }
    } else {
      // Validate inputs
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        setError('Por favor, preencha todos os campos.');
        return;
      }

      // LGPD Consent requirement check
      if (!lgpdConsent) {
        setError('Você precisa concordar com os Termos de Uso e Política de Privacidade para prosseguir.');
        return;
      }

      // Secure Server-Side Registration
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        const data = await res.json();

        if (data.success && data.user) {
          setSuccess('Sua conta foi criada em conformidade com a LGPD! Fazendo login seguro...');
          
          // Sync local storage list of registered users for local reference
          const localUsers = getRegisteredUsers();
          localStorage.setItem('creator_planner_registered_users', JSON.stringify([...localUsers, data.user]));

          // Increment saas accounts count metric
          const accountsCount = parseInt(localStorage.getItem('saas_accounts_count') || '0', 10);
          localStorage.setItem('saas_accounts_count', (accountsCount + 1).toString());

          setTimeout(() => {
            onLogin(data.user);
          }, 1000);
        } else {
          setError(data.error || 'Falha ao registrar usuário.');
        }
      } catch (err) {
        console.error('Server offline, fallback to local registration simulation:', err);
        const users = getRegisteredUsers();
        if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
          setError('Este e-mail já está cadastrado. Tente fazer login.');
          return;
        }

        const newUser: User = {
          id: `user_${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password,
          createdAt: new Date().toISOString()
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('creator_planner_registered_users', JSON.stringify(updatedUsers));

        setSuccess('Conta simulada criada offline! Fazendo login...');
        setTimeout(() => {
          onLogin(newUser);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-panel-black flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background visual atmosphere glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent-orange/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating brand icon logo */}
      <div className="relative flex flex-col items-center mb-8 z-10 text-center">
        <div className="relative p-3.5 rounded-2xl bg-panel-card border border-panel-border flex items-center justify-center shadow-2xl group mb-3">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-purple to-accent-orange opacity-40 rounded-2xl blur-md" />
          <div className="relative flex space-x-[3px] items-center">
            <span className="w-3 h-3 rounded-full bg-accent-purple" />
            <span className="w-3 h-3 rounded-full bg-white border-2 border-black" />
            <span className="w-3 h-3 rounded-full bg-accent-orange" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight gradient-title">
          Planner de Conteúdo
        </h1>
        <p className="text-zinc-400 text-xs mt-1.5 font-medium">
          Sua central de planejamento de conteúdo multicanais de alta conversão
        </p>
      </div>

      {/* Auth Card Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 z-10 relative"
      >
        {/* Toggle tabs */}
        <div className="flex bg-zinc-900/60 border border-panel-border/60 p-1.5 rounded-xl mb-6">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isLoginTab 
                ? 'bg-zinc-800 text-white shadow' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn size={14} />
            Entrar
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              !isLoginTab 
                ? 'bg-zinc-800 text-white shadow' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus size={14} />
            Cadastrar
          </button>
        </div>

        {/* Action Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium leading-relaxed">
              {success}
            </div>
          )}

          {/* Regular Registration Name Field */}
          {!isLoginTab && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                Nome completo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <UserIcon size={15} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Seu nome ou marca"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
              E-mail corporativo
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Mail size={15} />
              </span>
              <input
                type="email"
                required
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone Field for Registration */}
          {!isLoginTab && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                WhatsApp / Celular
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Phone size={15} />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
              Senha de acesso
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* LGPD Consent Checkbox */}
          {!isLoginTab && (
            <div className="flex items-start gap-2.5 pt-1.5 pb-2">
              <input
                id="lgpd-consent-checkbox"
                type="checkbox"
                required
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 rounded border-panel-border bg-zinc-900 text-accent-purple focus:ring-accent-purple/30 focus:ring-offset-0 cursor-pointer h-4 w-4"
              />
              <label htmlFor="lgpd-consent-checkbox" className="text-[11px] text-zinc-400 leading-normal select-none">
                Eu aceito os{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalTab('terms')}
                  className="text-accent-purple hover:underline font-medium focus:outline-none"
                >
                  Termos de Uso
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  onClick={() => setActiveLegalTab('privacy')}
                  className="text-accent-purple hover:underline font-medium focus:outline-none"
                >
                  Política de Privacidade
                </button>{' '}
                em conformidade com a LGPD.
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 shadow-lg shadow-accent-purple/20 transition-all transform active:scale-[0.98] cursor-pointer mt-2"
          >
            {isLoginTab ? 'Entrar na Conta' : 'Criar Conta Gratuita'}
          </button>
        </form>

        {/* Extra Onboarding Feature Info Box */}
        <div className="mt-6 pt-5 border-t border-panel-border/50 flex items-center gap-2 text-zinc-400 text-[11px] leading-relaxed">
          <Sparkles size={14} className="text-accent-orange flex-shrink-0 animate-pulse" />
          <span>Contas criadas recebem um planner totalmente limpo para gerenciar múltiplos clientes.</span>
        </div>
      </motion.div>

      {/* Legal Dialog for Terms / Privacy */}
      {activeLegalTab && (
        <LegalTextsDialog
          isOpen={true}
          onClose={() => setActiveLegalTab(null)}
          type={activeLegalTab}
        />
      )}
    </div>
  );
}
