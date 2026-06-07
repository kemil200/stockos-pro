import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const catLookup = pgTable('cat_lookup', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
