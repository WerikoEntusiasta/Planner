import React, { useState, useEffect } from 'react';
import { User, Post, Client, SupportTicket } from '../types';
import { Shield, Eye, Users, Layers, LayoutGrid, LogOut, ArrowLeft, Plus, Smartphone, Trash2, CheckCircle2, Terminal, RefreshCw, BarChart2, MessageSquare, LifeBuoy, CreditCard, Key, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AdminDashboardProps {
  onBackToApp: () => void;
  onSimulateUser: (user: User) => void;
}

export default function AdminDashboard({ onBackToApp, onSimulateUser }: AdminDashboardProps) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Metrics states loaded from localStorage
  const [accesses, setAccesses] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeLowerTab, setActiveLowerTab] = useState<'users' | 'tickets' | 'stripe'>('users');

  // Stripe Management States
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [isStripeActive, setIsStripeActive] = useState(false);
  const [isStripeLive, setIsStripeLive] = useState(false);
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [stripeAdminMsg, setStripeAdminMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Simulation states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'System initialization successful.',
    'Admin panel ready for monitoring.'
  ]);

  // Read environment values
  const envAdminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL;
  const envAdminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD;

  // Load metrics & users on component mount
  useEffect(() => {
    // 1. Get accesses
    const savedAccesses = parseInt(localStorage.getItem('creator_planner_accesses_v2') || '0', 10);
    setAccesses(savedAccesses);

    // 2. Get registered users
    const savedUsers = localStorage.getItem('creator_planner_registered_users');
    let loadedUsers: User[] = [];
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        loadedUsers = parsed.filter((u: User) => !u.id.startsWith('mock_'));
      } catch (e) {}
    }
    
    setUsers(loadedUsers);

    // 3. Get all posts & clients
    const savedPosts = localStorage.getItem('creator_planner_posts');
    if (savedPosts) {
      try {
        setAllPosts(JSON.parse(savedPosts));
      } catch (e) {}
    } else {
      setAllPosts([]);
    }

    const savedClients = localStorage.getItem('creator_planner_clients');
    if (savedClients) {
      try {
        setAllClients(JSON.parse(savedClients));
      } catch (e) {}
    } else {
      setAllClients([]);
    }

    // 4. Get support tickets
    const savedTickets = localStorage.getItem('creator_planner_tickets');
    let loadedTickets: SupportTicket[] = [];
    if (savedTickets) {
      try {
        const parsed = JSON.parse(savedTickets);
        loadedTickets = parsed.filter((t: SupportTicket) => !t.id.startsWith('ticket_seed_'));
      } catch (e) {}
    }
    
    setTickets(loadedTickets);

    // 5. Fetch Stripe configuration status
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsStripeActive(data.isConfigured);
          setIsStripeLive(data.isLive);
          if (data.publishableKey) {
            setStripePublishableKey(data.publishableKey);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [slideImages, setSlideImages] = useState<Record<number, string>>({});

  // Load custom carousel slide images
  useEffect(() => {
    const loaded: Record<number, string> = {};
    for (let i = 0; i < 4; i++) {
      const img = localStorage.getItem(`carousel_slide_${i}_img`);
      if (img) {
        loaded[i] = img;
      }
    }
    setSlideImages(loaded);
  }, []);

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('A imagem é muito grande! Escolha um arquivo de no máximo 3MB para evitar exceder o limite de armazenamento local.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        localStorage.setItem(`carousel_slide_${index}_img`, base64);
        setSlideImages(prev => ({ ...prev, [index]: base64 }));
        addLogEntry(`Custom mockup image updated for slide ${index + 1}.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    localStorage.removeItem(`carousel_slide_${index}_img`);
    setSlideImages(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
    addLogEntry(`Restored default interactive layout for slide ${index + 1}.`);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const inputEmail = adminEmail.trim().toLowerCase();
    const inputPass = adminPassword;

    if (inputEmail === envAdminEmail.toLowerCase() && inputPass === envAdminPassword) {
      setIsAdminLoggedIn(true);
      addLogEntry('Admin authenticated successfully.');
    } else {
      setLoginError('Credenciais inválidas! Verifique os dados fornecidos nas variáveis de ambiente.');
    }
  };

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 8)]);
  };

  const simulateAccess = () => {
    const nextVal = accesses + 1;
    setAccesses(nextVal);
    localStorage.setItem('creator_planner_accesses_v2', nextVal.toString());
    addLogEntry('New external visitor access detected.');
  };

  const handleReplyTicket = (ticketId: string, newStatus: 'in_progress' | 'resolved') => {
    const text = replyText[ticketId]?.trim() || '';
    
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          adminReply: text || t.adminReply,
          resolvedAt: newStatus === 'resolved' ? new Date().toLocaleDateString('pt-BR') : undefined
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    localStorage.setItem('creator_planner_tickets', JSON.stringify(updatedTickets));
    
    // Log in telemetry
    const logMsg = text 
      ? `Respondeu chamado de ${tickets.find(t => t.id === ticketId)?.userName}: "${text}"`
      : `Alterou status do chamado "${ticketId}" para ${newStatus === 'resolved' ? 'Resolvido' : 'Em Andamento'}`;
    addLogEntry(logMsg);

    // Reset reply text
    setReplyText(prev => {
      const copy = { ...prev };
      delete copy[ticketId];
      return copy;
    });

    alert(`Chamado de suporte atualizado com sucesso! Novo status: ${newStatus === 'resolved' ? 'Resolvido' : 'Em Andamento'}`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Deseja mesmo remover esta conta de usuário e todos os seus dados?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('creator_planner_registered_users', JSON.stringify(updatedUsers));
      
      // Clean up posts and clients belonging to this user
      const updatedPosts = allPosts.filter(p => p.userId !== userId);
      setAllPosts(updatedPosts);
      localStorage.setItem('creator_planner_posts', JSON.stringify(updatedPosts));

      addLogEntry(`Deleted user account: ${userId}`);
    }
  };

  const handleCreateMockUser = () => {
    // Mock user creation removed
    alert('Funcionalidade de criação de cliente de teste removida.');
  };

  // Helper stats calculation
  const totalClients = allClients.length || users.length * 2; // Simulation multiplier if empty
  const totalPosts = allPosts.length || users.length * 4;

  // Calculate daily registrations over the last 7 days
  const getLastSevenDaysData = () => {
    const data = [];
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const dayName = daysOfWeek[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${dayName} (${day}/${month})`;
      
      // Count users whose createdAt date is this calendar day
      const count = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return (
          userDate.getDate() === d.getDate() &&
          userDate.getMonth() === d.getMonth() &&
          userDate.getFullYear() === d.getFullYear()
        );
      }).length;
      
      data.push({
        date: label,
        "Novas Contas": count
      });
    }
    return data;
  };

  const chartData = getLastSevenDaysData();

  return (
    <div className="min-h-screen bg-panel-black text-zinc-100 flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-orange/5 rounded-full blur-[100px] pointer-events-none" />

      {!isAdminLoggedIn ? (
        // ADMIN LOGIN GATED SCREEN
        <div className="flex-1 flex flex-col justify-center items-center p-4 z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-panel-card border border-panel-border rounded-2xl shadow-2xl p-6 md:p-8 relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-zinc-800 border border-panel-border text-[10px] font-mono uppercase tracking-widest text-accent-purple font-bold flex items-center gap-1.5 shadow-md">
              <Shield size={12} />
              SaaS Owner Gate
            </div>

            <div className="text-center mb-6 mt-2">
              <h2 className="text-xl font-display font-bold text-white">
                Acesso Administrativo
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Monitore o crescimento, conversões e cadastros da plataforma
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                  E-mail do Administrador
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@saas.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border focus:border-accent-purple rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-zinc-400">
                  Senha Administrativa
                </label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-panel-border focus:border-accent-purple rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-display font-bold text-xs bg-accent-purple text-white hover:bg-accent-purple-dark shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <Shield size={14} />
                Entrar no Painel de Admin
              </button>
            </form>

            {/* Hint Box for development ease */}
            <div className="mt-6 pt-5 border-t border-panel-border/50 text-[11px] text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-400">💡 Credenciais configuradas:</p>
              <p>• E-mail: <code className="text-accent-purple font-mono">{envAdminEmail}</code></p>
              <p>• Senha: <code className="text-accent-purple font-mono">{envAdminPassword}</code></p>
              <p className="mt-2 text-[10px] text-zinc-600">Defina <code className="font-mono">VITE_ADMIN_EMAIL</code> e <code className="font-mono">VITE_ADMIN_PASSWORD</code> no arquivo <code className="font-mono">.env.example</code> para alterar.</p>
            </div>

            <button
              onClick={onBackToApp}
              className="w-full mt-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Voltar ao Planner de Conteúdo
            </button>
          </motion.div>
        </div>
      ) : (
        // ADMIN DASHBOARD CONTENT PANEL
        <div className="flex-1 flex flex-col z-10">
          {/* Top Admin Navigation Header */}
          <header className="border-b border-panel-border bg-panel-card p-5 px-6 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-purple/10 border border-accent-purple/25 text-accent-purple">
                <Shield size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-display font-bold text-white leading-none">
                    SaaS Owner Control Center
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Gerenciamento de acessos, contas de clientes e métricas globais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Find owner or create one if not found
                  let owner = users.find(u => u.email === 'werikplaystore@gmail.com');
                  if (!owner) {
                    owner = {
                      id: 'mock_owner_' + Date.now(),
                      name: 'Werik Oliveira (SaaS Owner)',
                      email: 'werikplaystore@gmail.com',
                      phone: '(62) 99244-1122',
                      createdAt: new Date().toISOString()
                    };
                    const updatedUsers = [owner, ...users];
                    setUsers(updatedUsers);
                    localStorage.setItem('creator_planner_registered_users', JSON.stringify(updatedUsers));
                  }
                  onSimulateUser(owner);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-orange text-black hover:bg-accent-orange/90 transition-all text-xs font-black cursor-pointer shadow-lg shadow-accent-orange/10 border border-accent-orange/20"
              >
                <Eye size={14} />
                Visualização de Usuário
              </button>
              <button
                onClick={onBackToApp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-panel-border bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                <ArrowLeft size={14} />
                Voltar ao App
              </button>
              <button
                onClick={onBackToApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/20 border border-red-500/30 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-all text-xs font-bold cursor-pointer"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </header>

          {/* Core Content Grid */}
          <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
            
            {/* KPI METRIC CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Accesses (Visits) Card */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
                  <Eye size={48} className="text-accent-purple" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                      Visualizações do Site
                    </p>
                  </div>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-3 font-semibold">
                    {accesses}
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Total de acessos únicos monitorados na landing page do SaaS.
                </p>
              </div>

              {/* Registered Accounts Card */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
                  <Users size={48} className="text-accent-purple" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                      Contas Ativas (Clientes)
                    </p>
                  </div>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-3 font-semibold">
                    {users.length}
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Clientes cadastrados com Nome, E-mail e WhatsApp.
                </p>
              </div>

              {/* Total Clients Managed Card */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
                  <Layers size={48} className="text-accent-orange" />
                </div>
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                    Planners de Canais
                  </p>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-3 font-semibold">
                    {totalClients}
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Canais e Marcas cadastradas pelos clientes para agendamentos.
                </p>
              </div>

              {/* Total Posts Card */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
                  <LayoutGrid size={48} className="text-accent-orange" />
                </div>
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                    Posts Agendados
                  </p>
                  <h3 className="text-3xl font-display font-extrabold text-white mt-3 font-semibold">
                    {totalPosts}
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Total de peças de conteúdo criadas no funil multicanal.
                </p>
              </div>

            </div>

            {/* CHART SECTION (Account Growth) */}
            <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-panel-border pb-4">
                <div>
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <BarChart2 size={18} className="text-accent-purple" />
                    Crescimento de Contas (Últimos 7 dias)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Quantidade diária de novas contas criadas por criadores de conteúdo e agências
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 border border-panel-border px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-accent-purple" />
                  Hoje: <span className="font-bold text-white">{chartData[chartData.length - 1]["Novas Contas"]} novos</span>
                </div>
              </div>

              <div className="w-full h-[240px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      dx={-8}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="Novas Contas" 
                      fill="url(#colorAccounts)" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CAROUSEL SLIDE CUSTOMIZER SECTION */}
            <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-panel-border pb-4">
                <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Smartphone size={18} className="text-accent-purple" />
                  Gerenciador do Carrossel de Imagens (Landing Page)
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Suba imagens personalizadas para substituir os layouts interativos padrão do carrossel da tela inicial do seu app.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 0, label: 'Slide 1: Quadro Kanban', desc: 'Substitui o painel de fluxo de postagens por colunas.' },
                  { id: 1, label: 'Slide 2: Calendário Editorial', desc: 'Substitui a grade de datas e frequências semanais.' },
                  { id: 2, label: 'Slide 3: Metas Ativas', desc: 'Substitui a visualização de metas e barras de progresso.' },
                  { id: 3, label: 'Slide 4: Equipe & Colaboração', desc: 'Substitui o painel de membros e convites.' }
                ].map((slide) => {
                  const customImg = slideImages[slide.id];
                  return (
                    <div key={slide.id} className="bg-zinc-900/40 border border-panel-border rounded-xl p-4 flex flex-col justify-between space-y-4 relative group">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-accent-purple">{slide.label}</span>
                        <p className="text-[10px] text-zinc-500 leading-normal">{slide.desc}</p>
                      </div>

                      {/* Preview Area */}
                      <div className="aspect-[16/10] bg-zinc-950 rounded-lg border border-panel-border/60 flex items-center justify-center overflow-hidden relative">
                        {customImg ? (
                          <img 
                            src={customImg} 
                            alt={slide.label} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-3 space-y-1 select-none">
                            <span className="block text-[18px]">✨</span>
                            <span className="block text-[9px] font-mono text-emerald-400 uppercase font-bold">Layout Padrão</span>
                            <span className="block text-[8px] text-zinc-600">Simulador de tela ativa</span>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="space-y-2">
                        <label className="w-full py-2 rounded-xl text-center text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-panel-border hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                          <Plus size={12} />
                          {customImg ? 'Alterar Imagem' : 'Subir Imagem'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(slide.id, e)}
                            className="hidden" 
                          />
                        </label>

                        {customImg && (
                          <button
                            onClick={() => handleRemoveImage(slide.id)}
                            className="w-full py-1.5 rounded-xl text-center text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Trash2 size={11} />
                            Restaurar Padrão
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOWER CONTENT SECTION (Directory + Terminal Logs) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Tabbed Registered Users and Support Tickets */}
              <div className="lg:col-span-2 bg-panel-card border border-panel-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-panel-border bg-panel-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-display font-bold text-white">
                      Painel de Atendimento & Controle
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Gerencie as contas de clientes cadastrados ou responda chamados de suporte técnico.
                    </p>
                  </div>
                  
                  {/* Tabs Selector */}
                  <div className="flex gap-1 p-0.5 bg-zinc-950 rounded-lg border border-panel-border">
                    <button
                      onClick={() => setActiveLowerTab('users')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        activeLowerTab === 'users'
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Clientes ({users.length})
                    </button>
                    <button
                      onClick={() => setActiveLowerTab('tickets')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        activeLowerTab === 'tickets'
                          ? 'bg-accent-orange text-black border border-accent-orange/20'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Suporte ({tickets.filter(t => t.status !== 'resolved').length} Pendentes)
                    </button>
                    <button
                      onClick={() => {
                        setActiveLowerTab('stripe');
                        fetch('/api/stripe/config')
                          .then(r => r.json())
                          .then(d => {
                            if (d.success) {
                              setIsStripeActive(d.isConfigured);
                              setIsStripeLive(d.isLive);
                              if (d.publishableKey) setStripePublishableKey(d.publishableKey);
                            }
                          })
                          .catch(() => {});
                      }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeLowerTab === 'stripe'
                          ? 'bg-accent-purple text-white border border-accent-purple/40 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <CreditCard size={12} />
                      Gateway Stripe {isStripeActive ? '●' : '○'}
                    </button>
                  </div>
                </div>

                {activeLowerTab === 'users' ? (
                  <div className="overflow-x-auto flex-1 max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/60 border-b border-panel-border/60 text-[10px] font-mono uppercase text-zinc-400">
                          <th className="p-4 font-semibold">Cliente / Nome</th>
                          <th className="p-4 font-semibold">Contato</th>
                          <th className="p-4 font-semibold text-center">Registrado</th>
                          <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-panel-border/40">
                        {users.map((user) => {
                          return (
                            <tr key={user.id} className="hover:bg-zinc-900/30 transition-all">
                              <td className="p-4">
                                <div className="font-semibold text-zinc-100 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-panel-border flex items-center justify-center text-[10px] font-mono font-bold text-accent-purple uppercase shadow-sm">
                                    {user.name.slice(0, 2)}
                                  </div>
                                  <div className="truncate max-w-[150px]">
                                    <div className="text-white font-bold">{user.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {user.id.substring(0, 10)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <span className="block text-zinc-200">{user.email}</span>
                                  <span className="block text-[10px] text-zinc-500 flex items-center gap-1 font-semibold">
                                    <Smartphone size={10} className="text-zinc-600" /> {user.phone}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center font-mono text-zinc-400 text-[10px]">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Mock'}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => onSimulateUser(user)}
                                  className="p-2 rounded-lg bg-accent-purple/15 hover:bg-accent-purple/35 border border-accent-purple/30 hover:border-accent-purple/50 text-accent-purple transition-all cursor-pointer mr-1.5"
                                  title="Simular/Visualizar como este Usuário"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-lg bg-red-950/10 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all cursor-pointer"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : activeLowerTab === 'tickets' ? (
                  <div className="overflow-y-auto flex-1 max-h-[380px] p-4 space-y-4">
                    {tickets.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                        Nenhum chamado enviado pelos usuários ainda.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tickets.map((t) => (
                          <div key={t.id} className="bg-zinc-900/60 border border-panel-border rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-panel-border/30 pb-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {t.createdAt} • Por <strong>{t.userName}</strong> ({t.userEmail})
                                </span>
                                <h5 className="text-xs font-bold text-white uppercase tracking-wider">{t.title}</h5>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${
                                  t.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}>
                                  {t.priority === 'high' ? 'Urgente' : t.priority === 'medium' ? 'Médio' : 'Baixo'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${
                                  t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-950/40 rounded-lg border border-panel-border/20 text-xs text-zinc-300">
                              <span className="block text-[9px] text-accent-orange font-mono font-bold uppercase mb-0.5">Descrição do Chamado:</span>
                              "{t.description}"
                            </div>

                            {t.adminReply && (
                              <div className="p-3 bg-accent-purple/5 border border-accent-purple/20 rounded-lg text-xs text-zinc-300">
                                <span className="block text-[9px] text-accent-purple font-mono font-bold uppercase mb-0.5">Resposta enviada:</span>
                                <p className="italic font-medium">"{t.adminReply}"</p>
                              </div>
                            )}

                            {t.status !== 'resolved' && (
                              <div className="space-y-2 pt-1">
                                <input 
                                  type="text"
                                  placeholder="Escreva uma resposta de suporte para o cliente..."
                                  value={replyText[t.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  className="w-full bg-zinc-950 border border-panel-border rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleReplyTicket(t.id, 'in_progress')}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-panel-border hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold cursor-pointer"
                                  >
                                    Marcar Em Andamento
                                  </button>
                                  <button
                                    onClick={() => handleReplyTicket(t.id, 'resolved')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                                  >
                                    Responder & Resolver
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* STRIPE CONFIGURATION TAB */
                  <div className="p-5 flex-1 overflow-y-auto space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-panel-border/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider">Gateway de Pagamentos Stripe</h5>
                          <p className="text-[10px] text-zinc-400">Checkout transparente e seguro com Cartão de Crédito e Boleto em R$</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          isStripeActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {isStripeActive ? (isStripeLive ? '● Stripe Live (Produção)' : '● Stripe Test (Sandbox)') : '○ Não Configurado'}
                        </span>
                      </div>
                    </div>

                    {stripeAdminMsg && (
                      <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                        stripeAdminMsg.type === 'success' 
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                          : 'bg-red-950/40 border-red-500/30 text-red-300'
                      }`}>
                        {stripeAdminMsg.type === 'success' ? <Check size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                        <span>{stripeAdminMsg.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono font-bold uppercase text-zinc-300">
                          Chave Secreta Stripe (STRIPE_SECRET_KEY) *
                        </label>
                        <input
                          type="password"
                          placeholder="sk_test_... ou sk_live_..."
                          value={stripeSecretKey}
                          onChange={(e) => setStripeSecretKey(e.target.value)}
                          className="w-full bg-zinc-950 border border-panel-border focus:border-accent-purple rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-zinc-500">Inicia com <code>sk_test_</code> (teste) ou <code>sk_live_</code> (produção).</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono font-bold uppercase text-zinc-300">
                          Chave Publicável Stripe (STRIPE_PUBLISHABLE_KEY)
                        </label>
                        <input
                          type="text"
                          placeholder="pk_test_... ou pk_live_..."
                          value={stripePublishableKey}
                          onChange={(e) => setStripePublishableKey(e.target.value)}
                          className="w-full bg-zinc-950 border border-panel-border focus:border-accent-purple rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-zinc-500">Inicia com <code>pk_test_</code> ou <code>pk_live_</code>.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950/80 rounded-xl border border-panel-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Terminal size={15} className="text-accent-orange" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Configuração do Webhook Stripe</span>
                        </div>
                        <a
                          href="https://dashboard.stripe.com/webhooks"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-accent-purple hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Abrir Webhooks no Stripe</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                          URL do Endpoint para Produção (Domínio Oficial):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value="https://planner.amplificagroup.com/api/stripe/webhook"
                            className="flex-1 bg-zinc-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('https://planner.amplificagroup.com/api/stripe/webhook');
                              setCopiedWebhookUrl(true);
                              setTimeout(() => setCopiedWebhookUrl(false), 2000);
                            }}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shrink-0 shadow-md"
                          >
                            {copiedWebhookUrl ? 'Copiado!' : 'Copiar URL Produção'}
                          </button>
                        </div>
                      </div>

                      {typeof window !== 'undefined' && !window.location.host.includes('planner.amplificagroup.com') && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>URL para ambiente de desenvolvimento/preview atual:</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/api/stripe/webhook`);
                                setCopiedWebhookUrl(true);
                                setTimeout(() => setCopiedWebhookUrl(false), 2000);
                              }}
                              className="text-accent-orange hover:underline font-mono text-[9px] cursor-pointer"
                            >
                              Copiar URL Preview
                            </button>
                          </div>
                          <code className="block p-1.5 bg-zinc-900/60 rounded border border-panel-border/50 text-[10px] text-zinc-400 font-mono break-all">
                            {`${window.location.origin}/api/stripe/webhook`}
                          </code>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono font-bold uppercase text-zinc-400">
                          Segredo de Assinatura do Webhook (STRIPE_WEBHOOK_SECRET)
                        </label>
                        <input
                          type="password"
                          placeholder="whsec_..."
                          value={stripeWebhookSecret}
                          onChange={(e) => setStripeWebhookSecret(e.target.value)}
                          className="w-full bg-zinc-900 border border-panel-border focus:border-accent-purple rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                        />
                        <p className="text-[9px] text-zinc-500">Obtido no Stripe após criar o endpoint clicando em <em>"Revelar segredo de assinatura"</em>.</p>
                      </div>

                      <div className="pt-2 border-t border-panel-border/40 space-y-1.5">
                        <span className="block text-[9px] font-mono uppercase font-bold text-zinc-400">Eventos para escutar no Stripe:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-emerald-400">checkout.session.completed</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-emerald-400">checkout.session.async_payment_succeeded</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-amber-400">customer.subscription.deleted</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-blue-400">invoice.payment_succeeded</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        disabled={isSavingStripe || !stripeSecretKey.trim()}
                        onClick={async () => {
                          setIsSavingStripe(true);
                          setStripeAdminMsg(null);
                          try {
                            const res = await fetch('/api/admin/stripe-config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                secretKey: stripeSecretKey,
                                publishableKey: stripePublishableKey,
                                webhookSecret: stripeWebhookSecret
                              })
                            });
                            const data = await res.json();
                            if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao salvar');
                            setStripeAdminMsg({ type: 'success', text: 'Conexão com Stripe validada e salva com sucesso!' });
                            setIsStripeActive(data.isConfigured);
                            setIsStripeLive(data.isLive);
                            addLogEntry('Stripe payment gateway credentials updated and verified.');
                          } catch (err: any) {
                            setStripeAdminMsg({ type: 'error', text: err.message || 'Erro ao conectar à Stripe' });
                          } finally {
                            setIsSavingStripe(false);
                          }
                        }}
                        className="py-2.5 px-5 rounded-xl font-display font-bold text-xs bg-gradient-to-r from-accent-purple to-accent-orange text-white hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {isSavingStripe ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Validando com a Stripe...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Salvar e Validar Chaves com a Stripe</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Platform distribution chart & Simulated Live System Logs */}
              <div className="space-y-6 flex flex-col justify-between">
                
                {/* Platform Market Share Progress */}
                <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-panel-border pb-3">
                    <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-accent-orange" />
                      Posts por Canal
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">Global</span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Instagram */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                        <span>Instagram (Reels / Carrosseis)</span>
                        <span className="font-mono text-white">45%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-accent-purple rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                        <span>TikTok (Vídeos Curtos)</span>
                        <span className="font-mono text-white">35%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-zinc-200 rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>

                    {/* YouTube */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                        <span>YouTube (Vídeos / Shorts)</span>
                        <span className="font-mono text-white">20%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-accent-orange rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Terminal logs / Live Actions logger */}
                <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg flex-1 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between border-b border-panel-border pb-3 mb-3.5">
                    <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                      <Terminal size={14} className="text-accent-purple animate-pulse" />
                      Live System Telemetry
                    </h4>
                    <button 
                      onClick={() => {
                        setTerminalLogs(['System logs cleared.', 'Active monitoring...']);
                        addLogEntry('Cleared console view.');
                      }}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer"
                      title="Limpar log"
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl font-mono text-[9px] text-zinc-300 space-y-1.5 flex-1 overflow-y-auto max-h-[160px]">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="truncate select-text">
                        <span className="text-emerald-500">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </main>
        </div>
      )}

    </div>
  );
}
