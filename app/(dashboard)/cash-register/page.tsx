import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { getPlanConfig } from '@/lib/plans';
import { notFound } from 'next/navigation';
import { Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MOVEMENT_LABELS: Record<string, string> = {
  PAYMENT_IN: 'Paiement reçu',
  REFUND_OUT: 'Remboursement',
  WITHDRAWAL: 'Retrait',
  DEPOSIT: 'Dépôt',
  OPENING_BALANCE: 'Solde initial',
};

export default async function CashRegisterPage() {
  const { shop } = await getCurrentShop();
  const { getPlanConfig } = await import('@/lib/plans');
  const config = await getPlanConfig(shop.id);
  if (config.maxRegisters === 0) notFound();
  const admin = createAdminClient();

  const [balanceResult, movementsResult] = await Promise.all([
    admin.from('cash_movements').select('amount').eq('shop_id', shop.id),
    admin.from('cash_movements').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(100),
  ]);

  const total = (balanceResult.data ?? []).reduce((sum, m) => sum + Number(m.amount), 0);
  const movements = movementsResult.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Caisse</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Journal des flux financiers</p>
        </div>
        <Card className="w-auto">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Landmark className="size-5 text-zinc-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Solde actuel</p>
              <p className={`text-lg font-bold tabular-nums ${total >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(total)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mouvements</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!movements?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Landmark className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun mouvement
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m: any) => {
                  const amount = Number(m.amount);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={amount >= 0 ? 'default' : 'destructive'}>
                          {MOVEMENT_LABELS[m.movement_type] || m.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.description || '-'}</TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${amount >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
