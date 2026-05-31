import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { stockItems, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils/currency';
import { Package } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
        <p className="text-sm text-muted-foreground">Gestion des niveaux de stock</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventaire</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Seuil min</TableHead>
                <TableHead className="text-right">Valeur stock</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Package className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun stock. Ajoutez des produits avec un stock initial.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const qty = Number(item.quantity);
                  const min = Number(item.minThreshold);
                  const isLow = qty <= min && min > 0;
                  const isOut = qty <= 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${isOut ? 'text-destructive' : isLow ? 'text-orange-500' : ''}`}>
                        {qty}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{min}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(qty * Number(item.productPrice))}</TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge variant="destructive">Rupture</Badge>
                        ) : isLow ? (
                          <Badge variant="secondary">Stock bas</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">OK</Badge>
                        )}
                      </TableCell>
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
