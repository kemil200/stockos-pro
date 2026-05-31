import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) throw new Error('SUPABASE_DB_URL not configured');
    _client = postgres(url);
    _db = drizzle(_client, { schema });
  }
  return _db;
}

const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export { db };
