'use server';

import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { calculateInvoice } from '@/lib/services/invoice-calculator';
import { revalidatePath } from 'next/cache';
import { CreateInvoiceSchema, InvoiceLineSchema } from '@/lib/validations/invoice';
import { ensureInvoiceSettings } from '@/lib/utils/invoice-settings';
import { auditLog, AuditAction } from '@/lib/audit';

export async function createInvoice(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    const admin = createAdminClient();

    const rawData = {
      clientName: formData.get('clientName') as string,
      clientPhone: (formData.get('clientPhone') as string) || undefined,
      lines: JSON.parse(formData.get('lines') as string) as z.infer<typeof InvoiceLineSchema>[],
      globalDiscountRate: formData.has('globalDiscountRate') ? Number(formData.get('globalDiscountRate')) : undefined,
      shippingFee: formData.has('shippingFee') ? Number(formData.get('shippingFee')) : undefined,
    };

    let parsed: z.infer<typeof CreateInvoiceSchema>;
    try {
      parsed = CreateInvoiceSchema.parse(rawData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const messages = err.issues.map((e) => e.message).join(', ');
        return { success: false, error: messages } as const;
      }
      throw err;
    }

    const settings = await ensureInvoiceSettings(shop.id);

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

    let nextNum = parseInt(settings.next_invoice_number || '1');
    let number = '';

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const currentSettings = attempt === 0
        ? settings
        : await ensureInvoiceSettings(shop.id);

      nextNum = parseInt(currentSettings.next_invoice_number || '1');
      number = `${prefix}${year}-${String(nextNum).padStart(4, '0')}`;

      const { data: updated } = await admin
        .from('invoice_settings')
        .update({ next_invoice_number: String(nextNum + 1) })
        .eq('id', currentSettings.id)
        .eq('next_invoice_number', String(nextNum))
        .select('next_invoice_number')
        .single();

      if (updated) {
        break;
      }

      if (attempt === MAX_RETRIES - 1) {
        return { success: false, error: 'Conflit de numérotation, veuillez réessayer' } as const;
      }
    }

    if (!number) {
      return { success: false, error: 'Impossible de générer le numéro de facture' } as const;
    }

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
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) return { success: false, error: `Erreur lors de la création: ${invoiceError.message}` } as const;
    if (!invoice) return { success: false, error: 'La création n\'a retourné aucune donnée' } as const;

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
    if (linesError) return { success: false, error: `Erreur sur les lignes: ${linesError.message}` } as const;

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.INVOICE_CREATED,
        entityType: 'invoice',
        entityId: invoice.id,
        metadata: { number, total: calc.total, client: parsed.clientName },
      });
    } catch {
      // audit non-bloquant
    }

    revalidatePath('/invoices');
    return { success: true, invoice, invoiceNumber: number } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function validateInvoice(invoiceId: string) {
  try {
    const { shop, user } = await getCurrentShop();
    const admin = createAdminClient();

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoice) return { success: false, error: 'Facture introuvable' } as const;
    if (invoice.status !== 'DRAFT') return { success: false, error: 'Facture déjà validée ou annulée' } as const;

    const { data: lines } = await admin
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId);

    const settings = await ensureInvoiceSettings(shop.id);

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
          return { success: false, error: `Stock insuffisant pour ${line.description}` } as const;
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

    if (updateError) return { success: false, error: `Erreur validation: ${updateError.message}` } as const;

    for (const line of (lines ?? [])) {
      if (line.product_id) {
        const stockItem = stockMap.get(line.product_id);
        if (stockItem) {
          const { error: movementError } = await admin.from('stock_movements').insert({
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
          if (movementError) {
            console.error(`Failed to insert stock movement for product ${line.product_id}:`, movementError);
          }
        }
      }
    }

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.INVOICE_VALIDATED,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: { total: String(calc.total) },
      });
    } catch {
      // audit non-bloquant
    }

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/invoices');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function cancelInvoice(invoiceId: string, reason?: string) {
  try {
    const { shop, user } = await getCurrentShop();
    const admin = createAdminClient();

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoice) return { success: false, error: 'Facture introuvable' } as const;
    if (invoice.status === 'PAID') return { success: false, error: 'Une facture payée ne peut pas être annulée' } as const;
    if (invoice.status === 'CANCELLED') return { success: false, error: 'Facture déjà annulée' } as const;

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Un motif d\'annulation est requis' } as const;
    }

    if (invoice.status === 'VALIDATED') {
      const { data: lines } = await admin
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (lines) {
        const productIds = lines.filter((l: any) => l.product_id).map((l: any) => l.product_id);

        const { data: stockItems } = productIds.length > 0
          ? await admin.from('stock_items').select('*').in('product_id', productIds).eq('shop_id', shop.id)
          : { data: [] };

        const stockMap = new Map((stockItems ?? []).map((s: any) => [s.product_id, s]));

        for (const line of lines) {
          if (line.product_id) {
            const stockItem = stockMap.get(line.product_id);
            if (stockItem) {
              await admin.from('stock_movements').insert({
                shop_id: shop.id,
                product_id: line.product_id,
                stock_item_id: stockItem.id,
                movement_type: 'CANCELLATION',
                quantity: String(Number(line.quantity)),
                unit_price: line.unit_price,
                reference_id: invoiceId,
                reference_type: 'invoice',
                reason: `Annulation facture: ${reason}`,
                created_by: user.id,
              });
            }
          }
        }
      }
    }

    const { error: cancelError } = await admin
      .from('invoices')
      .update({
        status: 'CANCELLED',
        cancel_reason: reason,
      })
      .eq('id', invoiceId);

    if (cancelError) return { success: false, error: `Erreur annulation: ${cancelError.message}` } as const;

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.INVOICE_CANCELLED,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: { reason, wasValidated: invoice.status === 'VALIDATED' },
      });
    } catch {
      // audit non-bloquant
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function validateInvoiceAction(invoiceId: string) {
  const result = await validateInvoice(invoiceId);
  if (!result.success) throw new Error(result.error);
}

export async function cancelInvoiceAction(formData: FormData) {
  const invoiceId = formData.get('invoiceId') as string;
  const reason = formData.get('reason') as string;
  const result = await cancelInvoice(invoiceId, reason || 'Non spécifié');
  if (!result.success) throw new Error(result.error);
}
