import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { PeriodSelector } from '@/components/reports/period-selector';
import { RevenueChart } from '@/components/reports/revenue-chart';
import { TopProducts } from '@/components/reports/top-products';
import { RevenueTrend } from '@/components/reports/revenue-trend';
import { CostRevenueChart } from '@/components/reports/cost-revenue-chart';
import { StorySection } from '@/components/reports/story-section';
import { DownloadPDF } from '@/components/reports/download-pdf';
import { getTopProducts, getDailyRevenue, getCOGS } from '@/lib/actions/reports';
import { getPlanConfig } from '@/lib/plans';
import { Suspense } from 'react';

function computeRange(period: string, dateParam: string | undefined, fromParam: string | undefined, toParam: string | undefined) {
  const now = new Date();
  let from: Date;
  let to: Date;
  switch (period) {
    case 'day': {
      const d = dateParam ? new Date(dateParam) : now;
      from = new Date(d); from.setHours(0, 0, 0, 0);
      to = new Date(d); to.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      const [y, m] = dateParam ? dateParam.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
      from = new Date(y, m - 1, 1);
      to = new Date(y, m, 0, 23, 59, 59, 999);
      break;
    }
    case 'year': {
      const y = dateParam ? Number(dateParam) : now.getFullYear();
      from = new Date(y, 0, 1);
      to = new Date(y, 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      to = toParam ? new Date(toParam) : now;
      to.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function periodLabel(period: string, dateParam?: string, fromParam?: string, toParam?: string) {
  switch (period) {
    case 'day': return dateParam ? new Date(dateParam).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aujourd\'hui';
    case 'month': {
      if (dateParam) {
        const [y, m] = dateParam.split('-').map(Number);
        return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      return 'Mois en cours';
    }
    case 'year': return dateParam || String(new Date().getFullYear());
    case 'custom': return `${fromParam || '?'} → ${toParam || '?'}`;
    default: return 'Mois en cours';
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period || 'month';
  const { from, to } = computeRange(period, sp.date, sp.from, sp.to);
  const label = periodLabel(period, sp.date, sp.from, sp.to);

  const { shop } = await getCurrentShop();
  const planConfig = await getPlanConfig(shop.id);
  const isAdvanced = planConfig.reports === 'advanced';
  const admin = createAdminClient();

  const [invoicesResult, expensesResult, topProductsData, dailyRevenueData, cogsData] = await Promise.all([
    admin.from('invoices')
      .select('id, invoice_number, client_name, total, amount_paid, balance_due, status, paid_at, created_at')
      .eq('shop_id', shop.id)
      .in('status', ['PAID', 'PARTIALLY_PAID', 'VALIDATED'])
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false }),
    admin.from('cash_movements')
      .select('amount, description, created_at')
      .eq('shop_id', shop.id)
      .eq('movement_type', 'EXPENSE')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false }),
    getTopProducts(from, to, 10),
    getDailyRevenue(from, to),
    getCOGS(from, to),
  ]);

  const invoices = invoicesResult.data ?? [];
  const expenses = expensesResult.data ?? [];

  const totalCA = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalPaid = invoices.reduce((s, inv) => s + Number(inv.amount_paid), 0);
  const totalExpenses = expenses.reduce((s, m) => s + Math.abs(Number(m.amount)), 0);
  const totalCOGS = cogsData.totalCost;
  const totalCosts = totalCOGS + totalExpenses;
  const profit = totalCA - totalCosts;
  const marginPct = totalCA > 0 ? ((profit / totalCA) * 100) : 0;
  const nbSales = invoices.length;
  const avgBasket = nbSales > 0 ? totalCA / nbSales : 0;

  const { data: lowStock } = await admin.from('stock_items').select('*').eq('shop_id', shop.id).lte('quantity', 'min_threshold').gt('min_threshold', '0');
  const lowStockCount = lowStock?.length ?? 0;

  const topProduct = topProductsData.length > 0 ? {
    name: topProductsData[0].name,
    revenue: topProductsData[0].totalRevenue,
    quantity: topProductsData[0].totalQuantity,
  } : null;

  const chartData: { date: string; revenue: number }[] = [];
  if (period === 'day') {
    const grouped = new Map<string, number>();
    for (const inv of invoices) {
      const hour = new Date(inv.created_at).getHours();
      grouped.set(String(hour), (grouped.get(String(hour)) ?? 0) + Number(inv.total));
    }
    for (const [h, v] of grouped) chartData.push({ date: `${h}h`, revenue: v });
    chartData.sort((a, b) => Number(a.date.replace('h', '')) - Number(b.date.replace('h', '')));
  } else if (period === 'month' || period === 'custom') {
    const grouped = new Map<string, number>();
    for (const inv of invoices) {
      const d = new Date(inv.created_at);
      grouped.set(`${d.getDate()}/${d.getMonth() + 1}`, (grouped.get(`${d.getDate()}/${d.getMonth() + 1}`) ?? 0) + Number(inv.total));
    }
    for (const [k, v] of grouped) chartData.push({ date: k, revenue: v });
    chartData.sort((a, b) => {
      const [ad, am] = a.date.split('/').map(Number);
      const [bd, bm] = b.date.split('/').map(Number);
      return am !== bm ? am - bm : ad - bd;
    });
  } else if (period === 'year') {
    const grouped = new Map<number, number>();
    for (const inv of invoices) {
      grouped.set(new Date(inv.created_at).getMonth(), (grouped.get(new Date(inv.created_at).getMonth()) ?? 0) + Number(inv.total));
    }
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 0; i < 12; i++) chartData.push({ date: months[i], revenue: grouped.get(i) ?? 0 });
  }

  const costRevenueChartData = cogsData.byDay.map((d) => ({ date: d.date, revenue: d.revenue, cost: d.cost }));

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 print-area">
      <div className="hidden print:block mb-6 pb-4 border-b">
        <h1 className="text-xl font-bold">{shop.name} — Rapport</h1>
        <p className="text-xs text-zinc-500 mt-1">{label} — {today}</p>
      </div>

      <div className="print-hide">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rapports</h1>
          </div>
          <DownloadPDF />
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <p className="text-sm text-zinc-500 print-hide mt-1">{label}</p>

      {/* Key numbers — simple, no jargon */}
      <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-xs text-zinc-400 mb-1">Chiffre d&apos;affaires</p>
          <p className="text-xl font-bold font-heading tracking-tight text-emerald-600 tabular-nums">{formatCurrency(totalCA)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">{nbSales} vente{nbSales > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-xs text-zinc-400 mb-1">Dépenses</p>
          <p className="text-xl font-bold font-heading tracking-tight text-red-500 tabular-nums">{formatCurrency(totalCosts)}</p>
          <p className="text-[10px] text-zinc-400 mt-1">Marchandises + charges</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-xs text-zinc-400 mb-1">Ce qu&apos;il vous reste</p>
          <p className={`text-xl font-bold font-heading tracking-tight tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(profit)}
          </p>
          <p className={`text-[10px] mt-1 ${marginPct >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {marginPct.toFixed(0)}% de marge
          </p>
        </div>
      </div>

      {/* Story section — plain language */}
      <StorySection
        revenue={totalCA}
        costs={totalCosts}
        cogs={totalCOGS}
        expenses={totalExpenses}
        profit={profit}
        marginPct={marginPct}
        nbSales={nbSales}
        avgBasket={avgBasket}
        topProduct={topProduct}
        lowStockCount={lowStockCount}
        label={label}
      />

      {chartData.length > 0 && isAdvanced && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b"><h2 className="font-heading font-semibold text-base">Évolution du chiffre d&apos;affaires</h2></div>
          <div className="p-4"><RevenueChart data={chartData} period={period} /></div>
        </div>
      )}

      {costRevenueChartData.length > 0 && isAdvanced && (
        <CostRevenueChart data={costRevenueChartData} />
      )}

      {dailyRevenueData.length > 1 && isAdvanced && (
        <RevenueTrend data={dailyRevenueData} />
      )}

      {topProductsData.length > 0 && isAdvanced && (
        <TopProducts products={topProductsData} />
      )}

      <div className="hidden print:block mt-6 pt-4 border-t text-xs text-zinc-400 text-center">
        {shop.name} — {label} — StockOS Pro
      </div>
    </div>
  );
}
