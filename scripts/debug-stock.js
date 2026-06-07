require('dotenv/config');
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require', max: 1 });

  // FK checks
  const [shop] = await sql`SELECT id FROM shops WHERE id = ${'347e34ff-66f3-403b-b39b-ad4be096e6ab'}::uuid`;
  console.log('Shop exists:', !!shop);
  const [product] = await sql`SELECT id FROM products WHERE id = ${'215fc941-fb21-46e7-acd9-a4326955ca00'}::uuid`;
  console.log('Product exists:', !!product);
  const [u] = await sql`SELECT id FROM users WHERE id = ${'f0144e22-5ef5-44fc-bd26-cc08253cbf56'}::uuid`;
  console.log('User exists:', !!u);

  // Check RLS policy for stock_movements
  const policies = await sql`SELECT policyname, cmd, permissive, qual FROM pg_policies WHERE tablename = 'stock_movements'`;
  console.log('\nRLS policies on stock_movements:', policies.length);
  for (const p of policies) {
    console.log(`  ${p.policyname}: ${p.cmd} | permissive=${p.permissive}`);
  }

  // Try direct insert with exact same params as the failing query
  try {
    await sql.unsafe(`
      INSERT INTO stock_movements (shop_id, product_id, stock_item_id, movement_type, quantity, unit_price, reason, created_by)
      VALUES (
        '347e34ff-66f3-403b-b39b-ad4be096e6ab'::uuid,
        '215fc941-fb21-46e7-acd9-a4326955ca00'::uuid,
        'a7b784f7-80d1-4545-821e-b3fb64d34d7e'::uuid,
        'IN',
        '10',
        '1100',
        'Debug test',
        'f0144e22-5ef5-44fc-bd26-cc08253cbf56'::uuid
      )
      RETURNING id
    `);
    console.log('Direct INSERT succeeded');
  } catch (e) {
    console.log('Direct INSERT error:', e.message);
  }

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
