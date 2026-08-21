/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserPermissions } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { copyToClipboard } from '../utils/clipboard';
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
  Edit3,
  LayoutGrid,
  BarChart2,
  Palette,
  Rocket,
  Image as ImageIcon,
  Workflow,
  FileText,
  Lock,
  Unlock,
  Sliders,
  ShieldCheck,
  Briefcase,
  PenTool,
  Wand2
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

export const ALL_PERMISSIONS_DEFAULT: NonNullable<User['permissions']> = {
  createCards: true,
  editCards: true,
  deleteCards: true,
  manageClients: true,
  useAI: true,
  viewMetrics: true,
  manageCampaigns: true,
  manageBrandKit: true,
  productionPipeline: true,
  creativeHub: true,
  clientApproval: true,
  manageIntegrations: true,
  exportData: true
};

export const PERMISSION_GROUPS = [
  {
    id: 'content',
    title: 'Planejamento & Conteúdo',
    icon: LayoutGrid,
    items: [
      {
        key: 'createCards' as const,
        label: 'Criar Novos Cards e Posts',
        shortLabel: 'Criar Cards',
        description: 'Adicionar novas ideias e planejar posts',
        icon: Plus,
        color: 'text-accent-purple'
      },
      {
        key: 'editCards' as const,
        label: 'Editar Roteiros e Títulos',
        shortLabel: 'Editar Cards',
        description: 'Modificar roteiro, pilares, hashtags e status',
        icon: Edit3,
        color: 'text-accent-orange'
      },
      {
        key: 'deleteCards' as const,
        label: 'Excluir Posts do Planner',
        shortLabel: 'Apagar Cards',
        description: 'Remover definitivamente conteúdos criados',
        icon: Trash2,
        color: 'text-red-400'
      },
      {
        key: 'productionPipeline' as const,
        label: 'Pipeline de Produção',
        shortLabel: 'Mover Pipeline',
        description: 'Avançar etapas (Roteiro, Gravação, Edição)',
        icon: Workflow,
        color: 'text-blue-400'
      }
    ]
  },
  {
    id: 'ai',
    title: 'Inteligência Artificial',
    icon: Sparkles,
    items: [
      {
        key: 'useAI' as const,
        label: 'Assistente IA & Criação Automática',
        shortLabel: 'Acesso à IA',
        description: 'Chat IA, Gerador de Roteiros e Carrosséis',
        icon: Wand2,
        color: 'text-purple-400'
      }
    ]
  },
  {
    id: 'brands',
    title: 'Marcas & Identidade Visual',
    icon: Palette,
    items: [
      {
        key: 'manageClients' as const,
        label: 'Gerenciar Marcas / Clientes',
        shortLabel: 'Marcas / Clientes',
        description: 'Cadastrar, renomear e excluir clientes',
        icon: Users,
        color: 'text-emerald-400'
      },
      {
        key: 'manageBrandKit' as const,
        label: 'Kit de Marca & Paleta de Cores',
        shortLabel: 'Brand Kit',
        description: 'Editar paletas, tipografia e diretrizes visuais',
        icon: Palette,
        color: 'text-pink-400'
      },
      {
        key: 'creativeHub' as const,
        label: 'Central de Criativos & Mídia',
        shortLabel: 'Hub de Criativos',
        description: 'Gerenciar anúncios, banners e artes',
        icon: ImageIcon,
        color: 'text-accent-purple'
      }
    ]
  },
  {
    id: 'strategy',
    title: 'Estratégia & Análises',
    icon: BarChart2,
    items: [
      {
        key: 'viewMetrics' as const,
        label: 'Dashboard de Desempenho & Metas',
        shortLabel: 'Dashboard & Metas',
        description: 'Acessar métricas de funil e metas semanais',
        icon: BarChart2,
        color: 'text-emerald-400'
      },
      {
        key: 'manageCampaigns' as const,
        label: 'Campanhas & Lançamentos',
        shortLabel: 'Campanhas',
        description: 'Criar e gerenciar campanhas sazonais',
        icon: Rocket,
        color: 'text-accent-orange'
      }
    ]
  },
  {
    id: 'operations',
    title: 'Aprovações & Operação',
    icon: CheckCircle2,
    items: [
      {
        key: 'clientApproval' as const,
        label: 'Links de Aprovação de Clientes',
        shortLabel: 'Aprovação Cliente',
        description: 'Gerar links públicos e aprovar conteúdos',
        icon: CheckCircle2,
        color: 'text-cyan-400'
      },
      {
        key: 'manageIntegrations' as const,
        label: 'Integrações (Meta & Webhooks)',
        shortLabel: 'Integrações',
        description: 'Configurar conexões externas e automações',
        icon: Zap,
        color: 'text-amber-400'
      },
      {
        key: 'exportData' as const,
        label: 'Exportar Cronogramas e Relatórios',
        shortLabel: 'Exportar CSV/PDF',
        description: 'Exportar calendário e dados em CSV/PDF',
        icon: FileText,
        color: 'text-zinc-300'
      }
    ]
  }
];

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
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [selectedMemberIdForEdit, setSelectedMemberIdForEdit] = useState<string | null>(null);

  const [invitePerms, setInvitePerms] = useState<NonNullable<User['permissions']>>({
    ...ALL_PERMISSIONS_DEFAULT
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

  // Generate invite link with all custom embedded permissions
  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${hostId}` +
    `&create=${invitePerms.createCards !== false}` +
    `&edit=${invitePerms.editCards !== false}` +
    `&delete=${invitePerms.deleteCards !== false}` +
    `&manage=${invitePerms.manageClients !== false}` +
    `&ai=${invitePerms.useAI !== false}` +
    `&metrics=${invitePerms.viewMetrics !== false}` +
    `&campaigns=${invitePerms.manageCampaigns !== false}` +
    `&brandkit=${invitePerms.manageBrandKit !== false}` +
    `&pipeline=${invitePerms.productionPipeline !== false}` +
    `&creatives=${invitePerms.creativeHub !== false}` +
    `&approval=${invitePerms.clientApproval !== false}` +
    `&integrations=${invitePerms.manageIntegrations !== false}` +
    `&export=${invitePerms.exportData !== false}`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePermission = (member: User, field: keyof NonNullable<User['permissions']>) => {
    const currentPerms = member.permissions || { ...ALL_PERMISSIONS_DEFAULT };
    const updatedPerms = {
      ...currentPerms,
      [field]: currentPerms[field] === false ? true : false
    };
    
    onUpdateMemberPermissions(member.id, updatedPerms);
  };

  const handleToggleInvitePermission = (field: keyof NonNullable<User['permissions']>) => {
    setInvitePerms(prev => ({
      ...prev,
      [field]: prev[field] === false ? true : false
    }));
  };

  // Preset Applicator
  const applyPresetToInvite = (preset: 'all' | 'copywriter' | 'designer' | 'traffic' | 'viewer') => {
    switch (preset) {
      case 'all':
        setInvitePerms({ ...ALL_PERMISSIONS_DEFAULT });
        break;
      case 'copywriter':
        setInvitePerms({
          createCards: true,
          editCards: true,
          deleteCards: false,
          manageClients: false,
          useAI: true,
          viewMetrics: true,
          manageCampaigns: true,
          manageBrandKit: false,
          productionPipeline: true,
          creativeHub: false,
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        });
        break;
      case 'designer':
        setInvitePerms({
          createCards: true,
          editCards: true,
          deleteCards: false,
          manageClients: false,
          useAI: true, // Designer com IA para gerar roteiros e textos de carrosséis
          viewMetrics: false,
          manageCampaigns: false,
          manageBrandKit: true,
          productionPipeline: true,
          creativeHub: true, // Central de criativos liberada
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        });
        break;
      case 'traffic':
        setInvitePerms({
          createCards: false,
          editCards: false,
          deleteCards: false,
          manageClients: false,
          useAI: false,
          viewMetrics: true,
          manageCampaigns: true,
          manageBrandKit: false,
          productionPipeline: false,
          creativeHub: true,
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        });
        break;
      case 'viewer':
        setInvitePerms({
          createCards: false,
          editCards: false,
          deleteCards: false,
          manageClients: false,
          useAI: false,
          viewMetrics: true,
          manageCampaigns: false,
          manageBrandKit: false,
          productionPipeline: false,
          creativeHub: false,
          clientApproval: true,
          manageIntegrations: false,
          exportData: false
        });
        break;
    }
  };

  const applyPresetToMember = (member: User, preset: 'all' | 'copywriter' | 'designer' | 'traffic' | 'viewer') => {
    let newPerms: NonNullable<User['permissions']>;
    switch (preset) {
      case 'all':
        newPerms = { ...ALL_PERMISSIONS_DEFAULT };
        break;
      case 'copywriter':
        newPerms = {
          createCards: true,
          editCards: true,
          deleteCards: false,
          manageClients: false,
          useAI: true,
          viewMetrics: true,
          manageCampaigns: true,
          manageBrandKit: false,
          productionPipeline: true,
          creativeHub: false,
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        };
        break;
      case 'designer':
        newPerms = {
          createCards: true,
          editCards: true,
          deleteCards: false,
          manageClients: false,
          useAI: false,
          viewMetrics: false,
          manageCampaigns: false,
          manageBrandKit: true,
          productionPipeline: true,
          creativeHub: true,
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        };
        break;
      case 'traffic':
        newPerms = {
          createCards: false,
          editCards: false,
          deleteCards: false,
          manageClients: false,
          useAI: false,
          viewMetrics: true,
          manageCampaigns: true,
          manageBrandKit: false,
          productionPipeline: false,
          creativeHub: true,
          clientApproval: true,
          manageIntegrations: false,
          exportData: true
        };
        break;
      case 'viewer':
        newPerms = {
          createCards: false,
          editCards: false,
          deleteCards: false,
          manageClients: false,
          useAI: false,
          viewMetrics: true,
          manageCampaigns: false,
          manageBrandKit: false,
          productionPipeline: false,
          creativeHub: false,
          clientApproval: true,
          manageIntegrations: false,
          exportData: false
        };
        break;
    }
    onUpdateMemberPermissions(member.id, newPerms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-5xl bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-panel-border/40 transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-panel-border/50 pb-5 mb-5 flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-orange text-white shadow-md">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
              {isTeamMember ? t('teamSpace', 'Espaço de Equipe') : t('inviteManageTeam', 'Gerenciador Granular de Equipe & Permissões')}
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ⚡ Reflexo Instantâneo
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isTeamMember 
                ? `${t('activeMemberInAgency', 'Membro ativo no workspace de')} ${hostUser.name}` 
                : 'Defina exatamente o que cada colaborador pode visualizar, criar, editar ou executar dentro do SaaS.'}
            </p>
          </div>
        </div>

        {/* Modal Body with Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 flex-1">
          
          {/* LEFT PANEL: INVITATION CONFIGURATOR */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* SENDER INFO / GUEST PREVIEW BAR (When logged in as Team Member) */}
            {isTeamMember ? (
              <div className="p-5 bg-panel-black/40 border border-panel-border rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-orange flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    {t('yourActivePermissions', 'Suas Permissões Ativas')}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Tempo Real
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-normal">
                  {t('activePermissionsNotice', 'Estas são as permissões ativas atribuídas ao seu usuário pelo administrador do workspace:')}
                </p>

                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map(group => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.id} className="space-y-1.5 pt-2 border-t border-panel-border/30 first:border-t-0 first:pt-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                          <GroupIcon size={12} className="text-accent-purple" />
                          <span>{group.title}</span>
                        </div>
                        {group.items.map(perm => {
                          const hasPerm = currentUser.permissions ? currentUser.permissions[perm.key] !== false : true;
                          const PermIcon = perm.icon;
                          return (
                            <div key={perm.key} className="flex items-center justify-between p-2 rounded-xl bg-panel-black/80 border border-panel-border/40 text-xs">
                              <div className="flex items-center gap-2">
                                <PermIcon size={13} className={perm.color} />
                                <div>
                                  <span className="text-zinc-200 font-medium text-[11px] block">{perm.label}</span>
                                  <span className="text-[9px] text-zinc-500">{perm.description}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase flex-shrink-0 ${
                                hasPerm 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/25'
                              }`}>
                                {hasPerm ? t('allowed', 'Liberado') : t('blocked', 'Bloqueado')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* HOST'S INVITE CONFIGURATOR */
              <div className="p-5 bg-panel-black/60 border border-panel-border rounded-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-accent-purple/5 rounded-full blur-xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded-md">
                      {t('step1SetPermissions', 'Passo 1: Permissões do Convite')}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isLimitReached ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {teamMembers.length}/{maxAllowedMembers} {t('membersCount', 'membros')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2.5">Perfil de Acesso do Convidado</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Escolha um perfil rápido ou personalize cada função individualmente:
                  </p>
                </div>

                {/* Quick Role Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Perfis Pré-Configurados:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetToInvite('all')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-panel-border/60 hover:border-accent-purple text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>🌟</span>
                      <span>Acesso Total</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToInvite('copywriter')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-panel-border/60 hover:border-accent-purple text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>✍️</span>
                      <span>Redator/Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToInvite('designer')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-panel-border/60 hover:border-accent-purple text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>🎨</span>
                      <span>Designer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToInvite('traffic')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-panel-border/60 hover:border-accent-purple text-zinc-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>📊</span>
                      <span>Gestor/Métricas</span>
                    </button>
                  </div>
                </div>

                {/* Granular Permission Checklist with Categories */}
                <div className="space-y-3 pt-2 border-t border-panel-border/30 max-h-[220px] overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map(group => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.id} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                          <GroupIcon size={12} className="text-accent-purple" />
                          <span>{group.title}</span>
                        </div>
                        <div className="space-y-1.5">
                          {group.items.map(item => {
                            const isChecked = invitePerms[item.key] !== false;
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => handleToggleInvitePermission(item.key)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                                  isChecked 
                                    ? 'bg-accent-purple/10 border-accent-purple/30 text-white hover:bg-accent-purple/15' 
                                    : 'bg-zinc-900/40 border-panel-border/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ItemIcon size={13} className={isChecked ? item.color : 'text-zinc-500'} />
                                  <div>
                                    <span className="block text-[11px] font-medium">{item.label}</span>
                                    <span className="block text-[9px] text-zinc-500 font-normal">{item.description}</span>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
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
                      </div>
                    );
                  })}
                </div>

                {/* Step 2: Copy link */}
                <div className="pt-3 border-t border-panel-border/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-orange">
                      {t('step2CopyInviteLink', 'Passo 2: Copiar Link de Convite')}
                    </span>
                  </div>

                  {isLimitReached ? (
                    <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-[11px] text-red-300 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <ShieldAlert size={13} className="text-red-400" />
                        {hostPlan === 'free'
                          ? t('freePlanNoInvites', 'O Plano Gratuito não permite membros de equipe.')
                          : t('planMemberLimitReached', `Limite de ${maxAllowedMembers} membros atingido para o Plano ${hostPlan.toUpperCase()}.`)}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Faça upgrade para adicionar mais colaboradores simultâneos ao workspace.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={inviteLink}
                          className="w-full bg-zinc-950/80 border border-panel-border rounded-xl px-3 py-2 text-[10px] font-mono text-zinc-300 focus:outline-none truncate select-all"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex-shrink-0 ${
                            copied 
                              ? 'bg-emerald-600 hover:bg-emerald-500' 
                              : 'bg-gradient-to-r from-accent-purple to-accent-orange hover:opacity-90 shadow-md shadow-accent-purple/20'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check size={14} />
                              <span>{t('copied', 'Copiado!')}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>{t('copyLink', 'Copiar Link')}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">
                        🔒 As permissões selecionadas são salvas automaticamente na URL e atribuídas assim que o membro se registrar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plan Upgrade Selector (Host Only) */}
            {!isTeamMember && (
              <div className="p-4 bg-panel-black/30 border border-panel-border/60 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Seu Plano Atual: <strong className="text-white uppercase">{hostPlan}</strong> ({maxAllowedMembers} {maxAllowedMembers === 1 ? 'membro' : 'membros'})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['starter', 'basic', 'pro', 'growth'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => onUpdateUserPlan(p, 'monthly')}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        hostPlan === p 
                          ? 'bg-accent-purple/20 border-accent-purple text-white font-bold' 
                          : 'bg-zinc-900/50 border-panel-border/30 text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-bold">{p}</span>
                      <span className="block text-[8px] text-zinc-500">{p === 'starter' ? '2 memb.' : p === 'basic' ? '3 memb.' : p === 'pro' ? '5 memb.' : '8 memb.'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: TEAM MEMBERS LIST WITH GRANULAR CONTROLS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {!isTeamMember ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Users size={14} className="text-accent-purple" />
                      {t('teamMembers', 'Membros da Equipe')} ({teamMembers.length})
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Clique nos botões de permissão para liberar ou bloquear qualquer recurso instantaneamente.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    {t('activeCollaborativeAccess', 'Sincronização Ao Vivo')}
                  </span>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-panel-border/60 rounded-2xl bg-panel-black/10">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-zinc-500 mx-auto mb-3">
                      <UserPlus size={16} />
                    </div>
                    <p className="text-xs text-zinc-400 font-bold">{t('noTeamMembersYet', 'Nenhum colaborador na equipe ainda')}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      {t('noTeamMembersSub', 'Escolha as permissões desejadas no painel esquerdo, copie o link gerado e envie para o colaborador ingressar.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                    {teamMembers.map((member) => {
                      const perms = member.permissions || { ...ALL_PERMISSIONS_DEFAULT };
                      const isExpanded = selectedMemberIdForEdit === member.id || teamMembers.length <= 2;

                      return (
                        <div 
                          key={member.id} 
                          className="p-4 bg-panel-black/40 border border-panel-border hover:border-panel-border/80 rounded-2xl space-y-4 relative transition-all"
                        >
                          {/* Top Row: User details & Presets */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-purple/30 to-accent-orange/30 border border-accent-purple/40 flex items-center justify-center text-xs font-mono font-bold text-white uppercase shadow-inner">
                                {member.name.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-white">{member.name}</h5>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                                    Membro
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-none mt-1">{member.email} {member.phone ? `• ${member.phone}` : ''}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedMemberIdForEdit(prev => prev === member.id ? null : member.id)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-zinc-300 text-[10px] font-semibold transition-all cursor-pointer"
                              >
                                {isExpanded ? 'Recolher' : 'Expandir Permissões'}
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`${t('confirmRemoveCollaborator', 'Deseja mesmo remover o colaborador')} ${member.name} ${t('fromYourTeam', 'da sua equipe?')}`)) {
                                    onRemoveMember(member.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-950/15 hover:bg-red-950/50 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all cursor-pointer"
                                title={t('removeCollaborator', 'Remover Colaborador')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Quick Role Presets for Member */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-panel-border/30">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold mr-1">Aplicar Perfil:</span>
                            <button
                              type="button"
                              onClick={() => applyPresetToMember(member, 'all')}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-panel-border/50 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                            >
                              🌟 Total
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToMember(member, 'copywriter')}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-panel-border/50 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                            >
                              ✍️ Redator
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToMember(member, 'designer')}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-panel-border/50 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                            >
                              🎨 Designer
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToMember(member, 'traffic')}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-panel-border/50 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                            >
                              📊 Gestor
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToMember(member, 'viewer')}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-panel-border/50 text-zinc-300 text-[9px] font-medium transition-all cursor-pointer"
                            >
                              👁️ Leitura
                            </button>
                          </div>

                          {/* Interactive Permissions Grid by Category */}
                          {isExpanded && (
                            <div className="border-t border-panel-border/30 pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                                  🔧 Permissões Granulares (Clique para Alternar):
                                </span>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  Reflete no app do usuário imediatamente
                                </span>
                              </div>

                              <div className="space-y-3">
                                {PERMISSION_GROUPS.map(group => {
                                  const GroupIcon = group.icon;
                                  return (
                                    <div key={group.id} className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                                        <GroupIcon size={12} className="text-accent-purple" />
                                        <span>{group.title}</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {group.items.map(item => {
                                          const isChecked = perms[item.key] !== false;
                                          const ItemIcon = item.icon;
                                          return (
                                            <button
                                              key={item.key}
                                              type="button"
                                              onClick={() => handleTogglePermission(member, item.key)}
                                              className={`flex items-center justify-between p-2 rounded-xl border text-[11px] font-semibold transition-all text-left cursor-pointer ${
                                                isChecked
                                                  ? 'bg-accent-purple/15 border-accent-purple/30 text-white hover:bg-accent-purple/20'
                                                  : 'bg-zinc-950/60 border-panel-border/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                                <ItemIcon size={13} className={isChecked ? item.color : 'text-zinc-600'} />
                                                <div className="truncate">
                                                  <span className="block text-[10px] font-medium leading-tight truncate">{item.shortLabel}</span>
                                                  <span className="block text-[8px] text-zinc-500 font-normal leading-none truncate mt-0.5">{item.description}</span>
                                                </div>
                                              </div>
                                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                                isChecked
                                                  ? 'border-accent-purple bg-accent-purple text-white'
                                                  : 'border-zinc-700 bg-transparent'
                                              }`}>
                                                {isChecked && <Check size={10} strokeWidth={3} />}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

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
                  ⚡ <strong>{t('usageTip', 'Dica de uso:')}</strong> {t('teamMemberRealtimeTip', 'Seus agendamentos, edições e criações de conteúdo estão sendo aplicados em tempo real na conta do anfitrião de forma colaborativa!')}
                </div>
              </div>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}
