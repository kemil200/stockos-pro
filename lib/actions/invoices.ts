'use server';

import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { invoices, invoiceLines, stockItems, stockMovements, packs, packItems } from '@/lib/db/schema';
import { calculateInvoice } from '@/lib/services/invoice-calculator';
import { allocateInvoiceNumber, ensureInvoiceSettings } from '@/lib/services/invoice-numbering';
import { revalidatePath } from 'next/cache';
import { CreateInvoiceSchema, InvoiceLineSchema } from '@/lib/validations/invoice';
import { auditLog, AuditAction } from '@/lib/audit';
import { assertWritable } from '@/lib/readonly';
import { assertPlanLimit } from '@/lib/plans';


export async function createInvoice(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    await assertWritable(shop.id);
    await assertPlanLimit(shop.id, 'maxInvoicesPerMonth');

    const linesJson = formData.get('lines') as string;
    if (linesJson.length > 100000) {
      return { success: false, error: 'Trop de lignes' } as const;
    }

    const rawData = {
      clientName: formData.get('clientName') as string,
      clientPhone: (formData.get('clientPhone') as string) || undefined,
      lines: JSON.parse(linesJson) as z.infer<typeof InvoiceLineSchema>[],
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

    const admin = createAdminClient();
    const { data: shopSettingsRows } = await admin
      .from('shop_settings')
      .select('currency')
      .eq('shop_id', shop.id)
      .limit(1);

    const shopCurrency = shopSettingsRows?.[0]?.currency || 'XOF';

    const calc = calculateInvoice(
      parsed.lines,
      {
        enableTax: settings.enableTax ?? false,
        taxRate: settings.taxRate,
        enableGlobalDiscount: settings.enableGlobalDiscount ?? false,
        enableLineDiscount: settings.enableLineDiscount ?? false,
        enableShipping: settings.enableShipping ?? false,
        enableRounding: settings.enableRounding ?? false,
        roundingPrecision: settings.roundingPrecision,
      },
      parsed.globalDiscountRate ?? 0,
      parsed.shippingFee ?? 0,
    );

    const { invoice, number } = await db.transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx, shop.id);

      const [created] = await tx
        .insert(invoices)
        .values({
          shopId: shop.id,
          invoiceNumber,
          clientName: parsed.clientName,
          clientPhone: parsed.clientPhone || null,
          status: 'DRAFT',
          currency: shopCurrency,
          subtotal: String(calc.subtotal),
          lineDiscountTotal: String(calc.lineDiscountTotal),
          globalDiscount: String(calc.globalDiscount),
          shippingFee: String(calc.shippingFee),
          taxAmount: String(calc.taxAmount),
          roundingAdjustment: String(calc.roundingAdjustment),
          total: String(calc.total),
          amountPaid: '0',
          balanceDue: String(calc.total),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: user.id,
        })
        .returning();

      const linesData = parsed.lines.map((line: z.infer<typeof InvoiceLineSchema>, i: number) => {
        const lineSubtotal = line.quantity * line.unitPrice;
        const discountAmount = line.discountRate ? lineSubtotal * line.discountRate : 0;
        return {
          invoiceId: created.id,
          productId: line.productId || null,
          packId: line.packId || null,
          description: line.description,
          quantity: String(line.quantity),
          unitPrice: String(line.unitPrice),
          discountRate: String(line.discountRate || 0),
          discountAmount: String(discountAmount),
          lineTotal: String(lineSubtotal - discountAmount),
          sortOrder: String(i),
        };
      });

      await tx.insert(invoiceLines).values(linesData);

      return { invoice: created, number: invoiceNumber };
    });

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
    await assertWritable(shop.id);
    const admin = createAdminClient();

    const { data: invoiceData } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoiceData) return { success: false, error: 'Facture introuvable' } as const;
    if (invoiceData.status !== 'DRAFT') return { success: false, error: 'Facture déjà validée ou annulée' } as const;

    const { data: lines } = await admin
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId);

    const settings = await ensureInvoiceSettings(shop.id);
    const storedGlobalDiscount = Number(invoiceData.global_discount);
    const storedShippingFee = Number(invoiceData.shipping_fee);
    const storedSubtotal = Number(invoiceData.subtotal);
    const storedLineDiscountTotal = Number(invoiceData.line_discount_total);
    const storedTaxAmount = Number(invoiceData.tax_amount);
    const storedRoundingAdjustment = Number(invoiceData.rounding_adjustment);
    const storedTotal = Number(invoiceData.total);

    const allLines = lines ?? [];
    const directProductIds = allLines.filter((l: any) => l.product_id && !l.pack_id).map((l: any) => l.product_id);
    const packLineIds = allLines.filter((l: any) => l.pack_id).map((l: any) => l.pack_id);

    const packItemsMap = new Map<string, { productId: string; quantity: number; purchasePrice: string }[]>();
    if (packLineIds.length > 0) {
      const packRows = await db
        .select({
          piPackId: packItems.packId,
          piProductId: packItems.productId,
          piQuantity: packItems.quantity,
          pPurchasePrice: packs.purchasePrice,
        })
        .from(packItems)
        .innerJoin(packs, eq(packs.id, packItems.packId))
        .where(and(
          eq(packs.shopId, shop.id),
          inArray(packItems.packId, packLineIds),
        ));

      for (const row of packRows) {
        const items = packItemsMap.get(row.piPackId) ?? [];
        items.push({
          productId: row.piProductId,
          quantity: Number(row.piQuantity),
          purchasePrice: row.pPurchasePrice ?? '0',
        });
        packItemsMap.set(row.piPackId, items);
      }

      for (const packId of packLineIds) {
        if (!packItemsMap.has(packId)) {
          const packLine = allLines.find((l: any) => l.pack_id === packId);
          throw new Error(`Pack introuvable pour ${packLine?.description ?? 'ligne'}`);
        }
      }
    }

    const allProductIds = [
      ...directProductIds,
      ...Array.from(packItemsMap.values()).flatMap((items) => items.map((i) => i.productId)),
    ];

    await db.transaction(async (tx) => {
      const [invoice] = await tx
        .select({ status: invoices.status })
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .for('update');

      if (!invoice) throw new Error('Facture introuvable');
      if (invoice.status !== 'DRAFT') throw new Error('Facture déjà validée ou annulée');
      if (allProductIds.length > 0) {
        const stockRows = await tx
          .select()
          .from(stockItems)
          .where(and(
            eq(stockItems.shopId, shop.id),
            inArray(stockItems.productId, allProductIds),
          ))
          .for('update');

        const stockMap = new Map(stockRows.map((s) => [s.productId, s]));

        for (const line of allLines) {
          if (line.product_id && !line.pack_id) {
            const stockItem = stockMap.get(line.product_id);
            if (!stockItem) {
              throw new Error(`Stock introuvable pour ${line.description}`);
            }
            if (Number(stockItem.quantity) - Number(line.quantity) < 0) {
              throw new Error(`Stock insuffisant pour ${line.description}`);
            }
          }
          if (line.pack_id) {
            const items = packItemsMap.get(line.pack_id) ?? [];
            for (const item of items) {
              const stockItem = stockMap.get(item.productId);
              if (!stockItem) {
                throw new Error(`Stock introuvable pour un produit du pack ${line.description}`);
              }
              const needed = item.quantity * Number(line.quantity);
              if (Number(stockItem.quantity) - needed < 0) {
                throw new Error(`Stock insuffisant pour ${line.description} (pack)`);
              }
            }
          }
        }

        for (const line of allLines) {
          if (line.product_id && !line.pack_id) {
            const stockItem = stockMap.get(line.product_id)!;
            await tx.insert(stockMovements).values({
              shopId: shop.id,
              productId: line.product_id,
              stockItemId: stockItem.id,
              movementType: 'SALE',
              quantity: String(-Number(line.quantity)),
              unitPrice: String(line.unit_price),
              referenceId: invoiceId,
              referenceType: 'invoice',
              createdBy: user.id,
            });
          }
          if (line.pack_id) {
            const items = packItemsMap.get(line.pack_id) ?? [];
            for (const item of items) {
              const stockItem = stockMap.get(item.productId);
              if (!stockItem) continue;
              const qty = item.quantity * Number(line.quantity);
              await tx.insert(stockMovements).values({
                shopId: shop.id,
                productId: item.productId,
                stockItemId: stockItem.id,
                movementType: 'SALE',
                quantity: String(-qty),
                unitPrice: item.purchasePrice,
                referenceId: invoiceId,
                referenceType: 'invoice',
                reason: `Pack: ${line.description}`,
                createdBy: user.id,
              });
            }
          }
        }
      }

      await tx
        .update(invoices)
        .set({
          status: 'VALIDATED',
          validatedAt: new Date(),
          validatedBy: user.id,
          subtotal: String(storedSubtotal),
          lineDiscountTotal: String(storedLineDiscountTotal),
          globalDiscount: String(storedGlobalDiscount),
          shippingFee: String(storedShippingFee),
          taxAmount: String(storedTaxAmount),
          roundingAdjustment: String(storedRoundingAdjustment),
          total: String(storedTotal),
          balanceDue: String(storedTotal),
        })
        .where(eq(invoices.id, invoiceId));
    });

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.INVOICE_VALIDATED,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: { total: String(storedTotal) },
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
    await assertWritable(shop.id);
    const admin = createAdminClient();

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoice) return { success: false, error: 'Facture introuvable' } as const;
    if (invoice.status === 'PAID') return { success: false, error: 'Une facture payée ne peut pas être annulée' } as const;
    if (invoice.status === 'PARTIALLY_PAID') return { success: false, error: 'Une facture partiellement payée ne peut pas être annulée. Remboursez d\'abord les paiements.' } as const;
    if (invoice.status === 'CANCELLED') return { success: false, error: 'Facture déjà annulée' } as const;

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Un motif d\'annulation est requis' } as const;
    }

    if (invoice.status === 'VALIDATED') {
      const { data: lines } = await admin
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId);

      const allCancelLines = lines ?? [];
      const packCancelIds = allCancelLines.filter((l: any) => l.pack_id).map((l: any) => l.pack_id);

      const cancelPackItemsMap = new Map<string, { productId: string; quantity: number }[]>();
      if (packCancelIds.length > 0) {
        const packRows = await db
          .select({
            piPackId: packItems.packId,
            piProductId: packItems.productId,
            piQuantity: packItems.quantity,
          })
          .from(packItems)
          .innerJoin(packs, eq(packs.id, packItems.packId))
          .where(and(
            eq(packs.shopId, shop.id),
            inArray(packItems.packId, packCancelIds),
          ));

        for (const row of packRows) {
          const items = cancelPackItemsMap.get(row.piPackId) ?? [];
          items.push({
            productId: row.piProductId,
            quantity: Number(row.piQuantity),
          });
          cancelPackItemsMap.set(row.piPackId, items);
        }
      }

      const directCancelProductIds = allCancelLines
        .filter((l: any) => l.product_id && !l.pack_id)
        .map((l: any) => l.product_id);

      const allCancelProductIds = [
        ...directCancelProductIds,
        ...Array.from(cancelPackItemsMap.values()).flatMap((items) => items.map((i) => i.productId)),
      ];

      if (allCancelProductIds.length > 0) {
        await db.transaction(async (tx) => {
          const [inv] = await tx
            .select({ status: invoices.status })
            .from(invoices)
            .where(eq(invoices.id, invoiceId))
            .for('update');

          if (!inv || inv.status !== 'VALIDATED') throw new Error('La facture n\'est plus validée');
          const stockRows = await tx
            .select()
            .from(stockItems)
            .where(and(
              eq(stockItems.shopId, shop.id),
              inArray(stockItems.productId, allCancelProductIds),
            ))
            .for('update');

          const stockMap = new Map(stockRows.map((s) => [s.productId, s]));

          for (const line of allCancelLines) {
            if (line.product_id && !line.pack_id) {
              const stockItem = stockMap.get(line.product_id);
              if (stockItem) {
                await tx.insert(stockMovements).values({
                  shopId: shop.id,
                  productId: line.product_id,
                  stockItemId: stockItem.id,
                  movementType: 'RETURN',
                  quantity: String(Number(line.quantity)),
                  unitPrice: String(line.unit_price),
                  referenceId: invoiceId,
                  referenceType: 'invoice',
                  reason: `Annulation facture: ${reason}`,
                  createdBy: user.id,
                });
              }
            }
            if (line.pack_id) {
              const items = cancelPackItemsMap.get(line.pack_id) ?? [];
              for (const item of items) {
                const stockItem = stockMap.get(item.productId);
                if (stockItem) {
                  const qty = item.quantity * Number(line.quantity);
                  await tx.insert(stockMovements).values({
                    shopId: shop.id,
                    productId: item.productId,
                    stockItemId: stockItem.id,
                    movementType: 'RETURN',
                    quantity: String(qty),
                    unitPrice: String(line.unit_price),
                    referenceId: invoiceId,
                    referenceType: 'invoice',
                    reason: `Annulation facture (pack): ${reason}`,
                    createdBy: user.id,
                  });
                }
              }
            }
          }

          await tx
            .update(invoices)
            .set({ status: 'CANCELLED', cancelReason: reason, updatedAt: new Date() })
            .where(eq(invoices.id, invoiceId));
        });
      }
    }

    if (invoice.status !== 'VALIDATED') {
      await admin
        .from('invoices')
        .update({ status: 'CANCELLED', cancel_reason: reason })
        .eq('id', invoiceId);
    }

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
