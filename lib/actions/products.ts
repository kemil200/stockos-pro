'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { CreateProductSchema, AdjustStockSchema } from '@/lib/validations/product';

export async function createProduct(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    const admin = createAdminClient();

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

    const { data: product, error: productError } = await admin
      .from('products')
      .insert({
        shop_id: shop.id,
        name: parsed.name,
        sku: parsed.sku || null,
        barcode: parsed.barcode || null,
        description: parsed.description || null,
        unit_price: String(parsed.unitPrice),
        purchase_price: parsed.purchasePrice != null ? String(parsed.purchasePrice) : '0',
        unit_type: parsed.unitType,
        category: parsed.category || null,
      })
      .select()
      .single();

    if (productError) return { success: false, error: `Erreur création produit: ${productError.message}` } as const;
    if (!product) return { success: false, error: 'Création produit sans réponse' } as const;

    const { error: stockError } = await admin
      .from('stock_items')
      .insert({
        shop_id: shop.id,
        product_id: product.id,
        quantity: '0',
        min_threshold: '0',
      });

    if (stockError) return { success: false, error: `Erreur création stock: ${stockError.message}` } as const;

    revalidatePath('/products');
    return { success: true, product } as const;
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
    const admin = createAdminClient();

    const parsed = AdjustStockSchema.parse({
      productId: formData.get('productId'),
      newQuantity: formData.get('newQuantity'),
      reason: formData.get('reason') || undefined,
    });

    const { data: stockItem } = await admin
      .from('stock_items')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('product_id', parsed.productId)
      .single();

    if (!stockItem) return { success: false, error: 'Stock introuvable' } as const;

    if (parsed.newQuantity !== Number(stockItem.quantity)) {
      const { error: movementError } = await admin
        .from('stock_movements')
        .insert({
          shop_id: shop.id,
          product_id: parsed.productId,
          stock_item_id: stockItem.id,
          movement_type: 'ADJUSTMENT',
          quantity: String(parsed.newQuantity),
          reason: parsed.reason || 'Ajustement manuel',
          created_by: user.id,
        });

      if (movementError) return { success: false, error: `Erreur mouvement: ${movementError.message}` } as const;
    }

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


