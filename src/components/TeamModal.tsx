/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Settings, 
  Zap, 
  UserPlus, 
  Plus, 
  Eye, 
  Edit3 
} from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUserPlan: (plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth', billingCycle?: 'monthly' | 'quarterly') => void;
  onUpdateMemberPermissions: (userId: string, permissions: NonNullable<User['permissions']>) => void;
  onRemoveMember: (userId: string) => void;
}

export default function TeamModal({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateUserPlan,
  onUpdateMemberPermissions,
  onRemoveMember
}: TeamModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [invitePerms, setInvitePerms] = useState<NonNullable<User['permissions']>>({
    createCards: true,
    editCards: true,
    deleteCards: true,
    manageClients: true
  });

  if (!isOpen) return null;

  // Determine host and user statuses
  const isTeamMember = !!currentUser.isTeamMember;
  const hostId = isTeamMember ? currentUser.invitedByUserId : currentUser.id;
  
  // Find host user record
  const hostUser = users.find(u => u.id === hostId) || currentUser;

  // Filter team members who were invited by this host
  const teamMembers = users.filter(u => u.isTeamMember && u.invitedByUserId === hostId);

  // Plan limit calculations
  const hostPlan = hostUser.plan || 'free';
  const maxAllowedMembers = hostPlan === 'growth' ? 8 : hostPlan === 'pro' ? 5 : hostPlan === 'basic' ? 3 : hostPlan === 'starter' ? 2 : 1;
  const isLimitReached = teamMembers.length >= maxAllowedMembers;

  // Generate invite link with custom embedded permissions
  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${hostId}` +
    `&create=${invitePerms.createCards}` +
    `&edit=${invitePerms.editCards}` +
    `&delete=${invitePerms.deleteCards}` +
    `&manage=${invitePerms.manageClients}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePermission = (member: User, field: keyof NonNullable<User['permissions']>) => {
    const currentPerms = member.permissions || {
      createCards: true,
      editCards: true,
      deleteCards: true,
      manageClients: true
    };
    
    const updatedPerms = {
      ...currentPerms,
      [field]: !currentPerms[field]
    };
    
    onUpdateMemberPermissions(member.id, updatedPerms);
  };

  const handleToggleInvitePermission = (field: keyof NonNullable<User['permissions']>) => {
    setInvitePerms(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border/40 transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-panel-border/50 pb-5 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-orange text-white shadow-md">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-xl font-display font-extrabold text-white">
              {isTeamMember ? t('teamSpace', 'Espaço de Equipe') : t('inviteManageTeam', 'Convidar & Gerenciar Equipe')}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isTeamMember 
                ? `${t('activeMemberInAgency', 'Membro ativo na agência de')} ${hostUser.name}` 
                : t('inviteCollaboratorsSub', 'Convide novos colaboradores e defina suas permissões de acesso diretamente no link.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: INVITATION CONFIGURATOR */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* SENDER INFO / GUEST PREVIEW BAR */}
            {isTeamMember ? (
              <div className="p-5 bg-panel-black/40 border border-panel-border rounded-2xl space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-orange flex items-center gap-1.5">
                  <Settings size={13} />
                  {t('yourActivePermissions', 'Suas Permissões Ativas')}
                </h4>
                
                <p className="text-[11px] text-zinc-400 leading-normal">
                  {t('activePermissionsNotice', 'Estas são as permissões ativas dadas pelo administrador do workspace para o seu usuário:')}
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { key: 'createCards' as const, label: t('permCreateCards', 'Criar cards de conteúdo') },
                    { key: 'editCards' as const, label: t('permEditCards', 'Editar/Atualizar cards') },
                    { key: 'deleteCards' as const, label: t('permDeleteCards', 'Apagar cards do planner') },
                    { key: 'manageClients' as const, label: t('permManageClients', 'Adicionar/Alterar marcas') },
                  ].map((perm) => {
                    const hasPerm = currentUser.permissions ? !!currentUser.permissions[perm.key] : true;
                    return (
                      <div key={perm.key} className="flex items-center justify-between p-2.5 rounded-xl bg-panel-black border border-panel-border/30">
                        <span className="text-zinc-300 font-medium">{perm.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          hasPerm 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/25'
                        }`}>
                          {hasPerm ? t('allowed', 'Permitido') : t('blocked', 'Bloqueado')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* HOST'S INVITE CONFIGURATOR */
              <div className="p-5 bg-panel-black/60 border border-panel-border rounded-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/5 rounded-full blur-xl" />
                
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded-md">
                    {t('step1SetPermissions', 'Passo 1: Definir Permissões')}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-3">{t('configureGuestPermissions', 'Configurar Permissões do Convidado')}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {t('guestPermissionsNotice', 'Marque as funções que o colaborador poderá realizar no sistema após se cadastrar usando o seu link.')}
                  </p>
                </div>

                {/* Checklist options */}
                <div className="space-y-2 pt-2 border-t border-panel-border/30">
                  {[
                    { key: 'createCards' as const, label: t('permCreateNewCards', 'Criar novos cards de conteúdo') },
                    { key: 'editCards' as const, label: t('permEditUpdateCards', 'Editar e atualizar cards') },
                    { key: 'deleteCards' as const, label: t('permDeletePlannerCards', 'Apagar cards do planner') },
                    { key: 'manageClients' as const, label: t('permManageBrandsClients', 'Gerenciar marcas/clientes') }
                  ].map((item) => {
                    const isChecked = !!invitePerms[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleToggleInvitePermission(item.key)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                          isChecked 
                            ? 'bg-accent-purple/10 border-accent-purple/30 text-white hover:bg-accent-purple/15' 
                            : 'bg-zinc-900/40 border-panel-border/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                        }`}
                      >
                        <span>{item.label}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'border-accent-purple bg-accent-purple text-white' 
                            : 'border-zinc-700 bg-transparent'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-panel-border/30 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-orange">
                        {t('step2CopyInviteLink', 'Passo 2: Copiar Link de Convite')}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isLimitReached ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {teamMembers.length}/{maxAllowedMembers} {t('membersCount', 'membros')}
                      </span>
                    </div>

                    {isLimitReached ? (
                      <div className="mt-2 p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-[11px] text-red-300 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <ShieldAlert size={13} className="text-red-400" />
                          {hostPlan === 'free'
                            ? t('freePlanNoInvites', 'O Plano Gratuito não permite membros de equipe.')
                            : t('planMemberLimitReached', `Limite de ${maxAllowedMembers} membros atingido para o Plano ${hostPlan.toUpperCase()}.`)}
                        </p>
                        <p className="text-[10px] text-red-300/80">
                          {t('upgradePlanToInviteMore', 'Faça upgrade do seu plano para convidar novos colaboradores para a sua equipe.')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        {t('inviteLinkUpdatedNotice', 'O link abaixo foi atualizado e já contém os códigos de permissões selecionados acima!')}
                      </p>
                    )}
                  </div>

                  {!isLimitReached && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={inviteLink}
                          className="flex-1 bg-zinc-950 border border-panel-border rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 select-all focus:outline-none"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                            copied 
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                              : 'bg-zinc-800 border-panel-border hover:bg-zinc-700 text-white'
                          }`}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? t('copied', 'Copiado') : t('copy', 'Copiar')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBSCRIPTION UPGRADE SECTION */}
            {!isTeamMember && (
              <div className="p-5 bg-panel-black/40 border border-panel-border rounded-2xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-panel-border/30 pb-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-purple flex items-center gap-1.5">
                    <Zap size={13} className="text-accent-purple" />
                    {t('subscriptionPlan', 'Plano de Assinatura')}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-accent-purple/10 text-[9px] font-mono font-bold uppercase text-accent-purple border border-accent-purple/20">
                    {t('planLabel', 'Plano')} {hostUser.plan ? hostUser.plan.toUpperCase() : 'FREE'}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 space-y-2">
                  <div className="flex justify-between items-center bg-zinc-950/40 border border-panel-border/30 p-2.5 rounded-xl">
                    <div>
                      <p className="font-bold text-white">{t('billingCycle', 'Ciclo de Cobrança:')}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {hostUser.billingCycle === 'quarterly' ? t('quarterlyBillingDiscount', 'Faturamento Trimestral (10% desconto)') : t('monthlyBilling', 'Faturamento Mensal')}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 font-bold px-2 py-0.5 rounded">
                      {hostUser.billingCycle === 'quarterly' ? t('quarterly', 'Trimestral') : t('monthly', 'Mensal')}
                    </span>
                  </div>

                  {hostUser.scheduledTerminationDate && (
                    <div className="p-2.5 rounded-xl bg-red-950/10 border border-red-500/20 text-[10px] text-red-400 font-mono flex flex-col gap-1">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                        ⚠️ {t('scheduledCancellation', 'Cancelamento Agendado')}
                      </span>
                      <span>{t('planTerminatesOn', 'Seu plano será encerrado em:')} <strong>{new Date(hostUser.scheduledTerminationDate).toLocaleDateString('pt-BR')}</strong></span>
                      <span>{t('cancellationNoticeSub', 'Ao final do ciclo, nenhuma nova cobrança será realizada e seu acesso será reduzido ao plano Gratuito.')}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase font-mono tracking-wider">{t('changePlanOrBilling', 'Alterar Plano ou Faturamento:')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateUserPlan('starter', 'monthly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'starter' && hostUser.billingCycle === 'monthly'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Starter {t('monthly', 'Mensal')}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 14,99/{t('monthShort', 'mês')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('starter', 'quarterly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'starter' && hostUser.billingCycle === 'quarterly'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold">Starter 3 {t('months', 'Meses')}</p>
                          <span className="text-[7px] bg-accent-orange text-black font-black px-1 rounded uppercase tracking-wider">10% Off</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 42,00/{t('cycle', 'ciclo')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('basic', 'monthly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'basic' && hostUser.billingCycle === 'monthly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Basic {t('monthly', 'Mensal')}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 29,00/{t('monthShort', 'mês')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('basic', 'quarterly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'basic' && hostUser.billingCycle === 'quarterly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold">Basic 3 {t('months', 'Meses')}</p>
                          <span className="text-[7px] bg-accent-orange text-black font-black px-1 rounded uppercase tracking-wider">10% Off</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 84,00/{t('cycle', 'ciclo')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('pro', 'monthly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'pro' && hostUser.billingCycle === 'monthly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Pro {t('monthly', 'Mensal')}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 49,00/{t('monthShort', 'mês')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('pro', 'quarterly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                          hostUser.plan === 'pro' && hostUser.billingCycle === 'quarterly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold">Pro 3 {t('months', 'Meses')}</p>
                          <span className="text-[7px] bg-accent-orange text-black font-black px-1 rounded uppercase tracking-wider">10% Off</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 144,00/{t('cycle', 'ciclo')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('growth', 'monthly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer col-span-1 ${
                          hostUser.plan === 'growth' && hostUser.billingCycle === 'monthly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Growth {t('monthly', 'Mensal')}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 79,00/{t('monthShort', 'mês')}</p>
                      </button>

                      <button
                        onClick={() => onUpdateUserPlan('growth', 'quarterly')}
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-all cursor-pointer col-span-1 ${
                          hostUser.plan === 'growth' && hostUser.billingCycle === 'quarterly'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-white'
                            : 'bg-zinc-900/60 border-panel-border/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold">Growth 3 {t('months', 'Meses')}</p>
                          <span className="text-[7px] bg-accent-orange text-black font-black px-1 rounded uppercase tracking-wider">10% Off</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 mt-0.5">R$ 224,00/{t('cycle', 'ciclo')}</p>
                      </button>
                    </div>

                    <p className="text-[9px] text-zinc-500 text-center leading-normal">
                      {t('plansPreLaunchNotice', 'Planos Basic, Pro e Growth estão atualmente em fase de pré-lançamento. Ao selecionar, seu plano simulado será atualizado para fins de teste.')}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: TEAM MEMBERS LIST */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {!isTeamMember ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Users size={14} className="text-accent-purple" />
                    {t('teamMembers', 'Membros da Equipe')} ({teamMembers.length})
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {t('activeCollaborativeAccess', 'Acesso Colaborativo Ativo')}
                  </span>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-panel-border/60 rounded-2xl bg-panel-black/10">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-zinc-500 mx-auto mb-3">
                      <UserPlus size={16} />
                    </div>
                    <p className="text-xs text-zinc-400 font-bold">{t('noTeamMembersYet', 'Nenhum colaborador na equipe ainda')}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      {t('noTeamMembersSub', 'Escolha as permissões desejadas no painel esquerdo, copie o link gerado e envie para o convidado.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    {teamMembers.map((member) => {
                      const perms = member.permissions || {
                        createCards: true,
                        editCards: true,
                        deleteCards: true,
                        manageClients: true
                      };
                      return (
                        <div 
                          key={member.id} 
                          className="p-4 bg-panel-black/30 border border-panel-border rounded-xl space-y-4 relative hover:border-panel-border/80 transition-all"
                        >
                          {/* Top Row: User details */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-panel-border flex items-center justify-center text-xs font-mono font-bold text-accent-purple uppercase">
                                {member.name.slice(0, 2)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-white">{member.name}</h5>
                                <p className="text-[10px] text-zinc-400 leading-none mt-1">{member.email} • {member.phone}</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (confirm(`${t('confirmRemoveCollaborator', 'Deseja mesmo remover o colaborador')} ${member.name} ${t('fromYourTeam', 'da sua equipe?')}`)) {
                                  onRemoveMember(member.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-950/15 hover:bg-red-950/50 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all cursor-pointer"
                              title={t('removeCollaborator', 'Remover Colaborador')}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Interactive Permissions Settings checkboxes */}
                          <div className="border-t border-panel-border/30 pt-3 space-y-2">
                            <span className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                              🔧 {t('activePermissionsClickToggle', 'Permissões Ativas (Clique para Alternar):')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { key: 'createCards' as const, label: t('permCreateCardsShort', 'Criar Cards') },
                                { key: 'editCards' as const, label: t('permEditCardsShort', 'Editar Cards') },
                                { key: 'deleteCards' as const, label: t('permDeleteCardsShort', 'Apagar Cards') },
                                { key: 'manageClients' as const, label: t('permManageBrandsShort', 'Gerenciar Marcas') }
                              ].map((item) => {
                                const isChecked = !!perms[item.key];
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleTogglePermission(member, item.key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all text-left cursor-pointer ${
                                      isChecked
                                        ? 'bg-accent-purple/15 border-accent-purple/30 text-white hover:bg-accent-purple/20'
                                        : 'bg-zinc-950/40 border-panel-border/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                                    }`}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                      isChecked
                                        ? 'border-accent-purple bg-accent-purple text-white'
                                        : 'border-zinc-700 bg-transparent'
                                    }`}>
                                      {isChecked && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Team Member Info Banner
              <div className="h-full flex flex-col justify-center items-center py-10 text-center space-y-4 px-4">
                <div className="p-3 bg-zinc-900 border border-panel-border rounded-2xl text-accent-purple">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t('hostExclusiveArea', 'Área Exclusiva do Anfitrião')}</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                    {t('teamMemberExclusiveNoticePre', 'Você está logado como um membro da equipe de')} <strong className="text-white">{hostUser.name}</strong>. {t('teamMemberExclusiveNoticePost', 'Apenas o administrador do workspace (o anfitrião) pode gerar novos links de convites e alterar permissões de acesso.')}
                  </p>
                </div>
                <div className="p-4 bg-accent-purple/5 border border-accent-purple/10 rounded-2xl text-left text-xs max-w-sm leading-relaxed text-zinc-300">
                  💡 <strong>{t('usageTip', 'Dica de uso:')}</strong> {t('teamMemberRealtimeTip', 'Seus agendamentos, edições e criações de conteúdo estão sendo aplicados em tempo real na conta do anfitrião de forma colaborativa!')}
                </div>
              </div>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}
