import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Receipt } from 'lucide-react';

export async function RecentSales() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: sales } = await admin
    .from('invoices')
    .select('id, client_name, total, validated_at')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .gte('validated_at', todayStart.toISOString())
    .order('validated_at', { ascending: false })
    .limit(20);

  if (!sales || sales.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-heading font-semibold text-zinc-900 mb-3">Ventes du jour</h3>
        <div className="text-center py-8 text-sm text-zinc-400">
          <Receipt className="size-8 text-zinc-200 mx-auto mb-2" />
          Aucune vente aujourd&apos;hui
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-heading font-semibold text-zinc-900 mb-3">
        Ventes du jour ({sales.length})
      </h3>
      <div className="space-y-1">
        {sales.map((sale: any) => {
          const time = new Date(sale.validated_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={sale.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-50 transition-colors"
            >
              <div className="size-2 mt-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-900 truncate">
                    {sale.client_name || 'Client'}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 shrink-0 tabular-nums">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
