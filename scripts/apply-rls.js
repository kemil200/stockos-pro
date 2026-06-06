require('dotenv/config');
const postgres = require('postgres');

async function applyRLS() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require', max: 1 });

  const tables = [
    'shops', 'shop_settings', 'users', 'products', 'stock_items', 'stock_movements',
    'invoice_settings', 'invoices', 'invoice_lines', 'payments', 'credit_notes',
    'cash_movements', 'subscriptions', 'audit_logs', 'events',
    'packs', 'pack_items', 'cat_lookup',
  ];

  // Enable RLS on all tables
  for (const t of tables) {
    try {
      await sql.unsafe(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
      console.log(`RLS enabled: ${t}`);
    } catch (e) {
      console.log(`RLS skip: ${t} - ${e.message}`);
    }
  }

  // Tenant isolation for tables with direct shop_id
  const directTables = tables.filter((t) => t !== 'invoice_lines' && t !== 'pack_items');
  for (const t of directTables) {
    try {
      const col = t === 'shops' ? 'id' : 'shop_id';
      await sql.unsafe(`
        DO $$ BEGIN
        CREATE POLICY tenant_isolation_${t} ON ${t}
        FOR ALL USING (${col} IN (
          SELECT shop_id FROM users WHERE auth_user_id = auth.uid()::text
        ));
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log(`Policy tenant: ${t}`);
    } catch (e) {
      console.log(`Policy skip: ${t} - ${e.message}`);
    }
  }

  // invoice_lines via parent invoice
  await sql.unsafe(`
    DO $$ BEGIN
    CREATE POLICY tenant_isolation_invoice_lines ON invoice_lines
    FOR ALL USING (invoice_id IN (
      SELECT id FROM invoices WHERE shop_id IN (
        SELECT shop_id FROM users WHERE auth_user_id = auth.uid()::text
      )
    ));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('Policy tenant: invoice_lines');

  // pack_items via parent pack
  await sql.unsafe(`
    DO $$ BEGIN
    CREATE POLICY tenant_isolation_pack_items ON pack_items
    FOR ALL USING (pack_id IN (
      SELECT id FROM packs WHERE shop_id IN (
        SELECT shop_id FROM users WHERE auth_user_id = auth.uid()::text
      )
    ));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('Policy tenant: pack_items');

  // Superadmin bypass for all tables
  for (const t of tables) {
    try {
      await sql.unsafe(`
        DO $$ BEGIN
        CREATE POLICY superadmin_bypass_${t} ON ${t}
        FOR ALL USING (
          (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPERADMIN'
          OR
          (auth.jwt() ->> 'role') = 'service_role'
        );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      console.log(`Policy superadmin: ${t}`);
    } catch (e) {
      console.log(`Policy skip: ${t} - ${e.message}`);
    }
  }

  console.log('\nAll RLS policies applied successfully');
  await sql.end();
}

applyRLS().catch((e) => { console.error(e); process.exit(1); });
