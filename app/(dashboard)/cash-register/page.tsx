import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { cashMovements } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
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
  EXPENSE: 'Dépense',
  WITHDRAWAL: 'Retrait',
  DEPOSIT: 'Dépôt',
  OPENING_BALANCE: 'Solde initial',
};

export default async function CashRegisterPage() {
  const { shop } = await getCurrentShop();

  const [balance] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(12,2))), 0)`,
    })
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shop.id));

  const movements = await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shop.id))
    .orderBy(sql`created_at DESC`)
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caisse</h1>
          <p className="text-sm text-muted-foreground">Journal des flux financiers</p>
        </div>
        <Card className="w-auto">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Landmark className="size-5 text-zinc-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Solde actuel</p>
              <p className={`text-lg font-bold tabular-nums ${balance.total >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(balance.total)}
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
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Landmark className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun mouvement
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => {
                  const amount = Number(m.amount);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={amount >= 0 ? 'default' : 'destructive'}>
                          {MOVEMENT_LABELS[m.movementType] || m.movementType}
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
