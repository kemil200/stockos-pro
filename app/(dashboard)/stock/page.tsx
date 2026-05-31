import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
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
  const admin = createAdminClient();

  const { data: items } = await admin
    .from('stock_items')
    .select('*, products(*)')
    .eq('shop_id', shop.id)
    .order('quantity', { ascending: true });

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
              {!items?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Package className="size-8 mx-auto mb-2 text-zinc-300" />
                    Aucun stock. Ajoutez des produits avec un stock initial.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any) => {
                  const qty = Number(item.quantity);
                  const min = Number(item.min_threshold);
                  const isLow = qty <= min && min > 0;
                  const isOut = qty <= 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.products?.name}</TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${isOut ? 'text-destructive' : isLow ? 'text-orange-500' : ''}`}>
                        {qty}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">{min}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(qty * Number(item.products?.unit_price ?? 0))}</TableCell>
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
