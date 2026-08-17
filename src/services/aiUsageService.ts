export interface AIQuotaStatus {
  allowed: boolean;
  isUnlimited?: boolean;
  reason?: 'plan_required' | 'limit_5h' | 'limit_week' | 'limit_month';
  message: string;
  count5h: number;
  max5h: number;
  countWeek: number;
  maxWeek: number;
  countMonth: number;
  maxMonth: number;
  remaining5h: number;
  remainingWeek: number;
  remainingMonth: number;
  resetTimeFormatted: string;
  planMultiplier: number;
}

export const AI_BASE_LIMITS = {
  WINDOW_5H_MS: 5 * 60 * 60 * 1000,
  WINDOW_WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  WINDOW_MONTH_MS: 30 * 24 * 60 * 60 * 1000,
  MAX_5H: 20,
  MAX_WEEK: 500,
  MAX_MONTH: 2000,
};

export function getPlanLimits(userPlan?: string) {
  const plan = (userPlan || 'free').toLowerCase();
  let multiplier = 1;
  let isUnlimited = false;

  if (plan === 'growth' || plan === 'enterprise' || plan === 'admin') {
    multiplier = 10;
    isUnlimited = true; // Growth PRO: Sem limites de planejamento
  } else if (plan === 'pro') {
    multiplier = 3; // 3x no plano Pro (60 req / 5h, 1.500 / semana, 6.000 / mês)
  } else if (plan === 'basic') {
    multiplier = 1; // 1x no plano Basic (20 req / 5h, 500 / semana, 2.000 / mês)
  } else {
    multiplier = 1;
  }

  return {
    multiplier,
    isUnlimited,
    max5h: AI_BASE_LIMITS.MAX_5H * multiplier,
    maxWeek: AI_BASE_LIMITS.MAX_WEEK * multiplier,
    maxMonth: AI_BASE_LIMITS.MAX_MONTH * multiplier,
  };
}

const STORAGE_KEY_PREFIX = 'planner_ai_usage_timestamps_';

function getStorageKey(userId?: string): string {
  return `${STORAGE_KEY_PREFIX}${userId || 'anonymous'}`;
}

export function getUsageTimestamps(userId?: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const list: number[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out records older than 30 days
    const valid = list.filter(ts => typeof ts === 'number' && now - ts <= AI_BASE_LIMITS.WINDOW_MONTH_MS);
    if (valid.length !== list.length) {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(valid));
    }
    return valid;
  } catch (e) {
    return [];
  }
}

export function checkAIQuota(userPlan?: string, isTeamMember?: boolean, userId?: string): AIQuotaStatus {
  const plan = (userPlan || 'free').toLowerCase();
  
  // Free and Starter do not have AI access
  const isPlanAllowed = ['basic', 'pro', 'growth', 'enterprise', 'admin'].includes(plan);
  const { multiplier, isUnlimited, max5h, maxWeek, maxMonth } = getPlanLimits(userPlan);

  const now = Date.now();
  const timestamps = getUsageTimestamps(userId);

  const list5h = timestamps.filter(ts => now - ts <= AI_BASE_LIMITS.WINDOW_5H_MS);
  const listWeek = timestamps.filter(ts => now - ts <= AI_BASE_LIMITS.WINDOW_WEEK_MS);
  const listMonth = timestamps.filter(ts => now - ts <= AI_BASE_LIMITS.WINDOW_MONTH_MS);

  const count5h = list5h.length;
  const countWeek = listWeek.length;
  const countMonth = listMonth.length;

  const remaining5h = isUnlimited ? 9999 : Math.max(0, max5h - count5h);
  const remainingWeek = isUnlimited ? 99999 : Math.max(0, maxWeek - countWeek);
  const remainingMonth = isUnlimited ? 999999 : Math.max(0, maxMonth - countMonth);

  // Calculate next reset time for the 5-hour window
  let resetTimeFormatted = 'em 5 horas';
  if (list5h.length > 0) {
    const oldestIn5h = Math.min(...list5h);
    const diffMs = (oldestIn5h + AI_BASE_LIMITS.WINDOW_5H_MS) - now;
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      const mins = Math.ceil((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      if (hours > 0) {
        resetTimeFormatted = `em ${hours}h ${mins}m`;
      } else {
        resetTimeFormatted = `em ${mins} min`;
      }
    } else {
      resetTimeFormatted = 'em instantes';
    }
  }

  if (!isPlanAllowed) {
    return {
      allowed: false,
      reason: 'plan_required',
      message: 'O acesso à Inteligência Artificial está disponível a partir do Plano Basic (R$ 29,00/mês). Faça upgrade para desbloquear!',
      count5h,
      max5h,
      countWeek,
      maxWeek,
      countMonth,
      maxMonth,
      remaining5h: 0,
      remainingWeek: 0,
      remainingMonth: 0,
      resetTimeFormatted,
      planMultiplier: multiplier,
      isUnlimited: false,
    };
  }

  // Growth has unlimited access (never blocked)
  if (isUnlimited) {
    return {
      allowed: true,
      isUnlimited: true,
      message: 'IA de Planejamento sem limites (Growth PRO)',
      count5h,
      max5h,
      countWeek,
      maxWeek,
      countMonth,
      maxMonth,
      remaining5h,
      remainingWeek,
      remainingMonth,
      resetTimeFormatted,
      planMultiplier: multiplier,
    };
  }

  if (count5h >= max5h) {
    return {
      allowed: false,
      reason: 'limit_5h',
      message: `Limite de ${max5h} requisições a cada 5 horas atingido. Sua cota será renovada ${resetTimeFormatted}.`,
      count5h,
      max5h,
      countWeek,
      maxWeek,
      countMonth,
      maxMonth,
      remaining5h: 0,
      remainingWeek,
      remainingMonth,
      resetTimeFormatted,
      planMultiplier: multiplier,
      isUnlimited: false,
    };
  }

  if (countWeek >= maxWeek) {
    return {
      allowed: false,
      reason: 'limit_week',
      message: `Limite semanal de ${maxWeek.toLocaleString()} requisições atingido. Aguarde a renovação da janela semanal.`,
      count5h,
      max5h,
      countWeek,
      maxWeek,
      countMonth,
      maxMonth,
      remaining5h,
      remainingWeek: 0,
      remainingMonth,
      resetTimeFormatted,
      planMultiplier: multiplier,
      isUnlimited: false,
    };
  }

  if (countMonth >= maxMonth) {
    return {
      allowed: false,
      reason: 'limit_month',
      message: `Limite mensal de ${maxMonth.toLocaleString()} requisições atingido. Aguarde a renovação da sua assinatura no próximo ciclo.`,
      count5h,
      max5h,
      countWeek,
      maxWeek,
      countMonth,
      maxMonth,
      remaining5h,
      remainingWeek,
      remainingMonth: 0,
      resetTimeFormatted,
      planMultiplier: multiplier,
      isUnlimited: false,
    };
  }

  return {
    allowed: true,
    message: 'Cota disponível',
    count5h,
    max5h,
    countWeek,
    maxWeek,
    countMonth,
    maxMonth,
    remaining5h,
    remainingWeek,
    remainingMonth,
    resetTimeFormatted,
    planMultiplier: multiplier,
    isUnlimited: false,
  };
}

export function consumeAIQuota(userPlan?: string, isTeamMember?: boolean, userId?: string, count: number = 1): { success: boolean; status: AIQuotaStatus } {
  const status = checkAIQuota(userPlan, isTeamMember, userId);
  if (!status.allowed) {
    return { success: false, status };
  }

  if (typeof window !== 'undefined') {
    try {
      const timestamps = getUsageTimestamps(userId);
      const now = Date.now();
      for (let i = 0; i < count; i++) {
        timestamps.push(now + i);
      }
      localStorage.setItem(getStorageKey(userId), JSON.stringify(timestamps));
    } catch (e) {
      console.warn('Could not persist AI usage:', e);
    }
  }

  const updatedStatus = checkAIQuota(userPlan, isTeamMember, userId);
  return { success: true, status: updatedStatus };
}
