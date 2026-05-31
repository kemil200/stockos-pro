import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { InvoiceForm } from '@/components/forms/invoice-form';

export default async function NewInvoicePage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: settingsRows } = await admin
    .from('invoice_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const { data: shopProducts } = await admin
    .from('products')
    .select('*')
    .eq('shop_id', shop.id);

  const settings = settingsRows?.[0] ?? null;

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
