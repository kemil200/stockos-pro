'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { geniuspayTransactions } from '@/lib/db/schema/geniuspay';
import { assertWritable } from '@/lib/readonly';

const GENIUSPAY_BASE = 'https://geniuspay.ci/api/v1/merchant';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos.site';

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER: { monthly: 5000, annual: 55000 },
  ESSENTIAL: { monthly: 8500, annual: 90000 },
  BUSINESS: { monthly: 13000, annual: 120000 },
};

function getGeniusPayKeys() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('Clés API GeniusPay non configurées');
  return { apiKey, apiSecret };
}

export async function initiateSubscriptionPayment(plan: string, billing: 'monthly' | 'annual' = 'annual') {
  try {
    const { shop, user } = await getCurrentShop();
    await assertWritable(shop.id);

    const admin = createAdminClient();

    const prices = PLAN_PRICES[plan];
    if (!prices) return { success: false, error: 'Plan invalide' } as const;

    const amount = billing === 'monthly' ? prices.monthly : prices.annual;
    const label = billing === 'monthly' ? 'mois' : 'an';
    const months = billing === 'monthly' ? 1 : 12;

    const { data: shopSettings } = await admin
      .from('shop_settings')
      .select('email, phone')
      .eq('shop_id', shop.id)
      .single();

    const customerName = user.display_name || shop.name;
    const customerEmail = user.email || shopSettings?.email || '';
    const customerPhone = (shopSettings?.phone || '').replace(/[^+\d]/g, '');

    const body: Record<string, unknown> = {
      amount,
      currency: 'XOF',
      description: `StockOS Pro — ${plan} (1 ${label})`,
      customer: { name: customerName },
      success_url: `${APP_URL}/invoices?gp_sub=success`,
      error_url: `${APP_URL}/invoices?gp_sub=error`,
      metadata: {
        payment_type: 'subscription',
        shop_id: shop.id,
        plan,
        billing,
        months,
      },
    };

    if (customerEmail) (body.customer as Record<string, unknown>).email = customerEmail;
    if (customerPhone) (body.customer as Record<string, unknown>).phone = customerPhone;

    const { apiKey, apiSecret } = getGeniusPayKeys();
    const response = await fetch(`${GENIUSPAY_BASE}/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (!json.success) {
      return { success: false, error: json.message || 'Erreur GeniusPay' } as const;
    }

    const gpData = json.data;

    await db.insert(geniuspayTransactions).values({
      shopId: shop.id,
      amount: String(gpData.amount),
      fees: gpData.fees ? String(gpData.fees) : null,
      netAmount: gpData.net_amount ? String(gpData.net_amount) : null,
      status: 'pending',
      gpReference: gpData.reference,
      gpPaymentMethod: gpData.gateway || null,
      metadata: JSON.stringify({ payment_type: 'subscription', plan, billing, shop_name: shop.name }),
    });

    return {
      success: true,
      checkoutUrl: gpData.checkout_url || gpData.payment_url,
      reference: gpData.reference,
    } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
