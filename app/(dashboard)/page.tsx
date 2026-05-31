import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices, cashMovements } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  FileText,
  Wallet,
  Landmark,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Bienvenue sur StockOS Pro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="CA Aujourd&apos;hui"
          value={formatCurrency(todayStats.revenue)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Factures aujourd&apos;hui"
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
          icon={Landmark}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dernières factures</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune facture récente</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{inv.clientName}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-medium text-sm">{formatCurrency(Number(inv.total))}</p>
                    <Badge variant={STATUS_VARIANTS[inv.status] || 'outline'}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
