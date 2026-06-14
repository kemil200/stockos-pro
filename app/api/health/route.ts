import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    const url = process.env.SUPABASE_DB_URL;
    checks.SUPABASE_DB_URL = url ? 'present' : 'missing';
  } catch {
    checks.SUPABASE_DB_URL = 'error reading';
  }

  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing';
  checks.RESEND_API_KEY = process.env.RESEND_API_KEY ? 'present' : 'missing';
  checks.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'not set';

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.listUsers({ page: 0, perPage: 1 });
    checks.supabase_admin = error ? `error: ${error.message}` : 'ok';
  } catch (e: any) {
    checks.supabase_admin = `error: ${e.message}`;
  }

  try {
    const { db } = await import('@/lib/db');
    await db.execute('SELECT 1');
    checks.drizzle_db = 'ok';
  } catch (e: any) {
    checks.drizzle_db = `error: ${e.message}`;
  }

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'present');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks },
    { status: allOk ? 200 : 500 }
  );
}
