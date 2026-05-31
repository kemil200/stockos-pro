import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { shops, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export class TenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantError';
  }
}

export async function getCurrentShop() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new TenantError('Unauthorized');

  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.userId, user.id));

  if (!shop) throw new TenantError('Shop not found');

  const [shopUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.authUserId, user.id), eq(users.shopId, shop.id)));

  if (!shopUser) throw new TenantError('User not found in shop');

  return { shop, user: shopUser };
}

export async function getShopById(shopId: string) {
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId));

  if (!shop) throw new TenantError('Shop not found');
  return shop;
}
