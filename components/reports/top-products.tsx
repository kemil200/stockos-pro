'use client';

import { formatCurrency } from '@/lib/utils/currency';
import { TrendingUp, Hash, Package } from 'lucide-react';

interface TopProduct {
  productId: string | null;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  count: number;
}

export function TopProducts({ products }: { products: TopProduct[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-sm text-zinc-400">
        <Package className="size-8 text-zinc-200 mx-auto mb-2" />
        Aucune vente sur cette période
      </div>
    );
  }

  const maxRevenue = products[0]?.totalRevenue || 1;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <TrendingUp className="size-4 text-emerald-600" />
          Produits gagnants
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Top {products.length} par chiffre d&apos;affaires</p>
      </div>

      <div className="divide-y">
        {products.map((p, i) => {
          const rank = i + 1;
          const barWidth = Math.max(4, (p.totalRevenue / maxRevenue) * 100);

          return (
            <div key={p.productId || i} className="px-5 py-3 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
              <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                rank === 1 ? 'bg-amber-100 text-amber-700' :
                rank === 2 ? 'bg-zinc-200 text-zinc-600' :
                rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-zinc-100 text-zinc-400'
              }`}>
                {rank}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800 truncate">{p.name}</p>
                  <p className="text-sm font-bold tabular-nums text-zinc-900 ml-2">{formatCurrency(p.totalRevenue)}</p>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 shrink-0">
                    <span className="flex items-center gap-0.5">
                      <Hash className="size-3" />
                      {p.totalQuantity}
                    </span>
                    <span>{p.count} vente(s)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t bg-zinc-50/80">
        <p className="text-xs text-zinc-500 text-center">
          {products.length} produit(s) — Total CA : {formatCurrency(products.reduce((s, p) => s + p.totalRevenue, 0))}
        </p>
      </div>
    </div>
  );
}
