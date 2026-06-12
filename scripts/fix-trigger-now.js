// Apply the fix directly to the database
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { 
    ssl: 'require', max: 1, connection: { family: 4 }
  });

  try {
    console.log('1. Dropping old trigger and function...');
    await sql`DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements CASCADE`;
    await sql`DROP FUNCTION IF EXISTS apply_stock_movement CASCADE`;
    
    console.log('2. Creating new function with PURCHASE support...');
    await sql`
      CREATE OR REPLACE FUNCTION apply_stock_movement()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CASE NEW.movement_type
          WHEN 'PURCHASE', 'RETURN', 'TRANSFER_IN', 'INITIAL' THEN
            UPDATE stock_items
            SET quantity = quantity + NEW.quantity, updated_at = NOW()
            WHERE id = NEW.stock_item_id;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
            END IF;
          WHEN 'SALE', 'TRANSFER_OUT', 'LOSS' THEN
            UPDATE stock_items
            SET quantity = quantity + NEW.quantity, updated_at = NOW()
            WHERE id = NEW.stock_item_id;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
            END IF;
            IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
              RAISE EXCEPTION 'Stock insuffisant';
            END IF;
          WHEN 'ADJUSTMENT' THEN
            UPDATE stock_items
            SET quantity = NEW.quantity, updated_at = NOW()
            WHERE id = NEW.stock_item_id;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
            END IF;
          WHEN 'IN' THEN
            UPDATE stock_items
            SET quantity = quantity + NEW.quantity, updated_at = NOW()
            WHERE id = NEW.stock_item_id;
          WHEN 'OUT' THEN
            UPDATE stock_items
            SET quantity = quantity + NEW.quantity, updated_at = NOW()
            WHERE id = NEW.stock_item_id;
            IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
              RAISE EXCEPTION 'Stock insuffisant';
            END IF;
          ELSE
            RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
        END CASE;
        RETURN NEW;
      END;
      $$
    `;
    
    console.log('3. Creating trigger...');
    await sql`
      CREATE TRIGGER trg_apply_stock_movement
      AFTER INSERT ON stock_movements
      FOR EACH ROW
      EXECUTE FUNCTION apply_stock_movement()
    `;
    
    console.log('4. Repairing stock quantities...');
    const { count: repaired } = await sql`
      UPDATE stock_items si
      SET quantity = COALESCE(sub.computed, 0), updated_at = NOW()
      FROM (
        SELECT stock_item_id, SUM(CASE WHEN movement_type <> 'ADJUSTMENT' THEN quantity ELSE 0 END) AS computed
        FROM stock_movements
        GROUP BY stock_item_id
      ) sub
      WHERE si.id = sub.stock_item_id
    `;
    console.log(`   ${repaired} stock items repaired`);
    
    console.log('5. Verifying...');
    const [{ stored, computed }] = await sql`
      SELECT 
        SUM(si.quantity)::numeric AS stored,
        COALESCE(SUM(CASE WHEN sm.movement_type <> 'ADJUSTMENT' THEN sm.quantity ELSE 0 END), 0) AS computed
      FROM stock_items si
      LEFT JOIN stock_movements sm ON sm.stock_item_id = si.id
    `;
    console.log(`   Total stored: ${stored} | Total computed: ${computed} | ${Math.abs(Number(stored) - Number(computed)) < 0.001 ? '✓ MATCH' : '✗ MISMATCH'}`);
    
    console.log('\n✓ FIX COMPLETE. Restart npm run dev and test a purchase.');
  } finally {
    await sql.end();
  }
}

main().catch(e => console.error('FATAL:', e.message || e));
