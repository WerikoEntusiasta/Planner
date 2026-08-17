/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Client, Post, WeeklyGoal } from '../types';

export interface TrialStatus {
  isTrial: boolean;
  isExpired: boolean;
  isReadOnly: boolean;
  daysLeft: number;
  isLifetimeFree: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth';
}

/**
 * Calculates the 15-day free trial status for a user.
 * - Free plan ('free' / 'gratis') is LIFETIME (vitalício) and never expires.
 * - Paid plans (starter, basic, pro, growth) have a 15-day trial period unless marked as `isPaid: true`.
 * - When expired without payment, `isReadOnly` is set to true.
 */
export function getUserTrialStatus(user?: User | null): TrialStatus {
  const currentPlan = (user?.plan || 'free') as 'free' | 'starter' | 'basic' | 'pro' | 'growth';

  // Admin user is always unrestricted
  if (!user || user.id === 'admin') {
    return {
      isTrial: false,
      isExpired: false,
      isReadOnly: false,
      daysLeft: 0,
      isLifetimeFree: false,
      plan: 'growth',
    };
  }

  // Free plan is lifetime (Vitalício)
  if (currentPlan === 'free' || (user.plan as string) === 'gratis') {
    return {
      isTrial: false,
      isExpired: false,
      isReadOnly: false,
      daysLeft: 0,
      isLifetimeFree: true,
      plan: 'free',
    };
  }

  // If user has paid via Stripe or is an active subscriber
  if (user.isPaid) {
    return {
      isTrial: false,
      isExpired: false,
      isReadOnly: false,
      daysLeft: 0,
      isLifetimeFree: false,
      plan: currentPlan,
    };
  }

  // User is on a paid plan (starter, basic, pro, growth) in trial mode
  const now = Date.now();
  const trialDurationMs = 15 * 24 * 60 * 60 * 1000; // 15 days in ms

  let startMs: number;
  if (user.trialStartDate) {
    startMs = new Date(user.trialStartDate).getTime();
  } else if (user.createdAt) {
    startMs = new Date(user.createdAt).getTime();
  } else {
    startMs = now;
  }

  let endMs: number;
  if (user.trialEndDate) {
    endMs = new Date(user.trialEndDate).getTime();
  } else {
    endMs = startMs + trialDurationMs;
  }

  const msRemaining = endMs - now;
  const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpired = msRemaining <= 0;

  return {
    isTrial: true,
    isExpired,
    isReadOnly: isExpired,
    daysLeft,
    isLifetimeFree: false,
    trialStartDate: new Date(startMs).toISOString(),
    trialEndDate: new Date(endMs).toISOString(),
    plan: currentPlan,
  };
}

/**
 * Downloads a complete JSON backup of all workspace items (posts, clients, goals, metadata)
 */
export function exportWorkspaceData(data: {
  user?: User | null;
  clients: Client[];
  posts: Post[];
  goals: WeeklyGoal[];
  metadata?: any;
}) {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    system: 'Content Planner SaaS',
    version: '2026.1',
    user: data.user ? {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      plan: data.user.plan,
      createdAt: data.user.createdAt,
    } : null,
    summary: {
      totalClients: data.clients.length,
      totalPosts: data.posts.length,
      totalGoals: data.goals.length,
    },
    clients: data.clients,
    posts: data.posts,
    goals: data.goals,
    metadata: data.metadata || {},
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const safeUserName = (data.user?.name || 'usuario').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  const fileName = `planner_backup_${safeUserName}_${dateStamp}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a CSV summary of all workspace posts
 */
export function exportPostsCSV(posts: Post[], clients: Client[]) {
  const headers = ['ID', 'Cliente/Marca', 'Título', 'Plataforma', 'Formato', 'Etapa Funil', 'Status', 'Data Agendada', 'Horário', 'Descrição / Legenda', 'Roteiro', 'Hashtags'];
  
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const rows = posts.map(p => [
    p.id,
    `"${(clientMap.get(p.clientId) || 'Cliente').replace(/"/g, '""')}"`,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    p.platform || '',
    p.format || '',
    p.funnelStage || '',
    p.status || '',
    p.scheduledDate || '',
    p.scheduledTime || '',
    `"${(p.description || '').replace(/"/g, '""')}"`,
    `"${(p.scriptText || '').replace(/"/g, '""')}"`,
    `"${(p.hashtags || []).join(', ').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const dateStamp = new Date().toISOString().split('T')[0];
  const fileName = `planner_posts_csv_${dateStamp}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
