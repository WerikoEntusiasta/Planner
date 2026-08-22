import React, { useState, useEffect } from 'react';
import { Post, Client, User, Platform } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  Calendar, Clock, Send, Share2, Instagram, Facebook, Globe, KeyRound, 
  Check, X, RefreshCw, AlertTriangle, ShieldCheck, Plus, Edit3, Trash2, ExternalLink, Sparkles
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  provider: string;
  name: string;
  username: string;
  expiresAt: string;
  status: string;
}

interface SchedulingHubViewProps {
  posts: Post[];
  currentUser?: User | null;
  activeClient?: Client;
  onUpdatePost: (post: Post) => void;
  onAddPost: (post: Post) => void;
  onDeletePost?: (id: string) => void;
}

export default function SchedulingHubView({
  posts,
  currentUser,
  activeClient,
  onUpdatePost,
  onAddPost,
  onDeletePost
}: SchedulingHubViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'integrations' | 'history'>('scheduled');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [creativesHubList, setCreativesHubList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('creator_planner_creatives');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated scheduling modal state (for scheduling & publishing directly without opening script editor)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form fields for scheduling modal
  const [modalTitle, setModalTitle] = useState('');
  const [modalPlatform, setModalPlatform] = useState<Platform>('instagram');
  const [modalAccountId, setModalAccountId] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalTime, setModalTime] = useState('12:00');
  const [modalDescription, setModalDescription] = useState('');
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [modalIsPublishing, setModalIsPublishing] = useState(false);

  const userId = currentUser?.id || 'demo_user';

  const fetchAccounts = async () => {
    if (!userId) return;
    setIsLoadingAccounts(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch('/api/connected-accounts', {
        headers: {
          'x-user-id': userId,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [userId]);

  // Listen to OAuth success message from popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') && 
        !origin.includes('localhost') && 
        origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setStatusMessage({
          type: 'success',
          text: `Sucesso! Conta "${event.data.accountName || 'Instagram'}" integrada com sucesso para agendamento automático.`
        });
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [userId]);

  const handleConnectFacebook = async () => {
    try {
      setIsLoadingAccounts(true);
      setStatusMessage(null);
      
      const res = await fetch(`/api/auth/facebook/url?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Erro ao gerar URL do OAuth do Facebook.');
      }

      const popupWidth = 600;
      const popupHeight = 750;
      let left = 100;
      let top = 100;
      try {
        if (window.top) {
          left = (window.top.outerWidth / 2) + (window.top.screenX || 0) - (popupWidth / 2);
          top = (window.top.outerHeight / 2) + (window.top.screenY || 0) - (popupHeight / 2);
        }
      } catch (e) {
        left = (window.innerWidth / 2) - (popupWidth / 2);
        top = (window.innerHeight / 2) - (popupHeight / 2);
      }

      const authWindow = window.open(
        data.url,
        'fb_oauth_popup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        setStatusMessage({
          type: 'error',
          text: 'O bloqueador de pop-ups impediu a janela de conexão. Por favor, libere pop-ups para este site.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro inesperado ao conectar ao Facebook.'
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Deseja realmente desconectar esta conta? Os agendamentos automáticos para este canal serão pausados.')) {
      return;
    }
    try {
      setIsLoadingAccounts(true);
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch(`/api/connected-accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Conta desconectada com sucesso.' });
        fetchAccounts();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erro ao desconectar conta.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao desconectar.' });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const openNewSchedulingModal = () => {
    setEditingPost(null);
    setModalTitle('');
    setModalPlatform('instagram');
    setModalAccountId(accounts[0]?.id || '');
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalTime('12:00');
    setModalDescription('');
    setModalMediaUrl('');
    setIsModalOpen(true);
  };

  const openEditSchedulingModal = (post: Post) => {
    setEditingPost(post);
    setModalTitle(post.title || '');
    setModalPlatform(post.platform || 'instagram');
    setModalAccountId(post.connectedAccountId || accounts[0]?.id || '');
    setModalDate(post.scheduledDate || new Date().toISOString().split('T')[0]);
    setModalTime(post.scheduledTime || '12:00');
    setModalDescription(post.description || '');
    setModalMediaUrl(post.coverThumbnail || '');
    setIsModalOpen(true);
  };

  const handleSaveScheduling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      alert('Por favor, informe o título ou legenda principal do post.');
      return;
    }

    if (editingPost) {
      const updated: Post = {
        ...editingPost,
        title: modalTitle,
        platform: modalPlatform,
        connectedAccountId: modalAccountId,
        scheduledDate: modalDate,
        scheduledTime: modalTime,
        description: modalDescription,
        coverThumbnail: modalMediaUrl,
        status: 'scheduled'
      };
      onUpdatePost(updated);
      setStatusMessage({ type: 'success', text: 'Agendamento atualizado com sucesso!' });
    } else {
      const newPost: Post = {
        id: 'post_' + Math.random().toString(36).substr(2, 9),
        title: modalTitle,
        description: modalDescription,
        platform: modalPlatform,
        format: 'reels',
        funnelStage: 'TOFU',
        status: 'scheduled',
        scheduledDate: modalDate,
        scheduledTime: modalTime,
        connectedAccountId: modalAccountId,
        coverThumbnail: modalMediaUrl,
        clientId: activeClient?.id || 'client_1'
      };
      onAddPost(newPost);
      setStatusMessage({ type: 'success', text: 'Novo post agendado com sucesso!' });
    }
    setIsModalOpen(false);
  };

  const handlePublishNow = async (post: Post) => {
    if (!post.connectedAccountId) {
      alert('Vincule uma conta Meta OAuth a este post antes de disparar automaticamente.');
      setActiveTab('integrations');
      return;
    }

    if (!confirm(`Deseja disparar "${post.title}" agora para a rede social conectada?`)) {
      return;
    }

    setModalIsPublishing(true);
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const res = await fetch('/api/publish-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          postId: post.id,
          connectedAccountId: post.connectedAccountId,
          caption: `${post.title}\n\n${post.description || ''}`,
          mediaUrl: post.coverThumbnail || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Post publicado com sucesso na rede social oficial!' });
        const updated: Post = { ...post, status: 'published' };
        onUpdatePost(updated);
      } else {
        throw new Error(data.error || 'Erro ao disparar publicação na API da Meta.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao publicar post automaticamente.' });
    } finally {
      setModalIsPublishing(false);
    }
  };

  // Filter posts for scheduling
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HERO BANNER */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-panel-card via-zinc-900 to-panel-card border border-panel-border overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              <span>Central de Agendamento & Integrações</span>
            </span>
            <span className="text-xs font-mono text-zinc-400">Marca: <strong className="text-white">{activeClient?.name || 'Geral'}</strong></span>
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Agendamento de Posts & Publicação Automática
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Gerencie o calendário de disparos, conecte suas contas oficiais do Instagram e Facebook via Meta Graph API e automatize a entrega de conteúdo sem esforço manual.
          </p>
        </div>
        
        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={openNewSchedulingModal}
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c4dff] text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-900/50 text-rose-300'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* VIEW TABS */}
      <div className="flex items-center gap-2 border-b border-panel-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'scheduled'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <Clock size={14} />
          <span>Posts Agendados ({scheduledPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'integrations'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <Share2 size={14} />
          <span>Contas & Integração Redes Sociais ({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-panel-card text-zinc-400 hover:text-white border border-panel-border'
          }`}
        >
          <Send size={14} />
          <span>Histórico Publicados ({publishedPosts.length})</span>
        </button>
      </div>

      {/* TAB 1: SCHEDULED POSTS */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fila de Disparos Programados</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Conteúdos aguardando a data e horário para publicação automática ou manual</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-panel-border">
              {scheduledPosts.length} agendados
            </span>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-panel-card border border-panel-border space-y-3">
              <Clock size={32} className="mx-auto text-zinc-600" />
              <h4 className="text-sm font-semibold text-white">Nenhum post agendado no momento</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Clique no botão abaixo para programar a data, horário e conta de publicação.
              </p>
              <button
                onClick={openNewSchedulingModal}
                className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Agendar Primeiro Post</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledPosts.map(post => (
                <div key={post.id} className="p-4 rounded-2xl bg-panel-card border border-panel-border hover:border-accent-purple/50 transition-all flex flex-col justify-between space-y-3 shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-bold">
                        {post.platform}
                      </span>
                      <span className="text-zinc-400">
                        {post.scheduledDate || 'Sem data'} {post.scheduledTime ? `às ${post.scheduledTime}` : ''}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-2">
                      {post.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 line-clamp-2">
                      {post.description || 'Sem legenda cadastrada.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-panel-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>{post.connectedAccountId ? 'Vinculado OAuth' : 'Manual'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.connectedAccountId && (
                        <button
                          onClick={() => handlePublishNow(post)}
                          disabled={modalIsPublishing}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-500/30"
                          title="Publicar agora via Meta API"
                        >
                          <Send size={12} />
                          <span>Disparar</span>
                        </button>
                      )}
                      <button
                        onClick={() => openEditSchedulingModal(post)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-panel-border"
                      >
                        <Edit3 size={12} />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA INTEGRATIONS (META OAUTH & CONNECTED ACCOUNTS) */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-panel-card to-zinc-900 border border-panel-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 size={16} className="text-accent-purple" />
                Conexão Oficial com Meta Graph API (Instagram & Facebook)
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                Conecte a Página do Facebook vinculada ao perfil comercial do Instagram para habilitar o disparo automático dos posts aprovados diretamente pela plataforma.
              </p>
            </div>
            <button
              onClick={handleConnectFacebook}
              disabled={isLoadingAccounts}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLoadingAccounts ? <RefreshCw size={14} className="animate-spin" /> : <Facebook size={14} />}
              <span>Conectar Nova Conta Meta</span>
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Contas Conectadas no Workspace</h4>
            
            {accounts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-panel-card border border-panel-border space-y-3">
                <Instagram size={28} className="mx-auto text-zinc-600" />
                <h5 className="text-xs font-semibold text-white">Nenhuma conta conectada ainda</h5>
                <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                  Clique no botão acima para autenticar com sua conta do Facebook/Instagram e vincular os canais de publicação.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-4 rounded-xl bg-panel-card border border-panel-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        {acc.provider === 'instagram' ? <Instagram size={18} /> : <Facebook size={18} />}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{acc.name}</h5>
                        <p className="text-[10px] font-mono text-zinc-400">@{acc.username} • <span className="text-emerald-400">Ativo</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(acc.id)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Desconectar conta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PUBLISHED HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Publicados</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Conteúdos que já foram publicados com sucesso nas redes sociais</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-panel-border">
              {publishedPosts.length} publicados
            </span>
          </div>

          {publishedPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-panel-card border border-panel-border space-y-2">
              <Send size={28} className="mx-auto text-zinc-600" />
              <h4 className="text-xs font-semibold text-white">Nenhum post publicado recentemente</h4>
              <p className="text-[11px] text-zinc-400">Os posts marcados como publicados aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedPosts.map(post => (
                <div key={post.id} className="p-4 rounded-2xl bg-panel-card border border-panel-border flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono uppercase font-bold">
                      Publicado
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2 mt-2">{post.title}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{post.description}</p>
                  </div>
                  <div className="pt-2 border-t border-panel-border/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>{post.platform}</span>
                    <span className="text-emerald-400">No ar</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DEDICATED SCHEDULING MODAL (Direct scheduling & auto-publish setup without script editor) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-panel-card border border-panel-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-panel-border flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent-purple" />
                <h3 className="text-sm font-bold text-white">
                  {editingPost ? 'Editar Agendamento' : 'Novo Agendamento Direto'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800/50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveScheduling} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick import from Creative Hub */}
              {!editingPost && (
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Puxar Post pronto da Central de Criativos</span>
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">{creativesHubList.length} criativos</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const creative = creativesHubList.find((c: any) => c.id === selectedId);
                      if (creative) {
                        setModalTitle(creative.title || '');
                        setModalDescription(creative.caption || creative.description || '');
                        if (creative.platform) setModalPlatform(creative.platform as Platform);
                        const assetUrl = creative.assets?.[0]?.url || creative.url || creative.thumbnail;
                        if (assetUrl) {
                          setModalMediaUrl(assetUrl);
                        }
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-purple-500/40 text-white text-xs focus:outline-none focus:border-accent-purple"
                  >
                    <option value="" disabled>-- Selecionar da Central de Criativos --</option>
                    {creativesHubList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.format || 'criativo'} - {c.platform || 'instagram'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Título / Tópico do Post</label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Ex: Dica de ouro para engajamento no Reels"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Plataforma</label>
                  <select
                    value={modalPlatform}
                    onChange={(e) => setModalPlatform(e.target.value as Platform)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Conta Conectada (Meta OAuth)</label>
                  <select
                    value={modalAccountId}
                    onChange={(e) => setModalAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                  >
                    <option value="">-- Selecionar Conta --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        @{acc.username} ({acc.provider})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Data de Agendamento</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Horário</label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Mídia (Imagem, Vídeo Reels ou Carrossel)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modalMediaUrl}
                      onChange={(e) => setModalMediaUrl(e.target.value)}
                      placeholder="URL da mídia ou faça upload direto abaixo..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple"
                    />
                    <label className="px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <Plus size={14} />
                      <span>Subir Arquivo</span>
                      <input
                        type="file"
                        accept="image/*,video/*,.zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              setModalMediaUrl(uploadEvent.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Quick picker from existing gallery posts */}
                  {posts.filter(p => p.coverThumbnail || p.visualIdea).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-panel-border space-y-2">
                      <span className="text-[10px] font-mono text-zinc-400 block">Ou escolha direto da Galeria de Criativos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {posts.filter(p => p.coverThumbnail || p.visualIdea).slice(0, 8).map(p => {
                          const thumb = p.coverThumbnail || '';
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setModalMediaUrl(thumb || p.visualIdea || '')}
                              className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-zinc-800 relative ${
                                modalMediaUrl === (thumb || p.visualIdea) ? 'border-accent-purple ring-2 ring-accent-purple/30' : 'border-zinc-700 hover:border-zinc-500'
                              }`}
                            >
                              {thumb ? (
                                <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400 p-1 text-center font-mono">
                                  {p.format || 'post'}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Visual Preview */}
                  {modalMediaUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-zinc-950 border border-panel-border flex items-center justify-center">
                      {modalMediaUrl.includes('mp4') || modalMediaUrl.startsWith('data:video') ? (
                        <video src={modalMediaUrl} className="w-full h-full object-contain" controls />
                      ) : (
                        <img src={modalMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setModalMediaUrl('')}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-white hover:bg-black"
                        title="Remover mídia"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Legenda / Texto para Publicação</label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Escreva a legenda que será publicada automaticamente..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-panel-border text-white text-xs focus:outline-none focus:border-accent-purple resize-none"
                />
              </div>

              <div className="pt-4 border-t border-panel-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent-purple text-white text-xs font-semibold hover:bg-accent-purple/95 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  {editingPost ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
