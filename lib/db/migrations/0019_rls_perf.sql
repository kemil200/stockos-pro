-- Optimize RLS policies: wrap auth.uid() and auth.jwt() in SELECT
-- so they are evaluated once per query, not once per row

-- Drop old tenant policies (from 0007)
DROP POLICY IF EXISTS tenant_isolation_shops ON shops;
DROP POLICY IF EXISTS tenant_isolation_shop_settings ON shop_settings;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
DROP POLICY IF EXISTS tenant_isolation_products ON products;
DROP POLICY IF EXISTS tenant_isolation_stock_items ON stock_items;
DROP POLICY IF EXISTS tenant_isolation_stock_movements ON stock_movements;
DROP POLICY IF EXISTS tenant_isolation_invoice_settings ON invoice_settings;
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
DROP POLICY IF EXISTS tenant_isolation_invoice_lines ON invoice_lines;
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
DROP POLICY IF EXISTS tenant_isolation_credit_notes ON credit_notes;
DROP POLICY IF EXISTS tenant_isolation_cash_movements ON cash_movements;
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON subscriptions;
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
DROP POLICY IF EXISTS tenant_isolation_events ON events;

-- Drop old superadmin policies (from 0008)
DROP POLICY IF EXISTS superadmin_bypass_shops ON shops;
DROP POLICY IF EXISTS superadmin_bypass_shop_settings ON shop_settings;
DROP POLICY IF EXISTS superadmin_bypass_users ON users;
DROP POLICY IF EXISTS superadmin_bypass_products ON products;
DROP POLICY IF EXISTS superadmin_bypass_stock_items ON stock_items;
DROP POLICY IF EXISTS superadmin_bypass_stock_movements ON stock_movements;
DROP POLICY IF EXISTS superadmin_bypass_invoice_settings ON invoice_settings;
DROP POLICY IF EXISTS superadmin_bypass_invoices ON invoices;
DROP POLICY IF EXISTS superadmin_bypass_invoice_lines ON invoice_lines;
DROP POLICY IF EXISTS superadmin_bypass_payments ON payments;
DROP POLICY IF EXISTS superadmin_bypass_credit_notes ON credit_notes;
DROP POLICY IF EXISTS superadmin_bypass_cash_movements ON cash_movements;
DROP POLICY IF EXISTS superadmin_bypass_subscriptions ON subscriptions;
DROP POLICY IF EXISTS superadmin_bypass_audit_logs ON audit_logs;
DROP POLICY IF EXISTS superadmin_bypass_events ON events;
DROP POLICY IF EXISTS superadmin_bypass_packs ON packs;
DROP POLICY IF EXISTS superadmin_bypass_pack_items ON pack_items;
DROP POLICY IF EXISTS superadmin_bypass_invites ON invites;

-- Drop old pack RLS policies (from 0008)
DROP POLICY IF EXISTS tenant_isolation_packs ON packs;
DROP POLICY IF EXISTS tenant_isolation_pack_items ON pack_items;

-- Drop old invite policies (from 0011)
DROP POLICY IF EXISTS tenant_isolation_invites ON invites;
DROP POLICY IF EXISTS superadmin_bypass_invites ON invites;

-- Recreate ALL tenant isolation policies with cached auth.uid()
-- auth.uid() wrapped in SELECT so Postgres evaluates it ONCE per query
CREATE POLICY tenant_isolation_shops ON shops FOR ALL USING (auth.uid()::text IN (SELECT auth_user_id FROM users WHERE shop_id = shops.id));
CREATE POLICY tenant_isolation_shop_settings ON shop_settings FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_users ON users FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_products ON products FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_stock_items ON stock_items FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_stock_movements ON stock_movements FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_invoice_settings ON invoice_settings FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_invoices ON invoices FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_invoice_lines ON invoice_lines FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text)));
CREATE POLICY tenant_isolation_payments ON payments FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_credit_notes ON credit_notes FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_cash_movements ON cash_movements FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_subscriptions ON subscriptions FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_events ON events FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_packs ON packs FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));
CREATE POLICY tenant_isolation_pack_items ON pack_items FOR ALL USING (pack_id IN (SELECT id FROM packs WHERE shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text)));
CREATE POLICY tenant_isolation_invites ON invites FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = (SELECT auth.uid())::text));

-- Recreate ALL superadmin bypass policies with cached auth.jwt()
CREATE POLICY superadmin_bypass_shops ON shops FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_shop_settings ON shop_settings FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_users ON users FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_products ON products FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_stock_items ON stock_items FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_stock_movements ON stock_movements FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_invoice_settings ON invoice_settings FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_invoices ON invoices FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_invoice_lines ON invoice_lines FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_payments ON payments FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_credit_notes ON credit_notes FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_cash_movements ON cash_movements FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_subscriptions ON subscriptions FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_audit_logs ON audit_logs FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_events ON events FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_packs ON packs FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_pack_items ON pack_items FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
CREATE POLICY superadmin_bypass_invites ON invites FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role'));
