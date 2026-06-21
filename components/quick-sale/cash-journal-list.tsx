import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { FileText } from 'lucide-react';

export async function CashJournalList() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: entries } = await admin
    .from('invoices')
    .select('id, invoice_number, validated_at')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .eq('client_name', '')
    .gte('validated_at', todayStart.toISOString())
    .lte('validated_at', todayEnd.toISOString())
    .order('validated_at', { ascending: false })
    .limit(30);

  if (!entries || entries.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-heading font-semibold text-zinc-900 mb-3">Journal du jour</h3>
        <div className="text-center py-6 text-sm text-zinc-400">
          <FileText className="size-8 text-zinc-200 mx-auto mb-2" />
          Aucune écriture aujourd&apos;hui
        </div>
      </div>
    );
  }

  const entryIds = entries.map((e: any) => e.id);
  const { data: lines } = await admin
    .from('invoice_lines')
    .select('invoice_id, description, quantity, unit_price, purchase_price')
    .in('invoice_id', entryIds);

  const linesByInvoice = new Map<string, any[]>();
  for (const line of lines ?? []) {
    const arr = linesByInvoice.get(line.invoice_id) || [];
    arr.push(line);
    linesByInvoice.set(line.invoice_id, arr);
  }

  return (
    <div>
      <h3 className="text-sm font-heading font-semibold text-zinc-900 mb-3">
        Journal du jour ({entries.length})
      </h3>
      <div className="space-y-1">
        {entries.map((entry: any) => {
          const entryLines = linesByInvoice.get(entry.id) || [];
          const time = new Date(entry.validated_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={entry.id} className="rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors">
              <div className="text-[11px] text-zinc-400 mb-1">{time}</div>
              {entryLines.map((line: any, i: number) => {
                const qty = Number(line.quantity);
                const achat = Number(line.purchase_price) || 0;
                const vente = Number(line.unit_price);
                const profit = (vente - achat) * qty;

                return (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-zinc-900">{line.description}</span>
                    {qty > 1 && (
                      <span className="text-zinc-400"> ×{qty}</span>
                    )}
                    <span className="text-zinc-400">
                      {' '}Acheté {Math.round(achat).toLocaleString('fr-FR')} → Vendu {Math.round(vente).toLocaleString('fr-FR')}
                    </span>
                    <span className={profit >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                      {' '}= {profit >= 0 ? '+' : ''}{Math.round(profit).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
