import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { invoices } from './invoices';
import { payments } from './payments';

export const geniuspayTransactions = pgTable('geniuspay_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  fees: numeric('fees', { precision: 12, scale: 2 }),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }),
  currency: text('currency').notNull().default('XOF'),
  status: text('status').notNull().default('pending'),
  gpReference: text('gp_reference'),
  gpPaymentMethod: text('gp_payment_method'),
  paymentId: uuid('payment_id').references(() => payments.id),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
