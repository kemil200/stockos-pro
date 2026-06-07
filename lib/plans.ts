import 'server-only';

import { createAdminClient } from '@/lib/server';

export type PlanName = 'STARTER' | 'ESSENTIAL' | 'BUSINESS' | 'TRIAL';

interface PlanConfig {
  maxUsers: number;
  maxRegisters: number;
  packs: boolean;
  reports: 'basic' | 'advanced';
  thermalPrinter: boolean;
  apiAccess: boolean;
}

const PLAN_FEATURES: Record<PlanName, PlanConfig> = {
  STARTER: {
    maxUsers: 1,
    maxRegisters: 0,
    packs: false,
    reports: 'basic',
    thermalPrinter: true,
    apiAccess: false,
  },
  ESSENTIAL: {
    maxUsers: 1,
    maxRegisters: 1,
    packs: true,
    reports: 'advanced',
    thermalPrinter: true,
    apiAccess: false,
  },
  BUSINESS: {
    maxUsers: Infinity,
    maxRegisters: Infinity,
    packs: true,
    reports: 'advanced',
    thermalPrinter: true,
    apiAccess: true,
  },
  TRIAL: {
    maxUsers: 1,
    maxRegisters: 1,
    packs: true,
    reports: 'advanced',
    thermalPrinter: true,
    apiAccess: false,
  },
};

export class PlanLimitError extends Error {
  constructor(feature: string, limit: number) {
    super(`Limite du plan atteinte : ${feature} (max: ${limit})`);
    this.name = 'PlanLimitError';
  }
}

async function getSubscription(shopId: string) {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from('subscriptions')
    .select('plan, status, features')
    .eq('shop_id', shopId)
    .limit(1);
  return subs?.[0] ?? null;
}

export async function getPlanConfig(shopId: string): Promise<PlanConfig> {
  const sub = await getSubscription(shopId);
  const plan = (sub?.plan as PlanName) || 'TRIAL';
  return PLAN_FEATURES[plan] || PLAN_FEATURES.TRIAL;
}

export async function checkPlanLimit(shopId: string, feature: 'maxUsers' | 'maxRegisters'): Promise<{ allowed: boolean; limit: number; current: number }> {
  const config = await getPlanConfig(shopId);
  const admin = createAdminClient();

  let current = 0;
  if (feature === 'maxUsers') {
    const { count } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    current = count ?? 0;
  } else if (feature === 'maxRegisters') {
    const { count } = await admin
      .from('cash_registers')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    current = count ?? 0;
  }

  const limit = config[feature];
  return { allowed: current < limit, limit, current };
}

export async function assertPlanLimit(shopId: string, feature: 'maxUsers' | 'maxRegisters'): Promise<void> {
  const { allowed, limit, current } = await checkPlanLimit(shopId, feature);
  if (!allowed) {
    throw new PlanLimitError(feature, limit);
  }
}

export async function hasFeature(shopId: string, feature: keyof PlanConfig): Promise<boolean> {
  const config = await getPlanConfig(shopId);
  return !!config[feature];
}
