'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { packs, packItems } from '@/lib/db/schema';
import { CreatePackSchema, UpdatePackSchema } from '@/lib/validations/pack';
import { assertWritable } from '@/lib/readonly';
import { hasFeature } from '@/lib/plans';

export async function createPack(formData: FormData) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);

    if (!(await hasFeature(shop.id, 'packs'))) {
      return { success: false, error: 'Fonctionnalité non disponible sur votre plan' } as const;
    }

    const itemsJson = formData.get('items') as string;
    if (itemsJson.length > 50000) {
      return { success: false, error: 'Trop de produits dans le pack' } as const;
    }
    const rawItems = JSON.parse(itemsJson);
    const parsed = CreatePackSchema.parse({
      name: formData.get('name'),
      salePrice: formData.get('salePrice'),
      purchasePrice: formData.get('purchasePrice') || undefined,
      description: formData.get('description') || undefined,
      items: rawItems,
    });

    const result = await db.transaction(async (tx) => {
      const [pack] = await tx
        .insert(packs)
        .values({
          shopId: shop.id,
          name: parsed.name,
          salePrice: String(parsed.salePrice),
          purchasePrice: parsed.purchasePrice != null ? String(parsed.purchasePrice) : '0',
          description: parsed.description || null,
        })
        .returning();

      const itemsData = parsed.items.map((item) => ({
        packId: pack.id,
        productId: item.productId,
        quantity: String(item.quantity),
      }));

      await tx.insert(packItems).values(itemsData);

      return pack;
    });

    revalidatePath('/products/packs');
    return { success: true, pack: result } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function updatePack(formData: FormData) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);

    if (!(await hasFeature(shop.id, 'packs'))) {
      return { success: false, error: 'Fonctionnalité non disponible sur votre plan' } as const;
    }

    const itemsJson = formData.get('items') as string;
    if (itemsJson.length > 50000) {
      return { success: false, error: 'Trop de produits dans le pack' } as const;
    }
    const rawItems = JSON.parse(itemsJson);
    const parsed = UpdatePackSchema.parse({
      packId: formData.get('packId'),
      name: formData.get('name'),
      salePrice: formData.get('salePrice'),
      purchasePrice: formData.get('purchasePrice') || undefined,
      description: formData.get('description') || undefined,
      items: rawItems,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(packs)
        .set({
          name: parsed.name,
          salePrice: String(parsed.salePrice),
          purchasePrice: parsed.purchasePrice != null ? String(parsed.purchasePrice) : '0',
          description: parsed.description || null,
          updatedAt: new Date(),
        })
        .where(and(eq(packs.id, parsed.packId), eq(packs.shopId, shop.id)));

      await tx.delete(packItems).where(eq(packItems.packId, parsed.packId));

      const itemsData = parsed.items.map((item) => ({
        packId: parsed.packId,
        productId: item.productId,
        quantity: String(item.quantity),
      }));

      await tx.insert(packItems).values(itemsData);
    });

    revalidatePath('/products/packs');
    revalidatePath(`/products/packs/${parsed.packId}`);
    return { success: true } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function deletePack(packId: string) {
  try {
    const { shop } = await getCurrentShop();
    await assertWritable(shop.id);

    if (!(await hasFeature(shop.id, 'packs'))) {
      return { success: false, error: 'Fonctionnalité non disponible sur votre plan' } as const;
    }

    await db
      .delete(packs)
      .where(and(eq(packs.id, packId), eq(packs.shopId, shop.id)));

    revalidatePath('/products/packs');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
