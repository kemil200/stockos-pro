import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { EyeOff } from 'lucide-react';

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
  const { data: shops } = await admin
    .from('shops')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (!shops?.length) redirect('/onboarding');

  const shopId = shops[0].id;

  const [{ data: subs }, { data: shopUsers }] = await Promise.all([
    admin.from('subscriptions').select('features, status').eq('shop_id', shopId).limit(1),
    admin.from('users').select('role, role_id').eq('auth_user_id', user.id).eq('shop_id', shopId).limit(1),
  ]);

  const shopUser = shopUsers?.[0] ?? null;

  let userPermissions: Record<string, string> | null = null;
  if (shopUser?.role_id) {
    const { data: roleData } = await admin
      .from('roles')
      .select('permissions')
      .eq('id', shopUser.role_id)
      .single();
    userPermissions = roleData?.permissions as Record<string, string> | null;
  } else if (shopUser?.role === 'owner') {
    userPermissions = {
      invoices: 'write', products: 'write', packs: 'write', stock: 'write',
      payments: 'write', cash_register: 'write', supply: 'write',
      clients: 'write', reports: 'write', settings: 'write',
    };
  }

  const features = (subs?.[0]?.features ?? {}) as Record<string, unknown>;
  const readOnly = !!features.readOnly;
  const expired = subs?.[0]?.status === 'EXPIRED';

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar permissions={userPermissions} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
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
          <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
            <div className="mx-auto" style={{ maxWidth: '78rem' }}>
              {children}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
