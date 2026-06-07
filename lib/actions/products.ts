'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { products, stockItems, stockMovements } from '@/lib/db/schema';
import { CreateProductSchema, AdjustStockSchema } from '@/lib/validations/product';
import { assertWritable } from '@/lib/readonly';
import { assertPlanLimit } from '@/lib/plans';

export async function createProduct(formData: FormData) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);
    await assertPlanLimit(shop.id, 'maxProducts');

    const parsed = CreateProductSchema.parse({
      name: formData.get('name'),
      sku: formData.get('sku') || undefined,
      barcode: formData.get('barcode') || undefined,
      description: formData.get('description') || undefined,
      unitPrice: formData.get('unitPrice'),
      purchasePrice: formData.get('purchasePrice'),
      unitType: formData.get('unitType'),
      category: formData.get('category') || undefined,
    });

    const result = await db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          shopId: shop.id,
          name: parsed.name,
          sku: parsed.sku || null,
          barcode: parsed.barcode || null,
          description: parsed.description || null,
          unitPrice: String(parsed.unitPrice),
          purchasePrice: parsed.purchasePrice != null ? String(parsed.purchasePrice) : '0',
          unitType: parsed.unitType,
          category: parsed.category || null,
        })
        .returning();

      await tx.insert(stockItems).values({
        shopId: shop.id,
        productId: product.id,
        quantity: '0',
        minThreshold: '0',
      });

      return product;
    });

    revalidatePath('/products');
    return { success: true, product: result } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function adjustStock(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    await assertWritable(shop.id);

    const parsed = AdjustStockSchema.parse({
      productId: formData.get('productId'),
      newQuantity: formData.get('newQuantity'),
      reason: formData.get('reason') || undefined,
    });

    await db.transaction(async (tx) => {
      const [stockItem] = await tx
        .select()
        .from(stockItems)
        .where(and(
          eq(stockItems.shopId, shop.id),
          eq(stockItems.productId, parsed.productId),
        ))
        .for('update');

      if (!stockItem) throw new Error('Stock introuvable');

      if (parsed.newQuantity !== Number(stockItem.quantity)) {
        await tx.insert(stockMovements).values({
          shopId: shop.id,
          productId: parsed.productId,
          stockItemId: stockItem.id,
          movementType: 'ADJUSTMENT',
          quantity: String(parsed.newQuantity),
          reason: parsed.reason || 'Ajustement manuel',
          createdBy: user.id,
        });

        await tx
          .update(stockItems)
          .set({ quantity: String(parsed.newQuantity), updatedAt: new Date() })
          .where(eq(stockItems.id, stockItem.id));
      }
    });

    revalidatePath('/stock');
    return { success: true } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function getStockHistory(productId: string) {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: movements } = await admin
    .from('stock_movements')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(5);

  return movements ?? [];
}

export async function getStockLevel(productId: string) {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  const { data: item } = await admin
    .from('stock_items')
    .select('quantity')
    .eq('shop_id', shop.id)
    .eq('product_id', productId)
    .single();

  return item ? Number(item.quantity) : 0;
}
