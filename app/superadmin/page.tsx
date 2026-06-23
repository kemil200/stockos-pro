import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import {
  Store,
  Users,
  CreditCard,
  TrendingUp,
  Shield,
  Timer,
} from 'lucide-react';
import { SubscriptionRow } from '@/components/superadmin/subscription-row';
import { SystemHealth } from '@/components/superadmin/system-health';
import { SignOutButton } from '@/components/layout/sign-out-button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const PLAN_PRICES: Record<string, number> = {
  STARTER: 55000,
  ESSENTIAL: 90000,
  BUSINESS: 120000,
  TRIAL: 0,
  MONTHLY: 90000,
  ANNUAL: 90000,
};

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== 'SUPERADMIN') redirect('/sign-in');

  const admin = createAdminClient();

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const totalAuthUsers = authUsers?.users.length ?? 0;

  const [shopsResult, usersResult, subsResult] = await Promise.all([
    admin.from('shops').select('*, shop_settings(*)'),
    admin.from('users').select('*').order('created_at', { ascending: false }),
    admin.from('subscriptions').select('*'),
  ]);

  const allShops = shopsResult.data ?? [];
  const allShopUsers = usersResult.data ?? [];
  const allSubscriptions = subsResult.data ?? [];

  const activeSubsByPlan = allSubscriptions.filter((s: any) => s.status === 'ACTIVE');
  const annualRevenue = activeSubsByPlan.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0);
  const monthlyRevenue = annualRevenue / 12;
  const activeSubs = activeSubsByPlan.length;
  const trialSubs = allSubscriptions.filter((s: any) => s.status === 'TRIAL').length;
  const pastDueSubs = allSubscriptions.filter((s: any) => s.status === 'PAST_DUE').length;
  const cancelledSubs = allSubscriptions.filter((s: any) => s.status === 'CANCELLED' || s.status === 'EXPIRED').length;

  const subMap = new Map(allSubscriptions.map((s: any) => [s.shop_id, s]));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8" style={{ maxWidth: '90rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 shadow-sm">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight lg:text-2xl">Superadmin</h1>
              <p className="text-sm text-muted-foreground">Gestion des boutiques et abonnements</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* System health */}
        <div className="mb-8">
          <SystemHealth />
        </div>

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">Boutiques</CardTitle>
              <Store className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium tabular-nums">{allShops.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeSubs} actif{activeSubs !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">Inscrits</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium tabular-nums">{totalAuthUsers}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">utilisateurs</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">CA mensuel</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium tabular-nums">
                {new Intl.NumberFormat('fr-FR').format(monthlyRevenue)} FCFA
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Intl.NumberFormat('fr-FR').format(annualRevenue)} FCFA / an
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">Essais</CardTitle>
              <Timer className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium tabular-nums">{trialSubs}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">en cours</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary row */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="rounded-xl border-emerald-200 bg-emerald-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-emerald-700">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-emerald-700 tabular-nums">{activeSubs}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-amber-200 bg-amber-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-amber-700">Essais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-amber-700 tabular-nums">{trialSubs}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-red-200 bg-red-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-red-700">Impayés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-red-700 tabular-nums">{pastDueSubs}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-zinc-200 bg-zinc-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal tracking-wide text-zinc-500">Annulés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-zinc-500 tabular-nums">{cancelledSubs}</p>
            </CardContent>
          </Card>
        </div>

        {/* Plan breakdown */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {(['STARTER', 'ESSENTIAL', 'BUSINESS'] as const).map((plan) => {
            const count = activeSubsByPlan.filter((s: any) => s.plan === plan).length;
            return (
              <Card key={plan} className={`rounded-xl shadow-none border-l-4 ${
                plan === 'STARTER' ? 'border-l-blue-500' :
                plan === 'ESSENTIAL' ? 'border-l-emerald-500' :
                'border-l-violet-500'
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-normal tracking-wide text-muted-foreground">{plan}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold tabular-nums">{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Intl.NumberFormat('fr-FR').format(count * PLAN_PRICES[plan])} FCFA/an
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Subscriptions table */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5" />
              <h2 className="font-heading text-base font-semibold lg:text-lg">
                Abonnements ({allShops.length})
              </h2>
            </div>
          </div>

          {allShops.length === 0 ? (
            <Card className="rounded-xl py-12 text-center shadow-none">
              <Store className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune boutique pour le moment</p>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-xl shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Boutique</th>
                      <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Contact</th>
                      <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Plan</th>
                      <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Statut</th>
                      <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Fin période</th>
                      <th className="px-4 py-3.5 text-right font-heading font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allShops.map((shop: any) => {
                      const sub = subMap.get(shop.id) as any;
                      return (
                        <SubscriptionRow
                          key={shop.id}
                          shop={shop}
                          sub={sub}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        {/* Users table */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <Users className="size-5" />
            <h2 className="font-heading text-base font-semibold lg:text-lg">
              Utilisateurs ({allShopUsers.length})
            </h2>
          </div>
          <Card className="overflow-hidden rounded-xl shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Nom</th>
                    <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Rôle</th>
                    <th className="px-4 py-3.5 text-left font-heading font-semibold text-muted-foreground">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {allShopUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        Aucun utilisateur
                      </td>
                    </tr>
                  ) : (
                    allShopUsers.map((u: any) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-medium">{u.display_name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'SUPERADMIN' ? 'bg-zinc-900 text-white' : 'bg-muted text-muted-foreground'}`}>
                            {u.role === 'SUPERADMIN' ? 'Superadmin' : 'Utilisateur'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
