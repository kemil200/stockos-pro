import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';
import { db } from '@/lib/db';
import { shops, shopSettings, invoiceSettings, subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingCreateShop } from './create-shop';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const [existing] = await db
    .select()
    .from(shops)
    .where(eq(shops.userId, user.id));

  if (existing) redirect('/invoices');

  return <OnboardingCreateShop />;
}
