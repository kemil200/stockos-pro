import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { stockItems, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';

export default async function StockPage() {
  const { shop } = await getCurrentShop();

  const items = await db
    .select({
      id: stockItems.id,
      productId: stockItems.productId,
      quantity: stockItems.quantity,
      minThreshold: stockItems.minThreshold,
      productName: products.name,
      productPrice: products.unitPrice,
    })
    .from(stockItems)
    .where(eq(stockItems.shopId, shop.id))
    .innerJoin(products, eq(stockItems.productId, products.id))
    .orderBy(sql`quantity ASC`);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Stock</h1>
        <p className="text-zinc-500 text-sm">Gestion des niveaux de stock</p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50">
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Produit</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Quantité</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Seuil min</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Valeur stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Statut</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-zinc-400">Aucun stock</td>
              </tr>
            ) : (
              items.map((item) => {
                const qty = Number(item.quantity);
                const min = Number(item.minThreshold);
                const isLow = qty <= min && min > 0;
                const isOut = qty <= 0;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : ''}`}>
                      {qty}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-zinc-500">{min}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(qty * Number(item.productPrice))}</td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Rupture</span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">Stock bas</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">OK</span>
                      )}
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
