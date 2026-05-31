import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { payments } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
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

export default async function PaymentsPage() {
  const { shop } = await getCurrentShop();

  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.shopId, shop.id))
    .orderBy(sql`created_at DESC`)
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="text-sm text-muted-foreground">Historique des paiements</p>
      </div>

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
              {allPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Receipt className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun paiement
                  </TableCell>
                </TableRow>
              ) : (
                allPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
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
