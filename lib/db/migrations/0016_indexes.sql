-- FK indexes: Every table filtered by shop_id gets an index
-- This is REQUIRED for RLS performance (every policy checks shop_id)
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_cat_lookup_shop_id ON cat_lookup(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_shop_id ON stock_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_product_id ON stock_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_shop_id ON stock_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_packs_shop_id ON packs(shop_id);
CREATE INDEX IF NOT EXISTS idx_pack_items_pack_id ON pack_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_items_product_id ON pack_items(product_id);
CREATE INDEX IF NOT EXISTS idx_events_shop_id ON events(shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_shop_id ON cash_movements(shop_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created_by ON cash_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON payments(received_by);
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_validated_by ON invoices(validated_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id ON invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_shop_id ON credit_notes(shop_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice_id ON credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_applied_by ON credit_notes(applied_by);
CREATE INDEX IF NOT EXISTS idx_credit_notes_created_by ON credit_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_shop_id ON invites(shop_id);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON invites(used_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Composite indexes: common multi-column query patterns
CREATE INDEX IF NOT EXISTS idx_invoices_shop_status ON invoices(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_shop_created ON invoices(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_shop_movement ON stock_movements(shop_id, movement_type, created_at);
CREATE INDEX IF NOT EXISTS idx_users_shop_auth ON users(shop_id, auth_user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token_expiry ON password_reset_tokens(token, expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_code_unused ON invites(code) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_shop_draft ON invoices(shop_id, status) WHERE status = 'DRAFT';
