import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { products, stockItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground">{allProducts.length} produit(s)</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
          <Plus className="size-4" />
          Nouveau produit
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
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
              {allProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Package className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun produit. Créez votre premier produit.
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((p) => {
                  const stock = stockMap.get(p.id);
                  const qty = stock ? Number(stock.quantity) : 0;
                  const isOut = qty <= 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(p.unitPrice))}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isOut ? 'destructive' : 'secondary'} className="tabular-nums">
                          {qty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.category || '-'}</TableCell>
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
