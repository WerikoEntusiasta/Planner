/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Platform = 'instagram' | 'tiktok' | 'youtube';

export type ContentFormat = 'reels' | 'shorts' | 'video' | 'carousel' | 'stories' | 'live' | 'email' | 'ad' | 'landing_page';

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export type PostStatus = 'draft' | 'production' | 'scheduled' | 'published';

export type ProductionStage = 'idea' | 'script' | 'recording' | 'editing' | 'approved' | 'scheduled' | 'published';

export type TeamRole = 'gestor' | 'redator' | 'designer' | 'social_media' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Optional legacy field, never stored in localStorage
  token?: string; // Secure signed session token
  createdAt: string;
  plan?: 'free' | 'starter' | 'basic' | 'pro' | 'growth';
  billingCycle?: 'monthly' | 'quarterly';
  scheduledTerminationDate?: string;
  isTeamMember?: boolean;
  invitedByUserId?: string;
  role?: TeamRole;
  permissions?: {
    createCards?: boolean;
    editCards?: boolean;
    deleteCards?: boolean;
    manageClients?: boolean;
  };
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
}

export interface Post {
  id: string;
  clientId: string;
  userId?: string;
  title: string;
  platform: Platform;
  format: ContentFormat;
  funnelStage: FunnelStage;
  status: PostStatus;
  productionStage?: ProductionStage;
  assignedRole?: TeamRole;
  assignedToUser?: string;
  campaignId?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  description?: string;
  hashtags?: string[];
  hookText?: string;
  scriptText?: string;
  visualIdea?: string;
  approvalStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  approvalFeedback?: string;
  approvalDate?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  category: 'bug' | 'duvida' | 'financeiro' | 'outro';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  adminReply?: string;
  createdAt: string;
}

export interface WeeklyGoal {
  id: string;
  clientId: string;
  userId?: string;
  title: string;
  targetCount: number;
  currentCount: number;
  platform: Platform;
  completed: boolean;
}

export interface HashtagGroup {
  id: string;
  name: string;
  category: string;
  tags: string[];
}

export interface BrandKit {
  clientId: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  toneOfVoice: string;
  targetAudience: string;
  tagline: string;
  driveFolderUrl?: string;
}

export interface CampaignItem {
  id: string;
  title: string;
  type: 'post' | 'story' | 'email' | 'landing_page' | 'ad';
  status: 'pending' | 'in_progress' | 'ready';
  notes?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  items: CampaignItem[];
}

export interface ReferenceItem {
  id: string;
  clientId: string;
  folderName: string;
  title: string;
  url?: string;
  notes?: string;
  type: 'link' | 'video' | 'image' | 'post' | 'text';
  createdAt: string;
}

export interface HolidayEvent {
  id: string;
  date: string; // MM-DD or YYYY-MM-DD
  title: string;
  category: 'comemorativa' | 'nicho' | 'lancamento' | 'evento';
  suggestionHook: string;
  funnelStage: FunnelStage;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  applicablePlans?: ('starter' | 'basic' | 'pro' | 'growth')[] | 'all';
  applicableCycles?: ('monthly' | 'quarterly')[] | 'all';
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  link?: string;
  linkText?: string;
  isActive: boolean | number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  category: string;
  adminUser: string;
  timestamp: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: 'free' | 'starter' | 'basic' | 'pro' | 'growth';
  isTeamMember: boolean;
  invitedByUserId?: string | null;
  createdAt: string;
  clientCount: number;
  postCount: number;
}


