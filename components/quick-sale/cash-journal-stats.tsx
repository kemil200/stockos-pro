import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { TrendingUp, ShoppingBag, CircleDollarSign } from 'lucide-react';

export async function CashJournalStats() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayInvoices } = await admin
    .from('invoices')
    .select('id, total')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .eq('client_name', '')
    .gte('validated_at', todayStart.toISOString())
    .lte('validated_at', todayEnd.toISOString());

  const invoiceIds = (todayInvoices ?? []).map((i: any) => i.id);

  let recette = 0;
  let depenses = 0;

  if (invoiceIds.length > 0) {
    const { data: lines } = await admin
      .from('invoice_lines')
      .select('quantity, unit_price, purchase_price')
      .in('invoice_id', invoiceIds);

    for (const line of lines ?? []) {
      const qty = Number(line.quantity);
      const salePrice = Number(line.unit_price);
      const purchasePrice = Number(line.purchase_price) || 0;
      recette += salePrice * qty;
      depenses += purchasePrice * qty;
    }
  }

  const benefice = recette - depenses;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
          <TrendingUp className="size-3.5 text-emerald-500" />
          Recette
        </div>
        <div className="text-lg font-bold font-heading tracking-tight text-emerald-600 tabular-nums">
          {formatCurrency(recette)}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
          <ShoppingBag className="size-3.5 text-amber-500" />
          Dépenses
        </div>
        <div className="text-lg font-bold font-heading tracking-tight text-amber-600 tabular-nums">
          {formatCurrency(depenses)}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
          <CircleDollarSign className="size-3.5" />
          Bénéfice
        </div>
        <div className={cn(
          'text-lg font-bold font-heading tracking-tight tabular-nums',
          benefice >= 0 ? 'text-zinc-900' : 'text-red-600'
        )}>
          {formatCurrency(benefice)}
        </div>
      </div>
    </div>
  );
}
