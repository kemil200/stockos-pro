'use server';

import { createClient, createAdminClient } from '@/lib/server';
import { auditLog, AuditAction } from '@/lib/audit';

async function assertSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  if (user.app_metadata?.role !== 'SUPERADMIN') throw new Error('Accès refusé : SUPERADMIN requis');
  return user;
}

export async function updateSubscription(
  shopId: string,
  data: { status?: string; plan?: string; current_period_end?: string },
) {
  const user = await assertSuperadmin();
  const admin = createAdminClient();

  const { data: prev } = await admin.from('subscriptions').select('plan, status').eq('shop_id', shopId).single();

  const { error } = await admin
    .from('subscriptions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);

  try {
    await auditLog({
      shopId,
      userId: user.id,
      action: AuditAction.SUBSCRIPTION_UPDATED,
      entityType: 'subscription',
      entityId: shopId,
      metadata: { from: prev || {}, to: data, by: user.email },
    });
  } catch { /* non-bloquant */ }
}

export async function renewSubscription(shopId: string, months: number) {
  const user = await assertSuperadmin();
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('current_period_end, plan, status')
    .eq('shop_id', shopId)
    .limit(1);

  const prev: any = subs?.[0] || {};
  const currentEnd = prev.current_period_end ? new Date(prev.current_period_end) : new Date();

  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + months);

  const newPlan = months >= 12 ? 'BUSINESS' : 'ESSENTIAL';

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'ACTIVE',
      plan: newPlan,
      current_period_end: newEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);

  try {
    await auditLog({
      shopId,
      userId: user.id,
      action: AuditAction.PLAN_CHANGED,
      entityType: 'subscription',
      entityId: shopId,
      metadata: { from: { plan: prev.plan, status: prev.status }, to: { plan: newPlan, status: 'ACTIVE', months }, by: user.email },
    });
  } catch { /* non-bloquant */ }
}

export async function setPlan(shopId: string, plan: string, months: number) {
  const user = await assertSuperadmin();
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('current_period_end, plan, status')
    .eq('shop_id', shopId)
    .limit(1);

  const prev: any = subs?.[0] || {};
  const currentEnd = prev.current_period_end ? new Date(prev.current_period_end) : new Date();

  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + months);

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'ACTIVE',
      plan,
      current_period_end: newEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);

  try {
    await auditLog({
      shopId,
      userId: user.id,
      action: AuditAction.PLAN_CHANGED,
      entityType: 'subscription',
      entityId: shopId,
      metadata: { from: { plan: prev.plan, status: prev.status }, to: { plan, status: 'ACTIVE', months }, by: user.email },
    });
  } catch { /* non-bloquant */ }
}

export async function toggleReadOnly(shopId: string, readOnly: boolean) {
  const user = await assertSuperadmin();
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('features')
    .eq('shop_id', shopId)
    .limit(1);

  const currentFeatures = (subs?.[0]?.features as Record<string, unknown>) ?? {};
  const newFeatures = { ...currentFeatures, readOnly };

  const { error } = await admin
    .from('subscriptions')
    .update({
      features: newFeatures,
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);

  try {
    await auditLog({
      shopId,
      userId: user.id,
      action: readOnly ? AuditAction.SUBSCRIPTION_UPDATED : AuditAction.SHOP_UPDATED,
      entityType: 'subscription',
      entityId: shopId,
      metadata: { feature: 'readOnly', from: !!currentFeatures.readOnly, to: readOnly, by: user.email },
    });
  } catch { /* non-bloquant */ }
}

export async function deleteShop(shopId: string) {
  const user = await assertSuperadmin();
  const admin = createAdminClient();

  const { data: shop } = await admin.from('shops').select('name, slug').eq('id', shopId).single();

  const { error } = await admin.from('shops').delete().eq('id', shopId);
  if (error) throw new Error(error.message);

  try {
    await auditLog({
      shopId: null as any,
      userId: user.id,
      action: AuditAction.SHOP_DELETED,
      entityType: 'shop',
      entityId: shopId,
      metadata: { shopName: shop?.name, shopSlug: shop?.slug, by: user.email },
    });
  } catch { /* non-bloquant */ }
}
