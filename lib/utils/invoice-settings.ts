import { createAdminClient } from '@/lib/server';

export interface InvoiceSettings {
  id: string;
  shop_id: string;
  enable_tax: boolean;
  tax_rate: string | null;
  tax_label: string;
  enable_global_discount: boolean;
  global_discount_max: string | null;
  enable_line_discount: boolean;
  line_discount_max: string | null;
  enable_commercial_discount: boolean;
  commercial_discount_name: string;
  enable_shipping: boolean;
  shipping_label: string;
  enable_rounding: boolean;
  rounding_precision: string;
  invoice_prefix: string;
  credit_note_prefix: string;
  next_invoice_number: string;
  next_credit_note_number: string;
  created_at: string;
  updated_at: string;
}

export async function ensureInvoiceSettings(
  shopId: string,
): Promise<InvoiceSettings> {
  const admin = createAdminClient();

  const { data: settingsRows } = await admin
    .from('invoice_settings')
    .select('*')
    .eq('shop_id', shopId)
    .limit(1);

  if (settingsRows?.[0]) return settingsRows[0] as InvoiceSettings;

  const { data: newSettings, error } = await admin
    .from('invoice_settings')
    .insert({
      shop_id: shopId,
      next_invoice_number: '1',
      next_credit_note_number: '1',
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Impossible de créer les paramètres de facturation: ${error.message}`,
    );
  }

  return newSettings as InvoiceSettings;
}
