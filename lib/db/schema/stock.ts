import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { products } from './products';
import { users } from './users';

export const stockItems = pgTable('stock_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  minThreshold: numeric('min_threshold', { precision: 12, scale: 3 }).default('0'),
  location: text('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  stockItemId: uuid('stock_item_id').notNull(),
  movementType: text('movement_type').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }),
  referenceId: uuid('reference_id'),
  referenceType: text('reference_type'),
  reason: text('reason'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
