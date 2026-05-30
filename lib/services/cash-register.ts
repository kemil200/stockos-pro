import 'server-only';

import { db } from '@/lib/db';
import { cashMovements } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getCashBalance(shopId: string): Promise<number> {
  const [result] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shopId));

  return result?.balance ?? 0;
}

export async function recordCashMovement(input: {
  shopId: string;
  movementType: string;
  amount: number;
  currency?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdBy: string;
}) {
  const [movement] = await db
    .insert(cashMovements)
    .values({
      shopId: input.shopId,
      movementType: input.movementType,
      amount: String(input.amount),
      currency: input.currency || 'XOF',
      referenceType: input.referenceType,
      referenceId: input.referenceId as any,
      description: input.description,
      createdBy: input.createdBy,
    })
    .returning();

  return movement;
}

export async function getCashMovements(shopId: string, limit = 50) {
  return db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.shopId, shopId))
    .orderBy(sql`created_at DESC`)
    .limit(limit);
}
