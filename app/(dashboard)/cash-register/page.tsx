import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { cashMovements } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caisse</h1>
          <p className="text-zinc-500 text-sm">Journal des flux financiers</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Solde actuel</p>
          <p className={`text-xl font-bold ${balance.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance.total)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Description</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Montant</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-400">Aucun mouvement</td>
              </tr>
            ) : (
              movements.map((m) => {
                const amount = Number(m.amount);
                return (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-sm">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm">{MOVEMENT_LABELS[m.movementType] || m.movementType}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{m.description || '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {amount >= 0 ? '+' : ''}{formatCurrency(amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
