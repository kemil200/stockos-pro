import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import { Store, Users, CreditCard } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Essai',
  MONTHLY: 'Mensuel',
  ANNUAL: 'Annuel',
};

const STATUS_VARIANTS: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAST_DUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-zinc-100 text-zinc-500',
  EXPIRED: 'bg-zinc-100 text-zinc-500',
};

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const admin = createAdminClient();

  const { data: allShops } = await admin
    .from('shops')
    .select('*, shop_settings(*)');

  const { data: allUsers } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: allSubscriptions } = await admin
    .from('subscriptions')
    .select('*');

  const subMap = new Map((allSubscriptions ?? []).map((s: any) => [s.shop_id, s]));

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Store className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-heading font-bold tracking-tight">
              Superadmin
            </h1>
            <p className="text-sm text-zinc-500">Gestion des boutiques et abonnements</p>
          </div>
        </div>

        {/* Subscriptions */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="size-5 text-zinc-700" />
            <h2 className="text-base lg:text-lg font-heading font-semibold">
              Abonnements ({allShops?.length ?? 0})
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Boutique</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Contact</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Plan</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Statut</th>
                  <th className="text-left px-4 py-3.5 font-heading font-semibold text-zinc-600">Fin période</th>
                </tr>
              </thead>
              <tbody>
                {(allShops ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 text-sm">
                      Aucune boutique pour le moment
                    </td>
                  </tr>
                ) : (allShops ?? []).map((shop: any) => {
                  const sub = subMap.get(shop.id) as any;
                  return (
                    <tr key={shop.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-900">{shop.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5 font-mono">{shop.slug}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {shop.shop_settings?.[0] ? (
                          <div>
                            <div className="text-sm text-zinc-600">{shop.shop_settings[0].email}</div>
                            <div className="text-xs text-zinc-400">{shop.shop_settings[0].phone}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-zinc-900">
                          {sub ? (PLAN_LABELS[sub.plan] ?? sub.plan) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {sub ? (
                          <span className={cn(
                            'inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold',
                            STATUS_VARIANTS[sub.status] ?? 'bg-zinc-100 text-zinc-600'
                          )}>
                            {sub.status === 'TRIAL' ? 'Essai' :
                             sub.status === 'ACTIVE' ? 'Actif' :
                             sub.status === 'PAST_DUE' ? 'Impayé' :
                             sub.status === 'CANCELLED' ? 'Annulé' :
                             sub.status === 'EXPIRED' ? 'Expiré' : sub.status}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-500">
                        {sub?.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Users className="size-5 text-zinc-700" />
            <h2 className="text-base lg:text-lg font-heading font-semibold">
              Utilisateurs ({allUsers?.length ?? 0})
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
                {(allUsers ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-zinc-400 text-sm">
                      Aucun utilisateur
                    </td>
                  </tr>
                ) : (allUsers ?? []).map((u: any) => (
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
                        ? new Date(u.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
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
