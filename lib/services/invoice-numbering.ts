import 'server-only';

import { db } from '@/lib/db';
import { invoiceSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface InvoiceSettingsRow {
  id: string;
  shopId: string;
  enableTax: boolean;
  taxRate: string | null;
  taxLabel: string | null;
  enableGlobalDiscount: boolean;
  globalDiscountMax: string | null;
  enableLineDiscount: boolean;
  lineDiscountMax: string | null;
  enableCommercialDiscount: boolean;
  commercialDiscountName: string | null;
  enableShipping: boolean;
  shippingLabel: string | null;
  enableRounding: boolean;
  roundingPrecision: string | null;
  invoicePrefix: string | null;
  creditNotePrefix: string | null;
  nextInvoiceNumber: string;
  nextCreditNoteNumber: string;
}

export async function ensureInvoiceSettings(
  shopId: string,
): Promise<InvoiceSettingsRow> {
  const [existing] = await db
    .select()
    .from(invoiceSettings)
    .where(eq(invoiceSettings.shopId, shopId));

  if (existing) return existing;

  const [created] = await db
    .insert(invoiceSettings)
    .values({
      shopId,
      nextInvoiceNumber: '1',
      nextCreditNoteNumber: '1',
    })
    .returning();

  return created;
}

export async function getNextInvoiceNumber(
  shopId: string,
): Promise<string> {
  const result = await db.transaction(async (tx) => {
    const [settings] = await tx
      .select()
      .from(invoiceSettings)
      .where(eq(invoiceSettings.shopId, shopId))
      .for('update');

    if (!settings) {
      throw new Error('Invoice settings not found for this shop');
    }

    const nextNum = parseInt(settings.nextInvoiceNumber || '1', 10);
    const prefix = settings.invoicePrefix || 'FACT-';
    const year = new Date().getFullYear();
    const number = `${prefix}${year}-${String(nextNum).padStart(4, '0')}`;

    await tx
      .update(invoiceSettings)
      .set({ nextInvoiceNumber: String(nextNum + 1) })
      .where(eq(invoiceSettings.id, settings.id));

    return number;
  });

  return result;
}
