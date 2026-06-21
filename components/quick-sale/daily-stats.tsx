import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { invoices, invoiceLines, products } from '@/lib/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
import { TrendingUp, CircleDollarSign } from 'lucide-react';

export async function DailyStats() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayInvoices } = await admin
    .from('invoices')
    .select('total')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .gte('validated_at', todayStart.toISOString());

  const revenue = (todayInvoices ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { data: monthInvoices } = await admin
    .from('invoices')
    .select('total')
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED')
    .gte('validated_at', monthStart.toISOString());

  const monthRevenue = (monthInvoices ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);

  const invoiceIds = (todayInvoices ?? []).map((i: any) => i.id);
  let profit = 0;
  if (invoiceIds.length > 0) {
    const { data: lines } = await admin
      .from('invoice_lines')
      .select('product_id, quantity, unit_price')
      .in('invoice_id', invoiceIds);

    if (lines) {
      const productIds = [...new Set(lines.filter((l: any) => l.product_id).map((l: any) => l.product_id))];
      if (productIds.length > 0) {
        const { data: prodRows } = await admin
          .from('products')
          .select('id, purchase_price')
          .in('id', productIds);

        const purchaseMap = new Map((prodRows ?? []).map((p: any) => [p.id, Number(p.purchase_price)]));

        for (const line of lines) {
          const qty = Number(line.quantity);
          const salePrice = Number(line.unit_price);
          const purchasePrice = line.product_id ? (purchaseMap.get(line.product_id) || 0) : 0;
          profit += (salePrice - purchasePrice) * qty;
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
          <TrendingUp className="size-3.5 text-emerald-500" />
          Recettes du jour
        </div>
        <div className="text-xl font-bold font-heading tracking-tight text-emerald-600 tabular-nums">
          {formatCurrency(revenue)}
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">
          Mois : {formatCurrency(monthRevenue)}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
          <CircleDollarSign className="size-3.5" />
          Bénéfice du jour
        </div>
        <div className="text-xl font-bold font-heading tracking-tight text-zinc-900 tabular-nums">
          {formatCurrency(profit)}
        </div>
        <div className="text-[11px] text-zinc-400 mt-1">
          Estimation
        </div>
      </div>
    </div>
  );
}
