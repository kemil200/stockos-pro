import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createClient() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error('SUPABASE_DB_URL not configured');

  return postgres(url, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    connection: {
      family: 4,
    },
    onnotice: () => {},
  });
}

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    _client = createClient();
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
