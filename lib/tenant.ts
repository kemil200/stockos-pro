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

  const { data: shopUsers } = await admin
    .from('users')
    .select('shop_id, role, display_name, email, id')
    .eq('auth_user_id', user.id);

  const shopUser = shopUsers?.[0] ?? null;
  if (!shopUser) throw new TenantError('User not found in shop');

  const { data: shops } = await admin
    .from('shops')
    .select('*')
    .eq('id', shopUser.shop_id)
    .limit(1);

  const shop = shops?.[0] ?? null;
  if (!shop) throw new TenantError('Shop not found');

  return { shop, user: shopUser };
}

export async function getShopById(shopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new TenantError('Unauthorized');

  if (user.app_metadata?.role === 'SUPERADMIN') {
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

  const admin = createAdminClient();
  const { data: shopUsers } = await admin
    .from('users')
    .select('shop_id')
    .eq('auth_user_id', user.id);

  const userShopId = shopUsers?.[0]?.shop_id;
  if (!userShopId || userShopId !== shopId) {
    throw new TenantError('Access denied');
  }

  const { data: shops } = await admin
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .limit(1);

  const shop = shops?.[0] ?? null;
  if (!shop) throw new TenantError('Shop not found');
  return shop;
}
