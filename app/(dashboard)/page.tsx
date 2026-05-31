import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
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
  const admin = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString();

  const { data: paidToday } = await admin
    .from('invoices')
    .select('total')
    .eq('shop_id', shop.id)
    .eq('status', 'PAID')
    .gte('created_at', todayStr);

  const todayRevenue = (paidToday ?? []).reduce((sum, inv) => sum + Number(inv.total), 0);
  const todayCount = paidToday?.length ?? 0;

  const { count: pendingCount } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('status', 'VALIDATED');

  const { data: movements } = await admin
    .from('cash_movements')
    .select('amount')
    .eq('shop_id', shop.id);

  const cashBalance = (movements ?? []).reduce((sum, m) => sum + Number(m.amount), 0);

  const { data: recentInvoices } = await admin
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-zinc-500 text-sm mt-1">Bienvenue sur StockOS Pro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="CA Aujourd&apos;hui"
          value={formatCurrency(todayRevenue)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Factures aujourd&apos;hui"
          value={String(todayCount)}
          icon={FileText}
        />
        <StatsCard
          title="En attente de paiement"
          value={String(pendingCount ?? 0)}
          icon={Wallet}
        />
        <StatsCard
          title="Solde caisse"
          value={formatCurrency(cashBalance)}
          icon={Landmark}
        />
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Dernières factures</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentInvoices?.length ? (
            <div className="text-center py-12">
              <FileText className="size-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucune facture récente</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-zinc-900">{inv.invoice_number}</p>
                    <p className="text-sm text-zinc-500 truncate">{inv.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <p className="font-medium text-sm text-zinc-900 tabular-nums">
                      {formatCurrency(Number(inv.total))}
                    </p>
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
