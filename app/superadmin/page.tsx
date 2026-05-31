import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import {
  Store, Users, CreditCard, TrendingUp,
  Shield, Timer, LogOut,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SubscriptionRow } from '@/components/superadmin/subscription-row';
import { SignOutButton } from '@/components/layout/sign-out-button';

const ACTIONS_LABELS: Record<string, string> = {
  TRIAL: 'Passer en Actif',
  ACTIVE: 'Marquer Impayé',
  PAST_DUE: 'Réactiver',
  CANCELLED: 'Réactiver',
  EXPIRED: 'Réactiver',
};

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== 'SUPERADMIN') redirect('/sign-in');

  const admin = createAdminClient();

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const totalAuthUsers = authUsers?.users.length ?? 0;

  const { data: allShops } = await admin
    .from('shops')
    .select('*, shop_settings(*)');

  const { data: allShopUsers } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: allSubscriptions } = await admin
    .from('subscriptions')
    .select('*');

  const { data: allInvoices } = await admin
    .from('invoices')
    .select('total, status');

  const totalRevenue = (allInvoices ?? [])
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

  const subMap = new Map((allSubscriptions ?? []).map((s: any) => [s.shop_id, s]));

  const activeTrials = (allSubscriptions ?? []).filter((s: any) => s.status === 'TRIAL').length;
  const activeSubs = (allSubscriptions ?? []).filter((s: any) => s.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between mb-8 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-heading font-bold tracking-tight">
                Superadmin
              </h1>
              <p className="text-sm text-zinc-500">Gestion des boutiques et abonnements</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8 lg:mb-10">
          <StatsCard
            title="Boutiques"
            value={String(allShops?.length ?? 0)}
            icon={Store}
            accent="bg-zinc-900"
          />
          <StatsCard
            title="Inscrits"
            value={String(totalAuthUsers)}
            icon={Users}
            accent="bg-blue-600"
          />
          <StatsCard
            title="Essais en cours"
            value={String(activeTrials)}
            icon={Timer}
            accent="bg-amber-600"
          />
          <StatsCard
            title="CA total"
            value={new Intl.NumberFormat('fr-FR').format(totalRevenue) + ' FCFA'}
            icon={TrendingUp}
            accent="bg-emerald-600"
          />
        </div>

        {/* Abonnements */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-zinc-700" />
              <h2 className="text-base lg:text-lg font-heading font-semibold">
                Abonnements ({allShops?.length ?? 0})
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" /> Actif ({activeSubs})
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" /> Essai ({activeTrials})
              </span>
            </div>
          </div>

          {(allShops ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-12 text-center">
              <Store className="size-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucune boutique pour le moment</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80">
                      <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Boutique</th>
                      <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Contact</th>
                      <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Plan</th>
                      <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Statut</th>
                      <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Fin période</th>
                      <th className="text-right px-4 py-3.5 font-heading font-semibold text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allShops ?? []).map((shop: any) => {
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
            </div>
          )}
        </section>

        {/* Utilisateurs */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Users className="size-5 text-zinc-700" />
            <h2 className="text-base lg:text-lg font-heading font-semibold">
              Utilisateurs ({allShopUsers?.length ?? 0})
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Nom</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Email</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Rôle</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {(allShopUsers ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-zinc-400 text-sm">
                      Aucun utilisateur
                    </td>
                  </tr>
                ) : (allShopUsers ?? []).map((u: any) => (
                  <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-zinc-900">{u.display_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        u.role === 'SUPERADMIN'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      )}>
                        {u.role === 'SUPERADMIN' ? 'Superadmin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-zinc-400">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
