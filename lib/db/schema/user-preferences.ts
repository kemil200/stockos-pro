import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  mode: text('mode').notNull().default('complete'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
