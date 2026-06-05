import { formatCurrency } from '@/lib/utils/currency';

interface Props {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopEmail?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  clientName: string;
  clientPhone?: string;
  currency: string;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  lineDiscountTotal: number;
  globalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  roundingAdjustment: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  invoiceFooter?: string;
  payments?: { method: string; amount: number; reference?: string }[];
}

function hr() {
  return '─'.repeat(32);
}

function padRight(text: string, len: number) {
  return (text || '').slice(0, len).padEnd(len, ' ');
}

function formatLine(description: string, qty: number, price: number, total: number) {
  const desc = description.slice(0, 18);
  const q = String(qty);
  const p = formatCurrency(price).replace(/\s/g, '');
  const t = formatCurrency(total).replace(/\s/g, '');
  return `${padRight(desc, 14)} ${padRight(q, 3)} ${padRight(p, 7)} ${t}`;
}

export function ThermalTicket({
  shopName, shopPhone, shopAddress, invoiceNumber, invoiceDate, dueDate,
  clientName, clientPhone,   lines, lineDiscountTotal, globalDiscount,
  shippingFee, taxAmount, roundingAdjustment, total, amountPaid, balanceDue,
  status, invoiceFooter, payments,
}: Props) {
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="thermal-ticket">
      <div className="thermal-inner">
        {/* Header */}
        <div className="text-center">
          <p className="font-bold" style={{ fontSize: '11px' }}>{shopName}</p>
          {shopAddress && <p className="text-xs">{shopAddress}</p>}
          {shopPhone && <p className="text-xs">Tel: {shopPhone}</p>}
        </div>

        <div className="text-center text-xs mt-1">{hr()}</div>

        <div className="text-xs">
          <p><span className="font-semibold">Facture:</span> {invoiceNumber}</p>
          <p><span className="font-semibold">Date:</span> {new Date(invoiceDate).toLocaleDateString('fr-FR')}</p>
          {dueDate && <p><span className="font-semibold">Échéance:</span> {new Date(dueDate).toLocaleDateString('fr-FR')}</p>}
        </div>

        <div className="text-xs mt-1">
          <p><span className="font-semibold">Client:</span> {clientName}</p>
          {clientPhone && <p>Tel: {clientPhone}</p>}
        </div>

        <div className="text-center text-xs mt-1">{hr()}</div>

        {/* Items */}
        <div className="text-xs font-mono" style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.4' }}>
          <div className="flex justify-between font-semibold">
            <span>{padRight('Article', 14)} {padRight('Qté', 3)} {padRight('Prix', 7)} Total</span>
          </div>
          {lines.map((line, i) => (
            <div key={i} className="flex justify-between">
              <span>{formatLine(line.description, line.quantity, line.unitPrice, line.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="text-center text-xs mt-1">{hr()}</div>

        {/* Totals */}
        <div className="text-xs font-mono" style={{ fontFamily: 'monospace', fontSize: '9px' }}>
          {lineDiscountTotal > 0 && (
            <div className="flex justify-between">
              <span>Rabais ligne</span>
              <span>-{formatCurrency(lineDiscountTotal)}</span>
            </div>
          )}
          {globalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Remise</span>
              <span>-{formatCurrency(globalDiscount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span>TVA</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {shippingFee > 0 && (
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
          )}
          {roundingAdjustment !== 0 && (
            <div className="flex justify-between">
              <span>Arrondi</span>
              <span>{formatCurrency(roundingAdjustment)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold mt-0.5">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {amountPaid > 0 && (
            <div className="flex justify-between">
              <span>Payé</span>
              <span>{formatCurrency(amountPaid)}</span>
            </div>
          )}
          {balanceDue > 0 && status !== 'DRAFT' && status !== 'CANCELLED' && (
            <div className="flex justify-between">
              <span>Reste dû</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          )}
        </div>

        {/* Payments */}
        {payments && payments.length > 0 && (
          <>
            <div className="text-center text-xs mt-1">{hr()}</div>
            <div className="text-xs font-mono" style={{ fontSize: '9px' }}>
              <p className="font-semibold">Paiements:</p>
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span>{p.method}{p.reference ? ` (${p.reference})` : ''}</span>
                  <span>{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center text-xs mt-1">{hr()}</div>

        {/* Footer */}
        <div className="text-center text-xs mt-1">
          <p>{invoiceFooter || `Merci de votre confiance — ${shopName}`}</p>
          <p className="mt-0.5">Généré le {today} — StockOS Pro</p>
        </div>

        <div className="text-center" style={{ paddingTop: '8px' }}>
          {'.\\n.\\n.\\n.\\n.\\n'}
        </div>
      </div>
    </div>
  );
}
