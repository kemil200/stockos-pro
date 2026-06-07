import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { SettingsForm } from '@/components/forms/settings-form';
import { hasFeature } from '@/lib/plans';
import Link from 'next/link';
import { Users } from 'lucide-react';

export default async function SettingsPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: shopCfgRows } = await admin
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const { data: invCfgRows } = await admin
    .from('invoice_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const { data: subRows } = await admin
    .from('subscriptions')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const shopCfg = shopCfgRows?.[0] ?? null;
  const invCfg = invCfgRows?.[0] ?? null;
  const sub = subRows?.[0] ?? null;

  const businessAccess = await hasFeature(shop.id, 'apiAccess');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-zinc-500 text-sm">Configurez votre boutique</p>
      </div>

      {businessAccess && (
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/settings/users"
            className="inline-flex items-center gap-2 px-4 py-3 bg-white rounded-xl border hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <Users className="size-4 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-zinc-900">Utilisateurs</p>
              <p className="text-xs text-zinc-500">Gérer les accès</p>
            </div>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Abonnement</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Plan</span>
            <span className="font-medium">{sub?.plan || 'TRIAL'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Statut</span>
            <span className="font-medium">{sub?.status || 'N/A'}</span>
          </div>
        </div>
      </div>

      <SettingsForm shopSettings={shopCfg} invoiceSettings={invCfg} />
    </div>
  );
}
