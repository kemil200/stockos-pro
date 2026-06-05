CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_roles ON roles
  FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = auth.uid()::text));

CREATE POLICY superadmin_bypass_roles ON roles
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
