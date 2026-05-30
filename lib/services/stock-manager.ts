import 'server-only';

import { db } from '@/lib/db';
import { stockMovements, stockItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { AuditAction, auditLog } from '@/lib/audit';

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockError';
  }
}

interface MovementInput {
  shopId: string;
  productId: string;
  movementType: string;
  quantity: number;
  unitPrice?: number;
  referenceId?: string;
  referenceType?: string;
  reason?: string;
  createdBy: string;
}

export async function createStockMovement(input: MovementInput) {
  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(
      eq(stockItems.shopId, input.shopId),
      eq(stockItems.productId, input.productId),
    ));

  if (!item) throw new StockError('Stock item not found');

  if (input.quantity < 0 && Number(item.quantity) + input.quantity < 0) {
    throw new StockError('Stock insuffisant');
  }

  const [movement] = await db
    .insert(stockMovements)
    .values({
      shopId: input.shopId,
      productId: input.productId,
      stockItemId: item.id,
      movementType: input.movementType,
      quantity: String(input.quantity),
      unitPrice: input.unitPrice ? String(input.unitPrice) : null,
      referenceId: input.referenceId as any,
      referenceType: input.referenceType,
      reason: input.reason,
      createdBy: input.createdBy,
    })
    .returning();

  return movement;
}

export async function getStockLevel(shopId: string, productId: string): Promise<number> {
  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(
      eq(stockItems.shopId, shopId),
      eq(stockItems.productId, productId),
    ));

  return item ? Number(item.quantity) : 0;
}

export async function getLowStockItems(shopId: string) {
  return db
    .select()
    .from(stockItems)
    .where(and(
      eq(stockItems.shopId, shopId),
    ));
}
