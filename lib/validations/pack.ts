import { z } from 'zod';

export const PackItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantité > 0'),
});

export const CreatePackSchema = z.object({
  name: z.string().min(1, 'Nom du pack requis'),
  salePrice: z.coerce.number().min(0, 'Prix de vente ≥ 0'),
  purchasePrice: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  items: z.array(PackItemSchema).min(1, 'Ajoutez au moins un produit'),
});

export const UpdatePackSchema = z.object({
  packId: z.string().uuid(),
  name: z.string().min(1, 'Nom du pack requis'),
  salePrice: z.coerce.number().min(0, 'Prix de vente ≥ 0'),
  purchasePrice: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  items: z.array(PackItemSchema).min(1, 'Ajoutez au moins un produit'),
});
