import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Calendar } from 'lucide-react';

export default async function HistoriquePage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: entries } = await admin
    .from('invoices')
    .select('id, invoice_number, validated_at')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .eq('client_name', '')
    .order('validated_at', { ascending: false })
    .limit(200);

  if (!entries || entries.length === 0) {
    return (
      <div>
        <h1 className="text-lg font-heading font-semibold text-zinc-900 mb-6">Historique</h1>
        <div className="text-center py-12 text-sm text-zinc-400">
          <Calendar className="size-10 text-zinc-200 mx-auto mb-3" />
          Aucune écriture
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

  const days = new Map<string, { entries: any[]; recette: number; depenses: number; benefice: number }>();

  for (const entry of entries) {
    const dayKey = new Date(entry.validated_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (!days.has(dayKey)) {
      days.set(dayKey, { entries: [], recette: 0, depenses: 0, benefice: 0 });
    }

    const day = days.get(dayKey)!;
    day.entries.push(entry);

    const entryLines = linesByInvoice.get(entry.id) || [];
    for (const line of entryLines) {
      const qty = Number(line.quantity);
      const vente = Number(line.unit_price);
      const achat = Number(line.purchase_price) || 0;
      day.recette += vente * qty;
      day.depenses += achat * qty;
    }
    day.benefice = day.recette - day.depenses;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-heading font-semibold text-zinc-900">Historique</h1>

      {Array.from(days.entries()).map(([dayKey, day]) => (
        <div key={dayKey}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold text-zinc-900 capitalize">
              {dayKey}
            </h2>
            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="text-emerald-600 font-medium">
                +{formatCurrency(day.recette)}
              </span>
              <span className="text-amber-600 font-medium">
                −{formatCurrency(day.depenses)}
              </span>
              <span className={day.benefice >= 0 ? 'text-zinc-900 font-semibold' : 'text-red-600 font-semibold'}>
                {day.benefice >= 0 ? '+' : ''}{formatCurrency(day.benefice)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {day.entries.map((entry: any) => {
              const entryLines = linesByInvoice.get(entry.id) || [];
              const time = new Date(entry.validated_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              let totalVente = 0;
              let totalAchat = 0;

              return (
                <div key={entry.id} className="rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors">
                  <div className="text-[11px] text-zinc-400 mb-1">{time}</div>
                  {entryLines.map((line: any, i: number) => {
                    const qty = Number(line.quantity);
                    const achat = Number(line.purchase_price) || 0;
                    const vente = Number(line.unit_price);
                    const profit = (vente - achat) * qty;
                    totalVente += vente * qty;
                    totalAchat += achat * qty;

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
      ))}
    </div>
  );
}
