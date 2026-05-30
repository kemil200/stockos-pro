import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shopSettings = pgTable('shop_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  shopId: uuid('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }).unique(),
  legalName: text('legal_name').notNull(),
  tradingName: text('trading_name'),
  address: text('address'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull().default('TG'),
  currency: text('currency').notNull().default('XOF'),
  logoUrl: text('logo_url'),
  invoiceFooter: text('invoice_footer'),
  taxId: text('tax_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
