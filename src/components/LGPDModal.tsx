import React, { useState } from 'react';
import { User, Client, Post, WeeklyGoal } from '../types';
import { Shield, Download, Trash2, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface LGPDModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  clients: Client[];
  posts: Post[];
  goals: WeeklyGoal[];
  onDeleteAccount: () => Promise<boolean>;
  onScheduleCancellation: (terminationDate: string | undefined) => void;
}

export default function LGPDModal({
  isOpen,
  onClose,
  currentUser,
  clients,
  posts,
  goals,
  onDeleteAccount,
  onScheduleCancellation
}: LGPDModalProps) {
  const { t } = useLanguage();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancellationChoice, setCancellationChoice] = useState<'immediate' | 'end_of_period' | null>(null);

  if (!isOpen || !currentUser) return null;

  // LGPD - Data Portability: export everything in JSON format
  const handleExportData = () => {
    try {
      const workspaceOwnerId = currentUser.isTeamMember ? currentUser.invitedByUserId : currentUser.id;
      
      const filteredClients = clients.filter(c => c.userId === workspaceOwnerId);
      const clientIds = filteredClients.map(c => c.id);
      const filteredPosts = posts.filter(p => clientIds.includes(p.clientId));
      const filteredGoals = goals.filter(g => clientIds.includes(g.clientId));

      const payload = {
        lgpd_export_date: new Date().toISOString(),
        compliance: "LGPD (Lei Geral de Proteção de Dados - Brasil, Lei nº 13.709/2018)",
        user_profile: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          plan: currentUser.plan,
          createdAt: currentUser.createdAt,
          isTeamMember: currentUser.isTeamMember
        },
        workspace_clients: filteredClients,
        workspace_posts: filteredPosts,
        workspace_goals: filteredGoals
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `portabilidade_dados_lgpd_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg('Seus dados foram exportados com sucesso em conformidade com o Artigo 18, V da LGPD!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg('Falha ao exportar dados: ' + err.message);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (deleteInput !== currentUser.email) {
      setErrorMsg('O e-mail digitado não coincide com seu e-mail de cadastro.');
      return;
    }

    setIsDeleting(true);
    try {
      const success = await onDeleteAccount();
      if (success) {
        setSuccessMsg('Sua conta e todos os dados associados foram completamente apagados dos servidores e do navegador.');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 3000);
      } else {
        setErrorMsg('Erro no servidor ao excluir a conta.');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setErrorMsg('Falha na exclusão: ' + err.message);
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-panel-border/60 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-white">
                  {t('lgpdTitle', 'Privacidade e Proteção de Dados (LGPD)')}
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                  {t('lgpdSub', 'Lei Geral de Proteção de Dados (Nº 13.709)')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-relaxed mb-4 flex items-start gap-2.5 animate-fade-in">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed mb-4 flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-panel-border/50 text-zinc-300 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-white text-[13px] mb-1">
                <Info size={14} className="text-accent-purple" />
                {t('howWeTreatData', 'Como tratamos seus dados pessoais?')}
              </div>
              <p>
                {t('howWeTreatDataP1', 'Valorizamos a transparência e a segurança das suas informações. Seus dados cadastrais (Nome, E-mail e Telefone) e os conteúdos planejados (Clientes, Posts e Metas) são armazenados em um banco de dados local privado integrado ao seu container Docker.')}
              </p>
              <p>
                {t('howWeTreatDataP2', 'Os seus dados são isolados com segurança e nunca são compartilhados ou vendidos a terceiros.')}
              </p>
            </div>

            {/* Compliance Rights Block */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">{t('yourGuaranteedRights', 'Seus Direitos Garantidos:')}</h4>
              
              {/* Right 1: Portability */}
              <div className="p-4 rounded-xl border border-panel-border bg-panel-card/40 hover:bg-zinc-900/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-emerald-500" />
                    {t('art18Portability', 'Artigo 18, V - Portabilidade de Dados')}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    {t('art18PortabilitySub', 'Baixe um arquivo contendo todas as informações de perfil, clientes cadastrados, metas semanais e publicações planejadas.')}
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Download size={14} />
                  {t('exportJson', 'Exportar JSON')}
                </button>
              </div>

              {/* Right 2: Deletion/Erasure */}
              {!showConfirmDelete ? (
                <div className="p-4 rounded-xl border border-red-500/10 bg-red-950/5 hover:bg-red-950/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-red-500" />
                      {t('art18Erasure', 'Artigo 18, VI - Eliminação de Dados Pessoais')}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {t('art18ErasureSub', 'Exclua permanentemente sua conta, seu histórico de planejamento, clientes e logins. Esta ação é irreversível.')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowConfirmDelete(true);
                      if (!currentUser.plan || currentUser.plan === 'free') {
                        setCancellationChoice('immediate');
                      } else {
                        setCancellationChoice(null);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Trash2 size={14} />
                    {t('deleteAccountBtn', 'Excluir Conta')}
                  </button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-red-500 bg-red-950/20 space-y-4 text-left"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{t('cancellationOrElimination', 'Cancelamento ou Eliminação')}</h5>
                      <p className="text-[11px] text-red-200/80 leading-relaxed mt-1">
                        {!currentUser.plan || currentUser.plan === 'free'
                          ? t('freeCancellationNotice', 'Esta ação apagará permanentemente sua conta e todos os clientes, publicações e metas criados. Seu acesso será revogado imediatamente e os dados não poderão ser recuperados.')
                          : t('paidCancellationNotice', 'Selecione uma das opções abaixo para prosseguir com o cancelamento da sua assinatura ou eliminação completa de seus dados.')}
                      </p>
                    </div>
                  </div>

                  {/* Choice Workflow */}
                  {cancellationChoice === null ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-zinc-900 border border-panel-border rounded-xl space-y-2">
                        <h6 className="text-xs font-bold text-white">
                          💼 {t('activeSubscriptionManagement', 'Gerenciamento da sua Assinatura Ativa')} ({currentUser.plan?.toUpperCase()})
                        </h6>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                          {t('activeSubscriptionNotice', 'Identificamos que você possui uma assinatura paga ativa. Sob a legislação brasileira (Código de Defesa do Consumidor) e políticas de SaaS corporativos, você possui duas opções para encerrar sua relação contratual com total autonomia:')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Option 1: Immediate delete */}
                        <button
                          type="button"
                          onClick={() => setCancellationChoice('immediate')}
                          className="p-4 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-950/5 hover:bg-red-950/15 text-left transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="text-xs font-bold text-red-400 group-hover:text-red-300">
                            {t('opt1DeleteNow', 'Opção 1: Excluir Agora')}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-normal">
                            {t('opt1DeleteNowSub', 'Apaga imediatamente todos os seus dados e cancela o acesso. Sem reembolso parcial do valor restante da assinatura atual.')}
                          </p>
                        </button>

                        {/* Option 2: End of period */}
                        <button
                          type="button"
                          onClick={() => setCancellationChoice('end_of_period')}
                          className="p-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/5 hover:bg-emerald-950/15 text-left transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                            {t('opt2CycleEnd', 'Opção 2: Fim do Ciclo')}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-normal">
                            {t('opt2CycleEndSub', 'Mantém seu acesso premium até o final do ciclo faturado. O plano expira automaticamente sem novas cobranças.')}
                          </p>
                        </button>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowConfirmDelete(false);
                            setCancellationChoice(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-panel-border/50 text-[11px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          {t('back', 'Voltar')}
                        </button>
                      </div>
                    </div>
                  ) : cancellationChoice === 'end_of_period' ? (
                    /* End of period flow */
                    <div className="space-y-4">
                      {(() => {
                        const created = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date();
                        const today = new Date();
                        const cycleMonths = currentUser.billingCycle === 'quarterly' ? 3 : 1;
                        let renewalDate = new Date(created.getTime());
                        while (renewalDate <= today) {
                          renewalDate.setMonth(renewalDate.getMonth() + cycleMonths);
                        }
                        const renewalStr = renewalDate.toLocaleDateString('pt-BR');
                        return (
                          <>
                            <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 space-y-2.5">
                              <h6 className="text-xs font-bold text-emerald-400">
                                ✅ {t('endSubOnDate', 'Encerrar Assinatura na Data:')} {renewalStr}
                              </h6>
                              <p className="text-[11px] text-zinc-300 leading-relaxed">
                                {t('endSubOnDateSub1', 'Ao confirmar, sua assinatura de faturamento')} {currentUser.billingCycle === 'quarterly' ? t('quarterly', 'Trimestral') : t('monthly', 'Mensal')} {t('willBeScheduledToCancel', 'será cancelada de forma programada.')}
                              </p>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {t('endSubOnDateSub2Pre', 'Seu workspace e colaboradores continuam 100% ativos com os benefícios do plano')} <strong>{currentUser.plan?.toUpperCase()}</strong> {t('endSubOnDateSub2Mid', 'até o fim do ciclo contratado em')} <strong>{renewalStr}</strong>. {t('endSubOnDateSub2Post', 'Após essa data, sua conta migrará para o Plano Gratuito automaticamente, preservando todo o seu histórico e marcas!')}
                              </p>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setCancellationChoice(null)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
                              >
                                {t('changeOption', 'Alterar Opção')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onScheduleCancellation(renewalDate.toISOString());
                                  setSuccessMsg(`${t('excellentChoice', 'Excelente escolha! Sua assinatura foi programada para encerrar em')} ${renewalStr}. ${t('enjoyPremiumAccessTillThen', 'Você continuará desfrutando do acesso premium até lá.')}`);
                                  setShowConfirmDelete(false);
                                  setCancellationChoice(null);
                                  setTimeout(() => setSuccessMsg(''), 6000);
                                }}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                              >
                                {t('confirmScheduledTermination', 'Confirmar Encerramento Programado')}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Immediate Delete Flow (with legal warning) */
                    <div className="space-y-4">
                      {currentUser.plan && currentUser.plan !== 'free' && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2 text-[11px] text-amber-200/95 leading-relaxed">
                          <span className="font-bold text-amber-400 block uppercase tracking-wider">
                            ⚠️ {t('legalNoRefundNotice', 'AVISO LEGAL DE NÃO REEMBOLSO (Legislação Brasileira):')}
                          </span>
                          {t('legalNoRefundBody', 'De acordo com o Código de Defesa do Consumidor (Art. 6º, V e Art. 39) e as práticas contratuais brasileiras, a rescisão unilateral antecipada de assinatura de software (SaaS) por parte do usuário não gera direito a reembolso ou devolução proporcional de valores referentes aos dias não utilizados dentro do ciclo já faturado (mensal ou trimestral). Ao selecionar a exclusão imediata abaixo, sua conta e todos os dados serão apagados instantaneamente, encerrando seu ciclo sem direito a reembolsos residuais.')}
                        </div>
                      )}

                      <form onSubmit={handleDeleteSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold text-zinc-300 uppercase">
                            {t('confirmDeleteEmailLabelPre', 'Para excluir tudo imediatamente, digite seu e-mail')} (<span className="text-white select-all">{currentUser.email}</span>):
                          </label>
                          <input
                            type="email"
                            required
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder={currentUser.email}
                            className="w-full bg-zinc-950 border border-red-500/40 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser.plan || currentUser.plan === 'free') {
                                setShowConfirmDelete(false);
                              } else {
                                setCancellationChoice(null);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
                          >
                            {t('changeOption', 'Mudar Opção')}
                          </button>
                          <button
                            type="submit"
                            disabled={isDeleting}
                            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isDeleting ? t('deletingEverything', 'Excluindo tudo...') : t('confirmAndDeleteEverything', 'Confirmar e Apagar Tudo')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer declaration */}
          <div className="border-t border-panel-border/60 pt-4 mt-6 text-center">
            <span className="text-[10px] font-mono text-zinc-500">
              Gerador de Conformidade LGPD v1.0 • Seguro e Criptografado
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
