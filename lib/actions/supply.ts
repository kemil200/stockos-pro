'use server';

import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
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
    const admin = createAdminClient();

    const parsed = SupplySchema.parse({
      productId: formData.get('productId'),
      quantity: formData.get('quantity'),
      unitPrice: formData.get('unitPrice'),
      reason: formData.get('reason') || undefined,
    });

    const { data: stockItem } = await admin
      .from('stock_items')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('product_id', parsed.productId)
      .single();

    if (!stockItem) return { success: false, error: 'Produit introuvable en stock' } as const;

    const totalCost = parsed.quantity * parsed.unitPrice;

    const { error: movementError } = await admin
      .from('stock_movements')
      .insert({
        shop_id: shop.id,
        product_id: parsed.productId,
        stock_item_id: stockItem.id,
        movement_type: 'IN',
        quantity: String(parsed.quantity),
        unit_price: String(parsed.unitPrice),
        reason: parsed.reason || 'Approvisionnement',
        created_by: user.id,
      });

    if (movementError) return { success: false, error: movementError.message } as const;

    const { error: priceError } = await admin
      .from('products')
      .update({ purchase_price: String(parsed.unitPrice) })
      .eq('id', parsed.productId)
      .eq('shop_id', shop.id);

    if (priceError) console.error('Failed to update purchase_price:', priceError);

    const { error: cashError } = await admin.from('cash_movements').insert({
      shop_id: shop.id,
      movement_type: 'EXPENSE',
      amount: String(-totalCost),
      reference_type: 'supply',
      reference_id: parsed.productId,
      description: `Achat: ${parsed.reason || 'Approvisionnement'} (${parsed.quantity} × ${parsed.unitPrice})`,
      created_by: user.id,
    });

    if (cashError) console.error('Failed to record cash movement:', cashError);

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
