import 'server-only';

import { auth } from '@clerk/nextjs/server';
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
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new TenantError('Unauthorized');

  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.clerkOrgId, orgId));

  if (!shop) throw new TenantError('Shop not found');

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.clerkUserId, userId), eq(users.shopId, shop.id)));

  if (!user) throw new TenantError('User not found in shop');

  return { shop, user };
}

export async function getShopById(shopId: string) {
  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId));

  if (!shop) throw new TenantError('Shop not found');
  return shop;
}
