import 'server-only';

import { createClient, createAdminClient } from '@/lib/server';

export class TenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantError';
  }
}

export async function getCurrentShop() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new TenantError('Unauthorized');

  const admin = createAdminClient();

  const [{ data: shops }, { data: shopUsers }] = await Promise.all([
    admin.from('shops').select('*').eq('user_id', user.id).limit(1),
    admin.from('users').select('*').eq('auth_user_id', user.id),
  ]);

  const shop = shops?.[0] ?? null;
  if (!shop) throw new TenantError('Shop not found');

  const shopUser = shopUsers?.[0] ?? null;
  if (!shopUser) throw new TenantError('User not found in shop');

  return { shop, user: shopUser };
}

export async function getShopById(shopId: string) {
  const admin = createAdminClient();

  const { data: shops } = await admin
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .limit(1);

  const shop = shops?.[0] ?? null;
  if (!shop) throw new TenantError('Shop not found');
  return shop;
}
