'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { assertWritable } from '@/lib/readonly';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    await assertWritable(shop.id);
    const admin = createAdminClient();

    const data = {
      legal_name: formData.get('legalName') as string,
      trading_name: formData.get('tradingName') as string || null,
      address: formData.get('address') as string || null,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      currency: formData.get('currency') as string,
      invoice_footer: formData.get('invoiceFooter') as string || null,
      country: formData.get('country') as string || 'TG',
    };

    const { error } = await admin
      .from('shop_settings')
      .update(data)
      .eq('shop_id', shop.id);

    if (error) return { success: false, error: error.message } as const;

    revalidatePath('/settings');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function updateInvoiceSettings(formData: FormData) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);
    const admin = createAdminClient();

    const data: Record<string, unknown> = {
      enable_tax: formData.get('enableTax') === 'on',
      tax_rate: formData.get('taxRate') ? String(Number(formData.get('taxRate' as string)) / 100) : null,
      enable_global_discount: formData.get('enableGlobalDiscount') === 'on',
      enable_line_discount: formData.get('enableLineDiscount') === 'on',
      enable_shipping: formData.get('enableShipping') === 'on',
      enable_rounding: formData.get('enableRounding') === 'on',
      rounding_precision: formData.get('enableRounding') === 'on' ? '0' : null,
      invoice_prefix: formData.get('invoicePrefix') as string || 'FACT-',
      tax_label: formData.get('taxLabel') as string || 'TVA',
    };

    const { error } = await admin
      .from('invoice_settings')
      .update(data)
      .eq('shop_id', shop.id);

    if (error) return { success: false, error: error.message } as const;

    revalidatePath('/settings');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
