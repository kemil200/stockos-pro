// Direct PostgreSQL check - no supabase-js dependency
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { 
    ssl: 'require',
    max: 1,
    connection: { family: 4 }
  });

  try {
    // 1. Check trigger exists
    console.log('=== TRIGGER EXISTENCE ===');
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'stock_movements'
    `;
    console.log('Triggers on stock_movements:', triggers.length);
    for (const t of triggers) {
      console.log(`  ${t.trigger_name} | ${t.event_manipulation}`);
    }
    if (triggers.length === 0) {
      console.log('  *** NO TRIGGER FOUND! This is the problem. ***');
    }

    // 2. Check function
    console.log('\n=== FUNCTION ===');
    const funcs = await sql`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE proname = 'apply_stock_movement'
    `;
    for (const f of funcs) {
      const hasPurchase = f.prosrc.includes('PURCHASE');
      const hasIn = f.prosrc.includes("'IN'");
      console.log(`  Source length: ${f.prosrc.length} | Has PURCHASE: ${hasPurchase} | Has 'IN': ${hasIn}`);
      if (!hasPurchase && hasIn) {
        console.log('  *** OLD FUNCTION (only IN/OUT/SALE/ADJUSTMENT) ***');
      }
    }

    // 3. Recent stock_movements
    console.log('\n=== LAST 5 STOCK_MOVEMENTS ===');
    const moves = await sql`
      SELECT movement_type, quantity, stock_item_id, reason, created_at
      FROM stock_movements
      ORDER BY created_at DESC
      LIMIT 5
    `;
    for (const m of moves) {
      console.log(`  ${m.movement_type.padEnd(16)} qty=${String(m.quantity).padEnd(10)} si=${m.stock_item_id.slice(0,8)} ${(m.reason||'').slice(0,50)}`);
    }

    // 4. Stock items
    console.log('\n=== STOCK ITEMS (sample) ===');
    const stock = await sql`
      SELECT si.id, si.product_id, si.quantity, p.name
      FROM stock_items si
      LEFT JOIN products p ON p.id = si.product_id
      ORDER BY si.updated_at DESC
      LIMIT 10
    `;
    for (const s of stock) {
      console.log(`  ${(s.name||'?').slice(0,20).padEnd(22)} qty=${s.quantity}  si=${s.id.slice(0,8)}`);
    }

    // 5. Cross-check: movements sum vs stock_items quantity
    console.log('\n=== CROSS-CHECK (stock vs computed) ===');
    const crossCheck = await sql`
      SELECT 
        si.id,
        si.quantity AS stored,
        COALESCE(SUM(CASE WHEN sm.movement_type <> 'ADJUSTMENT' THEN sm.quantity ELSE 0 END), 0) AS computed,
        COUNT(sm.id) AS move_count
      FROM stock_items si
      LEFT JOIN stock_movements sm ON sm.stock_item_id = si.id
      GROUP BY si.id, si.quantity
      HAVING COALESCE(SUM(CASE WHEN sm.movement_type <> 'ADJUSTMENT' THEN sm.quantity ELSE 0 END), 0) != si.quantity
         OR COUNT(sm.id) > 0
      LIMIT 10
    `;
    
    let mismatches = 0;
    for (const c of crossCheck) {
      const ok = Math.abs(Number(c.stored) - Number(c.computed)) < 0.001;
      if (!ok) mismatches++;
      console.log(`  si=${c.id.slice(0,8)} stored=${c.stored} computed=${c.computed} moves=${c.move_count} ${ok ? '✓' : '✗'}`);
    }
    console.log(`  Total mismatches: ${mismatches}`);

    if (mismatches > 0) {
      console.log('\n  *** STOCK DATA IS CORRUPTED - running repair... ***');
      await sql`
        UPDATE stock_items si
        SET quantity = COALESCE(sub.computed, 0), updated_at = NOW()
        FROM (
          SELECT stock_item_id, SUM(CASE WHEN movement_type <> 'ADJUSTMENT' THEN quantity ELSE 0 END) AS computed
          FROM stock_movements
          GROUP BY stock_item_id
        ) sub
        WHERE si.id = sub.stock_item_id
      `;
      console.log('  Repair applied.');
    }

    // 6. Check applied migrations
    console.log('\n=== DRIZZLE MIGRATIONS ===');
    const applied = await sql`
      SELECT id, hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at DESC
      LIMIT 5
    `;
    for (const m of applied) {
      console.log(`  ${String(m.id).padEnd(10)} hash=${m.hash?.slice(0,12)} ${m.created_at}`);
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    if (triggers.length === 0 && funcs.length === 0) {
      console.log('CRITICAL: No trigger and no function. Migration not applied. Run: npm run db:migrate');
    } else if (triggers.length === 0 && funcs.length > 0) {
      console.log('CRITICAL: Function exists but no trigger. Creating trigger now...');
      await sql`CREATE TRIGGER trg_apply_stock_movement AFTER INSERT ON stock_movements FOR EACH ROW EXECUTE FUNCTION apply_stock_movement()`;
      console.log('Trigger created.');
    } else if (triggers.length > 0) {
      console.log('Trigger exists. Checking function version...');
      const f = funcs[0];
      if (f && f.prosrc.includes('PURCHASE')) {
        console.log('Function handles PURCHASE ✓');
        if (mismatches > 0) {
          console.log('Stock data was repaired ✓');
        }
      } else {
        console.log('WARNING: Function is old version (no PURCHASE).');
      }
    }

  } finally {
    await sql.end();
  }
}

main().catch(e => console.error('FATAL:', e.message || e));
