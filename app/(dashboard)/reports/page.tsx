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

  const [paidResult, allResult] = await Promise.all([
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('created_at', thirtyDaysAgoStr),
    admin.from('invoices').select('status').eq('shop_id', shop.id),
  ]);

  const monthlyRevenue = (paidResult.data ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);
  const invoiceCount = paidResult.data?.length ?? 0;

  const invoiceByStatusMap = new Map<string, number>();
  for (const inv of (allResult.data ?? [])) {
    invoiceByStatusMap.set(inv.status, (invoiceByStatusMap.get(inv.status) ?? 0) + 1);
  }
  const invoiceByStatus = Array.from(invoiceByStatusMap.entries()).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rapports</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Statistiques des 30 derniers jours</p>
      </div>

      <Card>
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Revenus</CardTitle>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          <p className="text-2xl lg:text-3xl font-bold font-heading tracking-tight text-emerald-600 tabular-nums">
            {formatCurrency(monthlyRevenue)}
          </p>
          <p className="text-sm text-zinc-500 mt-1.5">{invoiceCount} facture(s) payée(s)</p>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Factures par statut</CardTitle>
          <CardDescription>Répartition de toutes les factures</CardDescription>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {invoiceByStatus.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {invoiceByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <Badge variant={STATUS_VARIANTS[status] || 'outline'}>
                    {STATUS_LABELS[status] || status}
                  </Badge>
                  <span className="font-medium tabular-nums text-zinc-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
