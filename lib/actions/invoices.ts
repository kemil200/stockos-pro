'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import {
  invoices,
  invoiceLines,
  invoiceSettings,
  stockItems,
} from '@/lib/db/schema';
import { getCurrentShop } from '@/lib/tenant';
import { calculateInvoice } from '@/lib/services/invoice-calculator';
import { createStockMovement } from '@/lib/services/stock-manager';
import { emitEvent } from '@/lib/services/event-bus';
import { auditLog, AuditAction } from '@/lib/audit';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CreateInvoiceSchema, InvoiceLineSchema } from '@/lib/validations/invoice';

async function getInvoiceSettings(shopId: string) {
  const [settings] = await db
    .select()
    .from(invoiceSettings)
    .where(eq(invoiceSettings.shopId, shopId));

  if (!settings) throw new Error('Invoice settings not found');
  return settings;
}

async function generateInvoiceNumber(shopId: string): Promise<string> {
  const [settings] = await db
    .select()
    .from(invoiceSettings)
    .where(eq(invoiceSettings.shopId, shopId))

  if (!settings) throw new Error('Invoice settings not found');

  const year = new Date().getFullYear();
  const prefix = settings.invoicePrefix || 'FACT-';
  const nextNum = parseInt(settings.nextInvoiceNumber || '1');
  const number = `${prefix}${year}-${String(nextNum).padStart(4, '0')}`;

  await db
    .update(invoiceSettings)
    .set({ nextInvoiceNumber: String(nextNum + 1) })
    .where(eq(invoiceSettings.id, settings.id));

  return number;
}

export async function createInvoice(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const rawData = {
    clientName: formData.get('clientName') as string,
    clientPhone: formData.get('clientPhone') as string,
    lines: JSON.parse(formData.get('lines') as string) as z.infer<typeof InvoiceLineSchema>[],
  };

  const parsed = CreateInvoiceSchema.parse(rawData);
  const settings = await getInvoiceSettings(shop.id);

  const calc = calculateInvoice(
    parsed.lines,
    settings,
    0,
    0,
  );

  const number = await generateInvoiceNumber(shop.id);

  const [invoice] = await db
    .insert(invoices)
    .values({
      shopId: shop.id,
      invoiceNumber: number,
      clientName: parsed.clientName,
      clientPhone: parsed.clientPhone || null,
      status: 'DRAFT',
      currency: 'XOF',
      subtotal: String(calc.subtotal),
      lineDiscountTotal: String(calc.lineDiscountTotal),
      globalDiscount: String(calc.globalDiscount),
      shippingFee: String(calc.shippingFee),
      taxAmount: String(calc.taxAmount),
      roundingAdjustment: String(calc.roundingAdjustment),
      total: String(calc.total),
      amountPaid: '0',
      balanceDue: String(calc.total),
      createdBy: user.id,
    })
    .returning();

  for (let i = 0; i < parsed.lines.length; i++) {
    const line = parsed.lines[i];
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = line.discountRate
      ? lineSubtotal * line.discountRate
      : 0;

    await db.insert(invoiceLines).values({
      invoiceId: invoice.id,
      productId: line.productId as any,
      description: line.description,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
      discountRate: String(line.discountRate || 0),
      discountAmount: String(discountAmount),
      lineTotal: String(lineSubtotal - discountAmount),
      sortOrder: String(i),
    });
  }

  await emitEvent({
    shopId: shop.id,
    eventType: 'INVOICE_CREATED',
    aggregateType: 'invoice',
    aggregateId: invoice.id,
    data: { invoiceNumber: number },
    userId: user.id,
  });

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.INVOICE_CREATED,
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: { invoiceNumber: number },
  });

  revalidatePath('/invoices');
  return { invoice, invoiceNumber: number };
}

export async function validateInvoice(invoiceId: string) {
  const { shop, user } = await getCurrentShop();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.id, invoiceId),
      eq(invoices.shopId, shop.id),
      eq(invoices.status, 'DRAFT'),
    ));

  if (!invoice) throw new Error('Facture introuvable ou déjà validée');

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId));

  const settings = await getInvoiceSettings(shop.id);

  const calc = calculateInvoice(
    lines.map((l) => ({
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      discountRate: Number(l.discountRate),
    })),
    settings,
  );

  await db
    .update(invoices)
    .set({
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: user.id,
      subtotal: String(calc.subtotal),
      lineDiscountTotal: String(calc.lineDiscountTotal),
      globalDiscount: String(calc.globalDiscount),
      shippingFee: String(calc.shippingFee),
      taxAmount: String(calc.taxAmount),
      roundingAdjustment: String(calc.roundingAdjustment),
      total: String(calc.total),
      balanceDue: String(calc.total),
    })
    .where(eq(invoices.id, invoiceId));

  for (const line of lines) {
    if (line.productId) {
      try {
        await createStockMovement({
          shopId: shop.id,
          productId: line.productId,
          movementType: 'SALE',
          quantity: -Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          referenceId: invoiceId,
          referenceType: 'invoice',
          createdBy: user.id,
        });
      } catch (e) {
        if (e instanceof Error && e.message === 'Stock insuffisant') {
          throw new Error(`Stock insuffisant pour le produit ${line.description}`);
        }
        throw e;
      }
    }
  }

  await emitEvent({
    shopId: shop.id,
    eventType: 'INVOICE_VALIDATED',
    aggregateType: 'invoice',
    aggregateId: invoiceId,
    data: { invoiceNumber: invoice.invoiceNumber, total: calc.total },
    userId: user.id,
  });

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.INVOICE_VALIDATED,
    entityType: 'invoice',
    entityId: invoiceId,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/invoices');
}

export async function cancelInvoice(invoiceId: string) {
  const { shop, user } = await getCurrentShop();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.id, invoiceId),
      eq(invoices.shopId, shop.id),
    ));

  if (!invoice) throw new Error('Facture introuvable');
  if (invoice.status === 'PAID') throw new Error('Une facture payée ne peut pas être annulée');
  if (invoice.status === 'CANCELLED') throw new Error('Facture déjà annulée');

  await db
    .update(invoices)
    .set({ status: 'CANCELLED' })
    .where(eq(invoices.id, invoiceId));

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.INVOICE_CANCELLED,
    entityType: 'invoice',
    entityId: invoiceId,
  });

  revalidatePath('/invoices');
}
