'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';

export async function getCashMovementsFull() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data } = await admin
    .from('cash_movements')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}
