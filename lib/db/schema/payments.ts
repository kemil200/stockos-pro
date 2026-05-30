import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { invoices } from './invoices';
import { users } from './users';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: text('method').notNull(),
  reference: text('reference'),
  notes: text('notes'),
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  receivedBy: uuid('received_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
