import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices, cashMovements } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  const netResult = monthlyRevenue.revenue - monthlyExpenses.total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
        <p className="text-sm text-muted-foreground">Statistiques des 30 derniers jours</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(monthlyRevenue.revenue)}</p>
            <p className="text-sm text-muted-foreground">{monthlyRevenue.count} facture(s) payée(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive tabular-nums">{formatCurrency(monthlyExpenses.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Résultat net</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${netResult >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(netResult)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factures par statut</CardTitle>
          <CardDescription>Répartition de toutes les factures</CardDescription>
        </CardHeader>
        <CardContent>
          {invoiceByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {invoiceByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant={STATUS_VARIANTS[status] || 'outline'}>
                    {STATUS_LABELS[status] || status}
                  </Badge>
                  <span className="font-medium tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
