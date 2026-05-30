import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices, invoiceLines, payments } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { PaymentForm } from '@/components/forms/payment-form';
import { formatCurrency } from '@/lib/utils/currency';
import { validateInvoice, cancelInvoice } from '@/lib/actions/invoices';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { shop, user } = await getCurrentShop();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.shopId, shop.id)));

  if (!invoice) notFound();

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id))
    .orderBy(asc(invoiceLines.sortOrder));

  const invoicePayments = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-zinc-500 mt-1">{invoice.clientName}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'DRAFT' && (
            <form action={validateInvoice.bind(null, id)}>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Valider la facture
              </button>
            </form>
          )}
          {invoice.status === 'DRAFT' && (
            <form action={cancelInvoice.bind(null, id)}>
              <button
                type="submit"
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                Annuler
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold">Détails</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Client</span>
              <span>{invoice.clientName}</span>
            </div>
            {invoice.clientPhone && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Téléphone</span>
                <span>{invoice.clientPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Date</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</span>
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
            {Number(invoice.lineDiscountTotal) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Rabais</span>
                <span className="text-red-600">-{formatCurrency(Number(invoice.lineDiscountTotal))}</span>
              </div>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">TVA</span>
                <span>{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total))}</span>
            </div>
            {Number(invoice.amountPaid) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Payé</span>
                <span>{formatCurrency(Number(invoice.amountPaid))}</span>
              </div>
            )}
            {Number(invoice.balanceDue) > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
              <div className="flex justify-between text-orange-600 font-medium">
                <span>Reste dû</span>
                <span>{formatCurrency(Number(invoice.balanceDue))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
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
            {lines.map((line) => (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-3 text-sm">{line.description}</td>
                <td className="py-3 text-sm text-right">{Number(line.quantity)}</td>
                <td className="py-3 text-sm text-right">{formatCurrency(Number(line.unitPrice))}</td>
                <td className="py-3 text-sm text-right font-medium">{formatCurrency(Number(line.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoicePayments.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Paiements</h2>
          <div className="space-y-2">
            {invoicePayments.map((p) => (
              <div key={p.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <span className="font-medium">{p.method}</span>
                  {p.reference && <span className="text-zinc-500 ml-2">Réf: {p.reference}</span>}
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
                  <p className="text-xs text-zinc-400">{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status) && (
        <PaymentForm invoiceId={id} balance={invoice.balanceDue} />
      )}
    </div>
  );
}
