import 'server-only';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { shops, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';

export class TenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantError';
  }
}

export async function getCurrentShop() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.session.activeOrganizationId) {
    throw new TenantError('Unauthorized');
  }

  const { user: authUser, session: authSession } = session;
  const orgId = authSession.activeOrganizationId;
  if (!orgId) throw new TenantError('No organization');

  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.clerkOrgId, orgId));

  if (!shop) throw new TenantError('Shop not found');

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.clerkUserId, authUser.id), eq(users.shopId, shop.id)));

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
