'use server';

import { eq } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { shopSettings, invoiceSettings } from '@/lib/db/schema';
import { assertWritable } from '@/lib/readonly';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    if (user.role !== 'owner') return { success: false, error: 'Réservé au propriétaire' } as const;
    await assertWritable(shop.id);

    const legalName = (formData.get('legalName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();

    if (!legalName) return { success: false, error: 'Le nom légal est requis' } as const;
    if (!email) return { success: false, error: 'L\'email est requis' } as const;
    if (!phone) return { success: false, error: 'Le téléphone est requis' } as const;

    await db
      .update(shopSettings)
      .set({
        legalName,
        tradingName: (formData.get('tradingName') as string)?.trim() || null,
        address: (formData.get('address') as string)?.trim() || null,
        email,
        phone,
        currency: (formData.get('currency') as string) || 'XOF',
        invoiceFooter: (formData.get('invoiceFooter') as string)?.trim() || null,
        country: (formData.get('country') as string) || 'TG',
        taxId: (formData.get('taxId') as string)?.trim() || null,
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
    const { shop, user } = await getCurrentShop();
    if (user.role !== 'owner') return { success: false, error: 'Réservé au propriétaire' } as const;
    await assertWritable(shop.id);

    const rawTaxRate = formData.get('taxRate') as string;
    let taxRate: string | null = null;
    if (rawTaxRate) {
      const n = Number(rawTaxRate);
      if (isNaN(n) || n < 0 || n > 100) return { success: false, error: 'Taux TVA invalide (0-100)' } as const;
      taxRate = String(n / 100);
    }

    await db
      .update(invoiceSettings)
      .set({
        enableTax: formData.get('enableTax') === 'on',
        taxRate,
        enableGlobalDiscount: formData.get('enableGlobalDiscount') === 'on',
        enableLineDiscount: formData.get('enableLineDiscount') === 'on',
        enableShipping: formData.get('enableShipping') === 'on',
        enableRounding: formData.get('enableRounding') === 'on',
        roundingPrecision: formData.get('enableRounding') === 'on' ? '0' : null,
        invoicePrefix: (formData.get('invoicePrefix') as string)?.trim() || 'FACT-',
        taxLabel: (formData.get('taxLabel') as string)?.trim() || 'TVA',
        shippingLabel: (formData.get('shippingLabel') as string)?.trim() || 'Livraison',
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
