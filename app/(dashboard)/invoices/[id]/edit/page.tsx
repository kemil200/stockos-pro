import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { notFound } from 'next/navigation';
import { InvoiceForm } from '@/components/forms/invoice-form';
import { ensureInvoiceSettings } from '@/lib/utils/invoice-settings';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const [invoiceResult, linesResult, productsResult, packsResult, settings] = await Promise.all([
    admin.from('invoices').select('*').eq('id', id).eq('shop_id', shop.id).single(),
    admin.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order'),
    admin.from('products').select('id, name, unit_price').eq('shop_id', shop.id).eq('is_active', true).order('name'),
    admin.from('packs').select('id, name, sale_price').eq('shop_id', shop.id).order('name'),
    ensureInvoiceSettings(shop.id),
  ]);

  const invoice = invoiceResult.data;
  if (!invoice || invoice.status !== 'DRAFT') notFound();

  const lines = linesResult.data ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">
          Modifier la facture {invoice.invoice_number}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {invoice.client_name} — Brouillon
        </p>
      </div>

      <InvoiceForm
        products={productsResult.data ?? []}
        packs={packsResult.data ?? []}
        settings={settings}
        invoice={{
          id,
          clientName: invoice.client_name,
          clientPhone: invoice.client_phone || undefined,
          lines: lines.map((l: any) => ({
            productId: l.product_id || undefined,
            packId: l.pack_id || undefined,
            description: l.description,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unit_price),
            discountRate: Number(l.discount_rate),
          })),
          globalDiscount: Number(invoice.global_discount),
          shippingFee: Number(invoice.shipping_fee),
        }}
      />
    </div>
  );
}
