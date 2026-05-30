import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { payments, invoices } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';

export default async function PaymentsPage() {
  const { shop } = await getCurrentShop();

  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.shopId, shop.id))
    .orderBy(sql`created_at DESC`)
    .limit(50);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Paiements</h1>
        <p className="text-zinc-500 text-sm">Historique des paiements</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Méthode</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Référence</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Montant</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-400">Aucun paiement</td>
              </tr>
            ) : (
              allPayments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-sm">{new Date(p.paymentDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm">{p.method}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{p.reference || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatCurrency(Number(p.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
