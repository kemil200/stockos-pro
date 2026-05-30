import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { products, stockItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ProductsPage() {
  const { shop } = await getCurrentShop();

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.shopId, shop.id))
    .orderBy(sql`created_at DESC`);

  const stockMap = new Map();
  const stockRows = await db
    .select()
    .from(stockItems)
    .where(eq(stockItems.shopId, shop.id));

  for (const s of stockRows) {
    stockMap.set(s.productId, s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-zinc-500 text-sm">{allProducts.length} produit(s)</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Nom</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">SKU</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Prix</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-zinc-400">
                  Aucun produit. Créez votre premier produit.
                </td>
              </tr>
            ) : (
              allProducts.map((p) => {
                const stock = stockMap.get(p.id);
                const qty = stock ? Number(stock.quantity) : 0;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{p.sku || '-'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(p.unitPrice))}</td>
                    <td className={`px-4 py-3 text-right ${qty <= 0 ? 'text-red-600 font-medium' : ''}`}>
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{p.category || '-'}</td>
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
