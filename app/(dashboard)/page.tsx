import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentShop } from '@/lib/tenant';
import { getDashboardStats } from '@/lib/actions/dashboard';
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

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieMode = cookieStore.get('stockos-mode')?.value;
  if (cookieMode === 'simple') redirect('/mode-simple');

  const { shop } = await getCurrentShop();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-5 lg:space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">{shop.name}</h1>
        <p className="text-sm text-zinc-500 mt-1" suppressHydrationWarning>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="CA aujourd'hui" value={formatCurrency(stats.todayRevenue)} icon={TrendingUp} accent="bg-emerald-600"
          trend={{ value: stats.trend, direction: stats.todayRevenue >= stats.yesterdayRevenue ? 'up' : 'down' }}
          subtitle={`vs ${formatCurrency(stats.yesterdayRevenue)}`} />
        <StatsCard title="Encaissements" value={String(stats.todayPaidCount)} icon={DollarSign} accent="bg-blue-600" subtitle="factures payées" />
        <StatsCard title="Achats" value={formatCurrency(stats.todayPurchases)} icon={ShoppingCart} accent="bg-amber-600" subtitle="entrées du jour" />
        <StatsCard title="Marge" value={formatCurrency(stats.margin)} icon={ArrowDownUp} accent={stats.margin >= 0 ? 'bg-emerald-700' : 'bg-red-600'}
          subtitle={stats.todayPurchases > 0 ? `${((stats.todayRevenue / stats.todayPurchases) * 100).toFixed(0)}% du CA` : stats.todayRevenue > 0 ? '100% du CA' : '—'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="À encaisser" value={String(stats.pendingCount)} icon={Clock} accent="bg-orange-600" subtitle="impayées" />
        <StatsCard title="Échéances ≤7j" value={formatCurrency(stats.dueSoonAmount)} icon={AlertTriangle} accent={stats.dueSoonCount > 0 ? 'bg-red-600' : 'bg-zinc-400'} subtitle={`${stats.dueSoonCount} facture(s)`} />
        <StatsCard title="Ruptures stock" value={String(stats.stockOutCount)} icon={AlertTriangle} accent="bg-rose-600" subtitle={stats.stockOutCount > 0 ? 'urgent' : 'OK'} />
        <Link href="/clients">
          <StatsCard title="Débiteurs" value={`${stats.pendingCount} →`} icon={Wallet} accent="bg-red-600" subtitle="Voir liste" />
        </Link>
      </div>

      {stats.paymentsByMethod.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.paymentsByMethod.map(({ method, amount }) => {
            const Icon = METHOD_ICONS[method] || Wallet;
            return (
              <div key={method} className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-zinc-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500 uppercase">{method === 'MOBILE_MONEY' ? 'Mobile' : method === 'BANK_TRANSFER' ? 'Virement' : method === 'CASH' ? 'Espèces' : method === 'CARD' ? 'Carte' : method}</p>
                  <p className="text-sm font-bold font-heading tabular-nums">{formatCurrency(amount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
