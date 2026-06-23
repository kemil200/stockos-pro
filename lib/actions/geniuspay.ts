'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { geniuspayTransactions } from '@/lib/db/schema/geniuspay';
import { assertWritable } from '@/lib/readonly';

const GENIUSPAY_BASE = 'https://geniuspay.ci/api/v1/merchant';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stockos.site';

function getGeniusPayKeys() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('Clés API GeniusPay non configurées');
  return { apiKey, apiSecret };
}

export async function initiateGeniusPayPayment(invoiceId: string) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);

    const admin = createAdminClient();
    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoice) return { success: false, error: 'Facture introuvable' } as const;
    if (!['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status)) {
      return { success: false, error: 'Cette facture ne peut pas recevoir de paiement' } as const;
    }

    const remaining = Number(invoice.balance_due);
    if (remaining <= 0) return { success: false, error: 'Cette facture est déjà payée' } as const;

    const { data: shopSettings } = await admin
      .from('shop_settings')
      .select('*')
      .eq('shop_id', shop.id)
      .single();

    const clientName = invoice.client_name || shopSettings?.trading_name || shop.name;
    const clientPhone = invoice.client_phone || shopSettings?.phone || '';
    const cleanPhone = clientPhone.replace(/[^+\d]/g, '');

    const body = {
      amount: remaining,
      description: `Facture ${invoice.invoice_number}`,
      customer: {
        name: clientName,
        ...(cleanPhone ? { phone: cleanPhone } : {}),
      },
      success_url: `${APP_URL}/invoices/${invoiceId}?gp_status=success`,
      error_url: `${APP_URL}/invoices/${invoiceId}?gp_status=error`,
      metadata: {
        invoice_id: invoiceId,
        shop_id: shop.id,
      },
    };

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
      invoiceId,
      amount: String(gpData.amount),
      fees: gpData.fees ? String(gpData.fees) : null,
      netAmount: gpData.net_amount ? String(gpData.net_amount) : null,
      status: 'pending',
      gpReference: gpData.reference,
      gpPaymentMethod: gpData.gateway || null,
      metadata: JSON.stringify({ invoice_number: invoice.invoice_number, gateway: gpData.gateway }),
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

