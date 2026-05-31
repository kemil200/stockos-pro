import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { notFound } from 'next/navigation';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/invoices/invoice-actions';
import { PaymentForm } from '@/components/forms/payment-form';
import { AutoPrint } from '@/components/invoices/auto-print';
import { formatCurrency } from '@/lib/utils/currency';
import { validateInvoiceAction, cancelInvoiceAction } from '@/lib/actions/invoices';

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const [invoiceResult, shopSettingsResult] = await Promise.all([
    admin.from('invoices').select('*').eq('id', id).eq('shop_id', shop.id).limit(1),
    admin.from('shop_settings').select('*').eq('shop_id', shop.id).limit(1),
  ]);

  const invoice = invoiceResult.data?.[0] ?? null;
  if (!invoice) notFound();

  const shopSettings = shopSettingsResult.data?.[0] ?? null;

  const [linesResult, paymentsResult] = await Promise.all([
    admin.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order', { ascending: true }),
    admin.from('payments').select('*').eq('invoice_id', id),
  ]);

  const lines = linesResult.data ?? [];
  const invoicePayments = paymentsResult.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {print === 'true' && <AutoPrint />}

      {/* Screen-only header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 print-hide">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">
              {invoice.invoice_number}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-zinc-500 mt-1.5">{invoice.client_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceActions invoiceId={id} />
          {invoice.status === 'DRAFT' && (
            <form action={validateInvoiceAction.bind(null, id)}>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
              >
                Valider
              </button>
            </form>
          )}
          {invoice.status === 'DRAFT' && (
            <form action={cancelInvoiceAction.bind(null, id)}>
              <button
                type="submit"
                className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all"
              >
                Annuler
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Print area */}
      <div className="print-area">
        {/* Receipt header */}
        <div className="text-center mb-6 print-only">
          <p className="text-lg font-heading font-bold">{shop.name}</p>
          {shopSettings?.address && <p className="text-xs">{shopSettings.address}</p>}
          {shopSettings?.phone && <p className="text-xs">Tél: {shopSettings.phone}</p>}
          {shopSettings?.email && <p className="text-xs">Email: {shopSettings.email}</p>}
          <hr className="my-3 border-t-2 border-black" />
          <h2 className="text-base font-heading font-bold">FACTURE</h2>
          <p className="text-xs">{invoice.invoice_number}</p>
          <hr className="my-3 border-t" />
        </div>

        <div className="flex justify-between text-xs mb-4 print-only">
          <div>
            <p className="font-medium">Client : {invoice.client_name}</p>
            {invoice.client_phone && <p>Tél : {invoice.client_phone}</p>}
          </div>
          <div className="text-right">
            <p>Date : {new Date(invoice.created_at).toLocaleDateString('fr-FR')}</p>
            <p>Statut : {invoice.status === 'PAID' ? 'Payée' : invoice.status === 'DRAFT' ? 'Brouillon' : invoice.status === 'VALIDATED' ? 'Validée' : invoice.status === 'CANCELLED' ? 'Annulée' : invoice.status}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Détails</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Client</span>
                <span>{invoice.client_name}</span>
              </div>
              {invoice.client_phone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Téléphone</span>
                  <span>{invoice.client_phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Date</span>
                <span>{new Date(invoice.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Devise</span>
                <span>{invoice.currency}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sous-total</span>
                <span>{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              {Number(invoice.line_discount_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rabais</span>
                  <span className="text-red-600">-{formatCurrency(Number(invoice.line_discount_total))}</span>
                </div>
              )}
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">TVA</span>
                  <span>{formatCurrency(Number(invoice.tax_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
              {Number(invoice.amount_paid) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Payé</span>
                  <span>{formatCurrency(Number(invoice.amount_paid))}</span>
                </div>
              )}
              {Number(invoice.balance_due) > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
                <div className="flex justify-between text-orange-600 font-medium">
                  <span>Reste dû</span>
                  <span>{formatCurrency(Number(invoice.balance_due))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-xl border p-6 mt-6">
          <h2 className="font-semibold mb-4">Articles</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-zinc-500">
                <th className="text-left pb-2">Description</th>
                <th className="text-right pb-2">Qté</th>
                <th className="text-right pb-2">Prix unitaire</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((line: any) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="py-3 text-sm">{line.description}</td>
                  <td className="py-3 text-sm text-right">{Number(line.quantity)}</td>
                  <td className="py-3 text-sm text-right">{formatCurrency(Number(line.unit_price))}</td>
                  <td className="py-3 text-sm text-right font-medium">{formatCurrency(Number(line.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payments */}
        {invoicePayments && invoicePayments.length > 0 && (
          <div className="bg-white rounded-xl border p-6 mt-6">
            <h2 className="font-semibold mb-4">Paiements</h2>
            <div className="space-y-2">
              {invoicePayments.map((p: any) => (
                <div key={p.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <span className="font-medium">{p.method}</span>
                    {p.reference && <span className="text-zinc-500 ml-2">Réf: {p.reference}</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
                    <p className="text-xs text-zinc-400">{new Date(p.payment_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt footer */}
        <div className="text-center text-xs text-zinc-400 mt-8 print-only">
          <hr className="mb-2" />
          <p>Merci de votre confiance</p>
          {shopSettings?.invoice_footer && <p className="mt-1">{shopSettings.invoice_footer}</p>}
        </div>
      </div>

      {/* Payment form (screen only) */}
      <div className="print-hide">
        {['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status) && (
          <PaymentForm invoiceId={id} balance={invoice.balance_due} />
        )}
      </div>
    </div>
  );
}
