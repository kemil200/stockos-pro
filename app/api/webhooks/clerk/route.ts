import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClerkClient } from '@clerk/backend';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { shops, users, invoiceSettings, subscriptions, shopSettings } from '@/lib/db/schema';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return Response.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    const payload = await req.text();
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type === 'organization.created') {
    const { id, name, slug } = evt.data;

    const [shop] = await db
      .insert(shops)
      .values({ name: name || slug || 'New Shop', slug: slug || id, clerkOrgId: id })
      .returning();

    await db.insert(shopSettings).values({
      shopId: shop.id,
      legalName: name || 'New Shop',
      email: '',
      phone: '',
    });

    await db.insert(invoiceSettings).values({ shopId: shop.id });

    await db.insert(subscriptions).values({
      shopId: shop.id,
      plan: 'TRIAL',
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  if (evt.type === 'organizationMembership.created') {
    const { organization, public_user_data } = evt.data;
    if (!public_user_data?.user_id) return Response.json({ success: true });

    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.clerkOrgId, organization.id));

    if (!shop) return Response.json({ success: true });

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const members = await clerk.organizations.getOrganizationMembershipList({ organizationId: organization.id });
    const adminCount = members.data.filter((m) => m.role === 'admin').length;

    if (adminCount === 1 && public_user_data.user_id) {
      const fullName = [public_user_data.first_name, public_user_data.last_name].filter(Boolean).join(' ') || public_user_data.identifier;
      await db.insert(users).values({
        clerkUserId: public_user_data.user_id,
        shopId: shop.id,
        role: 'owner',
        displayName: fullName,
        email: public_user_data.identifier,
      }).onConflictDoNothing();
    }
  }

  return Response.json({ success: true });
}
