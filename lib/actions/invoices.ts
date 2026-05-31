'use server';

import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { calculateInvoice } from '@/lib/services/invoice-calculator';
import { revalidatePath } from 'next/cache';
import { CreateInvoiceSchema, InvoiceLineSchema } from '@/lib/validations/invoice';

export async function createInvoice(formData: FormData) {
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const rawData = {
    clientName: formData.get('clientName') as string,
    clientPhone: formData.get('clientPhone') as string,
    lines: JSON.parse(formData.get('lines') as string) as z.infer<typeof InvoiceLineSchema>[],
  };

  const parsed = CreateInvoiceSchema.parse(rawData);

  const { data: settingsRows } = await admin
    .from('invoice_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const settings = settingsRows?.[0];
  if (!settings) throw new Error('Invoice settings not found');

  const { data: shopSettingsRows } = await admin
    .from('shop_settings')
    .select('currency')
    .eq('shop_id', shop.id)
    .limit(1);

  const shopCurrency = shopSettingsRows?.[0]?.currency || 'XOF';

  const calc = calculateInvoice(
    parsed.lines,
    {
      enableTax: settings.enable_tax ?? false,
      taxRate: settings.tax_rate,
      enableGlobalDiscount: settings.enable_global_discount ?? false,
      enableLineDiscount: settings.enable_line_discount ?? false,
      enableShipping: settings.enable_shipping ?? false,
      enableRounding: settings.enable_rounding ?? false,
      roundingPrecision: settings.rounding_precision,
    },
    parsed.globalDiscountRate ?? 0,
    parsed.shippingFee ?? 0,
  );

  const year = new Date().getFullYear();
  const prefix = settings.invoice_prefix || 'FACT-';
  const nextNum = parseInt(settings.next_invoice_number || '1');
  const number = `${prefix}${year}-${String(nextNum).padStart(4, '0')}`;

  const { data: invoice, error: invoiceError } = await admin
    .from('invoices')
    .insert({
      shop_id: shop.id,
      invoice_number: number,
      client_name: parsed.clientName,
      client_phone: parsed.clientPhone || null,
      status: 'DRAFT',
      currency: shopCurrency,
      subtotal: String(calc.subtotal),
      line_discount_total: String(calc.lineDiscountTotal),
      global_discount: String(calc.globalDiscount),
      shipping_fee: String(calc.shippingFee),
      tax_amount: String(calc.taxAmount),
      rounding_adjustment: String(calc.roundingAdjustment),
      total: String(calc.total),
      amount_paid: '0',
      balance_due: String(calc.total),
      created_by: user.id,
    })
    .select()
    .single();

  if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  if (!invoice) throw new Error('Invoice creation returned no data');

  const linesData = parsed.lines.map((line: z.infer<typeof InvoiceLineSchema>, i: number) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = line.discountRate ? lineSubtotal * line.discountRate : 0;
    return {
      invoice_id: invoice.id,
      product_id: line.productId || null,
      description: line.description,
      quantity: String(line.quantity),
      unit_price: String(line.unitPrice),
      discount_rate: String(line.discountRate || 0),
      discount_amount: String(discountAmount),
      line_total: String(lineSubtotal - discountAmount),
      sort_order: String(i),
    };
  });

  const { error: linesError } = await admin.from('invoice_lines').insert(linesData);
  if (linesError) throw new Error(`Failed to create invoice lines: ${linesError.message}`);

  const { data: updated } = await admin
    .from('invoice_settings')
    .update({ next_invoice_number: String(nextNum + 1) })
    .eq('id', settings.id)
    .eq('next_invoice_number', String(nextNum))
    .select('next_invoice_number')
    .single();

  if (!updated) throw new Error('Conflit de numérotation, réessayez');

  revalidatePath('/invoices');
  return { invoice, invoiceNumber: number };
}

export async function validateInvoice(invoiceId: string) {
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('shop_id', shop.id)
    .single();

  if (!invoice) throw new Error('Facture introuvable');
  if (invoice.status !== 'DRAFT') throw new Error('Facture déjà validée ou annulée');

  const { data: lines } = await admin
    .from('invoice_lines')
    .select('*')
    .eq('invoice_id', invoiceId);

  const { data: settingsRows } = await admin
    .from('invoice_settings')
    .select('*')
    .eq('shop_id', shop.id)
    .limit(1);

  const settings = settingsRows?.[0];
  if (!settings) throw new Error('Invoice settings not found');

  const calc = calculateInvoice(
    (lines ?? []).map((l: any) => ({
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      discountRate: Number(l.discount_rate),
    })),
    {
      enableTax: settings.enable_tax ?? false,
      taxRate: settings.tax_rate,
      enableGlobalDiscount: settings.enable_global_discount ?? false,
      enableLineDiscount: settings.enable_line_discount ?? false,
      enableShipping: settings.enable_shipping ?? false,
      enableRounding: settings.enable_rounding ?? false,
      roundingPrecision: settings.rounding_precision,
    },
  );

  const productIds = (lines ?? []).filter(l => l.product_id).map(l => l.product_id);

  const { data: stockItems } = productIds.length > 0
    ? await admin.from('stock_items').select('*').in('product_id', productIds).eq('shop_id', shop.id)
    : { data: [] };

  const stockMap = new Map((stockItems ?? []).map((s: any) => [s.product_id, s]));

  for (const line of (lines ?? [])) {
    if (line.product_id) {
      const stockItem = stockMap.get(line.product_id);
      if (stockItem && Number(stockItem.quantity) - Number(line.quantity) < 0) {
        throw new Error(`Stock insuffisant pour ${line.description}`);
      }
    }
  }

  const { error: updateError } = await admin
    .from('invoices')
    .update({
      status: 'VALIDATED',
      validated_at: new Date().toISOString(),
      validated_by: user.id,
      subtotal: String(calc.subtotal),
      line_discount_total: String(calc.lineDiscountTotal),
      global_discount: String(calc.globalDiscount),
      shipping_fee: String(calc.shippingFee),
      tax_amount: String(calc.taxAmount),
      rounding_adjustment: String(calc.roundingAdjustment),
      total: String(calc.total),
      balance_due: String(calc.total),
    })
    .eq('id', invoiceId);

  if (updateError) throw new Error(`Failed to validate invoice: ${updateError.message}`);

  for (const line of (lines ?? [])) {
    if (line.product_id) {
      const stockItem = stockMap.get(line.product_id);
      if (stockItem) {
        await admin.from('stock_movements').insert({
          shop_id: shop.id,
          product_id: line.product_id,
          stock_item_id: stockItem.id,
          movement_type: 'SALE',
          quantity: String(-Number(line.quantity)),
          unit_price: line.unit_price,
          reference_id: invoiceId,
          reference_type: 'invoice',
          created_by: user.id,
        });
      }
    }
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
}

export async function cancelInvoice(invoiceId: string) {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('shop_id', shop.id)
    .single();

  if (!invoice) throw new Error('Facture introuvable');
  if (invoice.status === 'PAID') throw new Error('Une facture payée ne peut pas être annulée');
  if (invoice.status === 'CANCELLED') throw new Error('Facture déjà annulée');

  const { error } = await admin
    .from('invoices')
    .update({ status: 'CANCELLED' })
    .eq('id', invoiceId);

  if (error) throw new Error(`Failed to cancel invoice: ${error.message}`);

  revalidatePath('/invoices');
}
