import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { notFound } from 'next/navigation';
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { InvoiceActions } from '@/components/invoices/invoice-actions';
import { PaymentForm } from '@/components/forms/payment-form';
import { AutoPrint } from '@/components/invoices/auto-print';
import { ThermalTicket } from '@/components/invoices/thermal-ticket';
import { formatCurrency } from '@/lib/utils/currency';
import { validateInvoiceAction } from '@/lib/actions/invoices';
import { CancelInvoiceButton } from '@/components/invoices/cancel-invoice-button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string; thermal?: string }>;
}) {
  const { id } = await params;
  const { print, thermal } = await searchParams;
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

  const thermalLines = lines.map((l: any) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPrice: Number(l.unit_price),
    lineTotal: Number(l.line_total),
  }));

  const thermalPayments = invoicePayments.map((p: any) => ({
    method: p.method,
    amount: Number(p.amount),
    reference: p.reference,
  }));

  if (thermal === 'true') {
    return (
      <div className="thermal-print">
        <ThermalTicket
          shopName={shop.name}
          shopPhone={shopSettings?.phone}
          shopAddress={shopSettings?.address}
          shopEmail={shopSettings?.email}
          invoiceNumber={invoice.invoice_number}
          invoiceDate={invoice.created_at}
          dueDate={invoice.due_date}
          clientName={invoice.client_name}
          clientPhone={invoice.client_phone}
          currency={invoice.currency}
          lines={thermalLines}
          lineDiscountTotal={Number(invoice.line_discount_total)}
          globalDiscount={Number(invoice.global_discount)}
          shippingFee={Number(invoice.shipping_fee)}
          taxAmount={Number(invoice.tax_amount)}
          roundingAdjustment={Number(invoice.rounding_adjustment)}
          total={Number(invoice.total)}
          amountPaid={Number(invoice.amount_paid)}
          balanceDue={Number(invoice.balance_due)}
          status={invoice.status}
          invoiceFooter={shopSettings?.invoice_footer}
          payments={thermalPayments}
        />
        <AutoPrint />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {print === 'true' && <AutoPrint />}

      <Link href="/invoices" className="print-hide inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
        <ArrowLeft className="size-3.5" />
        Retour aux factures
      </Link>

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
          <InvoiceActions
            clientName={invoice.client_name}
            clientPhone={invoice.client_phone}
            balanceDue={invoice.balance_due}
            invoiceId={id}
          />
          {invoice.status === 'DRAFT' && (
            <>
              <Link
                href={`/invoices/${id}/edit`}
                className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all inline-flex items-center gap-1.5"
              >
                Modifier
              </Link>
              <form action={validateInvoiceAction.bind(null, id)}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm"
                >
                  Valider
                </button>
              </form>
            </>
          )}
          {invoice.status === 'DRAFT' && (
            <CancelInvoiceButton invoiceId={id} />
          )}
        </div>
      </div>

      {/* Print area — design épuré */}
      <div className="print-area">
        {/* En-tête boutique + facture */}
        <div className="print-only">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-heading font-bold text-zinc-900">{shop.name}</h2>
              {shopSettings?.address && <p className="text-xs text-zinc-500 mt-0.5">{shopSettings.address}</p>}
              {shopSettings?.phone && <p className="text-xs text-zinc-500">{shopSettings.phone}</p>}
              {shopSettings?.email && <p className="text-xs text-zinc-500">{shopSettings.email}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-heading font-bold text-zinc-900 tracking-tight">FACTURE</h1>
              <p className="text-sm font-mono text-zinc-600 mt-1">{invoice.invoice_number}</p>
              <p className="text-xs text-zinc-400 mt-1">{new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {invoice.due_date && (
                <p className="text-xs text-zinc-400">Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          </div>

          <hr className="border-t-2 border-zinc-200 mb-6" />

          {/* Client */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Facturé à</p>
            <p className="font-semibold text-zinc-900">{invoice.client_name}</p>
            {invoice.client_phone && <p className="text-sm text-zinc-500">{invoice.client_phone}</p>}
          </div>

          {/* Tableau articles */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-zinc-200 text-left">
                <th className="pb-2 font-medium text-zinc-400">Description</th>
                <th className="pb-2 font-medium text-zinc-400 text-center">Qté</th>
                <th className="pb-2 font-medium text-zinc-400 text-right">Prix unit.</th>
                <th className="pb-2 font-medium text-zinc-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).map((line: any) => (
                <tr key={line.id} className="border-b border-zinc-100">
                  <td className="py-3 text-zinc-800">{line.description}</td>
                  <td className="py-3 text-center text-zinc-600">{Number(line.quantity)}</td>
                  <td className="py-3 text-right text-zinc-600">{formatCurrency(Number(line.unit_price))}</td>
                  <td className="py-3 text-right font-medium text-zinc-900">{formatCurrency(Number(line.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="mt-6 ml-auto w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Sous-total</span>
              <span className="text-zinc-800">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.line_discount_total) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Rabais</span>
                <span className="text-red-500">−{formatCurrency(Number(invoice.line_discount_total))}</span>
              </div>
            )}
            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">TVA</span>
                <span className="text-zinc-800">{formatCurrency(Number(invoice.tax_amount))}</span>
              </div>
            )}
            {Number(invoice.shipping_fee) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Livraison</span>
                <span className="text-zinc-800">{formatCurrency(Number(invoice.shipping_fee))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t-2 border-zinc-200">
              <span>Total</span>
              <span>{formatCurrency(Number(invoice.total))}</span>
            </div>
            {Number(invoice.amount_paid) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Payé</span>
                <span>{formatCurrency(Number(invoice.amount_paid))}</span>
              </div>
            )}
            {Number(invoice.balance_due) > 0 && invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
              <div className="flex justify-between font-medium text-amber-600">
                <span>Reste dû</span>
                <span>{formatCurrency(Number(invoice.balance_due))}</span>
              </div>
            )}
          </div>

          {/* Paiements */}
          {invoicePayments && invoicePayments.length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Paiements reçus</p>
              {invoicePayments.map((p: any) => (
                <div key={p.id} className="flex justify-between py-1.5 border-b border-zinc-100 text-sm">
                  <span className="text-zinc-600">{p.method} {p.reference ? `· ${p.reference}` : ''}</span>
                  <span className="font-medium text-zinc-800">{formatCurrency(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pied de page */}
          <div className="mt-12 pt-4 border-t border-zinc-200 text-center">
            <p className="text-xs text-zinc-400">
              {shopSettings?.invoice_footer || `Merci de votre confiance — ${shop.name}`}
            </p>
            <p className="text-[10px] text-zinc-300 mt-1">
              Généré par StockOS Pro
            </p>
          </div>
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
