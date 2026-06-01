'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { AlertTriangle, Package, RefreshCw, Search } from 'lucide-react';
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

interface StockItemData {
  id: string;
  product_id: string;
  quantity: string;
  min_threshold: string;
  products: { name: string; unit_price: string } | null;
  last_in_date?: string | null;
}

export function StockTableClient({ items }: { items: StockItemData[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      item.products?.name?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const stockOutItems = items.filter((item) => Number(item.quantity) <= 0);
  const lowStockItems = items.filter(
    (item) =>
      Number(item.quantity) <= Number(item.min_threshold) &&
      Number(item.min_threshold) > 0 &&
      Number(item.quantity) > 0,
  );

  return (
    <div className="space-y-4">
      {(stockOutItems.length > 0 || lowStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            {stockOutItems.length > 0 && (
              <p>
                <strong>{stockOutItems.length} produit(s) en rupture</strong>
                {stockOutItems.length > 0 && (
                  <span className="text-amber-600">
                    {' — '}
                    {stockOutItems.slice(0, 3).map((i) => i.products?.name).filter(Boolean).join(', ')}
                    {stockOutItems.length > 3 && ` et ${stockOutItems.length - 3} autre(s)`}
                  </span>
                )}
              </p>
            )}
            {lowStockItems.length > 0 && (
              <p className="mt-1">
                <strong>{lowStockItems.length} produit(s) sous le seuil minimum</strong>
                {lowStockItems.length > 0 && (
                  <span className="text-amber-600">
                    {' — '}
                    {lowStockItems.slice(0, 3).map((i) => i.products?.name).filter(Boolean).join(', ')}
                    {lowStockItems.length > 3 && ` et ${lowStockItems.length - 3} autre(s)`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Inventaire</CardTitle>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <RefreshCw className="size-3" /> Approvisionnement → /supply
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
                <TableHead className="text-right">Dernière entrée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    <Package className="size-10 text-zinc-200 mx-auto mb-3" />
                    {search ? 'Aucun produit trouvé' : "Aucun stock. Créez d'abord des produits."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
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
                      <TableCell className="text-right text-sm text-zinc-500 tabular-nums">
                        {item.last_in_date
                          ? new Date(item.last_in_date).toLocaleDateString('fr-FR')
                          : '-'}
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
