require('dotenv/config');
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require', max: 1 });

  const [row] = await sql`SELECT tgname FROM pg_trigger WHERE tgname = 'trg_apply_stock_movement'`;

  if (row) {
    console.log('OK: stock trigger exists');
  } else {
    console.log('MISSING: creating stock trigger...');
    const triggerSQL = fs.readFileSync('lib/db/migrations/0001_stock_trigger.sql', 'utf8');
    await sql.unsafe(triggerSQL);
    console.log('OK: stock trigger created');
  }

  await sql.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
