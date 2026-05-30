import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices, cashMovements, invoiceLines } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  FileText,
  Wallet,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export default async function DashboardPage() {
  const { shop } = await getCurrentShop();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayStats] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(CAST(total AS DECIMAL(12,2))), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.shopId, shop.id),
      eq(invoices.status, 'PAID'),
      gte(invoices.createdAt, today),
    ));

  const [pendingInvoices] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.shopId, shop.id),
      eq(invoices.status, 'VALIDATED'),
    ));

  const [cashBalance] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(12,2))), 0)`,
    })
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shop.id));

  const recentInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.shopId, shop.id))
    .orderBy(sql`created_at DESC`)
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-zinc-500">Bienvenue sur StockOS Pro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="CA Aujourd'hui"
          value={formatCurrency(todayStats.revenue)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Factures aujourd'hui"
          value={String(todayStats.count)}
          icon={FileText}
        />
        <StatsCard
          title="En attente de paiement"
          value={String(pendingInvoices.count)}
          icon={Wallet}
        />
        <StatsCard
          title="Solde caisse"
          value={formatCurrency(cashBalance.balance)}
          icon={Package}
        />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Dernières factures</h2>
        {recentInvoices.length === 0 ? (
          <p className="text-zinc-500 text-sm">Aucune facture récente</p>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{inv.invoiceNumber}</p>
                  <p className="text-sm text-zinc-500">{inv.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(Number(inv.total))}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
