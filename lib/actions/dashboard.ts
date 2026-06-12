'use server';

import { cache } from 'react';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayPaidCount: number;
  pendingCount: number;
  stockOutCount: number;
  dueSoonAmount: number;
  dueSoonCount: number;
  paidMonth: number;
  validatedMonth: number;
  rate: string;
  todayPurchases: number;
  margin: number;
  trend: string;
  paymentsByMethod: { method: string; amount: number }[];
}

function iso(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function isoEnd(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo + 1);
  return d.toISOString();
}

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();
  const t = iso(0);
  const y = iso(1);
  const ye = isoEnd(1);
  const w = new Date(Date.now() + 7 * 86400000).toISOString();
  const m = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    paidToday, paidYesterday, pending, stockResult, dueSoon,
    paymentsToday, paidMonth, validatedMonth,
    inMovements, products,
  ] = await Promise.all([
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', t),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', y).lt('paid_at', ye),
    admin.from('invoices').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']),
    admin.from('stock_items').select('quantity').eq('shop_id', shop.id),
    admin.from('invoices').select('balance_due').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID']).gt('balance_due', '0').lte('due_date', w).gte('due_date', t),
    admin.from('payments').select('amount, method').eq('shop_id', shop.id).gte('payment_date', t),
    admin.from('invoices').select('total').eq('shop_id', shop.id).eq('status', 'PAID').gte('paid_at', m),
    admin.from('invoices').select('total').eq('shop_id', shop.id).in('status', ['VALIDATED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']).gte('validated_at', m).neq('status', 'DRAFT'),
    admin.from('stock_movements').select('quantity, product_id').eq('shop_id', shop.id).eq('movement_type', 'PURCHASE').gte('created_at', t),
    admin.from('products').select('id, purchase_price').eq('shop_id', shop.id),
  ]);

  const todayRevenue = (paidToday.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const yesterdayRevenue = (paidYesterday.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const todayPaidCount = paidToday.data?.length ?? 0;
  const pendingCount = pending.count ?? 0;
  const stockOutCount = (stockResult.data ?? []).filter((s: any) => Number(s.quantity) <= 0).length;
  const dueSoonAmount = (dueSoon.data ?? []).reduce((s: number, i: any) => s + Number(i.balance_due), 0);
  const dueSoonCount = dueSoon.data?.length ?? 0;
  const paidM = (paidMonth.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const validatedM = (validatedMonth.data ?? []).reduce((s: number, i: any) => s + Number(i.total), 0);
  const rate = validatedM > 0 ? `${((paidM / validatedM) * 100).toFixed(0)}%` : '—';

  const priceMap = new Map<string, number>();
  for (const p of products.data ?? []) {
    priceMap.set(p.id, Number(p.purchase_price ?? 0));
  }
  const todayPurchases = (inMovements.data ?? []).reduce((s: number, m: any) => {
    return s + (Number(m.quantity) * (priceMap.get(m.product_id) ?? 0));
  }, 0);
  const margin = todayRevenue - todayPurchases;

  const trend = yesterdayRevenue > 0
    ? `${((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)}%`
    : todayRevenue > 0 ? '+100%' : '0%';

  const byMethod = new Map<string, number>();
  for (const p of paymentsToday.data ?? []) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
  }

  return {
    todayRevenue,
    yesterdayRevenue,
    todayPaidCount,
    pendingCount,
    stockOutCount,
    dueSoonAmount,
    dueSoonCount,
    paidMonth: paidM,
    validatedMonth: validatedM,
    rate,
    todayPurchases,
    margin,
    trend,
    paymentsByMethod: Array.from(byMethod.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([method, amount]) => ({ method, amount })),
  };
});
