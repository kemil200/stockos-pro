import 'server-only';

import { createAdminClient } from '@/lib/server';

interface ThermalData {
  shopName: string;
  shopPhone?: string;
  shopEmail?: string;
  shopAddress?: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  clientName: string;
  clientPhone?: string;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    discountAmount: number;
    lineTotal: number;
  }[];
  subtotal: number;
  lineDiscountTotal: number;
  globalDiscount: number;
  shippingFee: number;
  taxLabel: string;
  taxAmount: number;
  roundingAdjustment: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  payments: { method: string; amount: number; date: string }[];
  footer?: string;
  status: string;
}

function fmt(n: number, currency: string): string {
  const c = currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency;
  return `${Math.round(n).toLocaleString('fr-FR')} ${c}`;
}

function hr(): string {
  return '─'.repeat(32);
}

function renderLine(l: ThermalData['lines'][number], currency: string): string {
  const name = l.description.slice(0, 18).padEnd(18, ' ');
  const q = String(Math.round(l.quantity));
  const p = fmt(l.unitPrice, currency).replace(/\s/g, '');
  const t = fmt(l.lineTotal, currency).replace(/\s/g, '');
  return `│ ${name} ${q.padStart(2)}×${p.padStart(9)} ${t.padStart(9)} │`;
}

function buildHtml(data: ThermalData): string {
  const c = data.currency;

  const lines = data.lines.map((l) => renderLine(l, c)).join('\n');

  const statusLabel = data.status === 'CANCELLED' ? ' (ANNULÉE)' : '';

  const totalStr = fmt(data.total, c);
  const paidStr = fmt(data.amountPaid, c);
  const balanceStr = fmt(data.balanceDue, c);

  let paymentsBlock = '';
  if (data.payments.length > 0) {
    paymentsBlock = `
<pre>${hr()}</pre>
<pre>Paiements:</pre>
${data.payments.map((p) => `<pre>  ${p.method.slice(0, 12).padEnd(14)} ${fmt(p.amount, c)}</pre>`).join('\n')}`;
  }

  const taxBlock = data.taxAmount > 0
    ? `<pre class="right">${data.taxLabel.slice(0, 10).padEnd(10)} ${fmt(data.taxAmount, c).padStart(18, ' ')}</pre>`
    : '';

  const discountBlock = data.lineDiscountTotal > 0
    ? `<pre class="right">Remise lg. ${fmt(data.lineDiscountTotal, c).padStart(18, ' ')}</pre>`
    : '';

  const globalDiscountBlock = data.globalDiscount > 0
    ? `<pre class="right">Remise     ${fmt(data.globalDiscount, c).padStart(18, ' ')}</pre>`
    : '';

  const shippingBlock = data.shippingFee > 0
    ? `<pre class="right">Livraison  ${fmt(data.shippingFee, c).padStart(18, ' ')}</pre>`
    : '';

  const roundingBlock = data.roundingAdjustment !== 0
    ? `<pre class="right">Arrondi    ${fmt(data.roundingAdjustment, c).padStart(18, ' ')}</pre>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=58mm, initial-scale=1">
<title>Ticket ${data.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 58mm auto; margin: 0; }
  body {
    width: 56mm;
    margin: 1mm auto;
    background: #fff;
    color: #000;
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.5pt;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.5pt;
    line-height: 1.25;
    white-space: pre;
    margin: 0;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .big { font-size: 9pt; }
  .spacer { height: 6px; }
  @media print {
    body { width: 56mm; margin: 1mm auto; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<pre class="center big bold">${data.shopName.slice(0, 28)}</pre>
${data.shopAddress ? `<pre class="center">${data.shopAddress.slice(0, 28)}</pre>` : ''}
${data.shopPhone ? `<pre class="center">Tel: ${data.shopPhone}</pre>` : ''}
${data.shopEmail ? `<pre class="center">${data.shopEmail.slice(0, 28)}</pre>` : ''}
<pre>${hr()}</pre>
<pre>Facture: ${data.invoiceNumber}${statusLabel}</pre>
<pre>Date   : ${data.date}</pre>
${data.dueDate ? `<pre>Échéance: ${data.dueDate}</pre>` : ''}
<pre>Client : ${data.clientName.slice(0, 25)}</pre>
${data.clientPhone ? `<pre>Tel    : ${data.clientPhone}</pre>` : ''}
<pre>${hr()}</pre>
<pre>ARTICLE             QTÉ×PX=TOTAL</pre>
<pre>${lines}</pre>
<pre>${hr()}</pre>
<pre class="right">SOUS-TOTAL ${fmt(data.subtotal, c).padStart(18, ' ')}</pre>
${discountBlock}
${globalDiscountBlock}
${shippingBlock}
${taxBlock}
${roundingBlock}
<pre class="right bold">TOTAL     ${totalStr.padStart(18, ' ')}</pre>
${data.amountPaid > 0 ? `<pre class="right">Payé      ${paidStr.padStart(18, ' ')}</pre>` : ''}
${data.balanceDue > 0 && data.status !== 'CANCELLED' ? `<pre class="right">Reste dû  ${balanceStr.padStart(18, ' ')}</pre>` : ''}
${paymentsBlock}
${data.footer ? `<pre class="center">${data.footer.slice(0, 28)}</pre>` : ''}
<pre>${hr()}</pre>
<pre class="center">Merci de votre confiance!</pre>
<pre class="center">StockOS Pro</pre>
<div class="spacer"></div>
<pre class="center">.</pre>
<script>window.onload=function(){setTimeout(function(){window.print();},100)}</script>
</body>
</html>`;
}

export async function fetchAndRenderThermal(invoiceId: string, shopId: string): Promise<{ html: string; error?: string }> {
  const admin = createAdminClient();

  const { data: invoices, error: invErr } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('shop_id', shopId)
    .limit(1);

  if (invErr || !invoices?.length) {
    return { html: '', error: 'Facture introuvable' };
  }

  const inv = invoices[0];

  const [linesRes, shopRes, settingsRes, paymentsRes] = await Promise.all([
    admin.from('invoice_lines').select('*').eq('invoice_id', invoiceId).order('sort_order'),
    admin.from('shops')
      .select('name')
      .eq('id', inv.shop_id)
      .limit(1)
      .single(),
    admin.from('invoice_settings')
      .select('tax_label, invoice_footer')
      .eq('shop_id', shopId)
      .limit(1)
      .single(),
    admin.from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at'),
  ]);

  const lines = linesRes.data ?? [];
  const shopName = shopRes.data?.name ?? 'StockOS Pro';
  const settings = settingsRes.data;
  const payments = paymentsRes.data ?? [];

  const data: ThermalData = {
    shopName,
    shopPhone: inv.shop_phone,
    shopEmail: inv.shop_email,
    shopAddress: inv.shop_address,
    invoiceNumber: inv.invoice_number,
    date: new Date(inv.created_at).toLocaleDateString('fr-FR'),
    dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : undefined,
    clientName: inv.client_name,
    clientPhone: inv.client_phone || undefined,
    lines: lines.map((l: any) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      discountRate: Number(l.discount_rate),
      discountAmount: Number(l.discount_amount),
      lineTotal: Number(l.line_total),
    })),
    subtotal: Number(inv.subtotal),
    lineDiscountTotal: Number(inv.line_discount_total),
    globalDiscount: Number(inv.global_discount),
    shippingFee: Number(inv.shipping_fee),
    taxLabel: settings?.tax_label || 'TVA',
    taxAmount: Number(inv.tax_amount),
    roundingAdjustment: Number(inv.rounding_adjustment),
    total: Number(inv.total),
    amountPaid: Number(inv.amount_paid),
    balanceDue: Number(inv.balance_due),
    currency: inv.currency || 'XOF',
    payments: payments.map((p: any) => ({
      method: p.payment_method || 'Espèces',
      amount: Number(p.amount),
      date: new Date(p.created_at).toLocaleDateString('fr-FR'),
    })),
    footer: settings?.invoice_footer || undefined,
    status: inv.status,
  };

  return { html: buildHtml(data) };
}
