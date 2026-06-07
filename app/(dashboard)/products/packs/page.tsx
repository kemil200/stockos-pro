import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { formatCurrency } from '@/lib/utils/currency';
import { hasFeature } from '@/lib/plans';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Plus, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function PacksPage() {
  const { shop } = await getCurrentShop();
  if (!(await hasFeature(shop.id, 'packs'))) notFound();
  const admin = createAdminClient();

  const { data: allPacks } = await admin
    .from('packs')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  const packsList = allPacks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Packs</h1>
          <p className="text-sm text-zinc-500 mt-1.5">{packsList.length} pack(s)</p>
        </div>
        <Link href="/products/packs/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm">
          <Plus className="size-4" />
          Nouveau
        </Link>
      </div>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardHeader className="px-5 lg:px-6 py-4 lg:py-5">
          <CardTitle className="text-base lg:text-lg font-heading font-semibold">Packs de produits</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Prix achat</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!packsList.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                    <Layers className="size-10 text-zinc-200 mx-auto mb-3" />
                    Aucun pack. Composez votre premier pack.
                  </TableCell>
                </TableRow>
              ) : (
                packsList.map((p: any) => {
                  const sale = Number(p.sale_price);
                  const cost = Number(p.purchase_price);
                  const margin = cost > 0 ? ((sale - cost) / cost) * 100 : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-zinc-900">
                        <Link href={`/products/packs/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatCurrency(sale)}</TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-500">{formatCurrency(cost)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {margin !== null ? (
                          <span className={margin >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
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
