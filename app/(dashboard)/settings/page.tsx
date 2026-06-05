import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { SettingsForm } from '@/components/forms/settings-form';

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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-zinc-500 text-sm">Configurez votre boutique</p>
      </div>

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
