import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, KeyRound, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessReturnToLogin: (prefilledEmail?: string) => void;
  initialEmail?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccessReturnToLogin,
  initialEmail = ''
}: ForgotPasswordModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevCodeHint(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(t('fillEmailField', 'Por favor, informe seu e-mail cadastrado.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || t('codeSentSuccess', 'Código de recuperação enviado! Verifique seu e-mail.'));
        if (data.previewCode) {
          setDevCodeHint(data.previewCode);
        }
        setStep('reset');
      } else {
        setError(data.error || t('failedToSendCode', 'Não foi possível enviar o e-mail de recuperação.'));
      }
    } catch (err: any) {
      setError(t('connectionError', 'Erro de conexão com o servidor.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode || !newPassword || !confirmPassword) {
      setError(t('fillAllFields', 'Por favor, preencha todos os campos.'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength', 'A nova senha deve ter no mínimo 6 caracteres.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch', 'As senhas digitadas não coincidem.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(t('passwordResetSuccess', 'Senha redefinida com sucesso! Redirecionando para o login...'));
        setTimeout(() => {
          onSuccessReturnToLogin(cleanEmail);
        }, 1500);
      } else {
        setError(data.error || t('invalidCodeOrExpired', 'Código inválido ou expirado.'));
      }
    } catch (err: any) {
      setError(t('connectionError', 'Erro de conexão com o servidor.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border/40 transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-accent-purple to-accent-orange text-white shadow-lg">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-extrabold text-white">
              {step === 'request' ? t('forgotPasswordTitle', 'Recuperar Senha') : t('resetPasswordTitle', 'Criar Nova Senha')}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {step === 'request'
                ? t('forgotPasswordSub', 'Enviaremos um código seguro para o seu e-mail cadastrado.')
                : t('resetPasswordSub', 'Informe o código recebido e defina sua nova senha de acesso.')}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed flex items-center gap-2 mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium leading-relaxed flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {devCodeHint && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-mono mb-4">
            <span className="font-bold">Código gerado (Simulação/Dev):</span> {devCodeHint}
          </div>
        )}

        {/* Step 1: Request Code Form */}
        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                {t('registeredEmail', 'E-mail cadastrado')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="seu-email@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 shadow-lg shadow-accent-purple/20 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <span>{t('sendRecoveryCode', 'Enviar Código de Recuperação')}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onSuccessReturnToLogin(email)}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>{t('backToLogin', 'Voltar ao Login')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Reset Password Form */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                {t('recoveryCode', 'Código de 6 dígitos')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <KeyRound size={15} />
                </span>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="Ex: 849201"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono tracking-widest placeholder-zinc-500 focus:outline-none transition-all uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                {t('newPassword', 'Nova Senha')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                {t('confirmNewPassword', 'Confirmar Nova Senha')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border hover:border-zinc-700 focus:border-accent-purple rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 shadow-lg shadow-accent-purple/20 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <span>{t('saveNewPassword', 'Redefinir e Salvar Senha')}</span>
                  <CheckCircle2 size={14} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setError('');
                  setSuccess('');
                }}
                className="hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>{t('resendCode', 'Reenviar código')}</span>
              </button>

              <button
                type="button"
                onClick={() => onSuccessReturnToLogin(email)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                <span>{t('backToLogin', 'Voltar ao Login')}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
