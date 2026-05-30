import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { products, invoiceSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { InvoiceForm } from '@/components/forms/invoice-form';

export default async function NewInvoicePage() {
  const { shop } = await getCurrentShop();

  const [settings] = await db
    .select()
    .from(invoiceSettings)
    .where(eq(invoiceSettings.shopId, shop.id));

  const shopProducts = await db
    .select()
    .from(products)
    .where(eq(products.shopId, shop.id));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle facture</h1>
        <p className="text-zinc-500 text-sm">Créez une facture pour un client</p>
      </div>
      <InvoiceForm products={shopProducts} settings={settings} />
    </div>
  );
}
