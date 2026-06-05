'use server';

import { eq } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { shopSettings, invoiceSettings } from '@/lib/db/schema';
import { assertWritable } from '@/lib/readonly';
import { assertPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(formData: FormData) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    await db
      .update(shopSettings)
      .set({
        legalName: formData.get('legalName') as string,
        tradingName: (formData.get('tradingName') as string) || null,
        address: (formData.get('address') as string) || null,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        currency: formData.get('currency') as string,
        invoiceFooter: (formData.get('invoiceFooter') as string) || null,
        country: (formData.get('country') as string) || 'TG',
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.shopId, shop.id));

    revalidatePath('/settings');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function updateInvoiceSettings(formData: FormData) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    await db
      .update(invoiceSettings)
      .set({
        enableTax: formData.get('enableTax') === 'on',
        taxRate: formData.get('taxRate') ? String(Number(formData.get('taxRate') as string) / 100) : null,
        enableGlobalDiscount: formData.get('enableGlobalDiscount') === 'on',
        enableLineDiscount: formData.get('enableLineDiscount') === 'on',
        enableShipping: formData.get('enableShipping') === 'on',
        enableRounding: formData.get('enableRounding') === 'on',
        roundingPrecision: formData.get('enableRounding') === 'on' ? '0' : null,
        invoicePrefix: (formData.get('invoicePrefix') as string) || 'FACT-',
        taxLabel: (formData.get('taxLabel') as string) || 'TVA',
        updatedAt: new Date(),
      })
      .where(eq(invoiceSettings.shopId, shop.id));

    revalidatePath('/settings');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
