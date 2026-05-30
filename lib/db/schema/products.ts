import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  description: text('description'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  unitType: text('unit_type').notNull().default('UNITY'),
  category: text('category'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
