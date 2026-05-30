import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices, cashMovements } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';

export default async function ReportsPage() {
  const { shop } = await getCurrentShop();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [monthlyRevenue] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CAST(total AS DECIMAL(12,2))), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.shopId, shop.id),
      eq(invoices.status, 'PAID'),
      gte(invoices.createdAt, thirtyDaysAgo),
    ));

  const [monthlyExpenses] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(12,2))), 0)`,
    })
    .from(cashMovements)
    .where(and(
      eq(cashMovements.shopId, shop.id),
      eq(cashMovements.movementType, 'EXPENSE'),
      gte(cashMovements.createdAt, thirtyDaysAgo),
    ));

  const invoiceByStatus = await db
    .select({
      status: invoices.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(eq(invoices.shopId, shop.id))
    .groupBy(invoices.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-zinc-500 text-sm">Statistiques des 30 derniers jours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-zinc-500">Revenus</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyRevenue.revenue)}</p>
          <p className="text-xs text-zinc-400">{monthlyRevenue.count} facture(s)</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-zinc-500">Dépenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyExpenses.total)}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-zinc-500">Résultat net</p>
          <p className={`text-2xl font-bold ${monthlyRevenue.revenue - monthlyExpenses.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyRevenue.revenue - monthlyExpenses.total)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Factures par statut</h2>
        <div className="space-y-3">
          {invoiceByStatus.map(({ status, count }) => (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm">{status}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
          {invoiceByStatus.length === 0 && (
            <p className="text-sm text-zinc-400">Aucune donnée</p>
          )}
        </div>
      </div>
    </div>
  );
}
