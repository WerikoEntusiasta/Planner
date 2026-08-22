/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, WeeklyGoal, Platform, ContentFormat, FunnelStage, PostStatus, Client, User, UserPermissions } from './types';
import { initialPosts, initialGoals } from './data';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AppNavigationSidebar from './components/AppNavigationSidebar';
import CardView from './components/CardView';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import DashboardView from './components/DashboardView';
import PostDialog from './components/PostDialog';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import TeamModal from './components/TeamModal';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import PaymentCancelledPage from './components/PaymentCancelledPage';
import ClientApprovalPage from './components/ClientApprovalPage';
import ClientCreativeApprovalPage from './components/ClientCreativeApprovalPage';
import CreativeHubView from './components/CreativeHubView';
import SchedulingHubView from './components/SchedulingHubView';
import SupportModal from './components/SupportModal';
import LGPDModal from './components/LGPDModal';
import DemoNoticeModal from './components/DemoNoticeModal';
import IntegrationsModal from './components/IntegrationsModal';
import BrandKitModal from './components/BrandKitModal';
import HashtagLibraryModal from './components/HashtagLibraryModal';
import ProductionPipelineView from './components/ProductionPipelineView';
import CampaignsModal from './components/CampaignsModal';
import ReferenceHubModal from './components/ReferenceHubModal';
import AndroidAppModal from './components/AndroidAppModal';
import MobileBottomNav from './components/MobileBottomNav';
import CarouselAICreatorModal from './components/CarouselAICreatorModal';
import ComingSoonModal, { ComingSoonFeatureType } from './components/ComingSoonModal';
import QuickOnboardingGuide from './components/QuickOnboardingGuide';
import QuickStatusCounters from './components/QuickStatusCounters';
import FloatingQuickAction from './components/FloatingQuickAction';
import ShareApprovalModal from './components/ShareApprovalModal';
import PostEditorView from './components/PostEditorView';
import StrategicMetricsRow from './components/StrategicMetricsRow';
import TrialStatusBanner from './components/TrialStatusBanner';
import TrialExpiredModal from './components/TrialExpiredModal';
import PricingModal from './components/PricingModal';
import { getUserTrialStatus } from './utils/trialUtils';
import SeoRouter from './seo/SeoRouter';
import { Sparkles, BarChart2, Calendar as CalendarIcon, Target, Plus, Heart, HelpCircle, Shield, ChevronDown, Workflow, Image as ImageIcon } from 'lucide-react';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string>('');

  // View & Modals States
  const [activeView, setActiveView] = useState<'grid' | 'calendar' | 'kanban' | 'dashboard' | 'pipeline' | 'editor' | 'carousel-ai' | 'creatives' | 'scheduling'>('grid');
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState(false);
  const [isReferenceHubModalOpen, setIsReferenceHubModalOpen] = useState(false);
  const [isAndroidAppModalOpen, setIsAndroidAppModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { socket, isConnected } = useSocket();
  const [activeWorkspaceMembers, setActiveWorkspaceMembers] = useState<{ userId: string; userName: string }[]>([]);
  const [liveSyncToast, setLiveSyncToast] = useState<{ message: string; timestamp: number } | null>(null);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('creator_planner_logged_in_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return null;
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('creator_planner_is_admin_mode') === 'true';
  });
  const [isSimulatedSession, setIsSimulatedSession] = useState<boolean>(() => {
    return localStorage.getItem('creator_planner_is_simulating') === 'true';
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLGPDModalOpen, setIsLGPDModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<ComingSoonFeatureType | null>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Payment Redirection State
  const [showPaymentCancelledPage, setShowPaymentCancelledPage] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    return (
      urlParams.get('payment') === 'cancelled' ||
      urlParams.get('status') === 'cancelled' ||
      path.includes('/pagamento/cancelado') ||
      path.includes('/payment-cancelled')
    );
  });
  const [showPaymentSuccessPage, setShowPaymentSuccessPage] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    return (
      urlParams.get('payment') === 'success' ||
      urlParams.get('payment_success') === 'true' ||
      urlParams.get('status') === 'success' ||
      path.includes('/pagamento/sucesso') ||
      path.includes('/payment-success') ||
      path.includes('/obrigado')
    );
  });
  const [paymentSuccessPlan, setPaymentSuccessPlan] = useState<'free' | 'starter' | 'basic' | 'pro' | 'growth'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    return (plan === 'free' || plan === 'starter' || plan === 'basic' || plan === 'pro' || plan === 'growth') ? plan : 'pro';
  });
  const [paymentSuccessCycle, setPaymentSuccessCycle] = useState<'monthly' | 'quarterly'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cycle = urlParams.get('cycle');
    return cycle === 'quarterly' ? 'quarterly' : 'monthly';
  });

  const handleOpenPaymentSuccess = (plan?: 'free' | 'starter' | 'basic' | 'pro' | 'growth', cycle?: 'monthly' | 'quarterly') => {
    if (plan) setPaymentSuccessPlan(plan);
    if (cycle) setPaymentSuccessCycle(cycle);
    setShowPaymentSuccessPage(true);
  };

  // Advanced Filtering States
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [activeStage, setActiveStage] = useState<FunnelStage | 'all'>('all');
  const [activeFormat, setActiveFormat] = useState<ContentFormat | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [showStrategicMetrics, setShowStrategicMetrics] = useState(false);
  const [isShareApprovalModalOpen, setIsShareApprovalModalOpen] = useState(false);

  // Dialogue Modals State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editPostTarget, setEditPostTarget] = useState<Post | null>(null);
  const [calendarTargetDate, setCalendarTargetDate] = useState<string | undefined>(undefined);

  // 15-Day Free Trial and Pricing Modal States
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const trialStatus = getUserTrialStatus(currentUser);

  const checkTrialReadOnly = (): boolean => {
    if (trialStatus.isReadOnly) {
      setShowTrialExpiredModal(true);
      return true;
    }
    return false;
  };
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [openSignUpOnLanding, setOpenSignUpOnLanding] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<any | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);

  // Fetch active global announcement from server
  useEffect(() => {
    fetch('/api/announcements/active')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.announcement) {
          setActiveAnnouncement(data.announcement);
        }
      })
      .catch(() => {});
  }, []);

  // Increment SaaS accesses tracking counter on session start
  useEffect(() => {
    const isNewSession = !sessionStorage.getItem('saas_session_active');
    if (isNewSession) {
      sessionStorage.setItem('saas_session_active', 'true');
      const accesses = parseInt(localStorage.getItem('creator_planner_accesses_v2') || '0', 10);
      localStorage.setItem('creator_planner_accesses_v2', (accesses + 1).toString());
    }
  }, []);

  // Save/clean user login session to localStorage
  useEffect(() => {
    if (currentUser && currentUser.id !== 'demo_user') {
      localStorage.setItem('creator_planner_logged_in_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('creator_planner_logged_in_user');
    }
  }, [currentUser]);

  // Sync admin mode to localStorage
  useEffect(() => {
    localStorage.setItem('creator_planner_is_admin_mode', isAdminMode ? 'true' : 'false');
  }, [isAdminMode]);

  // Helper to sync local state to SQLite server database
  const syncToDatabase = async (currentUsers: User[], currentClients: Client[], currentPosts: Post[], currentGoals: WeeklyGoal[], extraMeta: any = {}) => {
    if (!currentUser || currentUser.id === 'demo_user') return;
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-password': currentUser.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          users: currentUsers,
          clients: currentClients,
          posts: currentPosts,
          goals: currentGoals,
          metadata: {
            activeClientId,
            ...extraMeta
          }
        }),
      });
      const resData = await response.json();
      if (!resData.success) {
        if (resData.error?.includes('Sessão inválida') || resData.error?.includes('expirada')) {
          console.error('Session expired, logging out.');
          setCurrentUser(null);
          localStorage.removeItem('creator_planner_logged_in_user');
          localStorage.removeItem('planner_user_token');
          window.location.reload();
        } else {
          console.error('Failed to sync to server database:', resData.error);
        }
      }
    } catch (err) {
      console.error('Offline or failed to connect to sync API:', err);
    }
  };

  // Load database items from SQLite on boot/login, with localStorage fallback/migration
  useEffect(() => {
    if (!currentUser) {
      setHasLoadedData(false);
      return;
    }

    if (currentUser.id === 'demo_user') {
      // Provide pre-populated mock data for the demo user in-memory
      setUsers([currentUser]);
      const defaultClient: Client = {
        id: 'client_demo',
        userId: 'demo_user',
        name: 'Canal de Demonstração'
      };
      setClients([defaultClient]);
      setActiveClientId('client_demo');
      
      // Seed with beautiful demo posts and goals
      setPosts(initialPosts.map(p => ({
        ...p,
        id: `demo_post_${p.id}`,
        userId: 'demo_user',
        clientId: 'client_demo'
      })));
      setGoals(initialGoals.map(g => ({
        ...g,
        id: `demo_goal_${g.id}`,
        userId: 'demo_user',
        clientId: 'client_demo'
      })));
      
      setHasLoadedData(true);
      setShowDemoNotice(true);
      return;
    }

    const loadData = async () => {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        const response = await fetch('/api/data', {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
        const resData = await response.json();
        
        if (resData.success && resData.data) {
          const { users: dbUsers, clients: dbClients, posts: dbPosts, goals: dbGoals, metadata } = resData.data;
          
          // Check if there is actual data in the SQLite database
          const hasDbData = (dbUsers && dbUsers.length > 0) || 
                            (dbClients && dbClients.length > 0) || 
                            (dbPosts && dbPosts.length > 0) || 
                            (dbGoals && dbGoals.length > 0);
                            
          if (hasDbData) {
            console.log('Loaded planner data from SQLite database.');
            setUsers(dbUsers || []);
            setClients(dbClients || []);
            setPosts(dbPosts || []);
            setGoals(dbGoals || []);
            if (metadata && metadata.activeClientId) {
              setActiveClientId(metadata.activeClientId);
            }
            setHasLoadedData(true);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch from SQLite API, using local storage fallback:', err);
      }
      
      // FALLBACK / MIGRATION: Load from localStorage if SQLite is empty or server offline
      console.log('Database empty or offline; reading/migrating from localStorage...');
      const savedClients = localStorage.getItem('creator_planner_clients');
      const savedActiveClientId = localStorage.getItem('creator_planner_active_client_id');
      const savedPosts = localStorage.getItem('creator_planner_posts');
      const savedGoals = localStorage.getItem('creator_planner_goals');
      const savedUsers = localStorage.getItem('creator_planner_registered_users');

      let loadedUsers: User[] = [];
      if (savedUsers) {
        try { loadedUsers = JSON.parse(savedUsers); } catch (e) {}
      }
      if (!loadedUsers.some(u => u.id === currentUser.id)) {
        loadedUsers.push(currentUser);
      }
      setUsers(loadedUsers);

      let loadedClients: Client[] = [];
      if (savedClients) {
        try { loadedClients = JSON.parse(savedClients); } catch (e) {}
      }
      setClients(loadedClients);

      let loadedActiveId = '';
      if (savedActiveClientId) {
        loadedActiveId = savedActiveClientId;
      }
      setActiveClientId(loadedActiveId);

      let loadedPosts: Post[] = [];
      if (savedPosts) {
        try { loadedPosts = JSON.parse(savedPosts); } catch (e) {}
      }
      setPosts(loadedPosts);

      let loadedGoals: WeeklyGoal[] = [];
      if (savedGoals) {
        try { loadedGoals = JSON.parse(savedGoals); } catch (e) {}
      }
      setGoals(loadedGoals);

      setHasLoadedData(true);
      
      // Perform initial migration sync to SQLite database
      setTimeout(() => {
        syncToDatabase(loadedUsers, loadedClients, loadedPosts, loadedGoals, { activeClientId: loadedActiveId });
      }, 500);
    };

    loadData();
  }, [currentUser?.id]);

  // Polling for data updates every 5 seconds for "real-time" feel
  useEffect(() => {
    if (!currentUser || !hasLoadedData || currentUser.id === 'demo_user') return;
    
    const interval = setInterval(async () => {
      try {
        const userToken = localStorage.getItem('planner_user_token') || '';
        const response = await fetch('/api/data', {
          headers: {
            'x-user-id': currentUser.id,
            'x-user-password': currentUser.password || '',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
          }
        });
        const resData = await response.json();
        
        if (resData.success && resData.data) {
          const { users: dbUsers, clients: dbClients, posts: dbPosts, goals: dbGoals, metadata } = resData.data;
          
          setUsers(dbUsers || []);
          setClients(dbClients || []);
          setPosts(dbPosts || []);
          setGoals(dbGoals || []);
          if (metadata && metadata.activeClientId) {
            setActiveClientId(metadata.activeClientId);
          }
        }
      } catch (err) {
        console.error('Failed to poll data from server:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser, hasLoadedData]);

  // Sync currentUser permissions and plan in real time with the fresh users directory
  useEffect(() => {
    if (!currentUser) return;
    const freshSelf = users.find(u => u.id === currentUser.id);
    if (freshSelf) {
      const needsUpdate = freshSelf.plan !== currentUser.plan ||
                          freshSelf.isTeamMember !== currentUser.isTeamMember ||
                          freshSelf.name !== currentUser.name ||
                          freshSelf.email !== currentUser.email ||
                          JSON.stringify(freshSelf.permissions) !== JSON.stringify(currentUser.permissions);
      if (needsUpdate) {
        setCurrentUser(prev => prev ? { ...prev, ...freshSelf } : freshSelf);
      }
    }
  }, [users, currentUser?.plan, currentUser?.isTeamMember, currentUser?.permissions, currentUser?.name, currentUser?.email]);

  const workspaceOwnerId = (currentUser && currentUser.isTeamMember) ? currentUser.invitedByUserId : currentUser?.id;

  // Real-Time Socket Connection & Multi-User Collaboration Handler
  useEffect(() => {
    if (!socket || !currentUser || !workspaceOwnerId || currentUser.id === 'demo_user') return;

    // Join the workspace room immediately
    socket.emit('join-workspace', {
      workspaceId: workspaceOwnerId,
      userId: currentUser.id,
      userName: currentUser.name
    });

    // 1. Full Workspace State Sync from Server / Other Team Members
    const handleSyncUpdated = (payload: any) => {
      const targetWorkspace = payload.workspaceOwnerId || payload.workspaceId;
      if (targetWorkspace !== workspaceOwnerId) return;

      if (payload.senderId && payload.senderId !== currentUser.id) {
        if (payload.data) {
          const { users: newUsers, clients: newClients, posts: newPosts, goals: newGoals, metadata: newMeta } = payload.data;
          if (Array.isArray(newUsers)) setUsers(newUsers);
          if (Array.isArray(newClients)) setClients(newClients);
          if (Array.isArray(newPosts)) setPosts(newPosts);
          if (Array.isArray(newGoals)) setGoals(newGoals);
          if (newMeta && newMeta.activeClientId) {
            setActiveClientId(prev => {
              const stillExists = newClients?.some((c: any) => c.id === prev);
              return stillExists ? prev : (newMeta.activeClientId || (newClients?.[0]?.id ?? ''));
            });
          }
        }
        setLiveSyncToast({
          message: `⚡ ${payload.senderName || 'Membro da equipe'} atualizou o painel em tempo real`,
          timestamp: Date.now()
        });
      }
    };

    // 2. Instant Action Forwarding (Sub-millisecond latency reflection)
    const handleActionReceived = (payload: any) => {
      if (payload.workspaceId !== workspaceOwnerId) return;
      if (payload.senderId && payload.senderId !== currentUser.id) {
        const actorName = payload.senderName || 'Membro da equipe';

        if (payload.action === 'save-post' && payload.payload) {
          const post = payload.payload;
          setPosts(prev => {
            const exists = prev.some(p => p.id === post.id);
            return exists ? prev.map(p => p.id === post.id ? post : p) : [post, ...prev];
          });
          setLiveSyncToast({
            message: `⚡ ${actorName} salvou o card "${post.title?.slice(0, 24) || 'Conteúdo'}"`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'delete-post' && payload.payload?.id) {
          setPosts(prev => prev.filter(p => p.id !== payload.payload.id));
          setLiveSyncToast({
            message: `⚡ ${actorName} removeu um card de conteúdo`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'update-status' && payload.payload?.id) {
          setPosts(prev => prev.map(p => p.id === payload.payload.id ? { ...p, status: payload.payload.newStatus } : p));
          setLiveSyncToast({
            message: `⚡ ${actorName} moveu o status de um post`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'create-client' && payload.payload) {
          setClients(prev => {
            const exists = prev.some(c => c.id === payload.payload.id);
            return exists ? prev : [...prev, payload.payload];
          });
          setLiveSyncToast({
            message: `⚡ ${actorName} cadastrou o cliente "${payload.payload.name}"`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'rename-client' && payload.payload) {
          setClients(prev => prev.map(c => c.id === payload.payload.id ? { ...c, name: payload.payload.name } : c));
          setLiveSyncToast({
            message: `⚡ ${actorName} alterou o nome de um cliente`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'add-goal' && payload.payload) {
          setGoals(prev => {
            const exists = prev.some(g => g.id === payload.payload.id);
            return exists ? prev : [...prev, payload.payload];
          });
          setLiveSyncToast({
            message: `⚡ ${actorName} adicionou uma nova meta`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'toggle-goal' && payload.payload?.id) {
          setGoals(prev => prev.map(g => g.id === payload.payload.id ? { ...g, completed: !g.completed } : g));
          setLiveSyncToast({
            message: `⚡ ${actorName} atualizou o progresso da meta`,
            timestamp: Date.now()
          });
        } else if (payload.action === 'update-permissions' && payload.payload?.userId) {
          const targetId = payload.payload.userId;
          const newPerms = payload.payload.permissions;
          setUsers(prev => prev.map(u => u.id === targetId ? { ...u, permissions: newPerms } : u));
          
          if (currentUser && currentUser.id === targetId) {
            setCurrentUser(prev => prev ? { ...prev, permissions: newPerms } : null);
            setLiveSyncToast({
              message: `⚡ Suas permissões de acesso foram atualizadas em tempo real pelo administrador`,
              timestamp: Date.now()
            });
          } else {
            setLiveSyncToast({
              message: `⚡ ${actorName} atualizou permissões de membro`,
              timestamp: Date.now()
            });
          }
        } else if (payload.action === 'remove-member' && payload.payload?.userId) {
          setUsers(prev => prev.filter(u => u.id !== payload.payload.userId));
        }
      }
    };

    // 3. Online Team Presence Tracking
    const handlePresence = (payload: any) => {
      if (payload.workspaceId === workspaceOwnerId && Array.isArray(payload.activeUsers)) {
        setActiveWorkspaceMembers(payload.activeUsers);
      }
    };

    // 4. Client Approval Status Updates
    const handlePostStatusUpdated = ({ postId, status }: { postId: string; status: string }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        status: status === 'approved' ? 'scheduled' : 'draft',
        approvalStatus: status === 'approved' ? 'approved' : 'rejected' 
      } : p));
      setLiveSyncToast({
        message: `⚡ Status de aprovação atualizado para "${status === 'approved' ? 'Aprovado' : 'Revisão'}"`,
        timestamp: Date.now()
      });
    };

    socket.on('workspace-sync-updated', handleSyncUpdated);
    socket.on('workspace-synced', handleSyncUpdated);
    socket.on('workspace-action-received', handleActionReceived);
    socket.on('workspace-presence-updated', handlePresence);
    socket.on('post-status-updated', handlePostStatusUpdated);

    return () => {
      socket.off('workspace-sync-updated', handleSyncUpdated);
      socket.off('workspace-synced', handleSyncUpdated);
      socket.off('workspace-action-received', handleActionReceived);
      socket.off('workspace-presence-updated', handlePresence);
      socket.off('post-status-updated', handlePostStatusUpdated);
    };
  }, [socket, currentUser, workspaceOwnerId]);

  // Auto-dismiss live toast after 3.5s
  useEffect(() => {
    if (!liveSyncToast) return;
    const t = setTimeout(() => setLiveSyncToast(null), 3500);
    return () => clearTimeout(t);
  }, [liveSyncToast]);

  // Instant action broadcaster to connected team members
  const emitWorkspaceAction = (action: string, payload?: any) => {
    if (!socket || !workspaceOwnerId || !currentUser || currentUser.id === 'demo_user') return;
    socket.emit('workspace-action', {
      workspaceId: workspaceOwnerId,
      action,
      payload,
      senderId: currentUser.id,
      senderName: currentUser.name
    });
  };

  // Auto-correct workspace client state for the logged-in user
  useEffect(() => {
    if (!currentUser || !workspaceOwnerId) return;

    const userClients = clients.filter(c => c.userId === workspaceOwnerId);
    
    if (userClients.length === 0) {
      // Lazy auto-provision first workspace client for a pristine signup experience
      const defaultClient: Client = {
        id: `client_default_${workspaceOwnerId}_${Date.now()}`,
        userId: workspaceOwnerId,
        name: 'Meu Canal Principal'
      };
      setClients(prev => [...prev, defaultClient]);
      setActiveClientId(defaultClient.id);
    } else {
      // Validate that the currently selected client is indeed owned by the logged-in user
      const isOwner = userClients.some(c => c.id === activeClientId);
      if (!isOwner) {
        setActiveClientId(userClients[0].id);
      }
    }
  }, [currentUser, workspaceOwnerId, clients, activeClientId]);

  // Synchronize state changes to both LocalStorage and SQLite Server Database
  useEffect(() => {
    if (!hasLoadedData) return;
    if (currentUser?.id === 'demo_user') return;

    localStorage.setItem('creator_planner_registered_users', JSON.stringify(users));
    localStorage.setItem('creator_planner_clients', JSON.stringify(clients));
    localStorage.setItem('creator_planner_active_client_id', activeClientId);
    localStorage.setItem('creator_planner_posts', JSON.stringify(posts));
    localStorage.setItem('creator_planner_goals', JSON.stringify(goals));

    const timer = setTimeout(() => {
      syncToDatabase(users, clients, posts, goals, { activeClientId });
    }, 300);

    return () => clearTimeout(timer);
  }, [users, clients, posts, goals, activeClientId, hasLoadedData]);

  // Inject simulated posts when in user simulation session
  useEffect(() => {
    if (!isSimulatedSession || !currentUser || !activeClientId) return;

      // Check if simulated posts for this client and user already exist
      const existingSimPosts = posts.filter(p => p.id.startsWith('sim_post_') && p.userId === currentUser.id && p.clientId === activeClientId);
      
      if (existingSimPosts.length === 0) {
        const simulatedPosts: Post[] = [
          {
            id: `sim_post_1_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "5 Erros de Gravação que Flopam seus Shorts",
            platform: 'youtube',
            format: 'shorts',
            funnelStage: 'TOFU',
            status: 'scheduled',
            scheduledDate: '2026-06-15',
            scheduledTime: '12:00',
            description: "Um shorts dinâmico apontando erros de iluminação e áudio que cortam o engajamento na metade nos primeiros 3 segundos.",
            hookText: "Se o seu vídeo começa com você respirando fundo ou dizendo 'E aí pessoal', você já perdeu 80% do público.",
            scriptText: "[0-3s] Mostra cena escura de propósito com texto piscando: ERRO 1.\n[3-15s] Explica como a iluminação de janela melhora a retenção.\n[15-30s] Revela o hack do microfone de lapela barato.\n[30-40s] CTA rápido para curtir e seguir.",
            visualIdea: "Câmera bem perto do rosto, cortes ultra rápidos a cada 2 segundos, legenda colorida com fundo preto.",
            approvalStatus: 'approved',
            hashtags: ['Shorts', 'Crescimento', 'DicasDeVideo']
          },
          {
            id: `sim_post_2_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "Como Organizar sua Rotina de Posts do Mês",
            platform: 'instagram',
            format: 'carousel',
            funnelStage: 'MOFU',
            status: 'draft',
            scheduledDate: '2026-06-16',
            scheduledTime: '18:30',
            description: "Carrossel educativo ensinando o passo a passo de como fazer um lote de gravação para o mês inteiro em apenas 4 horas.",
            hookText: "Como eu gravo 30 vídeos em 1 tarde de domingo sem ficar sem voz.",
            scriptText: "Slide 1: Capa Chamativa.\nSlide 2: Planejamento de Roteiro em Bloco.\nSlide 3: Configuração do Cenário Único.\nSlide 4: Troca Rápida de Camisetas (O Truque da Percepção).\nSlide 5: Pasta Compartilhada no Google Drive.\nSlide 6: CTA comentando 'ROTEIRO'.",
            visualIdea: "Design minimalista em tons de roxo profundo e laranja neon com imagens de celulares demonstrando organização.",
            approvalStatus: 'draft',
            hashtags: ['Produtividade', 'Organização', 'MarketingDigital']
          },
          {
            id: `sim_post_3_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "O Segredo do Gancho Perfeito no Reels",
            platform: 'instagram',
            format: 'reels',
            funnelStage: 'BOFU',
            status: 'production',
            scheduledDate: '2026-06-14',
            scheduledTime: '20:00',
            description: "Análise aprofundada de roteiros de reels de sucesso que geraram conversão de vendas direta pelo direct.",
            hookText: "Esta frase de 5 palavras me gerou mais de R$ 12.400 em vendas automáticas no Instagram.",
            scriptText: "[0-5s] Mostra o gráfico de faturamento e aponta o dedo.\n[5-20s] Explica o conceito de 'Curiosidade Insuportável'.\n[20-45s] Mostra exemplos práticos de ganchos aplicados a diferentes nichos (estética, finanças, dropshipping).\n[45-60s] Fala para o usuário comentar 'QUERO' para receber o template.",
            visualIdea: "Vídeo gravado em primeira pessoa andando pela sala com iluminação suave roxa ao fundo.",
            approvalStatus: 'pending',
            hashtags: ['VendasNoInstagram', 'ReelsStrategy', 'GatilhosMentais']
          },
          {
            id: `sim_post_4_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "Trends de Áudio que vão Estourar nesta Semana",
            platform: 'tiktok',
            format: 'video',
            funnelStage: 'TOFU',
            status: 'published',
            scheduledDate: '2026-06-12',
            scheduledTime: '10:15',
            description: "Compilado semanal de áudios em alta com sugestão de nicho de aplicação.",
            hookText: "Use este áudio antes que ele sature e veja seus views dobrarem em 24h.",
            scriptText: "Apresenta 3 áudios em alta. No áudio 1, sugere transição de antes e depois. No áudio 2, sugere tutorial rápido. No áudio 3, sugere POV engraçado.",
            visualIdea: "Gravação de tela demonstrando como achar as músicas na aba de virais do TikTok.",
            approvalStatus: 'approved',
            hashtags: ['TikTokTrends', 'ViraisDoMomento', 'DicasTiktok']
          }
        ];

        setPosts(prev => {
          const filtered = prev.filter(p => !p.id.startsWith('sim_post_') || !(p.userId === currentUser.id && p.clientId === activeClientId));
          return [...simulatedPosts, ...filtered];
        });
      }

      // Seeding simulated goals
      const hasSimulatedGoals = goals.some(g => g.userId === currentUser.id && g.clientId === activeClientId);
      if (!hasSimulatedGoals) {
        const simulatedGoals: WeeklyGoal[] = [
          {
            id: `sim_goal_1_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "Publicar 3 Reels Educativos",
            targetCount: 3,
            currentCount: 2,
            platform: 'instagram',
            completed: false
          },
          {
            id: `sim_goal_2_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "Ganhar 100 seguidores no TikTok",
            targetCount: 100,
            currentCount: 112,
            platform: 'tiktok',
            completed: true
          },
          {
            id: `sim_goal_3_${currentUser.id}`,
            clientId: activeClientId,
            userId: currentUser.id,
            title: "Bater 5.000 visualizações no YouTube",
            targetCount: 5000,
            currentCount: 4200,
            platform: 'youtube',
            completed: false
          }
        ];
        setGoals(prev => {
          const filtered = prev.filter(g => !(g.userId === currentUser.id && g.clientId === activeClientId));
          return [...simulatedGoals, ...filtered];
        });
      }
  }, [isSimulatedSession, currentUser, activeClientId]);

  // Core Permissions & Plan Validation Helpers
  const checkPermission = (action: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (!currentUser.isTeamMember) return true; // Host/Owner has all permissions
    
    const perms = currentUser.permissions || {
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
    return perms[action] !== false;
  };

  const getWorkspaceOwnerUser = (): User | null => {
    if (!currentUser) return null;
    const freshOwner = users.find(u => u.id === workspaceOwnerId);
    return freshOwner || currentUser;
  };

  const handleUpdateUserPlan = (plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth', billingCycle?: 'monthly' | 'quarterly') => {
    if (!currentUser) return;
    const targetUserId = currentUser.isTeamMember ? currentUser.invitedByUserId : currentUser.id;
    const activeBillingCycle = billingCycle || 'monthly';
    
    const updatedUsers = users.map(u => {
      if (u.id === targetUserId) {
        return { 
          ...u, 
          plan, 
          billingCycle: activeBillingCycle,
          // Clear termination date if they upgrade or change plan, to make sure it reactivates
          scheduledTerminationDate: undefined 
        };
      }
      return u;
    });
    setUsers(updatedUsers);

    // If the currently logged in user is the target, update their session state as well
    if (currentUser.id === targetUserId) {
      setCurrentUser(prev => prev ? { 
        ...prev, 
        plan, 
        billingCycle: activeBillingCycle,
        scheduledTerminationDate: undefined 
      } : null);
    }
  };

  const handleScheduleCancellation = (terminationDate: string | undefined) => {
    if (!currentUser) return;
    const targetUserId = currentUser.isTeamMember ? currentUser.invitedByUserId : currentUser.id;
    
    const updatedUsers = users.map(u => {
      if (u.id === targetUserId) {
        return { ...u, scheduledTerminationDate: terminationDate };
      }
      return u;
    });
    setUsers(updatedUsers);

    if (currentUser.id === targetUserId) {
      setCurrentUser(prev => prev ? { ...prev, scheduledTerminationDate: terminationDate } : null);
    }
  };

  const handleUpdateMemberPermissions = async (userId: string, permissions: NonNullable<User['permissions']>) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, permissions };
      }
      return u;
    });
    setUsers(updatedUsers);

    // If updating current user (host testing permissions or self), update session immediately
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, permissions } : null);
    }

    // Persist to localStorage
    try {
      const savedUsersStr = localStorage.getItem('creator_planner_registered_users');
      if (savedUsersStr) {
        const parsed = JSON.parse(savedUsersStr) as User[];
        const updated = parsed.map(u => u.id === userId ? { ...u, permissions } : u);
        localStorage.setItem('creator_planner_registered_users', JSON.stringify(updated));
      }
    } catch (e) {}

    // Persist to server SQLite database
    try {
      const token = localStorage.getItem('planner_user_token') || localStorage.getItem('planner_admin_token');
      await fetch('/api/team/update-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, permissions })
      });
    } catch (err) {
      console.error('Error updating member permissions on server:', err);
    }

    emitWorkspaceAction('update-permissions', { userId, permissions });
  };

  const handleRemoveMember = async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);

    // Sync to local storage
    try {
      const savedUsersStr = localStorage.getItem('creator_planner_registered_users');
      if (savedUsersStr) {
        const parsed = JSON.parse(savedUsersStr) as User[];
        const filtered = parsed.filter(u => u.id !== userId);
        localStorage.setItem('creator_planner_registered_users', JSON.stringify(filtered));
      }
    } catch (e) {}

    // Call server to remove member from database
    try {
      const token = localStorage.getItem('planner_user_token') || localStorage.getItem('planner_admin_token');
      await fetch('/api/team/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ memberId: userId })
      });
    } catch (err) {
      console.error('Error removing team member from server:', err);
    }

    emitWorkspaceAction('remove-member', { userId });
  };

  // Core Actions
  const handleCreateClient = (name: string) => {
    if (!currentUser || !workspaceOwnerId) return;
    if (checkTrialReadOnly()) return;

    if (!checkPermission('manageClients')) {
      alert('Você não tem permissão para gerenciar marcas/clientes.');
      return;
    }

    // Check Plan Limits for Brands/Clients
    const owner = getWorkspaceOwnerUser();
    const ownerPlan = owner?.plan || 'free';
    const currentClientsCount = clients.filter(c => c.userId === workspaceOwnerId).length;

    const maxClients = ownerPlan === 'growth' ? 25 : ownerPlan === 'pro' ? 14 : ownerPlan === 'basic' ? 8 : ownerPlan === 'starter' ? 4 : 2;

    if (currentClientsCount >= maxClients) {
      if (ownerPlan === 'free') {
        alert('O Plano Gratuito permite gerenciar no máximo 2 Marcas/Clientes. Faça upgrade para o Plano Starter ou superior para cadastrar mais marcas.');
      } else if (ownerPlan === 'starter') {
        alert('O Plano Starter permite gerenciar no máximo 4 Marcas/Clientes. Faça upgrade para o Plano Basic para cadastrar mais marcas.');
      } else if (ownerPlan === 'basic') {
        alert('O Plano Basic permite gerenciar no máximo 8 Marcas/Clientes. Faça upgrade para o Plano Pro para cadastrar mais marcas.');
      } else if (ownerPlan === 'pro') {
        alert('O Plano Pro permite gerenciar no máximo 14 Marcas/Clientes. Faça upgrade para o Plano Growth PRO para cadastrar mais marcas.');
      } else {
        alert('Limite máximo de 25 Marcas/Clientes atingido para o plano Growth PRO.');
      }
      setIsTeamModalOpen(true);
      return;
    }

    const newClient: Client = {
      id: `client_${Date.now()}`,
      userId: workspaceOwnerId,
      name
    };
    setClients([...clients, newClient]);
    setActiveClientId(newClient.id);
    emitWorkspaceAction('create-client', newClient);
  };

  const handleRenameClient = (clientId: string, newName: string) => {
    if (!currentUser) return;
    if (checkTrialReadOnly()) return;
    if (!checkPermission('manageClients')) {
      alert('Você não tem permissão para alterar o nome de marcas/clientes.');
      return;
    }
    const updated = clients.map((c) => (c.id === clientId ? { ...c, name: newName } : c));
    setClients(updated);
    emitWorkspaceAction('rename-client', { id: clientId, name: newName });
  };

  const handleSavePost = (savedPost: Post) => {
    if (!currentUser || !workspaceOwnerId) return;
    if (checkTrialReadOnly()) return;

    const exists = posts.some((p) => p.id === savedPost.id);
    if (exists) {
      if (!checkPermission('editCards')) {
        alert('Você não tem permissão para editar cards de conteúdo.');
        return;
      }
    } else {
      if (!checkPermission('createCards')) {
        alert('Você não tem permissão para criar novos cards de conteúdo.');
        return;
      }
    }

    const postWithUser = { 
      ...savedPost, 
      userId: savedPost.userId || workspaceOwnerId,
      clientId: savedPost.clientId || activeClientId
    };
    let updatedPosts: Post[];
    if (exists) {
      updatedPosts = posts.map((p) => (p.id === savedPost.id ? postWithUser : p));
    } else {
      updatedPosts = [postWithUser, ...posts];
    }
    setPosts(updatedPosts);
    emitWorkspaceAction('save-post', postWithUser);
  };

  const handleDeletePost = (id: string) => {
    if (checkTrialReadOnly()) return;
    if (!checkPermission('deleteCards')) {
      alert('Você não tem permissão para apagar cards de conteúdo.');
      return;
    }
    const updatedPosts = posts.filter((p) => p.id !== id);
    setPosts(updatedPosts);
    emitWorkspaceAction('delete-post', { id });
  };

  const handleDuplicatePost = (post: Post) => {
    if (!currentUser || !workspaceOwnerId) return;
    if (checkTrialReadOnly()) return;
    if (!checkPermission('createCards')) {
      alert('Você não tem permissão para criar/duplicar cards de conteúdo.');
      return;
    }
    const duplicated: Post = {
      ...post,
      id: `post_${Date.now()}`,
      userId: workspaceOwnerId,
      clientId: activeClientId,
      title: `${post.title} (Cópia)`,
      status: 'draft' // Reset copied item to Draft status for revision
    };
    const updated = [duplicated, ...posts];
    setPosts(updated);
    emitWorkspaceAction('save-post', duplicated);
  };

  const handleUpdateStatus = (id: string, newStatus: PostStatus) => {
    if (checkTrialReadOnly()) return;
    if (!checkPermission('editCards')) {
      alert('Você não tem permissão para editar/mover cards de conteúdo.');
      return;
    }
    const updated = posts.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    setPosts(updated);
    emitWorkspaceAction('update-status', { id, newStatus });
  };

  const handleToggleGoal = (id: string) => {
    if (checkTrialReadOnly()) return;
    if (!checkPermission('editCards')) {
      alert('Você não tem permissão para editar metas semanais.');
      return;
    }
    const updated = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    setGoals(updated);
    emitWorkspaceAction('toggle-goal', { id });
  };

  const handleAddGoal = (title: string, platform: Platform) => {
    if (!currentUser || !workspaceOwnerId) return;
    if (checkTrialReadOnly()) return;
    if (!checkPermission('createCards')) {
      alert('Você não tem permissão para criar novas metas.');
      return;
    }
    const newGoal: WeeklyGoal = {
      id: `goal_${Date.now()}`,
      userId: workspaceOwnerId,
      clientId: activeClientId,
      title,
      platform,
      targetCount: 1,
      currentCount: 0,
      completed: false
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    emitWorkspaceAction('add-goal', newGoal);
  };

  // Instant Idea Inserter from Seeder Sidebar
  const handleAddQuickPost = (platform: Platform, format: ContentFormat, titleStr: string) => {
    if (!currentUser || !workspaceOwnerId) return;
    if (checkTrialReadOnly()) return;
    if (!checkPermission('createCards')) {
      alert('Você não tem permissão para criar novos cards.');
      return;
    }
    const newQuickPost: Post = {
      id: `post_${Date.now()}`,
      userId: workspaceOwnerId,
      clientId: activeClientId,
      title: titleStr,
      platform,
      format,
      funnelStage: 'TOFU',
      status: 'draft',
      scheduledDate: '2026-06-14', // Default to current creator active date
      scheduledTime: '18:00',
      description: 'Uma ideia de ganchos rápidos gerados pelo laboratório de insights do planner de conteúdo.',
      hashtags: ['IdeiasRapidas', 'Planejador', 'VideosCurtos']
    };

    const updated = [newQuickPost, ...posts];
    setPosts(updated);
    emitWorkspaceAction('save-post', newQuickPost);

    // Open immediately for customization in full-page editor view
    setEditPostTarget(newQuickPost);
    setActiveView('editor');
  };

  // Triggers full-page editor view from top buttons
  const handleOpenCreateDialog = () => {
    if (checkTrialReadOnly()) return;
    if (!checkPermission('createCards')) {
      alert('Você não tem permissão para criar novos conteúdos no workspace.');
      return;
    }
    setEditPostTarget(null);
    setCalendarTargetDate(undefined);
    setActiveView('editor');
  };

  // Triggers full-page editor view with selected date relative from calendar click
  const handleAddPostToSpecificDate = (dateStr: string) => {
    if (checkTrialReadOnly()) return;
    if (!checkPermission('createCards')) {
      alert('Você não tem permissão para criar novos conteúdos no workspace.');
      return;
    }
    setEditPostTarget(null);
    setCalendarTargetDate(dateStr);
    setActiveView('editor');
  };

  const handleCardClick = (post: Post) => {
    setEditPostTarget(post);
    setCalendarTargetDate(undefined);
    setActiveView('editor');
  };

  // Filter clients, posts and goals for the current workspace
  const userClients = clients.filter((c) => c.userId === workspaceOwnerId);
  const clientPosts = posts.filter((post) => post.clientId === activeClientId && (post.userId === workspaceOwnerId || !post.userId || post.userId === currentUser?.id));
  const clientGoals = goals.filter((goal) => goal.clientId === activeClientId && (goal.userId === workspaceOwnerId || !goal.userId || goal.userId === currentUser?.id));

  // Perform advanced multi-selector filtering on the active client's posts
  const filteredPosts = clientPosts.filter((post) => {
    const matchesPlatform = activePlatform === 'all' || post.platform === activePlatform;
    const matchesStage = activeStage === 'all' || post.funnelStage === activeStage;
    const matchesFormat = activeFormat === 'all' || post.format === activeFormat;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'in_review' && (post.approvalStatus === 'pending' || (post.status as string) === 'in_review')) ||
      (statusFilter === 'scheduled' && post.status === 'scheduled') ||
      (statusFilter === 'approved' && (post.status === 'published' || post.approvalStatus === 'approved')) ||
      (statusFilter === 'draft' && post.status === 'draft');
    return matchesPlatform && matchesStage && matchesFormat && matchesStatus;
  });

  // Calculate metrics for active client only
  const totalPostsCount = clientPosts.length;
  const draftCount = clientPosts.filter((p) => p.status === 'draft').length;
  const scheduledCount = clientPosts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = clientPosts.filter((p) => p.status === 'published').length;

  // LGPD Delete Account Handler using Secure Server API
  const handleDeleteAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const userToken = localStorage.getItem('planner_user_token') || '';
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
          'x-user-password': currentUser.password || '',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        localStorage.clear();
        sessionStorage.clear();
        setCurrentUser(null);
        return true;
      } else {
        console.error('Delete account server error:', data.error);
        return false;
      }
    } catch (err) {
      console.error('Delete account server connection error, fallback to local purge:', err);
      localStorage.clear();
      sessionStorage.clear();
      setCurrentUser(null);
      return true;
    }
  };

  // View routing triggers
  const queryParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1];
  const isPathToken = lastPathPart && !['aprovar', 'aprovar-legenda', 'aprovar-legendas', 'aprovar-criativo', 'aprovar-criativos', 'central-aprovacao'].includes(lastPathPart);

  const approvePostId = queryParams.get('approvePostId');
  const creativeToken = queryParams.get('creativeToken') || queryParams.get('shareToken') || queryParams.get('token') || queryParams.get('id') || queryParams.get('creativeId') || (isPathToken ? lastPathPart : '');
  const clientApprovalToken = queryParams.get('clientToken') || queryParams.get('client') || queryParams.get('clientId') || queryParams.get('clientName');
  const isCaptionFocus = queryParams.get('focus') === 'caption' || queryParams.get('type') === 'caption' || window.location.pathname.includes('/aprovar-legenda') || window.location.pathname.includes('/aprovar-legendas');
  const isGeneralHubMode = queryParams.get('mode') === 'hub' || window.location.pathname.includes('/aprovar-criativos') || window.location.pathname.includes('/central-aprovacao') || window.location.pathname.includes('/aprovar-legendas');
  const isCreativeApprovalUrl = window.location.pathname.startsWith('/aprovar') || window.location.pathname.startsWith('/central-aprovacao') ||
    Boolean(creativeToken || clientApprovalToken || isGeneralHubMode);

  // Creative Client Approval Portal (Supports Single Creative & General Hub for All Creatives + Caption Approval)
  if (isCreativeApprovalUrl || creativeToken || clientApprovalToken || isGeneralHubMode) {
    return (
      <ClientCreativeApprovalPage 
        shareToken={creativeToken || ''} 
        clientToken={clientApprovalToken || ''}
        initialMode={isGeneralHubMode || Boolean(clientApprovalToken) ? 'hub' : 'single'}
        initialFocus={isCaptionFocus ? 'caption' : 'all'}
        onBackToApp={currentUser ? () => {
          window.history.replaceState({}, '', '/');
          window.location.reload();
        } : undefined}
      />
    );
  }

  // Check SEO routes
  const seoView = SeoRouter({
    onStartFreeTrial: () => {
      window.location.href = '/?auth=open';
    }
  });

  if (seoView) {
    return seoView;
  }

  if (approvePostId) {
    return <ClientApprovalPage postId={approvePostId} />;
  }

  if (showPaymentCancelledPage) {
    return (
      <PaymentCancelledPage
        onReturnHome={() => {
          setShowPaymentCancelledPage(false);
          window.history.replaceState({}, '', '/');
        }}
        onRetryPayment={() => {
          setShowPaymentCancelledPage(false);
          window.history.replaceState({}, '', '/#planos');
        }}
      />
    );
  }

  if (showPaymentSuccessPage) {
    return (
      <PaymentSuccessPage
        initialPlan={paymentSuccessPlan}
        initialCycle={paymentSuccessCycle}
        currentUser={currentUser}
        onGoToPlanner={() => setShowPaymentSuccessPage(false)}
        onUpdateUserPlan={handleUpdateUserPlan}
        onOpenTeamModal={() => {
          setShowPaymentSuccessPage(false);
          setIsTeamModalOpen(true);
        }}
        onBackToHome={() => setShowPaymentSuccessPage(false)}
      />
    );
  }

  if (isAdminMode) {
    return (
      <AdminDashboard 
        onBackToApp={() => setIsAdminMode(false)} 
        onSimulateUser={(user) => {
          setCurrentUser(user);
          setIsAdminMode(false);
          setIsSimulatedSession(true);
          localStorage.setItem('creator_planner_is_simulating', 'true');
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LandingPage 
        onLogin={(user) => {
          setCurrentUser(user);
          setOpenSignUpOnLanding(false);
        }} 
        onEnterAdminMode={() => setIsAdminMode(true)}
        initialAuthOpen={openSignUpOnLanding}
        initialTab="register"
      />
    );
  }

  return (
    <div id="content-planner-app" className="min-h-screen bg-panel-black flex text-zinc-100 selection:bg-accent-purple selection:text-white">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <AppNavigationSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onNewPostClick={handleOpenCreateDialog}
        clients={userClients}
        activeClientId={activeClientId}
        onSelectClient={setActiveClientId}
        onCreateClient={handleCreateClient}
        onRenameClient={handleRenameClient}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem('planner_user_token');
          localStorage.removeItem('creator_planner_logged_in_user');
          setCurrentUser(null);
        }}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
        onOpenLGPDModal={() => setIsLGPDModalOpen(true)}
        onOpenIntegrationsModal={() => {
          if (!checkPermission('manageIntegrations')) {
            alert('Acesso restrito: Você não tem permissão para configurar integrações.');
            return;
          }
          setIsIntegrationsModalOpen(true);
        }}
        onOpenBrandKitModal={() => {
          if (!checkPermission('manageBrandKit')) {
            alert('Acesso restrito: Você não tem permissão para gerenciar o Kit de Marca.');
            return;
          }
          setIsBrandKitModalOpen(true);
        }}
        onOpenHashtagLibraryModal={() => setIsHashtagModalOpen(true)}
        onOpenCampaignsModal={() => {
          if (!checkPermission('manageCampaigns')) {
            alert('Acesso restrito: Você não tem permissão para gerenciar campanhas.');
            return;
          }
          setIsCampaignsModalOpen(true);
        }}
        onOpenReferenceHubModal={() => setIsReferenceHubModalOpen(true)}
        onOpenAndroidAppModal={() => setIsAndroidAppModalOpen(true)}
        onOpenCarouselAIModal={() => {
          if (!checkPermission('useAI')) {
            alert('Acesso restrito: Você não tem permissão para utilizar ferramentas de Inteligência Artificial.');
            return;
          }
          setComingSoonFeature('carousel_ai');
        }}
        isSimulatedSession={isSimulatedSession}
        onExitSimulation={() => {
          setIsSimulatedSession(false);
          localStorage.removeItem('creator_planner_is_simulating');
          setIsAdminMode(true);
          localStorage.removeItem('creator_planner_logged_in_user');
          setCurrentUser(null);
        }}
        totalPostsCount={totalPostsCount}
        draftCount={draftCount}
        scheduledCount={scheduledCount}
        publishedCount={publishedCount}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* 2. RIGHT MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {activeView === 'editor' ? (
          <PostEditorView
            onBack={() => setActiveView('grid')}
            onSave={handleSavePost}
            onDelete={handleDeletePost}
            postToEdit={editPostTarget}
            initialDate={calendarTargetDate}
            clientId={activeClientId}
            clientName={userClients.find(c => c.id === activeClientId)?.name || 'Cliente'}
            readOnly={trialStatus.isReadOnly}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            onOpenIntegrationsModal={() => setIsIntegrationsModalOpen(true)}
          />
        ) : (
          <>

        {/* 15 Days Free Trial / Expiration Banner */}
        <TrialStatusBanner
          trialStatus={trialStatus}
          currentUser={currentUser}
          clients={clients}
          posts={posts}
          goals={goals}
          onOpenPricingModal={() => setIsPricingModalOpen(true)}
        />

        {/* Global Announcement Banner (Broadcast) */}
        {activeAnnouncement && !dismissedAnnouncement && (
          <div className={`border-b px-6 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-md flex-shrink-0 transition-all ${
            activeAnnouncement.type === 'warning' 
              ? 'bg-amber-950/80 text-amber-200 border-amber-500/30' 
              : activeAnnouncement.type === 'alert'
              ? 'bg-red-950/80 text-red-200 border-red-500/30'
              : 'bg-accent-purple/20 text-purple-200 border-accent-purple/40'
          }`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
              <p className="truncate">
                <strong className="font-bold mr-1">{activeAnnouncement.title}:</strong>
                {activeAnnouncement.message}
              </p>
              {activeAnnouncement.link && (
                <a
                  href={activeAnnouncement.link}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold hover:text-white shrink-0 ml-1 text-[11px]"
                >
                  {activeAnnouncement.linkText || 'Saiba mais'} &rarr;
                </a>
              )}
            </div>
            <button
              onClick={() => setDismissedAnnouncement(true)}
              className="text-zinc-400 hover:text-white shrink-0 p-1 cursor-pointer"
              title="Fechar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {isSimulatedSession && (
          <div className="bg-gradient-to-r from-accent-purple via-accent-orange to-accent-purple border-b border-white/10 px-6 py-2 text-xs text-black font-bold flex flex-wrap items-center justify-between gap-3 shadow-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="font-mono text-[10px] uppercase font-black bg-black text-white px-2 py-0.5 rounded tracking-wide">
                Simulação de Usuário
              </span>
              <span className="text-zinc-950">
                Você está visualizando a plataforma como: <strong className="underline">{currentUser?.name}</strong> ({currentUser?.email})
              </span>
            </div>
            <button
              onClick={() => {
                setIsSimulatedSession(false);
                localStorage.removeItem('creator_planner_is_simulating');
                setIsAdminMode(true);
                localStorage.removeItem('creator_planner_logged_in_user');
                setCurrentUser(null);
              }}
              className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-lg text-[11px] font-mono font-extrabold hover:bg-zinc-900 transition-all cursor-pointer shadow-md border border-white/10"
            >
              <Shield size={12} />
              Voltar para o Painel Admin
            </button>
          </div>
        )}

        {/* Header Filter Bar */}
        <div className="flex-shrink-0">
          <Header
            activePlatform={activePlatform}
            setActivePlatform={setActivePlatform}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
            activeFormat={activeFormat}
            setActiveFormat={setActiveFormat}
            activeView={activeView}
            onNewPostClick={handleOpenCreateDialog}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            currentUser={currentUser}
            activeTeamMembersCount={activeWorkspaceMembers.length || 1}
            isLive={isConnected}
          />
        </div>

        {/* Scrollable Workspace Container */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-y-auto">
          
          {/* Main Workspace Panels */}
          <main className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-5 md:space-y-6 pb-28 lg:pb-8">
          
          {/* Quick Onboarding Success Guide for Customer Experience */}
          <QuickOnboardingGuide
            currentUser={currentUser}
            posts={clientPosts}
            activeClient={userClients.find(c => c.id === activeClientId)}
            onOpenBrandKit={() => setIsBrandKitModalOpen(true)}
            onOpenNewPost={handleOpenCreateDialog}
            onOpenApprovalLink={() => setIsShareApprovalModalOpen(true)}
          />



          {/* Discrete Free Plan Contact Warning Banner */}
          {!currentUser.isTeamMember && (!currentUser.plan || currentUser.plan === 'free') && (
            <div className="p-3.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Sparkles size={14} className="text-accent-orange animate-pulse flex-shrink-0" />
                <p className="text-xs text-zinc-300 font-medium">
                  Deseja acesso aos recursos do plano pro?{' '}
                  <a 
                    href="https://wa.me/5517991951381?text=Ol%C3%A1!%20Gostaria%20de%20acesso%20aos%20recursos%20do%20plano%20Pro%20do%20Planner%20de%20Conte%C3%BAdo%20Multicanal."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-orange hover:text-white font-extrabold underline underline-offset-2 transition-all cursor-pointer"
                  >
                    Clique aqui
                  </a>{' '}
                  e entre em contato com a nossa equipe!
                </p>
              </div>
              <a
                href="https://wa.me/5517991951381?text=Ol%C3%A1!%20Gostaria%20de%20acesso%20aos%20recursos%20do%20plano%20Pro%20do%20Planner%20de%20Conte%C3%BAdo%20Multicanal."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-panel-border text-white text-[10px] font-mono font-bold hover:border-accent-purple transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <span>WhatsApp: (17) 99195-1381</span>
              </a>
            </div>
          )}
          
          {/* Active Filtering Info Label */}
          {(activePlatform !== 'all' || activeStage !== 'all' || activeFormat !== 'all') && (
            <div className="p-3 rounded-xl bg-panel-card/85 border border-panel-border flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                Filtros ativos: {activePlatform !== 'all' ? `Canal ${activePlatform}` : ''}{activeStage !== 'all' ? ` • Funil [${activeStage}]` : ''}{activeFormat !== 'all' ? ` • Formato: ${activeFormat}` : ''}
              </span>
              <button
                onClick={() => {
                  setActivePlatform('all');
                  setActiveStage('all');
                  setActiveFormat('all');
                }}
                className="text-accent-orange font-bold font-mono text-[10px] uppercase tracking-wider hover:underline hover:text-accent-orange-dark cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          )}

          {/* Render Active workspace panel view */}
          <div className="transition-all duration-300">
            {activeView === 'grid' && (
              <div className="space-y-6 animate-fade-in">
                {/* Visual Intro Banner inspired by user attachment */}
                <div className="p-6 bg-gradient-to-r from-panel-card to-panel-black rounded-2xl border border-panel-border flex items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-accent-purple-glow to-transparent pointer-events-none" />
                  <div className="text-left space-y-1.5 max-w-lg">
                    <div className="inline-flex items-center gap-1.5 px-2 bg-accent-purple/10 text-accent-purple border border-accent-purple/20 text-[10px] font-mono rounded">
                      <Sparkles size={11} /> ATALHO DE CREATOR
                    </div>
                    <h2 className="text-lg md:text-xl font-display font-black text-white">
                      Seu Grid Estratégico de Postagens
                    </h2>
                    {clientPosts.length === 0 && (
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Este painel organiza os posts por estágio do funil com ilustrações dedicadas para carrosséis, vídeos longos ou curtos nas cores solicitadas.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleOpenCreateDialog}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 border border-panel-border rounded-xl px-4 py-2 transition-all cursor-pointer"
                  >
                    Novo Item
                  </button>
                </div>

                {/* Thin Orange Card: Detalhes dos planejamentos */}
                <div 
                  onClick={() => setShowStrategicMetrics(!showStrategicMetrics)}
                  className="bg-panel-card border border-accent-orange/40 hover:border-accent-orange px-5 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-md group select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-orange animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-orange">
                      Detalhes dos planejamentos
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                      ({showStrategicMetrics ? 'Ocultar métricas e metas' : 'Clique para expandir métricas e funil'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-accent-orange font-bold font-mono">
                    <span>{showStrategicMetrics ? 'Recolher' : 'Expandir'}</span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${showStrategicMetrics ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showStrategicMetrics && (
                  <StrategicMetricsRow
                    posts={clientPosts}
                    goals={clientGoals}
                    onToggleGoal={handleToggleGoal}
                    onAddGoal={handleAddGoal}
                  />
                )}

                <CardView
                  posts={filteredPosts}
                  onPostClick={handleCardClick}
                  onDeletePost={handleDeletePost}
                  onDuplicatePost={handleDuplicatePost}
                />
              </div>
            )}

            {activeView === 'calendar' && (
              <CalendarView
                posts={filteredPosts}
                onPostClick={handleCardClick}
                onAddPostToDate={handleAddPostToSpecificDate}
                onOpenCampaignsModal={() => setIsCampaignsModalOpen(true)}
              />
            )}

            {activeView === 'kanban' && (
              <KanbanView
                posts={filteredPosts}
                onPostClick={handleCardClick}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {activeView === 'pipeline' && (
              !checkPermission('productionPipeline') ? (
                <div className="p-12 text-center bg-panel-card/60 border border-panel-border rounded-2xl space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-panel-border flex items-center justify-center text-blue-400 mx-auto shadow-inner">
                    <Workflow size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Acesso ao Pipeline Bloqueado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Seu usuário não possui permissão para acessar ou movimentar o Pipeline de Produção neste workspace.
                  </p>
                  <button
                    onClick={() => setActiveView('grid')}
                    className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Voltar para o Grid
                  </button>
                </div>
              ) : (
                <ProductionPipelineView
                  posts={filteredPosts}
                  onOpenPostDialog={handleCardClick}
                  onUpdatePostStage={(postId, stage) => {
                    setPosts(prev => prev.map(p => {
                      if (p.id === postId) {
                        const newStatus: PostStatus = stage === 'published' ? 'published' : stage === 'scheduled' ? 'scheduled' : 'production';
                        return { ...p, productionStage: stage, status: newStatus };
                      }
                      return p;
                    }));
                  }}
                />
              )
            )}

            {activeView === 'dashboard' && (
              !checkPermission('viewMetrics') ? (
                <div className="p-12 text-center bg-panel-card/60 border border-panel-border rounded-2xl space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-panel-border flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                    <BarChart2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Dashboard de Métricas Bloqueado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O administrador do workspace desabilitou a visualização do painel de métricas e conversões para a sua conta.
                  </p>
                  <button
                    onClick={() => setActiveView('grid')}
                    className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Voltar para o Grid
                  </button>
                </div>
              ) : (
                <DashboardView
                  posts={filteredPosts}
                  allPosts={posts.filter(p => p.userId === workspaceOwnerId || !p.userId || p.userId === currentUser?.id)}
                  clients={userClients}
                  activeClient={userClients.find(c => c.id === activeClientId)}
                  activeClientId={activeClientId}
                  onSelectClient={setActiveClientId}
                  onNewPostClick={handleOpenCreateDialog}
                  currentUser={currentUser}
                />
              )
            )}

            {activeView === 'carousel-ai' && (
              !checkPermission('useAI') ? (
                <div className="p-12 text-center bg-panel-card/60 border border-panel-border rounded-2xl space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-panel-border flex items-center justify-center text-purple-400 mx-auto shadow-inner">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Criador IA Bloqueado</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O uso de recursos de Inteligência Artificial está restrito pelo administrador do workspace para o seu usuário.
                  </p>
                  <button
                    onClick={() => setActiveView('grid')}
                    className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Voltar para o Grid
                  </button>
                </div>
              ) : (
                <CarouselAICreatorModal
                  isPageView={true}
                  userPlan={currentUser?.plan || 'free'}
                  isTeamMember={currentUser?.isTeamMember || false}
                  userId={currentUser?.id}
                  onOpenPricing={() => setIsTeamModalOpen(true)}
                  onCreatePost={(postData) => {
                    if (!currentUser || !workspaceOwnerId) return;
                    const newPost: Post = {
                      id: `post_${Date.now()}`,
                      userId: workspaceOwnerId,
                      clientId: activeClientId,
                      title: postData.title || 'Carrossel IA',
                      platform: postData.platform || 'instagram',
                      format: postData.format || 'carousel',
                      funnelStage: postData.funnelStage || 'MOFU',
                      status: postData.status || 'draft',
                      scheduledDate: postData.scheduledDate || '2026-06-14',
                      scheduledTime: postData.scheduledTime || '18:00',
                      description: postData.description || '',
                      hashtags: postData.hashtags || [],
                      hookText: postData.hookText || '',
                      scriptText: postData.scriptText || '',
                      visualIdea: postData.visualIdea || ''
                    };
                    setPosts([newPost, ...posts]);
                    setEditPostTarget(newPost);
                    setActiveView('editor');
                  }}
                />
              )
            )}

            {activeView === 'creatives' && (
              !checkPermission('creativeHub') ? (
                <div className="p-12 text-center bg-panel-card/60 border border-panel-border rounded-2xl space-y-4 max-w-lg mx-auto my-12 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-panel-border flex items-center justify-center text-pink-400 mx-auto shadow-inner">
                    <ImageIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Central de Criativos Bloqueada</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Você não tem permissão para visualizar ou gerenciar a central de criativos de mídia e anúncios neste workspace.
                  </p>
                  <button
                    onClick={() => setActiveView('grid')}
                    className="px-4 py-2 rounded-xl bg-accent-purple text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Voltar para o Grid
                  </button>
                </div>
              ) : (
                <CreativeHubView
                  clients={userClients}
                  activeClientId={activeClientId}
                  currentUser={currentUser}
                  onOpenPricing={() => setIsPricingModalOpen(true)}
                />
              )
            )}

            {activeView === 'scheduling' && (
              <SchedulingHubView
                posts={clientPosts}
                currentUser={currentUser}
                activeClient={userClients.find(c => c.id === activeClientId)}
                onUpdatePost={(updatedPost) => {
                  setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
                }}
                onAddPost={(newPost) => {
                  setPosts([newPost, ...posts]);
                }}
              />
            )}
          </div>

        </main>

        {/* Workspace Sidebar (Goals, funnel ratio, template generator) */}
        {activeView === 'grid' && (
          <Sidebar
            posts={clientPosts}
            goals={clientGoals}
            userPlan={currentUser?.plan || 'free'}
            isTeamMember={currentUser?.isTeamMember || false}
            userId={currentUser?.id}
            onOpenPricing={() => setIsTeamModalOpen(true)}
            onToggleGoal={handleToggleGoal}
            onAddQuickPost={handleAddQuickPost}
            onAddGoal={handleAddGoal}
            onCreatePostFromAI={(ideasInput) => {
              if (!currentUser || !workspaceOwnerId) return;
              const items = Array.isArray(ideasInput) ? ideasInput : [ideasInput];
              const newPosts: Post[] = items.map((idea, index) => ({
                id: `post_${Date.now()}_${index}`,
                userId: workspaceOwnerId,
                clientId: activeClientId,
                title: idea.title || 'Novo Post com IA',
                platform: idea.platform || 'instagram',
                format: idea.format || 'reels',
                funnelStage: idea.funnelStage || 'TOFU',
                status: idea.status || 'draft',
                scheduledDate: idea.scheduledDate || '2026-06-14',
                scheduledTime: idea.scheduledTime || '18:00',
                description: idea.scriptText || idea.description || '',
                hashtags: idea.hashtags || [],
                hookText: idea.hookText || '',
                scriptText: idea.scriptText || '',
                visualIdea: idea.visualIdea || ''
              }));

              const updated = [...newPosts, ...posts];
              setPosts(updated);
              if (newPosts.length === 1) {
                setEditPostTarget(newPosts[0]);
                setActiveView('editor');
              }
            }}
          />
        )}

        </div>

        {/* 4. MODAL DIALOG CONTROLLER OVERLAY */}
        <PostDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSavePost}
          onDelete={handleDeletePost}
          postToEdit={editPostTarget}
          initialDate={calendarTargetDate}
        />

        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          currentUser={currentUser}
          users={users}
          onUpdateUserPlan={handleUpdateUserPlan}
          onUpdateMemberPermissions={handleUpdateMemberPermissions}
          onRemoveMember={handleRemoveMember}
        />

        <SupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          currentUser={currentUser}
        />

        <LGPDModal
          isOpen={isLGPDModalOpen}
          onClose={() => setIsLGPDModalOpen(false)}
          currentUser={currentUser}
          clients={clients}
          posts={posts}
          goals={goals}
          onDeleteAccount={handleDeleteAccount}
          onScheduleCancellation={handleScheduleCancellation}
        />

        <DemoNoticeModal
          isOpen={showDemoNotice}
          onClose={() => setShowDemoNotice(false)}
          onSignUp={() => {
            setShowDemoNotice(false);
            setCurrentUser(null);
            localStorage.removeItem('creator_planner_logged_in_user');
            setOpenSignUpOnLanding(true);
          }}
        />

        <IntegrationsModal
          isOpen={isIntegrationsModalOpen}
          onClose={() => setIsIntegrationsModalOpen(false)}
          userId={currentUser ? currentUser.id : ''}
          userEmail={currentUser ? currentUser.email : ''}
        />

        <BrandKitModal
          isOpen={isBrandKitModalOpen}
          onClose={() => setIsBrandKitModalOpen(false)}
          clientId={activeClientId}
          clientName={userClients.find(c => c.id === activeClientId)?.name || 'Cliente'}
        />

        <HashtagLibraryModal
          isOpen={isHashtagModalOpen}
          onClose={() => setIsHashtagModalOpen(false)}
        />

        <CampaignsModal
          isOpen={isCampaignsModalOpen}
          onClose={() => setIsCampaignsModalOpen(false)}
          clientId={activeClientId}
          clientName={userClients.find(c => c.id === activeClientId)?.name || 'Cliente'}
        />

        <ReferenceHubModal
          isOpen={isReferenceHubModalOpen}
          onClose={() => setIsReferenceHubModalOpen(false)}
          clientId={activeClientId}
          clientName={userClients.find(c => c.id === activeClientId)?.name || 'Cliente'}
        />

        <AndroidAppModal
          isOpen={isAndroidAppModalOpen}
          onClose={() => setIsAndroidAppModalOpen(false)}
        />

        {/* 15 Days Free Trial Expired Warning & Data Export Modal */}
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={() => setShowTrialExpiredModal(false)}
          currentUser={currentUser}
          clients={clients}
          posts={posts}
          goals={goals}
          onOpenPricing={() => {
            setShowTrialExpiredModal(false);
            setIsPricingModalOpen(true);
          }}
          trialStatus={trialStatus}
        />

        {/* Dedicated Pricing & Stripe Checkout Modal */}
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          currentUser={currentUser}
          onPlanUpdated={(newPlan) => {
            handleUpdateUserPlan(newPlan);
            setIsPricingModalOpen(false);
          }}
        />

        {/* Coming Soon Feature Modal */}
        <ComingSoonModal
          isOpen={comingSoonFeature !== null}
          onClose={() => setComingSoonFeature(null)}
          featureType={comingSoonFeature || 'general'}
        />

        {/* Client Share Approval Link Modal */}
        <ShareApprovalModal
          isOpen={isShareApprovalModalOpen}
          onClose={() => setIsShareApprovalModalOpen(false)}
          posts={clientPosts}
          client={userClients.find(c => c.id === activeClientId)}
        />

        {/* Floating Quick Action Speed Dial Button */}
        <FloatingQuickAction
          onNewPost={handleOpenCreateDialog}
          onOpenApprovalLink={() => setIsShareApprovalModalOpen(true)}
          onOpenBrandKit={() => setIsBrandKitModalOpen(true)}
          onOpenCampaigns={() => setIsCampaignsModalOpen(true)}
          onOpenReferenceHub={() => setIsReferenceHubModalOpen(true)}
        />

        {/* Floating Real-Time Workspace Activity Toast */}
        {liveSyncToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce-in bg-panel-card/95 border border-accent-purple/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs max-w-sm pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-semibold text-zinc-100">{liveSyncToast.message}</span>
          </div>
        )}

        {/* 5. FOOTER */}
        <footer className="border-t border-panel-border/80 bg-panel-black py-4 text-center text-[11px] text-zinc-600 font-mono flex-shrink-0 mb-14 lg:mb-0">
          <p>Planner de Conteúdo Multicanal v2026 • Cores personalizadas em Roxo, Laranja, Preto & Branco</p>
        </footer>

        {/* 6. MOBILE BOTTOM NAVIGATION BAR FOR ANDROID & MOBILE PHONES */}
        <MobileBottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          onNewPostClick={handleOpenCreateDialog}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
        />

        </>
        )}

      </div>

    </div>
  );
}
