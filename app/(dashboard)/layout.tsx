import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { EyeOff } from 'lucide-react';
import { SubscriptionBanner } from '@/components/subscription/trial-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  if (user.app_metadata?.role === 'SUPERADMIN') {
    redirect('/superadmin');
  }

  const admin = createAdminClient();

  const { data: shopUsers } = await admin
    .from('users')
    .select('shop_id, role')
    .eq('auth_user_id', user.id);

  if (!shopUsers?.length) redirect('/onboarding');

  const shopId = shopUsers[0].shop_id;
  const userRole = shopUsers[0].role || 'owner';

  const { data: subs } = await admin
    .from('subscriptions')
    .select('features, status, plan, trial_ends_at, current_period_end')
    .eq('shop_id', shopId)
    .limit(1);

  const sub = subs?.[0] ?? null;
  const features = (sub?.features ?? {}) as Record<string, unknown>;

  if (sub?.status === 'TRIAL' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
    await admin.from('subscriptions').update({ status: 'EXPIRED' }).eq('shop_id', shopId);
  }

  const expired = sub?.status === 'EXPIRED' || (sub?.status === 'TRIAL' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date());
  const readOnly = !!features.readOnly;

  const plan = sub?.plan || 'TRIAL';

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar plan={plan} role={userRole} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar plan={plan} role={userRole} />
        {sub && (
          <SubscriptionBanner
            plan={plan}
            trialEndsAt={sub.trial_ends_at ?? null}
            periodEnd={sub.current_period_end ?? null}
            status={sub.status ?? 'TRIAL'}
          />
        )}
        {(readOnly || expired) && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 lg:px-6">
            <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
              <EyeOff className="size-4 shrink-0" />
              <span>
                {expired
                  ? 'Abonnement expiré. Mode lecture seule. Contactez le support pour réactiver.'
                  : 'Boutique en lecture seule. Contactez le support pour plus d\'informations.'
                }
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-zinc-50/80 pb-20 lg:pb-0">
          <div className="px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="mx-auto max-w-[78rem]">
              {children}
            </div>
          </div>
        </main>
        <div className="lg:hidden">
          <BottomNav plan={plan} role={userRole} />
        </div>
      </div>
    </div>
  );
}
