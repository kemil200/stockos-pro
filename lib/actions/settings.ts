'use server';

import { db } from '@/lib/db';
import { shopSettings, invoiceSettings } from '@/lib/db/schema';
import { getCurrentShop } from '@/lib/tenant';
import { auditLog, AuditAction } from '@/lib/audit';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateShopSettings(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const data = {
    legalName: formData.get('legalName') as string,
    tradingName: formData.get('tradingName') as string,
    address: formData.get('address') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    currency: formData.get('currency') as string,
    invoiceFooter: formData.get('invoiceFooter') as string,
  };

  await db
    .update(shopSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shopSettings.shopId, shop.id));

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.SHOP_UPDATED,
    entityType: 'shop_settings',
    entityId: shop.id,
  });

  revalidatePath('/settings');
}

export async function updateInvoiceSettings(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const data = {
    enableTax: formData.get('enableTax') === 'on',
    taxRate: formData.get('taxRate') ? String(formData.get('taxRate')) : null,
    enableGlobalDiscount: formData.get('enableGlobalDiscount') === 'on',
    enableLineDiscount: formData.get('enableLineDiscount') === 'on',
    enableShipping: formData.get('enableShipping') === 'on',
    enableRounding: formData.get('enableRounding') === 'on',
    invoicePrefix: formData.get('invoicePrefix') as string,
    taxLabel: formData.get('taxLabel') as string,
  };

  await db
    .update(invoiceSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(invoiceSettings.shopId, shop.id));

  revalidatePath('/settings');
}
