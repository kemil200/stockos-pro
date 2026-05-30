import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';

export const cashMovements = pgTable('cash_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  movementType: text('movement_type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('XOF'),
  referenceType: text('reference_type'),
  referenceId: uuid('reference_id'),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
