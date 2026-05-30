import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').references(() => shops.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  data: jsonb('data').notNull(),
  userId: uuid('user_id').references(() => users.id),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
