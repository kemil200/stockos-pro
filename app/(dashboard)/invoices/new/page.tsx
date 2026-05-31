import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { InvoiceForm } from '@/components/forms/invoice-form';
import { ensureInvoiceSettings } from '@/lib/utils/invoice-settings';

export default async function NewInvoicePage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const settings = await ensureInvoiceSettings(shop.id);

  const { data: shopProducts } = await admin
    .from('products')
    .select('*')
    .eq('shop_id', shop.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle facture</h1>
        <p className="text-zinc-500 text-sm">Créez une facture pour un client</p>
      </div>
      <InvoiceForm products={shopProducts ?? []} settings={settings} />
    </div>
  );
}
