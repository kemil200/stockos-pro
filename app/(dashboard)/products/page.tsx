import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { hasFeature } from '@/lib/plans';
import Link from 'next/link';
import { Plus, Package, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { shop } = await getCurrentShop();
  const showPacks = await hasFeature(shop.id, 'packs');
  const admin = createAdminClient();

  const [productsResult, stockResult] = await Promise.all([
    admin.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
    admin.from('stock_items').select('*').eq('shop_id', shop.id),
  ]);

  const allProducts = productsResult.data ?? [];
  const stockRows = stockResult.data ?? [];

  const stockMap = new Map();
  for (const s of stockRows) {
    stockMap.set(s.product_id, s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Produits</h1>
          <p className="text-sm text-zinc-500 mt-1.5">{allProducts.length} produit(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {showPacks && (
            <Link href="/products/packs" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-all">
              <Layers className="size-4" />
              Packs
            </Link>
          )}
          <Link href="/products/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm">
            <Plus className="size-4" />
            Nouveau
          </Link>
        </div>
      </div>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Catalogue</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Catégorie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!allProducts.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                    <Package className="size-10 text-zinc-200 mx-auto mb-3" />
                    Aucun produit. Créez votre premier produit.
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((p: any) => {
                  const stock = stockMap.get(p.id);
                  const qty = stock ? Number(stock.quantity) : 0;
                  const isOut = qty <= 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-zinc-900">{p.name}</TableCell>
                      <TableCell className="text-zinc-500">{p.sku || '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(p.unit_price))}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isOut ? 'destructive' : 'secondary'} className="tabular-nums">
                          {qty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">{p.category || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
