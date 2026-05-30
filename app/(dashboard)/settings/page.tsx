import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { shopSettings, invoiceSettings, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsForm } from '@/components/forms/settings-form';

export default async function SettingsPage() {
  const { shop } = await getCurrentShop();

  const [shopCfg] = await db
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.shopId, shop.id));

  const [invCfg] = await db
    .select()
    .from(invoiceSettings)
    .where(eq(invoiceSettings.shopId, shop.id));

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.shopId, shop.id));

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
