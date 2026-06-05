import 'server-only';

import { createAdminClient } from '@/lib/server';

interface ThermalData {
  shopName: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientPhone?: string;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
}

function fmt(n: number, currency: string): string {
  const c = currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency;
  return `${Math.round(n).toLocaleString('fr-FR')} ${c}`;
}

function padRight(s: string, len: number): string {
  return s.slice(0, len).padEnd(len, ' ');
}

function hr(): string {
  return '─'.repeat(32);
}

function renderLine(desc: string, qty: number, price: number, total: number, currency: string): string {
  const name = desc.slice(0, 16).padEnd(16, ' ');
  const q = String(qty);
  const p = `${Math.round(price)}`;
  const t = `${Math.round(total)}`;
  return `${name}${q}×${p}=${t}`;
}

function buildHtml(data: ThermalData): string {
  const c = data.currency;

  const lines = data.lines.map((l) =>
    `│ ${renderLine(l.description, l.quantity, l.unitPrice, l.lineTotal, c).slice(0, 30)} │`
  ).join('\n');

  const totalStr = fmt(data.total, c);
  const paidStr = fmt(data.amountPaid, c);
  const balanceStr = fmt(data.balanceDue, c);

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
<pre class="center big bold">STOCKOS PRO</pre>
<pre class="center">${data.shopName.slice(0, 28)}</pre>
<pre>${hr()}</pre>
<pre>Facture: ${data.invoiceNumber}</pre>
<pre>Date   : ${data.date}</pre>
<pre>Client : ${data.clientName.slice(0, 25)}</pre>
${data.clientPhone ? `<pre>Tel    : ${data.clientPhone}</pre>` : ''}
<pre>${hr()}</pre>
<pre>ARTICLE              QTÉ×PX=TOTAL</pre>
<pre>${lines}</pre>
<pre>${hr()}</pre>
<pre class="right">SOUS-TOTAL ${fmt(data.subtotal, c).padStart(18, ' ')}</pre>
${data.taxAmount > 0 ? `<pre class="right">TVA       ${fmt(data.taxAmount, c).padStart(18, ' ')}</pre>` : ''}
<pre class="right bold">TOTAL     ${totalStr.padStart(18, ' ')}</pre>
${data.amountPaid > 0 ? `<pre class="right">Payé      ${paidStr.padStart(18, ' ')}</pre>` : ''}
${data.balanceDue > 0 ? `<pre class="right">Reste dû  ${balanceStr.padStart(18, ' ')}</pre>` : ''}
<pre>${hr()}</pre>
<pre class="center">Merci de votre confiance!</pre>
<pre class="center">StockOS Pro</pre>
<div class="spacer"></div>
<pre class="center">.</pre>
<script>window.onload=function(){setTimeout(function(){window.print();},100)}</script>
</body>
</html>`;
}

export async function fetchAndRenderThermal(invoiceId: string): Promise<{ html: string; error?: string }> {
  const admin = createAdminClient();

  const { data: invoices, error: invErr } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .limit(1);

  if (invErr || !invoices?.length) {
    return { html: '', error: 'Facture introuvable' };
  }

  const inv = invoices[0];

  const [linesRes, shopRes] = await Promise.all([
    admin.from('invoice_lines').select('*').eq('invoice_id', invoiceId).order('sort_order'),
    admin.from('shops')
      .select('name')
      .eq('id', inv.shop_id)
      .limit(1)
      .single(),
  ]);

  const lines = linesRes.data ?? [];
  const shopName = shopRes.data?.name ?? 'StockOS Pro';

  const data: ThermalData = {
    shopName,
    invoiceNumber: inv.invoice_number,
    date: new Date(inv.created_at).toLocaleDateString('fr-FR'),
    clientName: inv.client_name,
    clientPhone: inv.client_phone || undefined,
    lines: lines.map((l: any) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      lineTotal: Number(l.line_total),
    })),
    subtotal: Number(inv.subtotal),
    taxAmount: Number(inv.tax_amount),
    total: Number(inv.total),
    amountPaid: Number(inv.amount_paid),
    balanceDue: Number(inv.balance_due),
    currency: inv.currency || 'XOF',
  };

  return { html: buildHtml(data) };
}
