'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { hasFeature } from '@/lib/plans';

export interface SearchItem {
  id: string;
  type: 'invoice' | 'product' | 'pack' | 'category';
  label: string;
  subtitle: string;
  href: string;
}

export async function searchAll(query: string): Promise<SearchItem[]> {
  if (!query || query.length < 2) return [];

  const { shop } = await getCurrentShop();
  const canSeePacks = await hasFeature(shop.id, 'packs');
  const admin = createAdminClient();
  const results: SearchItem[] = [];
  const q = query.toLowerCase();

  try {
    // Search products
    const { data: products } = await admin
      .from('products')
      .select('id, name, category, unit_price')
      .eq('shop_id', shop.id)
      .ilike('name', `%${q}%`)
      .limit(5);

    for (const p of products ?? []) {
      results.push({
        id: p.id,
        type: 'product',
        label: p.name,
        subtitle: `${p.category || 'Sans catégorie'} · ${Number(p.unit_price).toLocaleString()} FCFA`,
        href: `/products`,
      });
    }

    // Search categories
    const { data: categories } = await admin
      .from('cat_lookup')
      .select('id, name')
      .eq('shop_id', shop.id)
      .ilike('name', `%${q}%`)
      .limit(3);

    for (const c of categories ?? []) {
      results.push({
        id: c.id,
        type: 'category',
        label: `Catégorie : ${c.name}`,
        subtitle: 'Voir les produits',
        href: `/products`,
      });
    }

    // Search invoices
    const { data: invoices } = await admin
      .from('invoices')
      .select('id, invoice_number, client_name, total')
      .eq('shop_id', shop.id)
      .or(`invoice_number.ilike.%${q}%,client_name.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const inv of invoices ?? []) {
      results.push({
        id: inv.id,
        type: 'invoice',
        label: inv.invoice_number,
        subtitle: `${inv.client_name} · ${Number(inv.total).toLocaleString()} FCFA`,
        href: `/invoices/${inv.id}`,
      });
    }

    // Search packs (if plan allows)
    if (canSeePacks) {
      const { data: packs } = await admin
        .from('packs')
        .select('id, name, sale_price')
        .eq('shop_id', shop.id)
        .ilike('name', `%${q}%`)
        .limit(3);

      for (const pk of packs ?? []) {
        results.push({
          id: pk.id,
          type: 'pack',
          label: `Pack : ${pk.name}`,
          subtitle: `${Number(pk.sale_price).toLocaleString()} FCFA`,
          href: `/products/packs`,
        });
      }
    }
  } catch {
    // silent — search is non-blocking
  }

  return results;
}
