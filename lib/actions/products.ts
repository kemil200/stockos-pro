'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { CreateProductSchema, AdjustStockSchema } from '@/lib/validations/product';

export async function createProduct(formData: FormData) {
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const parsed = CreateProductSchema.parse({
    name: formData.get('name'),
    sku: formData.get('sku'),
    barcode: formData.get('barcode'),
    description: formData.get('description'),
    unitPrice: formData.get('unitPrice'),
    unitType: formData.get('unitType'),
    category: formData.get('category'),
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
      unit_type: parsed.unitType,
      category: parsed.category || null,
    })
    .select()
    .single();

  if (productError) throw new Error(`Failed to create product: ${productError.message}`);
  if (!product) throw new Error('Product creation returned no data');

  const { error: stockError } = await admin
    .from('stock_items')
    .insert({
      shop_id: shop.id,
      product_id: product.id,
      quantity: '0',
      min_threshold: '0',
    });

  if (stockError) throw new Error(`Failed to create stock item: ${stockError.message}`);

  revalidatePath('/products');
  return { product };
}

export async function adjustStock(formData: FormData) {
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const parsed = AdjustStockSchema.parse({
    productId: formData.get('productId'),
    newQuantity: formData.get('newQuantity'),
    reason: formData.get('reason'),
  });

  const { data: stockItem } = await admin
    .from('stock_items')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('product_id', parsed.productId)
    .single();

  if (!stockItem) throw new Error('Stock item not found');

  const currentQty = Number(stockItem.quantity);
  const diff = parsed.newQuantity - currentQty;

  if (diff !== 0) {
    const { error: movementError } = await admin
      .from('stock_movements')
      .insert({
        shop_id: shop.id,
        product_id: parsed.productId,
        movement_type: 'ADJUSTMENT',
        quantity: diff,
        reason: parsed.reason || 'Ajustement manuel',
        created_by: user.id,
      });

    if (movementError) throw new Error(`Failed to create stock movement: ${movementError.message}`);
  }

  revalidatePath('/stock');
  return { success: true };
}
