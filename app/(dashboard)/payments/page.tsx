import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DATE_PRESETS = [
  { label: 'Ce mois', value: 'month' },
  { label: 'Mois dernier', value: 'last-month' },
  { label: '30 jours', value: '30d' },
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const now = new Date();
  let fromDate: Date;
  switch (period) {
    case 'month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last-month':
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    default:
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      break;
  }
  const fromStr = fromDate.toISOString();

  let toDate: Date | undefined;
  if (period === 'last-month') {
    toDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  let query = admin
    .from('payments')
    .select('*')
    .eq('shop_id', shop.id)
    .gte('created_at', fromStr);

  if (toDate) {
    query = query.lt('created_at', toDate.toISOString());
  }

  const [paymentsResult, summaryResult] = await Promise.all([
    query.order('created_at', { ascending: false }).limit(100),
    admin.from('payments').select('method, amount').eq('shop_id', shop.id).gte('created_at', fromStr),
  ]);

  const allPayments = paymentsResult.data ?? [];

  const methodTotals = new Map<string, number>();
  for (const p of (summaryResult.data ?? [])) {
    methodTotals.set(p.method, (methodTotals.get(p.method) ?? 0) + Number(p.amount));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-sm text-muted-foreground">Historique des paiements</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DATE_PRESETS.map(({ label, value }) => {
          const params = new URLSearchParams();
          if (value !== '30d') params.set('period', value);
          return (
            <Link
              key={value}
              href={`/payments${params.toString() ? `?${params.toString()}` : ''}`}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                (period || '30d') === value
                  ? 'bg-zinc-900 text-white'
                  : 'hover:bg-zinc-100 text-zinc-600',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {methodTotals.size > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from(methodTotals.entries()).map(([method, total]) => (
            <Card key={method}>
              <CardContent className="p-4">
                <p className="text-sm text-zinc-500 font-medium">{method}</p>
                <p className="text-lg font-bold text-green-600 tabular-nums mt-1">
                  {formatCurrency(total)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!allPayments.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Receipt className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun paiement
                  </TableCell>
                </TableRow>
              ) : (
                allPayments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="text-muted-foreground">{p.reference || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600 tabular-nums">
                      {formatCurrency(Number(p.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
