import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  FileText,
  Wallet,
  Landmark,
  AlertTriangle,
  Clock,
  Smartphone,
  Building2,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validée',
  PAID: 'Payée',
  PARTIALLY_PAID: 'Partielle',
  CANCELLED: 'Annulée',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PAID: 'default',
  VALIDATED: 'secondary',
  DRAFT: 'outline',
  PARTIALLY_PAID: 'secondary',
  CANCELLED: 'destructive',
};

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  CASH: Landmark,
  MOBILE_MONEY: Smartphone,
  BANK_TRANSFER: Building2,
  CARD: CreditCard,
  CHECK: CreditCard,
  OTHER: Wallet,
};

function getDateRange(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function getDateRangeEnd(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export default async function DashboardPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const todayStart = getDateRange(0);
  const yesterdayStart = getDateRange(1);
  const yesterdayEnd = getDateRangeEnd(1);
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    paidTodayResult,
    paidYesterdayResult,
    pendingCountResult,
    movementsResult,
    stockResult,
    recentInvoicesResult,
    dueSoonResult,
    paymentsTodayResult,
    paidThisMonthResult,
    validatedThisMonthResult,
  ] = await Promise.all([
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', todayStart),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', yesterdayStart).lt('paid_at', yesterdayEnd),
    admin.from('invoices').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']),
    admin.from('cash_movements').select('amount').eq('shop_id', shop.id).neq('movement_type', 'EXPENSE'),
    admin.from('stock_items').select('quantity').eq('shop_id', shop.id),
    admin.from('invoices').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
    admin.from('invoices').select('balance_due').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']).gt('balance_due', '0').lte('due_date', weekLater).gte('due_date', todayStart),
    admin.from('payments').select('amount, method').eq('shop_id', shop.id).gte('payment_date', todayStart),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', monthStart),
    admin.from('invoices').select('total').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).gte('validated_at', monthStart).neq('status', 'DRAFT'),
  ]);

  const todayRevenue = (paidTodayResult.data ?? []).reduce((s, i) => s + Number(i.total), 0);
  const yesterdayRevenue = (paidYesterdayResult.data ?? []).reduce((s, i) => s + Number(i.total), 0);
  const todayCount = paidTodayResult.data?.length ?? 0;
  const pendingCount = pendingCountResult.count ?? 0;
  const cashBalance = (movementsResult.data ?? []).reduce((s, m) => s + Number(m.amount), 0);
  const stockOutCount = (stockResult.data ?? []).filter((s: any) => Number(s.quantity) <= 0).length;

  const dueSoonAmount = (dueSoonResult.data ?? []).reduce((s, i) => s + Number(i.balance_due), 0);
  const dueSoonCount = dueSoonResult.data?.length ?? 0;

  const paidThisMonth = (paidThisMonthResult.data ?? []).reduce((s, i) => s + Number(i.total), 0);
  const validatedThisMonthTotal = (validatedThisMonthResult.data ?? []).reduce((s, i) => s + Number(i.total), 0);
  const collectionRate = validatedThisMonthTotal > 0
    ? `${((paidThisMonth / validatedThisMonthTotal) * 100).toFixed(0)}%`
    : '—';

  const pctChange = yesterdayRevenue > 0
    ? `${((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)}%`
    : todayRevenue > 0 ? '+100%' : '0%';
  const trendDirection = todayRevenue >= yesterdayRevenue ? 'up' as const : 'down' as const;
  const trendValue = yesterdayRevenue > 0 || todayRevenue > 0 ? pctChange : undefined;

  const byMethod = new Map<string, number>();
  for (const p of paymentsTodayResult.data ?? []) {
    const m = p.method || 'OTHER';
    byMethod.set(m, (byMethod.get(m) ?? 0) + Number(p.amount));
  }
  const methods = Array.from(byMethod.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const recentInvoices = recentInvoicesResult.data;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          {shop.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title="CA aujourd'hui"
          value={formatCurrency(todayRevenue)}
          icon={TrendingUp}
          accent="bg-emerald-600"
          trend={trendValue ? { value: trendValue, direction: trendDirection } : undefined}
          subtitle={`vs hier ${formatCurrency(yesterdayRevenue)}`}
        />
        <StatsCard
          title="Encaissements"
          value={String(todayCount)}
          icon={FileText}
          accent="bg-blue-600"
          subtitle="factures payées"
        />
        <StatsCard
          title="Solde caisse"
          value={formatCurrency(cashBalance)}
          icon={Landmark}
          accent="bg-violet-600"
        />
        <StatsCard
          title="Taux recouvrement"
          value={collectionRate}
          icon={Wallet}
          accent="bg-amber-600"
          subtitle="ce mois-ci"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title="À encaisser"
          value={String(pendingCount)}
          icon={Clock}
          accent="bg-orange-600"
          subtitle="factures impayées"
        />
        <StatsCard
          title="Échéances ≤ 7 jours"
          value={formatCurrency(dueSoonAmount)}
          icon={AlertTriangle}
          accent={dueSoonCount > 0 ? 'bg-red-600' : 'bg-zinc-400'}
          subtitle={`${dueSoonCount} facture(s)`}
        />
        <StatsCard
          title="Ruptures de stock"
          value={String(stockOutCount)}
          icon={AlertTriangle}
          accent="bg-rose-600"
          subtitle={stockOutCount > 0 ? 'À réapprovisionner' : 'Aucune'}
        />
        <Link href="/clients" className="block">
          <StatsCard
            title="Clients débiteurs"
            value={String(pendingCount)}
            icon={Wallet}
            accent="bg-red-600"
            subtitle="Voir la liste →"
          />
        </Link>
      </div>

      {methods.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {methods.map(([method, amount]) => {
            const Icon = METHOD_ICONS[method] || Wallet;
            return (
              <div key={method} className="bg-white rounded-xl border border-zinc-200/80 px-4 py-3 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-zinc-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500 font-medium uppercase">{method === 'MOBILE_MONEY' ? 'Mobile' : method === 'BANK_TRANSFER' ? 'Virement' : method === 'CASH' ? 'Espèces' : method === 'CARD' ? 'Carte' : 'Autre'}</p>
                  <p className="text-sm font-bold font-heading text-zinc-900 tabular-nums">{formatCurrency(amount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">
            Dernières factures
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {!recentInvoices?.length ? (
            <div className="text-center py-12 lg:py-16">
              <FileText className="size-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucune facture récente</p>
            </div>
          ) : (
            <div className="-mx-5 lg:-mx-6">
              <div className="divide-y divide-zinc-100">
                {recentInvoices.map((inv: any, i: number) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-5 lg:px-6 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-zinc-900 font-heading">
                        {inv.invoice_number}
                      </p>
                      <p className="text-sm text-zinc-500 truncate mt-0.5">
                        {inv.client_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4 shrink-0 ml-4">
                      <span className="font-semibold text-sm text-zinc-900 tabular-nums">
                        {formatCurrency(Number(inv.total))}
                      </span>
                      <Badge variant={STATUS_VARIANTS[inv.status] || 'outline'} className="text-[11px] px-2.5 py-0.5">
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
