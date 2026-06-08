CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id)
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_invites ON invites
  FOR ALL USING (shop_id IN (SELECT shop_id FROM users WHERE auth_user_id = auth.uid()::text));

CREATE POLICY superadmin_bypass_invites ON invites
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN' OR (auth.jwt() ->> 'role') = 'service_role');
