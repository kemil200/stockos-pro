'use server';

import { createAdminClient } from '@/lib/server';

export async function updateSubscription(
  shopId: string,
  data: { status?: string; plan?: string; current_period_end?: string },
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('subscriptions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);
}

export async function renewSubscription(shopId: string, months: number) {
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('subscriptions')
    .select('current_period_end')
    .eq('shop_id', shopId)
    .limit(1);

  const currentEnd = subs?.[0]?.current_period_end
    ? new Date(subs[0].current_period_end)
    : new Date();

  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + months);

  const { error } = await admin
    .from('subscriptions')
    .update({
      status: 'ACTIVE',
      plan: months >= 12 ? 'ANNUAL' : 'MONTHLY',
      current_period_end: newEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId);

  if (error) throw new Error(error.message);
}

export async function toggleReadOnly(shopId: string, readOnly: boolean) {
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
}

export async function deleteShop(shopId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('shops').delete().eq('id', shopId);
  if (error) throw new Error(error.message);
}
