-- Enable RLS on packs and pack_items tables
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;

-- Tenant isolation for packs (has direct shop_id)
CREATE POLICY tenant_isolation_packs ON public.packs
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()::text));

-- Tenant isolation for pack_items: resolve via parent pack's shop_id
CREATE POLICY tenant_isolation_pack_items ON public.pack_items
    FOR ALL USING (
        pack_id IN (
            SELECT id FROM public.packs
            WHERE shop_id IN (
                SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()::text
            )
        )
    );

-- Fix superadmin bypass: app_metadata.role is nested, not top-level role
-- The top-level JWT 'role' is the Postgres role ('authenticated'), not the custom app_metadata role
-- Correct path: auth.jwt() -> 'app_metadata' ->> 'role'

-- Drop old policies with incorrect path
DROP POLICY IF EXISTS superadmin_bypass_shops ON public.shops;
DROP POLICY IF EXISTS superadmin_bypass_shop_settings ON public.shop_settings;
DROP POLICY IF EXISTS superadmin_bypass_users ON public.users;
DROP POLICY IF EXISTS superadmin_bypass_products ON public.products;
DROP POLICY IF EXISTS superadmin_bypass_stock_items ON public.stock_items;
DROP POLICY IF EXISTS superadmin_bypass_stock_movements ON public.stock_movements;
DROP POLICY IF EXISTS superadmin_bypass_invoice_settings ON public.invoice_settings;
DROP POLICY IF EXISTS superadmin_bypass_invoices ON public.invoices;
DROP POLICY IF EXISTS superadmin_bypass_invoice_lines ON public.invoice_lines;
DROP POLICY IF EXISTS superadmin_bypass_payments ON public.payments;
DROP POLICY IF EXISTS superadmin_bypass_credit_notes ON public.credit_notes;
DROP POLICY IF EXISTS superadmin_bypass_cash_movements ON public.cash_movements;
DROP POLICY IF EXISTS superadmin_bypass_subscriptions ON public.subscriptions;
DROP POLICY IF EXISTS superadmin_bypass_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS superadmin_bypass_events ON public.events;

-- Recreate with correct JWT path: auth.jwt() -> 'app_metadata' ->> 'role'
CREATE POLICY superadmin_bypass_shops ON public.shops
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_shop_settings ON public.shop_settings
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_users ON public.users
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_products ON public.products
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_stock_items ON public.stock_items
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_stock_movements ON public.stock_movements
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoice_settings ON public.invoice_settings
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoices ON public.invoices
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoice_lines ON public.invoice_lines
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_payments ON public.payments
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_credit_notes ON public.credit_notes
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_cash_movements ON public.cash_movements
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_subscriptions ON public.subscriptions
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_audit_logs ON public.audit_logs
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_events ON public.events
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');

-- Superadmin bypass for packs and pack_items
CREATE POLICY superadmin_bypass_packs ON public.packs
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_pack_items ON public.pack_items
    FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
