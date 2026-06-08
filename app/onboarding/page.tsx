import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/server';
import { OnboardingCreateShop } from './create-shop';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const admin = createAdminClient();

  const { data: shops } = await admin
    .from('shops')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (shops?.length) redirect('/invoices');

  const { data: shopUsers } = await admin
    .from('users')
    .select('shop_id')
    .eq('auth_user_id', user.id)
    .limit(1);

  if (shopUsers?.length) redirect('/invoices');

  const cookieStore = await cookies();
  const inviteCookie = cookieStore.get('invite_code')?.value;
  if (inviteCookie) {
    redirect(`/sign-in?invite=${inviteCookie}`);
  }

  return <OnboardingCreateShop />;
}
