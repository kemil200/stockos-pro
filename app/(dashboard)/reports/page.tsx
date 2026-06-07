import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { PrintButton } from '@/components/reports/print-button';
import { PeriodSelector } from '@/components/reports/period-selector';
import { RevenueChart } from '@/components/reports/revenue-chart';
import { TopProducts } from '@/components/reports/top-products';
import { RevenueTrend } from '@/components/reports/revenue-trend';
import { CostRevenueChart } from '@/components/reports/cost-revenue-chart';
import { DownloadCSV } from '@/components/reports/download-csv';
import { getTopProducts, getDailyRevenue, getCOGS } from '@/lib/actions/reports';
import { getPlanConfig } from '@/lib/plans';
import { TrendingUp, ShoppingCart, Percent, Receipt, ArrowDownUp, Coins } from 'lucide-react';
import { Suspense } from 'react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', VALIDATED: 'Validée', PAID: 'Payée',
  PARTIALLY_PAID: 'Partielle', CANCELLED: 'Annulée',
};

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

  const [invoicesResult, expensesResult, paymentsResult, topProductsData, dailyRevenueData, cogsData] = await Promise.all([
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
    admin.from('cash_movements')
      .select('amount, method')
      .eq('shop_id', shop.id)
      .eq('movement_type', 'PAYMENT_IN')
      .gte('created_at', from)
      .lte('created_at', to),
    getTopProducts(from, to, 10),
    getDailyRevenue(from, to),
    getCOGS(from, to),
  ]);

  const invoices = invoicesResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const paymentsData = paymentsResult.data ?? [];

  const totalCA = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalPaid = invoices.reduce((s, inv) => s + Number(inv.amount_paid), 0);
  const totalExpenses = expenses.reduce((s, m) => s + Math.abs(Number(m.amount)), 0);
  const totalCashIn = paymentsData.reduce((s, m) => s + Number(m.amount), 0);
  const totalCOGS = cogsData.totalCost;
  const totalCosts = totalCOGS + totalExpenses;
  const profit = totalCA - totalCosts;
  const marginPct = totalCA > 0 ? ((profit / totalCA) * 100) : 0;
  const nbSales = invoices.length;
  const avgBasket = nbSales > 0 ? totalCA / nbSales : 0;

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

  const csvData = invoices.map((inv: any) => ({
    'N° Facture': inv.invoice_number,
    'Client': inv.client_name,
    'Statut': STATUS_LABELS[inv.status] || inv.status,
    'Total': Number(inv.total),
    'Encaissé': Number(inv.amount_paid),
    'Reste': Number(inv.balance_due),
    'Date': new Date(inv.created_at).toLocaleDateString('fr-FR'),
  }));

  const csvColumns = [
    { key: 'N° Facture', label: 'N° Facture' },
    { key: 'Client', label: 'Client' },
    { key: 'Statut', label: 'Statut' },
    { key: 'Total', label: 'Total' },
    { key: 'Encaissé', label: 'Encaissé' },
    { key: 'Reste', label: 'Reste' },
    { key: 'Date', label: 'Date' },
  ];

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 print-area">
      <div className="hidden print:block mb-6 pb-4 border-b">
        <h1 className="text-xl font-bold">{shop.name} — Rapport commercial</h1>
        <p className="text-xs text-zinc-500 mt-1">Période : {label} — Généré le {today}</p>
      </div>

      <div className="print-hide">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rapports</h1>
          </div>
          <div className="flex items-center gap-2">
            <DownloadCSV data={csvData} columns={csvColumns} filename={`rapport-${label.replace(/\s+/g, '-').toLowerCase()}`} />
            <PrintButton />
          </div>
        </div>
        <Suspense>
          <PeriodSelector />
        </Suspense>
      </div>

      <p className="text-sm text-zinc-500 print-hide mt-1">Période : {label}</p>

      {/* Key Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3">
        <div className="bg-white rounded-xl border p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="size-4 text-emerald-600" /></div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CA</p>
          </div>
          <p className="text-xl lg:text-2xl font-bold font-heading tracking-tight text-emerald-600 tabular-nums">{formatCurrency(totalCA)}</p>
          <p className="text-xs text-zinc-400 mt-1">{nbSales} vente(s) · Panier moyen {formatCurrency(avgBasket)}</p>
        </div>

        <div className="bg-white rounded-xl border p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-red-100 flex items-center justify-center"><ShoppingCart className="size-4 text-red-600" /></div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Coûts</p>
          </div>
          <p className="text-xl lg:text-2xl font-bold font-heading tracking-tight text-red-600 tabular-nums">{formatCurrency(totalCosts)}</p>
          <p className="text-xs text-zinc-400 mt-1">Marchandises {formatCurrency(totalCOGS)} · Dépenses {formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl border p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Coins className={`size-4 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bénéfice</p>
          </div>
          <p className={`text-xl lg:text-2xl font-bold font-heading tracking-tight tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(profit)}
          </p>
          <p className={`text-xs mt-1 ${marginPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            Marge {marginPct >= 0 ? '+' : ''}{marginPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b"><h2 className="font-heading font-semibold text-base">CA</h2></div>
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

      {/* Sales table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-heading font-semibold text-base">Ventes</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{nbSales} facture(s)</p>
        </div>
        {nbSales === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Aucune vente sur cette période</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">N° Facture</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</th>
                  <th className="text-right px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Encaissé</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reste</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                    <td className="px-2 py-3">{inv.client_name}</td>
                    <td className="px-2 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{STATUS_LABELS[inv.status] || inv.status}</span>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums font-medium">{formatCurrency(Number(inv.total))}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-emerald-600">{formatCurrency(Number(inv.amount_paid))}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(Number(inv.balance_due))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-zinc-50/80 font-semibold">
                  <td className="px-5 py-3 text-xs text-zinc-500" colSpan={3}>Total</td>
                  <td className="px-2 py-3 text-right tabular-nums">{formatCurrency(totalCA)}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-emerald-600">{formatCurrency(totalPaid)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(totalCA - totalPaid)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {expenses.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-heading font-semibold text-base">Dépenses</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{expenses.length} mouvement(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((exp: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(exp.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 py-3">{exp.description || '—'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-red-600">{formatCurrency(Math.abs(Number(exp.amount)))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-zinc-50/80 font-semibold">
                  <td className="px-5 py-3 text-xs text-zinc-500" colSpan={2}>Total</td>
                  <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="hidden print:block mt-6 pt-4 border-t text-xs text-zinc-400 text-center">
        StockOS Pro — {shop.name} — Rapport généré le {today}
      </div>
    </div>
  );
}
