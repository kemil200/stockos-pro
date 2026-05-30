'use server';

import { db } from '@/lib/db';
import { products, stockItems } from '@/lib/db/schema';
import { getCurrentShop } from '@/lib/tenant';
import { createStockMovement } from '@/lib/services/stock-manager';
import { emitEvent } from '@/lib/services/event-bus';
import { auditLog, AuditAction } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CreateProductSchema, AdjustStockSchema } from '@/lib/validations/product';

export async function createProduct(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const parsed = CreateProductSchema.parse({
    name: formData.get('name'),
    sku: formData.get('sku'),
    barcode: formData.get('barcode'),
    description: formData.get('description'),
    unitPrice: formData.get('unitPrice'),
    unitType: formData.get('unitType'),
    category: formData.get('category'),
  });

  const [product] = await db
    .insert(products)
    .values({
      shopId: shop.id,
      name: parsed.name,
      sku: parsed.sku || null,
      barcode: parsed.barcode || null,
      description: parsed.description || null,
      unitPrice: String(parsed.unitPrice),
      unitType: parsed.unitType,
      category: parsed.category || null,
    })
    .returning();

  await db.insert(stockItems).values({
    shopId: shop.id,
    productId: product.id,
    quantity: '0',
    minThreshold: '0',
  });

  revalidatePath('/products');
  return { product };
}

export async function adjustStock(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const parsed = AdjustStockSchema.parse({
    productId: formData.get('productId'),
    newQuantity: formData.get('newQuantity'),
    reason: formData.get('reason'),
  });

  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(
      eq(stockItems.shopId, shop.id),
      eq(stockItems.productId, parsed.productId),
    ));

  if (!item) throw new Error('Stock item not found');

  const currentQty = Number(item.quantity);
  const diff = parsed.newQuantity - currentQty;

  if (diff !== 0) {
    await createStockMovement({
      shopId: shop.id,
      productId: parsed.productId,
      movementType: 'ADJUSTMENT',
      quantity: diff,
      reason: parsed.reason || 'Ajustement manuel',
      createdBy: user.id,
    });
  }

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.STOCK_ADJUSTED,
    entityType: 'stock',
    entityId: item.id,
    metadata: {
      productId: parsed.productId,
      previousQty: currentQty,
      newQty: parsed.newQuantity,
      reason: parsed.reason,
    },
  });

  revalidatePath('/stock');
  return { success: true };
}
