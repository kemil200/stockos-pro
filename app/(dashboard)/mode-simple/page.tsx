import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { DailyStats } from '@/components/quick-sale/daily-stats';
import { SaleForm } from '@/components/quick-sale/sale-form';
import { RecentSales } from '@/components/quick-sale/recent-sales';

export default async function ModeSimplePage() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: productRows } = await admin
    .from('products')
    .select('id, name, unit_price')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('name');

  const products = (productRows ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    unit_price: p.unit_price,
  }));

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Date header — notebook style */}
      <div>
        <h1 className="text-lg font-heading font-semibold text-zinc-900">
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </h1>
      </div>

      {/* Daily stats */}
      <DailyStats />

      {/* Sale form */}
      <div>
        <h2 className="text-sm font-heading font-semibold text-zinc-900 mb-4">
          Nouvelle vente
        </h2>
        <SaleForm products={products} />
      </div>

      {/* Recent sales */}
      <RecentSales />

      {/* Footer link to full mode */}
      <div className="text-center pb-6">
        <p className="text-xs text-zinc-400">
          Besoin des rapports, stock ou produits ?
        </p>
        <p className="text-xs text-zinc-400">
          Passez en{' '}
          <span className="text-zinc-600 font-medium">mode Complet</span>
          {' '}depuis le toggle en haut.
        </p>
      </div>
    </div>
  );
}
