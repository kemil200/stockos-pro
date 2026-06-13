ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_only_password_reset_tokens ON password_reset_tokens
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
