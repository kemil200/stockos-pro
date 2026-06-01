-- Enable RLS on all public tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper: resolve shop_id from auth.user_id
-- The users table maps auth.uid() → shop_id.
-- For tables with shop_id directly, we use that.
-- For tables without shop_id, we join through their parent.

-- Policy for tables with direct shop_id column
CREATE POLICY tenant_isolation_shops ON public.shops
    FOR ALL USING (id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_shop_settings ON public.shop_settings
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_users ON public.users
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_products ON public.products
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_stock_items ON public.stock_items
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_stock_movements ON public.stock_movements
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_invoice_settings ON public.invoice_settings
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_invoices ON public.invoices
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_payments ON public.payments
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_credit_notes ON public.credit_notes
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_cash_movements ON public.cash_movements
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_subscriptions ON public.subscriptions
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_events ON public.events
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()));

-- invoice_lines has no shop_id — resolve via parent invoice
CREATE POLICY tenant_isolation_invoice_lines ON public.invoice_lines
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM public.invoices
            WHERE shop_id IN (
                SELECT shop_id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Superadmin bypass: service_role or JWT role='SUPERADMIN' sees everything
CREATE POLICY superadmin_bypass_shops ON public.shops
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_shop_settings ON public.shop_settings
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_users ON public.users
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_products ON public.products
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_stock_items ON public.stock_items
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_stock_movements ON public.stock_movements
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoice_settings ON public.invoice_settings
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoices ON public.invoices
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_invoice_lines ON public.invoice_lines
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_payments ON public.payments
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_credit_notes ON public.credit_notes
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_cash_movements ON public.cash_movements
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_subscriptions ON public.subscriptions
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_audit_logs ON public.audit_logs
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY superadmin_bypass_events ON public.events
    FOR ALL USING ((auth.jwt() ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
