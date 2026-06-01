import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ArrowDownUp,
  AlertTriangle,
  Clock,
  Smartphone,
  Building2,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  CASH: Wallet,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Building2,
  CARD: CreditCard,
  CHECK: CreditCard,
  OTHER: Wallet,
};

function iso(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function isoEnd(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo + 1);
  return d.toISOString();
}

export default async function DashboardPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();
  const t = iso(0); const y = iso(1); const ye = isoEnd(1);
  const w = new Date(Date.now() + 7 * 86400000).toISOString();
  const m = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    paidToday, paidYesterday, pending, stockResult, dueSoon,
    paymentsToday, paidMonth, validatedMonth,
    inMovements, products,
  ] = await Promise.all([
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', t),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', y).lt('paid_at', ye),
    admin.from('invoices').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']),
    admin.from('stock_items').select('quantity').eq('shop_id', shop.id),
    admin.from('invoices').select('balance_due').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']).gt('balance_due', '0').lte('due_date', w).gte('due_date', t),
    admin.from('payments').select('amount, method').eq('shop_id', shop.id).gte('payment_date', t),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', m),
    admin.from('invoices').select('total').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).gte('validated_at', m).neq('status', 'DRAFT'),
    admin.from('stock_movements').select('quantity, product_id').eq('shop_id', shop.id).eq('movement_type', 'IN'),
    admin.from('products').select('id, purchase_price').eq('shop_id', shop.id),
  ]);

  const todayRev = (paidToday.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const yesterdayRev = (paidYesterday.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const todayCount = paidToday.data?.length ?? 0;
  const pendingCount = pending.count ?? 0;
  const stockOut = (stockResult.data ?? []).filter((s: any) => Number(s.quantity) <= 0).length;
  const dueSoonAmt = (dueSoon.data ?? []).reduce((s: number, i: any) => s + Number(i.balance_due), 0);
  const dueSoonCt = dueSoon.data?.length ?? 0;
  const paidM = (paidMonth.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const validatedM = (validatedMonth.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const rate = validatedM > 0 ? `${((paidM / validatedM) * 100).toFixed(0)}%` : '—';

  const priceMap = new Map<string, number>();
  for (const p of products.data ?? []) {
    priceMap.set(p.id, Number(p.purchase_price ?? 0));
  }
  const purchases = (inMovements.data ?? []).reduce((s: number, m: any) => {
    return s + (Number(m.quantity) * (priceMap.get(m.product_id) ?? 0));
  }, 0);
  const margin = todayRev - purchases;

  const trend = yesterdayRev > 0 ? `${((todayRev - yesterdayRev) / yesterdayRev * 100).toFixed(1)}%` : todayRev > 0 ? '+100%' : '0%';

  const byMethod = new Map<string, number>();
  for (const p of paymentsToday.data ?? []) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
  }
  const methods = Array.from(byMethod.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-5 lg:space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">{shop.name}</h1>
        <p className="text-sm text-zinc-500 mt-1" suppressHydrationWarning>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="CA aujourd'hui" value={formatCurrency(todayRev)} icon={TrendingUp} accent="bg-emerald-600"
          trend={{ value: trend, direction: todayRev >= yesterdayRev ? 'up' : 'down' }}
          subtitle={`vs ${formatCurrency(yesterdayRev)}`} />
        <StatsCard title="Encaissements" value={String(todayCount)} icon={DollarSign} accent="bg-blue-600" subtitle="factures payées" />
        <StatsCard title="Achats" value={formatCurrency(purchases)} icon={ShoppingCart} accent="bg-amber-600" subtitle="entrées stock" />
        <StatsCard title="Marge" value={formatCurrency(margin)} icon={ArrowDownUp} accent={margin >= 0 ? 'bg-emerald-700' : 'bg-red-600'}
          subtitle={purchases > 0 ? `${((todayRev / purchases) * 100).toFixed(0)}% du CA` : '—'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="À encaisser" value={String(pendingCount)} icon={Clock} accent="bg-orange-600" subtitle="impayées" />
        <StatsCard title="Échéances ≤7j" value={formatCurrency(dueSoonAmt)} icon={AlertTriangle} accent={dueSoonCt > 0 ? 'bg-red-600' : 'bg-zinc-400'} subtitle={`${dueSoonCt} facture(s)`} />
        <StatsCard title="Ruptures stock" value={String(stockOut)} icon={AlertTriangle} accent="bg-rose-600" subtitle={stockOut > 0 ? 'urgent' : 'OK'} />
        <Link href="/clients">
          <StatsCard title="Débiteurs" value={`${pendingCount} →`} icon={Wallet} accent="bg-red-600" subtitle="Voir liste" />
        </Link>
      </div>

      {methods.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {methods.map(([method, amt]) => {
            const Icon = METHOD_ICONS[method] || Wallet;
            return (
              <div key={method} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-zinc-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500 uppercase">{method === 'MOBILE_MONEY' ? 'Mobile' : method === 'BANK_TRANSFER' ? 'Virement' : method === 'CASH' ? 'Espèces' : method === 'CARD' ? 'Carte' : method}</p>
                  <p className="text-sm font-bold font-heading tabular-nums">{formatCurrency(amt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
