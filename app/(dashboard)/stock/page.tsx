import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { Package, RefreshCw } from 'lucide-react';
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
import { StockAdjustButton } from '@/components/stock/stock-adjust-button';

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
        <p className="text-sm text-zinc-500">Gérez les niveaux de stock de vos produits</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Inventaire</CardTitle>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <RefreshCw className="size-3" /> Cliquez sur "Ajuster" pour modifier
          </span>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    <Package className="size-10 text-zinc-200 mx-auto mb-3" />
                    Aucun stock. Créez d&apos;abord des produits.
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
                      <TableCell className="text-right text-zinc-500 tabular-nums">{min}</TableCell>
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
                      <TableCell className="text-right">
                        <StockAdjustButton
                          productId={item.product_id}
                          productName={item.products?.name ?? ''}
                          currentQty={qty}
                        />
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
