import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
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
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const { data: paidInvoices } = await admin
    .from('invoices')
    .select('total')
    .eq('shop_id', shop.id)
    .eq('status', 'PAID')
    .gte('created_at', thirtyDaysAgoStr);

  const monthlyRevenue = (paidInvoices ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);
  const invoiceCount = paidInvoices?.length ?? 0;

  const { data: expenseMovements } = await admin
    .from('cash_movements')
    .select('amount')
    .eq('shop_id', shop.id)
    .eq('movement_type', 'EXPENSE')
    .gte('created_at', thirtyDaysAgoStr);

  const monthlyExpenses = (expenseMovements ?? []).reduce((sum, m) => sum + Number(m.amount), 0);

  const { data: allInvoices } = await admin
    .from('invoices')
    .select('status')
    .eq('shop_id', shop.id);

  const invoiceByStatusMap = new Map<string, number>();
  for (const inv of (allInvoices ?? [])) {
    invoiceByStatusMap.set(inv.status, (invoiceByStatusMap.get(inv.status) ?? 0) + 1);
  }
  const invoiceByStatus = Array.from(invoiceByStatusMap.entries()).map(([status, count]) => ({ status, count }));

  const netResult = monthlyRevenue - monthlyExpenses;

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
            <p className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-sm text-muted-foreground">{invoiceCount} facture(s) payée(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive tabular-nums">{formatCurrency(monthlyExpenses)}</p>
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
