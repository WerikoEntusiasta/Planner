import React, { useState, useEffect } from 'react';
import { User, Post, Client, SupportTicket, Coupon, Announcement, AuditLog, AdminUserItem } from '../types';
import { 
  Shield, Eye, Users, Layers, LayoutGrid, LogOut, ArrowLeft, Plus, Smartphone, Trash2, 
  CheckCircle2, Terminal, RefreshCw, BarChart2, MessageSquare, LifeBuoy, CreditCard, 
  Key, ExternalLink, Check, AlertCircle, Tag, Percent, Ticket, Copy, Calendar, 
  DollarSign, X, Search, Filter, Sparkles, Download, UserPlus, Zap, Edit3, Send, 
  Radio, RadioTower, Megaphone, Bell, Lock, Unlock, Phone, Mail, ArrowUpRight, TrendingUp,
  Activity, Server, Database, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

interface AdminDashboardProps {
  onBackToApp: () => void;
  onSimulateUser: (user: User) => void;
}

export default function AdminDashboard({ onBackToApp, onSimulateUser }: AdminDashboardProps) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Primary Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'coupons' | 'stripe' | 'tickets' | 'announcements' | 'carousel' | 'audit'>('overview');

  // Metrics & SaaS Analytics
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    paidUsersCount: 0,
    freeUsersCount: 0,
    conversionRate: '0.0',
    mrrBrl: 0,
    arrBrl: 0,
    totalClients: 0,
    totalPosts: 0,
    totalTickets: 0,
    openTickets: 0,
    planDistribution: { free: 0, starter: 0, basic: 0, pro: 0, growth: 0 },
    dailyGrowth: [],
    systemStatus: { database: 'healthy', stripe: 'test', geminiAI: 'active' }
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Users Directory State
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  
  // Modals for User Management
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserPlan, setNewUserPlan] = useState<'free' | 'starter' | 'basic' | 'pro' | 'growth'>('pro');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit User Plan Modal
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [targetPlan, setTargetPlan] = useState<'free' | 'starter' | 'basic' | 'pro' | 'growth'>('pro');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Coupons Management State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [couponAdminMsg, setCouponAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCouponLink, setCopiedCouponLink] = useState<string | null>(null);

  // New Coupon Form
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(20);
  const [formMaxUses, setFormMaxUses] = useState<string>('');
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');

  // Support Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'aberto' | 'em_andamento' | 'resolvido'>('all');
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null);

  // Global Announcements / Broadcast Banner State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [showCreateAnnModal, setShowCreateAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'success' | 'alert'>('info');
  const [annLink, setAnnLink] = useState('');
  const [annLinkText, setAnnLinkText] = useState('');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Stripe Management State
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [isStripeActive, setIsStripeActive] = useState(false);
  const [isStripeLive, setIsStripeLive] = useState(false);
  const [isSavingStripe, setIsSavingStripe] = useState(false);
  const [stripeAdminMsg, setStripeAdminMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [showWebhookTestModal, setShowWebhookTestModal] = useState(false);
  const [webhookTestEmail, setWebhookTestEmail] = useState('cliente@exemplo.com');
  const [webhookTestPlan, setWebhookTestPlan] = useState('pro');
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  // Carousel Slide Customizer State
  const [slideImages, setSlideImages] = useState<Record<number, string>>({});

  // Environment Admin Credentials
  const envAdminEmail = (import.meta as any).env.VITE_ADMIN_EMAIL;
  const envAdminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD;

  // Initial Data Fetch
  const fetchAllData = async () => {
    fetchMetrics();
    fetchAdminUsers();
    fetchCoupons();
    fetchTickets();
    fetchAnnouncements();
    fetchAuditLogs();
    fetchStripeConfig();
  };

  useEffect(() => {
    fetchAllData();

    // Load custom carousel images from localStorage
    const loaded: Record<number, string> = {};
    for (let i = 0; i < 4; i++) {
      const img = localStorage.getItem(`carousel_slide_${i}_img`);
      if (img) loaded[i] = img;
    }
    setSlideImages(loaded);
  }, []);

  // Fetchers
  const fetchMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setAdminUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error('Failed to load coupons:', e);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const res = await fetch('/api/admin/tickets');
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setIsLoadingAnnouncements(true);
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error('Failed to load announcements:', e);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchStripeConfig = async () => {
    try {
      const res = await fetch('/api/stripe/config');
      const data = await res.json();
      if (data.success) {
        setIsStripeActive(data.isConfigured);
        setIsStripeLive(data.isLive);
        if (data.publishableKey) setStripePublishableKey(data.publishableKey);
      }
    } catch (e) {}
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      setIsSubmittingUser(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          phone: newUserPhone.trim(),
          password: newUserPassword,
          plan: newUserPlan
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        fetchAdminUsers();
        fetchMetrics();
        fetchAuditLogs();
      } else {
        alert(data.error || 'Erro ao criar usuário');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateUserPlan = async () => {
    if (!editingUser) return;
    try {
      setIsUpdatingPlan(true);
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan })
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchAdminUsers();
        fetchMetrics();
        fetchAuditLogs();
      } else {
        alert(data.error || 'Erro ao atualizar plano');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${email}" e todas as suas marcas e postagens?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAdminUsers();
        fetchMetrics();
        fetchAuditLogs();
      } else {
        alert(data.error || 'Erro ao excluir usuário');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSimulate = (userItem: AdminUserItem) => {
    const fullUser: User = {
      id: userItem.id,
      name: userItem.name,
      email: userItem.email,
      phone: userItem.phone || '',
      createdAt: userItem.createdAt,
      plan: userItem.plan,
      isTeamMember: userItem.isTeamMember,
      invitedByUserId: userItem.invitedByUserId || undefined
    };
    onSimulateUser(fullUser);
  };

  // Coupons Actions
  const handleToggleCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/coupons/${couponId}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, isActive: data.isActive } : c));
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (couponId: string, code: string) => {
    if (!window.confirm(`Excluir cupom "${code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        setCouponAdminMsg({ type: 'success', text: `Cupom ${code} excluído.` });
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) return;

    try {
      setIsSavingCoupon(true);
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
          expiresAt: formExpiresAt || null,
          description: formDescription.trim() || null,
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateCouponModal(false);
        setFormCode('');
        setFormDiscountValue(20);
        setFormMaxUses('');
        setFormExpiresAt('');
        setFormDescription('');
        fetchCoupons();
        fetchAuditLogs();
      } else {
        alert(data.error || 'Erro ao criar cupom');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const copyPromoLink = (code: string) => {
    const origin = window.location.origin;
    const url = `${origin}/?cupom=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedCouponLink(code);
    setTimeout(() => setCopiedCouponLink(null), 2500);
  };

  // Support Tickets Actions
  const handleReplyTicket = async (ticketId: string) => {
    const msg = replyInput[ticketId]?.trim();
    if (!msg) return;

    try {
      setIsSubmittingReply(ticketId);
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, adminName: 'Suporte Oficial Planner' })
      });
      const data = await res.json();
      if (data.success) {
        setReplyInput(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(null);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
        fetchMetrics();
        fetchAuditLogs();
      }
    } catch (e) {}
  };

  // Announcements Actions
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      setIsSubmittingAnn(true);
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle.trim(),
          message: annMessage.trim(),
          type: annType,
          link: annLink.trim() || null,
          linkText: annLinkText.trim() || null,
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateAnnModal(false);
        setAnnTitle('');
        setAnnMessage('');
        setAnnLink('');
        setAnnLinkText('');
        fetchAnnouncements();
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      fetchAnnouncements();
      fetchAuditLogs();
    } catch (e) {}
  };

  // Stripe Settings Actions
  const handleSaveStripeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingStripe(true);
      setStripeAdminMsg(null);
      const res = await fetch('/api/stripe/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: stripeSecretKey.trim() || undefined,
          publishableKey: stripePublishableKey.trim() || undefined,
          webhookSecret: stripeWebhookSecret.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setStripeAdminMsg({ type: 'success', text: '✅ Configurações do Stripe salvas com sucesso!' });
        setIsStripeActive(true);
        setIsStripeLive(data.isLive);
        fetchAuditLogs();
      } else {
        setStripeAdminMsg({ type: 'error', text: data.error || 'Erro ao salvar Stripe' });
      }
    } catch (err: any) {
      setStripeAdminMsg({ type: 'error', text: err.message });
    } finally {
      setIsSavingStripe(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setWebhookTestResult('loading');
      const res = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'checkout.session.completed',
          email: webhookTestEmail,
          plan: webhookTestPlan
        })
      });
      const data = await res.json();
      setWebhookTestResult(data);
      fetchAdminUsers();
      fetchMetrics();
      fetchAuditLogs();
    } catch (err: any) {
      setWebhookTestResult({ error: err.message });
    }
  };

  // Carousel Uploads
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        localStorage.setItem(`carousel_slide_${index}_img`, base64);
        setSlideImages(prev => ({ ...prev, [index]: base64 }));
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
  };

  // Filtered Users
  const filteredUsers = adminUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;
    return matchesSearch && matchesPlan;
  });

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  // Login screen if logged out
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-accent-purple selection:text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-panel-card border border-panel-border rounded-3xl p-8 shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-purple to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-accent-purple/20">
              <Shield size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white">Painel Master Admin</h2>
            <p className="text-xs text-zinc-400">Entre com as credenciais administrativas do SaaS</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const correctEmail = envAdminEmail || 'admin@planner.com';
            const correctPass = envAdminPassword || 'admin123';
            if (adminEmail.trim().toLowerCase() === correctEmail.toLowerCase() && adminPassword === correctPass) {
              setIsAdminLoggedIn(true);
              setLoginError('');
            } else {
              setLoginError('Credenciais administrativas inválidas.');
            }
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">E-mail Administrativo</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@planner.com"
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent-purple"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Senha Master</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent-purple"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30 text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white font-bold text-sm transition-all shadow-lg shadow-accent-purple/20 cursor-pointer"
            >
              Acessar Painel
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="w-full text-center text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Voltar ao aplicativo</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-accent-purple selection:text-white">
      
      {/* 1. TOP MASTER BAR */}
      <header className="border-b border-panel-border/70 bg-zinc-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-purple to-pink-500 flex items-center justify-center shadow-md shadow-accent-purple/20 shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-extrabold text-white tracking-tight">
                Painel Master SaaS
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                PROD v2.6
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Gestão Centralizada de Finanças, Usuários, Cupons e Infraestrutura
            </p>
          </div>
        </div>

        {/* System Health Indicators & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Badges */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-950/80 border border-panel-border px-3 py-1.5 rounded-xl text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SQLite DB: <strong className="text-white">OK</strong>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isStripeActive ? (isStripeLive ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-zinc-600'}`} />
              Stripe: <strong className="text-white">{isStripeActive ? (isStripeLive ? 'LIVE' : 'TEST') : 'OFF'}</strong>
            </span>
          </div>

          <button
            onClick={fetchAllData}
            title="Atualizar dados agora"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-panel-border transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoadingMetrics ? 'animate-spin text-accent-purple' : ''} />
          </button>

          <a
            href="/api/admin/export/users"
            download
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-panel-border text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </a>

          <button
            onClick={onBackToApp}
            className="px-3.5 py-1.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Voltar ao App</span>
          </button>

          <button
            onClick={() => setIsAdminLoggedIn(false)}
            title="Sair do painel"
            className="p-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. NAVIGATION TABS BAR */}
      <div className="bg-zinc-900/60 border-b border-panel-border/60 px-4 sm:px-8 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {[
          { id: 'overview' as const, label: 'Visão Geral & Finanças', icon: BarChart2 },
          { id: 'users' as const, label: `Usuários (${metrics.totalUsers || adminUsers.length})`, icon: Users },
          { id: 'coupons' as const, label: `Cupons (${coupons.length})`, icon: Ticket },
          { id: 'stripe' as const, label: 'Stripe & Faturamento', icon: CreditCard },
          { id: 'tickets' as const, label: `Suporte (${metrics.openTickets || 0} abertos)`, icon: LifeBuoy },
          { id: 'announcements' as const, label: 'Avisos Globais', icon: Megaphone },
          { id: 'carousel' as const, label: 'Landing Page', icon: Smartphone },
          { id: 'audit' as const, label: 'Auditoria & Logs', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: OVERVIEW & SAAS METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* MRR Card */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign size={48} className="text-emerald-400" />
                </div>
                <p className="text-[11px] font-mono font-bold uppercase text-zinc-400 flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-400" />
                  MRR (Receita Recorrente)
                </p>
                <h3 className="text-3xl font-display font-extrabold text-white mt-2">
                  R$ {metrics.mrrBrl?.toFixed(2).replace('.', ',') || '0,00'}
                  <span className="text-xs text-zinc-400 font-normal ml-1">/mês</span>
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-panel-border/50">
                  <span>ARR Estimado:</span>
                  <strong className="text-emerald-400 font-mono">R$ {metrics.arrBrl?.toFixed(2).replace('.', ',') || '0,00'}</strong>
                </div>
              </div>

              {/* Total Users & Conversion */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={48} className="text-accent-purple" />
                </div>
                <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                  Criadores & Assinantes
                </p>
                <h3 className="text-3xl font-display font-extrabold text-white mt-2">
                  {metrics.totalUsers || adminUsers.length}
                  <span className="text-xs text-zinc-400 font-normal ml-1.5">contas</span>
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-panel-border/50">
                  <span>Taxa de Conversão:</span>
                  <strong className="text-accent-purple font-mono">{metrics.conversionRate || '0'}% ({metrics.paidUsersCount || 0} pagantes)</strong>
                </div>
              </div>

              {/* Total Managed Channels */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Layers size={48} className="text-accent-orange" />
                </div>
                <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                  Planners & Marcas Ativas
                </p>
                <h3 className="text-3xl font-display font-extrabold text-white mt-2">
                  {metrics.totalClients || 0}
                  <span className="text-xs text-zinc-400 font-normal ml-1.5">canais</span>
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-panel-border/50">
                  <span>Média por Criador:</span>
                  <strong className="text-white font-mono">
                    {metrics.totalUsers > 0 ? ((metrics.totalClients || 0) / metrics.totalUsers).toFixed(1) : '1.0'} marcas
                  </strong>
                </div>
              </div>

              {/* Total Posts in Funnel */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <LayoutGrid size={48} className="text-pink-500" />
                </div>
                <p className="text-[11px] font-mono font-bold uppercase text-zinc-400">
                  Posts & Roteiros Agendados
                </p>
                <h3 className="text-3xl font-display font-extrabold text-white mt-2">
                  {metrics.totalPosts || 0}
                  <span className="text-xs text-zinc-400 font-normal ml-1.5">peças</span>
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-panel-border/50">
                  <span>Chamados de Suporte:</span>
                  <strong className={`${metrics.openTickets > 0 ? 'text-amber-400' : 'text-zinc-400'} font-mono`}>
                    {metrics.openTickets || 0} pendentes
                  </strong>
                </div>
              </div>

            </div>

            {/* Growth Chart & Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* User Growth Chart (2 cols) */}
              <div className="lg:col-span-2 bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-panel-border/60 pb-4">
                  <div>
                    <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      <BarChart2 size={16} className="text-accent-purple" />
                      Crescimento de Cadastros (Últimos 14 Dias)
                    </h4>
                    <p className="text-[11px] text-zinc-400">Novos criadores e agências ingressando diariamente na plataforma</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-panel-border text-[10px] font-mono text-zinc-400">
                    Tempo Real
                  </span>
                </div>

                <div className="w-full h-[240px] pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.dailyGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} dx={-8} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="users" name="Novos Usuários" fill="url(#growthGradient)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan Distribution (1 col) */}
              <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-display font-bold text-white flex items-center gap-2 border-b border-panel-border/60 pb-4">
                    <Percent size={16} className="text-emerald-400" />
                    Distribuição por Plano
                  </h4>

                  <div className="space-y-3 mt-4">
                    {[
                      { name: 'Growth PRO', key: 'growth', price: 'R$ 79,00/mês', color: 'bg-pink-500', count: metrics.planDistribution?.growth || 0 },
                      { name: 'Pro Creator', key: 'pro', price: 'R$ 49,00/mês', color: 'bg-accent-purple', count: metrics.planDistribution?.pro || 0 },
                      { name: 'Basic', key: 'basic', price: 'R$ 29,00/mês', color: 'bg-blue-500', count: metrics.planDistribution?.basic || 0 },
                      { name: 'Starter', key: 'starter', price: 'R$ 14,99/mês', color: 'bg-emerald-500', count: metrics.planDistribution?.starter || 0 },
                      { name: 'Plano Grátis', key: 'free', price: 'R$ 0,00', color: 'bg-zinc-600', count: metrics.planDistribution?.free || 0 },
                    ].map((p) => {
                      const total = metrics.totalUsers || 1;
                      const percent = Math.round((p.count / total) * 100);
                      return (
                        <div key={p.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">{p.name}</span>
                            <span className="font-mono text-zinc-400">{p.count} ({percent}%)</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <div className={`h-full ${p.color}`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/80 border border-panel-border rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Base Ativa:</span>
                    <strong className="text-white">{metrics.totalUsers || 0} contas</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Assinaturas Pagas:</span>
                    <strong className="text-emerald-400">{metrics.paidUsersCount || 0} clientes</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: USERS DIRECTORY & MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-panel-card border border-panel-border rounded-2xl p-4 shadow-lg">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou ID..."
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  className="bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent-purple cursor-pointer"
                >
                  <option value="all">Todos os Planos</option>
                  <option value="free">Gratuito</option>
                  <option value="starter">Starter</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="growth">Growth PRO</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-panel-card border border-panel-border rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 border-b border-panel-border text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Contato</th>
                      <th className="py-3 px-4">Plano Atual</th>
                      <th className="py-3 px-4 text-center">Marcas</th>
                      <th className="py-3 px-4 text-center">Posts</th>
                      <th className="py-3 px-4">Cadastro</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel-border/50 text-zinc-300">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          <RefreshCw size={18} className="animate-spin text-accent-purple mx-auto mb-2" />
                          Carregando usuários do sistema...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          Nenhum usuário encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const planColors: Record<string, string> = {
                          growth: 'bg-pink-950/60 text-pink-300 border-pink-500/40',
                          pro: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
                          basic: 'bg-blue-950/60 text-blue-300 border-blue-500/40',
                          starter: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
                          free: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                        };

                        return (
                          <tr key={u.id} className="hover:bg-zinc-900/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-purple to-pink-500 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                                  {u.name ? u.name.charAt(0) : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">{u.name || 'Sem Nome'}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono truncate">{u.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <p className="text-zinc-200">{u.email}</p>
                              {u.phone && (
                                <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                  <Phone size={10} />
                                  {u.phone}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${planColors[u.plan] || planColors.free}`}>
                                {u.plan || 'FREE'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold text-zinc-200">
                              {u.clientCount || 0}
                            </td>

                            <td className="py-3 px-4 text-center font-mono font-bold text-zinc-200">
                              {u.postCount || 0}
                            </td>

                            <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                              {u.createdAt ? u.createdAt.split('T')[0] : 'N/A'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSimulate(u)}
                                  title="Simular Acesso / Entrar na conta do usuário"
                                  className="px-2.5 py-1 rounded-lg bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple border border-accent-purple/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>Acessar</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingUser(u);
                                    setTargetPlan(u.plan as any);
                                  }}
                                  title="Alterar Plano"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-panel-border transition-all cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="Excluir Usuário"
                                  className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: COUPONS ENGINE */}
        {activeTab === 'coupons' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Ticket size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Central de Cupons Promocionais</h3>
                  <p className="text-xs text-zinc-400">Crie campanhas com desconto percentual ou valor fixo para aumentar a conversão de vendas</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateCouponModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Criar Novo Cupom</span>
              </button>
            </div>

            {couponAdminMsg && (
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                couponAdminMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}>
                <span>{couponAdminMsg.text}</span>
                <button onClick={() => setCouponAdminMsg(null)}><X size={14} /></button>
              </div>
            )}

            {/* Coupons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((cp) => {
                const isExpired = cp.expiresAt && new Date() > new Date(cp.expiresAt + 'T23:59:59');
                const isLimitReached = cp.maxUses && cp.usedCount >= cp.maxUses;

                return (
                  <div
                    key={cp.id}
                    className={`bg-panel-card border rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-4 transition-all ${
                      !cp.isActive || isExpired || isLimitReached
                        ? 'border-panel-border/50 opacity-70'
                        : 'border-panel-border hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-zinc-950 border border-panel-border text-sm font-mono font-extrabold text-emerald-400 uppercase tracking-wider">
                          {cp.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {cp.discountType === 'percent' ? `${cp.discountValue}% OFF` : `R$ ${cp.discountValue.toFixed(2)} OFF`}
                        </span>
                      </div>

                      {cp.description && (
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium">{cp.description}</p>
                      )}

                      <div className="space-y-1 pt-2 border-t border-panel-border/40 text-[11px] font-mono text-zinc-400">
                        <div className="flex justify-between">
                          <span>Utilizações:</span>
                          <strong className="text-white">{cp.usedCount} {cp.maxUses ? `/ ${cp.maxUses}` : '(Ilimitado)'}</strong>
                        </div>
                        {cp.expiresAt && (
                          <div className="flex justify-between">
                            <span>Validade:</span>
                            <strong className="text-zinc-300">{cp.expiresAt}</strong>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span>Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            cp.isActive && !isExpired && !isLimitReached
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {cp.isActive ? (isExpired ? 'Expirado' : isLimitReached ? 'Esgotado' : 'Ativo') : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-panel-border/40">
                      <button
                        onClick={() => copyPromoLink(cp.code)}
                        className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-panel-border text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedCouponLink === cp.code ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleCoupon(cp.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          cp.isActive
                            ? 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-950/60'
                            : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/60'
                        }`}
                      >
                        {cp.isActive ? 'Desativar' : 'Ativar'}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(cp.id, cp.code)}
                        className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: STRIPE & BILLING SETTINGS */}
        {activeTab === 'stripe' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-panel-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Configuração do Gateway Stripe</h3>
                    <p className="text-xs text-zinc-400">Insira suas chaves de API da Stripe para processar pagamentos reais com cartão de crédito e checkout seguro</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowWebhookTestModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-panel-border text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity size={14} className="text-accent-purple" />
                  <span>Testar Webhook</span>
                </button>
              </div>

              {stripeAdminMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  stripeAdminMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}>
                  <span>{stripeAdminMsg.text}</span>
                  <button onClick={() => setStripeAdminMsg(null)}><X size={14} /></button>
                </div>
              )}

              <form onSubmit={handleSaveStripeConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-300">
                    Stripe Secret Key (sk_test_... ou sk_live_...) *
                  </label>
                  <input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="sk_test_51Pxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-purple"
                  />
                  <p className="text-[10px] text-zinc-500">Obtida em Stripe Dashboard &gt; Desenvolvedores &gt; Chaves de API.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase text-zinc-300">
                      Stripe Publishable Key (pk_test_... ou pk_live_...)
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_test_51Pxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-purple"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase text-zinc-300">
                      Stripe Webhook Secret (whsec_...)
                    </label>
                    <input
                      type="password"
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      placeholder="whsec_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-accent-purple"
                    />
                  </div>
                </div>

                {/* Webhook Endpoint Info */}
                <div className="p-4 bg-zinc-950/80 border border-panel-border rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Endpoint para Webhooks no Stripe:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/api/stripe/webhook`;
                        navigator.clipboard.writeText(url);
                        setCopiedWebhookUrl(true);
                        setTimeout(() => setCopiedWebhookUrl(false), 2000);
                      }}
                      className="text-[11px] text-accent-purple hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedWebhookUrl ? <Check size={12} /> : <Copy size={12} />}
                      {copiedWebhookUrl ? 'URL Copiada!' : 'Copiar URL'}
                    </button>
                  </div>
                  <code className="block p-2 bg-zinc-900 rounded-lg text-xs font-mono text-emerald-400 select-all break-all">
                    {window.location.origin}/api/stripe/webhook
                  </code>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingStripe}
                    className="px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingStripe ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT & HELPDESK TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-panel-card border border-panel-border rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <LifeBuoy size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Central de Chamados de Suporte</h3>
                  <p className="text-xs text-zinc-400">Responda dúvidas e solicitações enviadas diretamente pelos clientes</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(['all', 'aberto', 'em_andamento', 'resolvido'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
                      ticketFilter === st
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {isLoadingTickets ? (
                <div className="py-12 text-center text-zinc-500">
                  <RefreshCw size={18} className="animate-spin text-accent-purple mx-auto mb-2" />
                  Carregando chamados...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 bg-panel-card border border-panel-border rounded-2xl">
                  Nenhum chamado de suporte encontrado.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const statusColors: Record<string, string> = {
                    aberto: 'bg-amber-950 text-amber-300 border-amber-500/30',
                    em_andamento: 'bg-blue-950 text-blue-300 border-blue-500/30',
                    resolvido: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
                    fechado: 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  };

                  return (
                    <div key={t.id} className="bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-panel-border/50 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-accent-purple font-bold">#{t.id}</span>
                            <h4 className="font-bold text-white text-sm">{t.subject || t.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${statusColors[t.status] || statusColors.aberto}`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Por: <strong className="text-zinc-200">{t.userName || 'Cliente'}</strong> ({t.userEmail}) • {t.createdAt?.split('T')[0]}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                            className="bg-zinc-950 border border-panel-border rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                          >
                            <option value="aberto">Aberto</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="resolvido">Resolvido</option>
                            <option value="fechado">Fechado</option>
                          </select>
                        </div>
                      </div>

                      {/* Ticket Message */}
                      <p className="text-xs text-zinc-200 bg-zinc-950/60 p-3 rounded-xl border border-panel-border/50 leading-relaxed whitespace-pre-wrap">
                        {t.message || t.description}
                      </p>

                      {/* Replies History */}
                      {t.replies && t.replies.length > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-accent-purple/30">
                          {t.replies.map((rep: any) => (
                            <div key={rep.id} className="p-3 bg-zinc-900/80 rounded-xl border border-panel-border/60 text-xs space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                <span className="font-bold text-accent-purple">{rep.author}</span>
                                <span>{rep.createdAt?.split('T')[0]}</span>
                              </div>
                              <p className="text-zinc-200">{rep.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={replyInput[t.id] || ''}
                          onChange={(e) => setReplyInput(prev => ({ ...prev, [t.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleReplyTicket(t.id);
                            }
                          }}
                          placeholder="Digite sua resposta técnica..."
                          className="flex-1 bg-zinc-950 border border-panel-border rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent-purple"
                        />
                        <button
                          onClick={() => handleReplyTicket(t.id)}
                          disabled={isSubmittingReply === t.id || !replyInput[t.id]?.trim()}
                          className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          <Send size={12} />
                          <span>Responder</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GLOBAL ANNOUNCEMENTS / BROADCAST BANNER */}
        {activeTab === 'announcements' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-panel-card border border-panel-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Comunicados & Banners Globais</h3>
                  <p className="text-xs text-zinc-400">Envie avisos de novas features, novidades ou manutenções que aparecem no topo do app para todos os usuários</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateAnnModal(true)}
                className="px-4 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Novo Comunicado</span>
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-panel-card border border-panel-border rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ann.type === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                      }`}>
                        {ann.type}
                      </span>
                      <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                    </div>
                    <p className="text-xs text-zinc-300">{ann.message}</p>
                    {ann.link && (
                      <a href={ann.link} target="_blank" rel="noreferrer" className="text-[11px] text-accent-purple hover:underline flex items-center gap-1">
                        <span>{ann.linkText || 'Ver detalhes'}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: LANDING PAGE CAROUSEL CUSTOMIZER */}
        {activeTab === 'carousel' && (
          <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-panel-border/60 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone size={18} className="text-accent-purple" />
                Personalizador de Telas da Landing Page
              </h3>
              <p className="text-xs text-zinc-400">Suba imagens personalizadas para substituir os layouts interativos padrão do carrossel da tela inicial.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 0, label: 'Slide 1: Funil Kanban', desc: 'Substitui o painel de fluxo de postagens por colunas.' },
                { id: 1, label: 'Slide 2: Calendário Editorial', desc: 'Substitui a grade de datas e frequências semanais.' },
                { id: 2, label: 'Slide 3: Metas & Performance', desc: 'Substitui a visualização de metas e barras de progresso.' },
                { id: 3, label: 'Slide 4: Colaboração de Equipe', desc: 'Substitui o painel de membros e convites.' }
              ].map((slide) => {
                const customImg = slideImages[slide.id];
                return (
                  <div key={slide.id} className="bg-zinc-900/50 border border-panel-border rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-accent-purple">{slide.label}</span>
                      <p className="text-[10px] text-zinc-400">{slide.desc}</p>
                    </div>

                    <div className="aspect-[16/10] bg-zinc-950 rounded-lg border border-panel-border flex items-center justify-center overflow-hidden">
                      {customImg ? (
                        <img src={customImg} alt={slide.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-3 select-none">
                          <span className="block text-[10px] font-mono text-emerald-400 font-bold uppercase">Layout Padrão</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="w-full py-2 rounded-xl text-center text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-panel-border transition-all cursor-pointer flex items-center justify-center gap-1.5">
                        <Plus size={12} />
                        {customImg ? 'Alterar Imagem' : 'Subir Imagem'}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(slide.id, e)} className="hidden" />
                      </label>
                      {customImg && (
                        <button
                          onClick={() => handleRemoveImage(slide.id)}
                          className="w-full py-1.5 rounded-xl text-center text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          Restaurar Padrão
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT TRAIL & SYSTEM LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-panel-card border border-panel-border rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-panel-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <Terminal size={18} className="text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Logs de Auditoria & Segurança</h3>
                  <p className="text-xs text-zinc-400">Histórico de ações administrativas, alterações de planos e eventos em tempo real</p>
                </div>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 font-mono text-xs space-y-2 max-h-[480px] overflow-y-auto border border-panel-border">
              {auditLogs.length === 0 ? (
                <p className="text-zinc-600">Nenhum log registrado até o momento.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-900 pb-2">
                    <div className="space-x-2">
                      <span className="text-emerald-400 font-bold">[{log.action}]</span>
                      <span className="text-zinc-300">{log.details}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* 4. MODALS */}
      {/* ========================================== */}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-panel-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus size={16} className="text-accent-purple" />
                Cadastrar Usuário Manualmente
              </h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Carlos Creator"
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="carlos@exemplo.com"
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300">WhatsApp</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300">Plano Inicial</label>
                  <select
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                  >
                    <option value="free">Gratuito</option>
                    <option value="starter">Starter</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro Creator</option>
                    <option value="growth">Growth PRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Senha Inicial</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-panel-border">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20"
                >
                  {isSubmittingUser ? 'Criando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER PLAN MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-panel-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={16} className="text-accent-purple" />
                Alterar Plano do Cliente
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Usuário: <strong className="text-white">{editingUser.name}</strong></p>
              <p className="text-xs text-zinc-400">E-mail: <strong className="text-white">{editingUser.email}</strong></p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Novo Plano</label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as any)}
                className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
              >
                <option value="free">Gratuito</option>
                <option value="starter">Starter (R$ 14,99/mês)</option>
                <option value="basic">Basic (R$ 29,00/mês)</option>
                <option value="pro">Pro Creator (R$ 49,00/mês)</option>
                <option value="growth">Growth PRO (R$ 79,00/mês)</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-panel-border">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUserPlan}
                disabled={isUpdatingPlan}
                className="px-5 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20"
              >
                {isUpdatingPlan ? 'Salvando...' : 'Salvar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-panel-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ticket size={18} className="text-emerald-400" />
                Criar Novo Cupom de Desconto
              </h3>
              <button onClick={() => setShowCreateCouponModal(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold uppercase text-zinc-300">Código do Cupom *</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Ex: LANCA20, BLACK50, VIP100"
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">Tipo</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="percent">Porcentagem (% OFF)</option>
                    <option value="fixed">Valor Fixo (R$ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">Valor do Desconto *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">Limite de Usos (Opcional)</label>
                  <input
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">Validade Até (Opcional)</label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold uppercase text-zinc-300">Descrição / Nota Interna</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Campanha Especial de Lançamento"
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-panel-border">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCoupon}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {isSavingCoupon ? 'Salvando...' : 'Criar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showCreateAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-panel-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone size={18} className="text-amber-400" />
                Criar Comunicado Global
              </h3>
              <button onClick={() => setShowCreateAnnModal(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">Título do Aviso *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Ex: 🚀 Nova Feature: Gerador de Carrossel IA!"
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Mensagem *</label>
                <textarea
                  required
                  rows={3}
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Descreva a novidade ou comunicado para os usuários..."
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300">Link Opcional</label>
                  <input
                    type="url"
                    value={annLink}
                    onChange={(e) => setAnnLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300">Texto do Botão</label>
                  <input
                    type="text"
                    value={annLinkText}
                    onChange={(e) => setAnnLinkText(e.target.value)}
                    placeholder="Ex: Conhecer Agora"
                    className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-panel-border">
                <button
                  type="button"
                  onClick={() => setShowCreateAnnModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnn}
                  className="px-5 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20"
                >
                  {isSubmittingAnn ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WEBHOOK SIMULATOR MODAL */}
      {showWebhookTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-panel-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-accent-purple" />
                Simulador de Webhook Stripe
              </h3>
              <button onClick={() => setShowWebhookTestModal(false)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
            </div>

            <p className="text-xs text-zinc-400">
              Dispare um evento simulado de pagamento confirmado para testar a ativação automática de planos no banco de dados.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300">E-mail do Cliente</label>
                <input
                  type="email"
                  value={webhookTestEmail}
                  onChange={(e) => setWebhookTestEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Plano Comprado</label>
                <select
                  value={webhookTestPlan}
                  onChange={(e) => setWebhookTestPlan(e.target.value)}
                  className="w-full bg-zinc-950 border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-purple"
                >
                  <option value="starter">Starter</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro Creator</option>
                  <option value="growth">Growth PRO</option>
                </select>
              </div>

              {webhookTestResult && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-panel-border text-xs font-mono text-emerald-400">
                  {webhookTestResult === 'loading' ? 'Processando simulação...' : JSON.stringify(webhookTestResult, null, 2)}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-panel-border">
              <button
                onClick={() => setShowWebhookTestModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                onClick={handleTestWebhook}
                className="px-5 py-2 rounded-xl bg-accent-purple hover:bg-accent-purple/90 text-white text-xs font-bold transition-all shadow-md shadow-accent-purple/20"
              >
                Disparar Teste
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
