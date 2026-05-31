import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  FileText,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
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
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Bienvenue sur StockOS Pro
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title="CA Aujourd&apos;hui"
          value={formatCurrency(todayRevenue)}
          icon={TrendingUp}
          accent="bg-emerald-600"
        />
        <StatsCard
          title="Factures aujourd&apos;hui"
          value={String(todayCount)}
          icon={FileText}
          accent="bg-blue-600"
        />
        <StatsCard
          title="En attente de paiement"
          value={String(pendingCount ?? 0)}
          icon={Wallet}
          accent="bg-amber-600"
        />
        <StatsCard
          title="Solde caisse"
          value={formatCurrency(cashBalance)}
          icon={Landmark}
          accent="bg-violet-600"
        />
      </div>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">
            Dernières factures
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 lg:px-6 pb-5 lg:pb-6">
          {!recentInvoices?.length ? (
            <div className="text-center py-12 lg:py-16">
              <FileText className="size-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucune facture récente</p>
            </div>
          ) : (
            <div className="-mx-5 lg:-mx-6">
              <div className="divide-y divide-zinc-100">
                {recentInvoices.map((inv: any, i: number) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-5 lg:px-6 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-zinc-900 font-heading">
                        {inv.invoice_number}
                      </p>
                      <p className="text-sm text-zinc-500 truncate mt-0.5">
                        {inv.client_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4 shrink-0 ml-4">
                      <span className="font-semibold text-sm text-zinc-900 tabular-nums">
                        {formatCurrency(Number(inv.total))}
                      </span>
                      <Badge variant={STATUS_VARIANTS[inv.status] || 'outline'} className="text-[11px] px-2.5 py-0.5">
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
