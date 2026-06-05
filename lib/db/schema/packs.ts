import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { products } from './products';

export const packs = pgTable('packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  salePrice: numeric('sale_price', { precision: 12, scale: 2 }).notNull(),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }).default('0'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const packItems = pgTable('pack_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  packId: uuid('pack_id').notNull().references(() => packs.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull(),
});
