import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { shops, shopSettings, invoiceSettings, subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingCreateOrg } from './create-org';

export default async function OnboardingPage() {
  const { userId, orgId, orgSlug } = await auth();

  if (!userId) redirect('/sign-in');

  if (orgId) {
    const [existing] = await db
      .select()
      .from(shops)
      .where(eq(shops.clerkOrgId, orgId));

    if (!existing) {
      const [shop] = await db
        .insert(shops)
        .values({ name: orgSlug || 'Ma boutique', slug: orgSlug || orgId, clerkOrgId: orgId })
        .returning();

      await db.insert(shopSettings).values({ shopId: shop.id, legalName: shop.name, email: '', phone: '' });
      await db.insert(invoiceSettings).values({ shopId: shop.id });
      await db.insert(subscriptions).values({
        shopId: shop.id, plan: 'TRIAL', status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const [user] = await db.select().from(users).where(eq(users.clerkUserId, userId));
      if (!user) {
        await db.insert(users).values({
          clerkUserId: userId, shopId: shop.id, role: 'owner', displayName: 'Utilisateur', email: '',
        });
      }
    }

    redirect('/invoices');
  }

  return <OnboardingCreateOrg />;
}
