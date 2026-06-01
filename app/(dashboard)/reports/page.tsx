import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { PrintButton } from '@/components/reports/print-button';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', VALIDATED: 'Validée', PAID: 'Payée',
  PARTIALLY_PAID: 'Partielle', CANCELLED: 'Annulée',
};

export default async function ReportsPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const since = thirtyDaysAgo.toISOString();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthStart = startOfMonth.toISOString();

  const [paidInvResult, expensesResult, cashInResult] = await Promise.all([
    admin.from('invoices')
      .select('id, invoice_number, client_name, total, amount_paid, balance_due, status, paid_at, created_at')
      .eq('shop_id', shop.id)
      .in('status', ['PAID', 'PARTIALLY_PAID', 'VALIDATED'])
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    admin.from('cash_movements')
      .select('amount, description, created_at')
      .eq('shop_id', shop.id)
      .eq('movement_type', 'EXPENSE')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false }),
    admin.from('cash_movements')
      .select('amount')
      .eq('shop_id', shop.id)
      .eq('movement_type', 'PAYMENT_IN')
      .gte('created_at', monthStart),
  ]);

  const invoices = paidInvResult.data ?? [];

  const totalCA = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalPaid = invoices.reduce((s, inv) => s + Number(inv.amount_paid), 0);

  const totalExpenses = (expensesResult.data ?? []).reduce((s, m) => s + Math.abs(Number(m.amount)), 0);
  const totalCashIn = (cashInResult.data ?? []).reduce((s, m) => s + Number(m.amount), 0);

  const expenses = expensesResult.data ?? [];

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 print-area">
      {/* Print header */}
      <div className="hidden print:block mb-6 pb-4 border-b">
        <h1 className="text-xl font-bold">{shop.name} — Rapport commercial</h1>
        <p className="text-xs text-zinc-500 mt-1">Période : 30 derniers jours — Généré le {today}</p>
      </div>

      {/* Screen header */}
      <div className="print-hide flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rapport commercial</h1>
          <p className="text-sm text-zinc-500 mt-1">30 derniers jours</p>
        </div>
        <PrintButton />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chiffre d&apos;affaires</p>
          <p className="text-2xl font-bold font-heading tracking-tight text-emerald-600 mt-2 tabular-nums">
            {formatCurrency(totalCA)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">{invoices.length} facture(s) — Encaissé: {formatCurrency(totalPaid)}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Achats / Dépenses</p>
          <p className="text-2xl font-bold font-heading tracking-tight text-red-600 mt-2 tabular-nums">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Encaissements: {formatCurrency(totalCashIn)}</p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Résultat net</p>
          <p className={`text-2xl font-bold font-heading tracking-tight mt-2 tabular-nums ${totalCashIn - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(totalCashIn - totalExpenses)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Mois en cours</p>
        </div>
      </div>

      {/* Sales lines */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-heading font-semibold text-base">Ventes</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{invoices.length} facture(s)</p>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Aucune vente sur cette période</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">N° Facture</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total</th>
                  <th className="text-right px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Encaissé</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reste à payer</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                    <td className="px-2 py-3">{inv.client_name}</td>
                    <td className="px-2 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums font-medium">{formatCurrency(Number(inv.total))}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-emerald-600">{formatCurrency(Number(inv.amount_paid))}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(Number(inv.balance_due))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-zinc-50/80 font-semibold">
                  <td className="px-5 py-3 text-xs text-zinc-500" colSpan={3}>Total</td>
                  <td className="px-2 py-3 text-right tabular-nums">{formatCurrency(totalCA)}</td>
                  <td className="px-2 py-3 text-right tabular-nums text-emerald-600">{formatCurrency(totalPaid)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(totalCA - totalPaid)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Expenses */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-heading font-semibold text-base">Dépenses</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{expenses.length} mouvement(s) — Mois en cours</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50/80">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((exp: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(exp.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-2 py-3">{exp.description || '—'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-red-600">
                      {formatCurrency(Math.abs(Number(exp.amount)))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-zinc-50/80 font-semibold">
                  <td className="px-5 py-3 text-xs text-zinc-500" colSpan={2}>Total dépenses</td>
                  <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatCurrency(totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Print footer */}
      <div className="hidden print:block mt-6 pt-4 border-t text-xs text-zinc-400 text-center">
        StockOS Pro — {shop.name} — Rapport généré le {today}
      </div>
    </div>
  );
}
