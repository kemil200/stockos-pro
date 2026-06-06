'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();
  const { data } = await admin
    .from('cat_lookup')
    .select('id, name')
    .eq('shop_id', shop.id)
    .order('name');
  return data ?? [];
}

export async function upsertCategory(name: string) {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing } = await admin
    .from('cat_lookup')
    .select('id')
    .eq('shop_id', shop.id)
    .eq('name', trimmed)
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error } = await admin
    .from('cat_lookup')
    .insert({ shop_id: shop.id, name: trimmed })
    .select('id')
    .single();

  if (error) return null;
  return created?.id ?? null;
}
