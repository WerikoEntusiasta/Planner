import React, { useState, useEffect } from 'react';
import { User, SupportTicket } from '../types';
import { Check, X, HelpCircle, AlertCircle, Send, MessageSquare, History, LifeBuoy, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function SupportModal({ isOpen, onClose, currentUser }: SupportModalProps) {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('duvida');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [successMessage, setSuccessMessage] = useState('');

  // Load user tickets on mount
  useEffect(() => {
    if (!isOpen) return;
    try {
      const allTickets: SupportTicket[] = JSON.parse(localStorage.getItem('creator_planner_tickets') || '[]');
      // Filter tickets created by this user
      const userTickets = allTickets.filter(t => t.userId === currentUser.id);
      setTickets(userTickets);
    } catch (e) {
      setTickets([]);
    }
  }, [isOpen, currentUser.id, successMessage]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'pending',
      createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          subject: title.trim(),
          message: description.trim(),
          category,
          priority
        })
      });
    } catch (err) {
      console.error('Server offline, saving support ticket locally:', err);
    }

    try {
      const allTickets: SupportTicket[] = JSON.parse(localStorage.getItem('creator_planner_tickets') || '[]');
      const updated = [newTicket, ...allTickets];
      localStorage.setItem('creator_planner_tickets', JSON.stringify(updated));
      
      // Save logs
      const logs = JSON.parse(localStorage.getItem('creator_planner_admin_logs') || '[]');
      const logEntry = {
        id: `log_${Date.now()}`,
        text: `Novo chamado de suporte criado por ${currentUser.name}: "${title}"`,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      localStorage.setItem('creator_planner_admin_logs', JSON.stringify([logEntry, ...logs]));
    } catch {}

    setTitle('');
    setDescription('');
    setCategory('duvida');
    setPriority('medium');
    setSuccessMessage('Ticket de suporte enviado com sucesso! Nossa equipe ou o administrador do SaaS responderá em breve.');
    
    setTimeout(() => {
      setSuccessMessage('');
      setActiveTab('history');
    }, 2500);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'bug': return t('catBug', 'Inseto/Bug de Sistema');
      case 'duvida': return t('catDoubt', 'Dúvida Geral');
      case 'financeiro': return t('catBilling', 'Faturamento / Financeiro');
      default: return t('catOther', 'Outro Assunto');
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">{t('prioHigh', 'Alta')}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">{t('prioMedium', 'Média')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">{t('prioLow', 'Baixa')}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">● {t('statusResolved', 'Resolvido')}</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-accent-orange/10 text-accent-orange border border-accent-orange/20 flex items-center gap-1 animate-pulse">● {t('statusInProgress', 'Em Andamento')}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">● {t('statusPending', 'Pendente')}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative max-h-[85vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-panel-border/60 pb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-white">{t('creatorSupportCenter', 'Central de Suporte ao Criador')}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t('creatorSupportSub', 'Envie suas dúvidas, relate bugs ou faça sugestões diretamente para a equipe administrativa do SaaS.')}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'create'
                ? 'bg-accent-orange text-black border-accent-orange hover:bg-accent-orange/90'
                : 'bg-zinc-900 border-panel-border text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <MessageSquare size={13} />
            {t('newTicket', 'Novo Chamado')}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'history'
                ? 'bg-accent-orange text-black border-accent-orange hover:bg-accent-orange/90'
                : 'bg-zinc-900 border-panel-border text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History size={13} />
            {t('yourTickets', 'Seus Chamados')} ({tickets.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto mt-6 pr-1 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.form
                key="tab-create"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {successMessage ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 font-semibold animate-fade-in">
                    <Check size={16} />
                    <span>{successMessage}</span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                      {t('problemCategory', 'Categoria do Problema')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                      className="w-full bg-zinc-900 border border-panel-border hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-orange transition-all cursor-pointer font-semibold"
                    >
                      <option value="duvida">{t('optPlannerDoubt', 'Dúvida de Uso do Planner')}</option>
                      <option value="bug">{t('optBugReport', 'Bug de Tela / Instabilidade')}</option>
                      <option value="financeiro">{t('optBillingUpgrade', 'Upgrade de Plano / Pagamentos')}</option>
                      <option value="outro">{t('optOtherTopics', 'Outros Assuntos')}</option>
                    </select>
                  </div>

                  {/* Priority Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                      {t('urgencyLevel', 'Nível de Gravidade / Urgência')}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                      className="w-full bg-zinc-900 border border-panel-border hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-orange transition-all cursor-pointer font-semibold"
                    >
                      <option value="low">{t('optLowPrio', 'Baixo (Dúvidas ou Melhorias)')}</option>
                      <option value="medium">{t('optMedPrio', 'Médio (Funções instáveis)')}</option>
                      <option value="high">{t('optHighPrio', 'Alto (Problemas impedindo o uso)')}</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                    {t('ticketSubject', 'Assunto / Título do Chamado')}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('ticketSubjectPlaceholder', 'Ex: Erro ao tentar duplicar posts ou subir imagem de mock')}
                    className="w-full bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-orange transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                    {t('detailedDescription', 'Descrição Detalhada do Problema')}
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('ticketDescPlaceholder', 'Descreva detalhadamente o problema ou sua dúvida para que possamos te ajudar com rapidez...')}
                    className="w-full h-32 bg-zinc-900 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent-orange transition-all resize-none"
                  />
                </div>

                {/* Bottom submit */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-accent-orange hover:bg-accent-orange/95 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-accent-orange/10"
                  >
                    <Send size={13} />
                    {t('sendSupportTicket', 'Enviar Ticket de Suporte')}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="tab-history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                {tickets.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-panel-border/60 rounded-2xl bg-panel-black/10">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-panel-border flex items-center justify-center text-zinc-500 mx-auto mb-3">
                      <LifeBuoy size={16} />
                    </div>
                    <p className="text-xs text-zinc-400 font-bold">Nenhum chamado aberto ainda</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Se precisar de suporte com qualquer ferramenta de roteirização ou faturamento, envie-nos um chamado no botão superior.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {tickets.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="bg-zinc-900/35 border border-panel-border rounded-xl p-4 md:p-5 space-y-4 hover:border-panel-border/80 transition-all text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                              <Clock size={11} /> {ticket.createdAt}
                            </span>
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                              {ticket.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>

                        <div className="bg-zinc-950/40 p-3.5 rounded-lg border border-panel-border/20 text-xs text-zinc-300 leading-relaxed font-medium">
                          <span className="block text-[9px] font-mono font-bold uppercase text-accent-orange mb-1">
                            Descrição enviada ({getCategoryLabel(ticket.category)}):
                          </span>
                          "{ticket.description}"
                        </div>

                        {/* Admin Reply Widget */}
                        {ticket.adminReply ? (
                          <div className="bg-accent-orange/5 p-4 rounded-lg border border-accent-orange/20 text-xs text-zinc-300 leading-relaxed space-y-1.5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-orange/5 rounded-full blur-lg" />
                            <span className="font-bold text-accent-orange flex items-center gap-1">
                              <span>🧑‍💻 Resposta do Suporte:</span>
                            </span>
                            <p className="font-semibold italic text-zinc-200">"{ticket.adminReply}"</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                            <Clock size={11} className="text-zinc-500" />
                            <span>Aguardando análise e resposta da equipe do suporte técnico.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
