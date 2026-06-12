import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { StockTableClient } from '@/components/stock/stock-table-client';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const [{ data: items }, { data: inMovements }] = await Promise.all([
    admin.from('stock_items').select('*, products(*)').eq('shop_id', shop.id).order('quantity', { ascending: true }),
    admin.from('stock_movements').select('product_id, created_at').eq('shop_id', shop.id).eq('movement_type', 'PURCHASE').order('created_at', { ascending: false }),
  ]);

  const lastInMap = new Map<string, string>();
  for (const m of (inMovements ?? [])) {
    if (!lastInMap.has(m.product_id)) {
      lastInMap.set(m.product_id, m.created_at);
    }
  }

  const itemsWithLastIn = (items ?? []).map((item: any) => ({
    ...item,
    last_in_date: lastInMap.get(item.product_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <p className="text-sm text-zinc-500">Gérez les niveaux de stock de vos produits</p>
      </div>

      <StockTableClient items={itemsWithLastIn} />
    </div>
  );
}
