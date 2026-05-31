import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Prix ≥ 0'),
  purchasePrice: z.coerce.number().min(0).optional(),
  unitType: z.enum(['UNITY', 'KG', 'LITER', 'METER', 'BOX', 'PACK']).default('UNITY'),
  category: z.string().optional(),
});

export const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  newQuantity: z.coerce.number().min(0, 'Quantité ≥ 0'),
  reason: z.string().optional(),
});
