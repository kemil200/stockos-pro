import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';
import { PackagePlus, TrendingDown } from 'lucide-react';
import { SupplyForm } from '@/components/supply/supply-form';

export default async function SupplyPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const [productsResult, expensesResult, recentResult] = await Promise.all([
    admin.from('products').select('id, name, unit_price, purchase_price').eq('shop_id', shop.id).order('name'),
    admin.from('cash_movements').select('amount').eq('shop_id', shop.id).eq('movement_type', 'EXPENSE'),
    admin.from('stock_movements').select('*').eq('shop_id', shop.id).eq('movement_type', 'IN').order('created_at', { ascending: false }).limit(10),
  ]);

  const products = productsResult.data ?? [];
  const totalExpenses = (expensesResult.data ?? []).reduce((s: number, m: any) => s + Math.abs(Number(m.amount)), 0);
  const recentMovements = recentResult.data ?? [];

  const typeLabel = (t: string) => {
    const m: Record<string, string> = { IN: 'Achat', SALE: 'Vente', ADJUSTMENT: 'Ajustement', CANCELLATION: 'Annulation' };
    return m[t] || t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Approvisionnement</h1>
          <p className="text-sm text-zinc-500 mt-1.5">Acheter des marchandises pour réapprovisionner le stock</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-100">
          <TrendingDown className="size-4 text-red-500" />
          <span className="text-sm font-semibold text-red-600 tabular-nums">{formatCurrency(totalExpenses)}</span>
          <span className="text-xs text-red-400">dépenses totales</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6">
          <h2 className="text-base font-heading font-semibold mb-4">Nouvel achat</h2>
          <SupplyForm products={products} />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6">
          <h2 className="text-base font-heading font-semibold mb-4">Derniers achats</h2>
          {recentMovements.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">Aucun achat</p>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 text-sm">
                  <div>
                    <span className="font-medium text-zinc-700">{typeLabel(m.movement_type)}</span>
                    <span className="text-zinc-400 ml-2">{m.reason || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium tabular-nums">{m.quantity} × {formatCurrency(Number(m.unit_price ?? 0))}</span>
                    <p className="text-xs text-zinc-400">{new Date(m.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
