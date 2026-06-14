import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  try {
    const r = await db.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'`
    );
    results.table_exists = (r as any).length > 0 ? 'yes' : 'NO';
  } catch (e: any) {
    results.table_exists = `error: ${e.message}`;
  }

  try {
    const r = await db.execute(`SELECT * FROM drizzle.__drizzle_migrations WHERE hash LIKE '%password_reset%' LIMIT 5`);
    results.migrations = (r as any).length > 0 ? r : 'none found';
  } catch (e: any) {
    results.migrations = `error: ${e.message}`;
  }

  return NextResponse.json(results);
}
