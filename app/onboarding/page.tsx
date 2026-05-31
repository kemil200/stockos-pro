import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { shops, shopSettings, invoiceSettings, subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingCreateOrg } from './create-org';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const { user: authUser } = session;
  const orgId = session.session.activeOrganizationId;

  if (orgId) {
    const [existing] = await db
      .select()
      .from(shops)
      .where(eq(shops.clerkOrgId, orgId));

    if (!existing) {
      const org = await auth.api.getFullOrganization({ headers: await headers() });

      const [shop] = await db
        .insert(shops)
        .values({ name: org?.name || 'Ma boutique', slug: org?.slug || orgId, clerkOrgId: orgId })
        .returning();

      await db.insert(shopSettings).values({ shopId: shop.id, legalName: shop.name, email: '', phone: '' });
      await db.insert(invoiceSettings).values({ shopId: shop.id });
      await db.insert(subscriptions).values({
        shopId: shop.id, plan: 'TRIAL', status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const [user] = await db.select().from(users).where(eq(users.clerkUserId, authUser.id));
      if (!user) {
        await db.insert(users).values({
          clerkUserId: authUser.id, shopId: shop.id, role: 'owner', displayName: authUser.name || 'Utilisateur', email: authUser.email || '',
        });
      }
    }

    redirect('/invoices');
  }

  return <OnboardingCreateOrg />;
}
