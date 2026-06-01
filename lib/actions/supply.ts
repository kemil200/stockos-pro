'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { stockItems, stockMovements, products, cashMovements } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { auditLog, AuditAction } from '@/lib/audit';

const SupplySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantité doit être > 0'),
  unitPrice: z.coerce.number().min(0, 'Prix d\'achat ≥ 0'),
  reason: z.string().optional(),
});

export async function purchaseStock(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();

    const parsed = SupplySchema.parse({
      productId: formData.get('productId'),
      quantity: formData.get('quantity'),
      unitPrice: formData.get('unitPrice'),
      reason: formData.get('reason') || undefined,
    });

    const totalCost = parsed.quantity * parsed.unitPrice;

    await db.transaction(async (tx) => {
      const [stockItem] = await tx
        .select()
        .from(stockItems)
        .where(and(
          eq(stockItems.shopId, shop.id),
          eq(stockItems.productId, parsed.productId),
        ))
        .for('update');

      if (!stockItem) throw new Error('Produit introuvable en stock');

      await tx.insert(stockMovements).values({
        shopId: shop.id,
        productId: parsed.productId,
        stockItemId: stockItem.id,
        movementType: 'IN',
        quantity: String(parsed.quantity),
        unitPrice: String(parsed.unitPrice),
        reason: parsed.reason || 'Approvisionnement',
        createdBy: user.id,
      });

      await tx
        .update(products)
        .set({ purchasePrice: String(parsed.unitPrice) })
        .where(and(
          eq(products.id, parsed.productId),
          eq(products.shopId, shop.id),
        ));

      await tx.insert(cashMovements).values({
        shopId: shop.id,
        movementType: 'EXPENSE',
        amount: String(-totalCost),
        referenceType: 'supply',
        referenceId: parsed.productId,
        description: `Achat: ${parsed.reason || 'Approvisionnement'} (${parsed.quantity} × ${parsed.unitPrice})`,
        createdBy: user.id,
      });
    });

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.STOCK_ADJUSTED,
        entityType: 'stock',
        entityId: parsed.productId,
        metadata: { quantity: parsed.quantity, unitPrice: parsed.unitPrice, totalCost },
      });
    } catch { /* non-bloquant */ }

    revalidatePath('/stock');
    revalidatePath('/supply');
    revalidatePath('/');
    return { success: true, totalCost } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
