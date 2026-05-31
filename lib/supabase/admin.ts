import { createClient } from '@supabase/supabase-js';

let _admin: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin credentials not configured');
    _admin = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _admin;
}
