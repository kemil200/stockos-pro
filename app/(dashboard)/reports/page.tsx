import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RevenueChart } from '@/components/reports/revenue-chart';
import { PrintButton } from '@/components/reports/print-button';

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

export default async function ReportsPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthStr = startOfMonth.toISOString();

  const [paidResult, allResult, dailyResult, topProductsResult, expensesResult, cashInResult] = await Promise.all([
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', thirtyDaysAgoStr),
    admin.from('invoices').select('status').eq('shop_id', shop.id),
    admin.from('invoices').select('total, paid_at').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', thirtyDaysAgoStr).order('paid_at'),
    admin.from('invoice_lines').select('product_id, quantity, unit_price, line_total').gte('created_at', thirtyDaysAgoStr),
    admin.from('cash_movements').select('amount').eq('shop_id', shop.id).eq('movement_type', 'EXPENSE').gte('created_at', startOfMonthStr),
    admin.from('cash_movements').select('amount').eq('shop_id', shop.id).eq('movement_type', 'PAYMENT_IN').gte('created_at', startOfMonthStr),
  ]);

  // Revenue
  const monthlyRevenue = (paidResult.data ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);
  const invoiceCount = paidResult.data?.length ?? 0;

  // Expenses (absolute value since they're stored as negative)
  const totalExpenses = (expensesResult.data ?? []).reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0);
  const totalCashIn = (cashInResult.data ?? []).reduce((sum, m) => sum + Number(m.amount), 0);
  const netMargin = totalCashIn - totalExpenses;

  // Invoice by status
  const invoiceByStatusMap = new Map<string, number>();
  for (const inv of (allResult.data ?? [])) {
    invoiceByStatusMap.set(inv.status, (invoiceByStatusMap.get(inv.status) ?? 0) + 1);
  }
  const invoiceByStatus = Array.from(invoiceByStatusMap.entries()).map(([status, count]) => ({ status, count }));
  const totalCount = invoiceByStatus.reduce((s, c) => s + c.count, 0);
  const draftCount = invoiceByStatusMap.get('DRAFT') ?? 0;
  const validatedCount = invoiceByStatusMap.get('VALIDATED') ?? 0;
  const paidCount = invoiceByStatusMap.get('PAID') ?? 0;
  const draftToValidatedRate = draftCount > 0 ? Math.round(validatedCount / draftCount * 100) : 0;
  const validatedToPaidRate = validatedCount > 0 ? Math.round(paidCount / validatedCount * 100) : 0;

  // Daily revenue chart
  const revenueByDate = new Map<string, number>();
  for (const inv of (dailyResult.data ?? [])) {
    if (inv.paid_at) {
      const day = inv.paid_at.slice(0, 10);
      revenueByDate.set(day, (revenueByDate.get(day) ?? 0) + Number(inv.total));
    }
  }
  const chartData = Array.from(revenueByDate.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top products
  const productQuantityMap = new Map<string, { qty: number; revenue: number }>();
  for (const line of (topProductsResult.data ?? [])) {
    if (!line.product_id) continue;
    const existing = productQuantityMap.get(line.product_id) ?? { qty: 0, revenue: 0 };
    existing.qty += Number(line.quantity);
    existing.revenue += Number(line.line_total);
    productQuantityMap.set(line.product_id, existing);
  }
  const topProducts = Array.from(productQuantityMap.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 print-area">
      {/* Print header — visible only when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b">
        <h1 className="text-2xl font-bold">{shop.name} — Rapport commercial</h1>
        <p className="text-sm text-zinc-500 mt-1">Généré le {today}</p>
      </div>

      {/* Screen header */}
      <div className="print-hide flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Analyse des 30 derniers jours</p>
        </div>
        <PrintButton />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
            <CardTitle className="text-sm font-heading font-semibold text-zinc-500">Revenus 30j</CardTitle>
          </CardHeader>
          <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
            <p className="text-2xl lg:text-3xl font-bold font-heading tracking-tight text-emerald-600 tabular-nums">
              {formatCurrency(monthlyRevenue)}
            </p>
            <p className="text-sm text-zinc-500 mt-1.5">{invoiceCount} facture(s) payée(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
            <CardTitle className="text-sm font-heading font-semibold text-zinc-500">Dépenses (mois)</CardTitle>
          </CardHeader>
          <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
            <p className="text-2xl lg:text-3xl font-bold font-heading tracking-tight text-red-600 tabular-nums">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-sm text-zinc-500 mt-1.5">Encaissements: {formatCurrency(totalCashIn)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
            <CardTitle className="text-sm font-heading font-semibold text-zinc-500">Marge nette</CardTitle>
          </CardHeader>
          <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
            <p className={`text-2xl lg:text-3xl font-bold font-heading tracking-tight tabular-nums ${netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(netMargin)}
            </p>
            <p className="text-sm text-zinc-500 mt-1.5">{netMargin >= 0 ? 'Bénéficiaire' : 'Déficitaire'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
            <CardTitle className="text-sm font-heading font-semibold text-zinc-500">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Brouillon → Validée</span>
                <span className="font-semibold">{draftToValidatedRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Validée → Payée</span>
                <span className="font-semibold">{validatedToPaidRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Total factures</span>
                <span className="font-semibold">{totalCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factures par statut */}
      <Card>
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Factures par statut</CardTitle>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {invoiceByStatus.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {invoiceByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between py-0.5">
                  <Badge variant={STATUS_VARIANTS[status] || 'outline'} className="text-[11px]">
                    {STATUS_LABELS[status] || status}
                  </Badge>
                  <span className="font-medium tabular-nums text-sm text-zinc-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue chart */}
      <Card className="print:break-inside-avoid">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Revenu journalier</CardTitle>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {chartData.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">Aucune donnée de revenu sur cette période</p>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      <Card className="print:break-inside-avoid">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Top 5 produits</CardTitle>
          <CardDescription>Les plus vendus en quantité</CardDescription>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune vente sur cette période</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([productId, { qty, revenue }], i) => (
                <div key={productId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-medium w-5">{i + 1}.</span>
                    <span className="text-sm font-medium">{productId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="tabular-nums text-zinc-500">{qty} vendu(s)</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t text-xs text-zinc-400 text-center">
        StockOS Pro — {shop.name} — Rapport généré le {today}
      </div>
    </div>
  );
}
