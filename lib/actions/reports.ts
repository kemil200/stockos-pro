'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';

interface TopProduct {
  productId: string | null;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  count: number;
}

export async function getTopProducts(from: string, to: string, limit = 10): Promise<TopProduct[]> {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: invoiceIds } = await admin
    .from('invoices')
    .select('id')
    .eq('shop_id', shop.id)
    .in('status', ['PAID', 'PARTIALLY_PAID', 'VALIDATED'])
    .gte('created_at', from)
    .lte('created_at', to);

  if (!invoiceIds || !invoiceIds.length) return [];

  const ids = invoiceIds.map((i: any) => i.id);

  const { data: lines } = await admin
    .from('invoice_lines')
    .select('product_id, quantity, line_total, description')
    .in('invoice_id', ids)
    .not('product_id', 'is', null);

  if (!lines || !lines.length) return [];

  const productIds = [...new Set(lines.map((l: any) => l.product_id))];
  const { data: products } = await admin
    .from('products')
    .select('id, name')
    .eq('shop_id', shop.id)
    .in('id', productIds);

  const productMap = new Map<string, string>();
  for (const p of products ?? []) {
    productMap.set(p.id, p.name);
  }

  const grouped = new Map<string, { totalQuantity: number; totalRevenue: number; count: number; name: string }>();
  for (const line of lines) {
    const pid = line.product_id;
    const name = productMap.get(pid) || line.description;
    const existing = grouped.get(pid) || { totalQuantity: 0, totalRevenue: 0, count: 0, name };
    existing.totalQuantity += Number(line.quantity);
    existing.totalRevenue += Number(line.line_total);
    existing.count += 1;
    grouped.set(pid, existing);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
    .slice(0, limit)
    .map(([productId, data]) => ({
      productId,
      name: data.name,
      totalQuantity: data.totalQuantity,
      totalRevenue: data.totalRevenue,
      count: data.count,
    }));
}

export async function getDailyRevenue(from: string, to: string): Promise<{ date: string; revenue: number; count: number }[]> {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: invoices } = await admin
    .from('invoices')
    .select('total, created_at')
    .eq('shop_id', shop.id)
    .in('status', ['PAID', 'PARTIALLY_PAID', 'VALIDATED'])
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: true });

  if (!invoices || !invoices.length) return [];

  const byDay = new Map<string, { revenue: number; count: number }>();
  for (const inv of invoices) {
    const day = new Date(inv.created_at).toISOString().slice(0, 10);
    const existing = byDay.get(day) || { revenue: 0, count: 0 };
    existing.revenue += Number(inv.total);
    existing.count += 1;
    byDay.set(day, existing);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }));
}
