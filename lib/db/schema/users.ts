import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('EMPLOYEE'),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
