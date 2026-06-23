import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Wallet, TrendingDown, TrendingUp, ArrowLeftRight } from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  PAYMENT_IN: 'Encaissement',
  EXPENSE: 'Dépense',
  TRANSFER: 'Virement',
};

const METHOD_COLORS: Record<string, string> = {
  PAYMENT_IN: 'text-emerald-600 bg-emerald-50',
  EXPENSE: 'text-red-600 bg-red-50',
  TRANSFER: 'text-blue-600 bg-blue-50',
};

export default async function CashRegisterPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: movements } = await admin
    .from('cash_movements')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const allMovements = movements ?? [];

  const balance = allMovements.reduce((sum: number, m: any) => sum + Number(m.amount), 0);
  const inflows = allMovements.filter((m: any) => Number(m.amount) > 0);
  const outflows = allMovements.filter((m: any) => Number(m.amount) < 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Caisse</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Suivi des mouvements de trésorerie</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <TrendingUp className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700 tabular-nums">{formatCurrency(inflows.reduce((s: number, m: any) => s + Number(m.amount), 0))}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
            <TrendingDown className="size-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600 tabular-nums">{formatCurrency(Math.abs(outflows.reduce((s: number, m: any) => s + Number(m.amount), 0)))}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-900">
            <Wallet className="size-4 text-white" />
            <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6">
        <h2 className="text-base font-heading font-semibold mb-4">Mouvements récents</h2>
        {allMovements.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Aucun mouvement</p>
        ) : (
          <div className="space-y-2">
            {allMovements.map((m: any) => {
              const label = METHOD_LABELS[m.movement_type] || m.movement_type;
              const color = METHOD_COLORS[m.movement_type] || 'text-zinc-600 bg-zinc-100';
              return (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <ArrowLeftRight className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{m.description || label}</p>
                      <p className="text-xs text-zinc-400">{new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums shrink-0 ml-4 ${Number(m.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Number(m.amount) >= 0 ? '+' : ''}{formatCurrency(Number(m.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
