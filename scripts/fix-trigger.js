require('dotenv/config');
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require', max: 1 });

  // Drop existing trigger first
  await sql.unsafe('DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements');

  // Create function WITHOUT SET search_path (original did not have it)
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION apply_stock_movement()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      CASE NEW.movement_type
        WHEN 'IN' THEN
          UPDATE stock_items SET quantity = quantity + NEW.quantity, updated_at = NOW() WHERE id = NEW.stock_item_id;
          IF NOT FOUND THEN RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id; END IF;
        WHEN 'OUT', 'SALE' THEN
          UPDATE stock_items SET quantity = quantity + NEW.quantity, updated_at = NOW() WHERE id = NEW.stock_item_id;
          IF NOT FOUND THEN RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id; END IF;
          IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
            RAISE EXCEPTION 'Stock insuffisant';
          END IF;
        WHEN 'ADJUSTMENT' THEN
          UPDATE stock_items SET quantity = NEW.quantity, updated_at = NOW() WHERE id = NEW.stock_item_id;
          IF NOT FOUND THEN RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id; END IF;
        WHEN 'CANCELLATION' THEN
          UPDATE stock_items SET quantity = quantity + NEW.quantity, updated_at = NOW() WHERE id = NEW.stock_item_id;
          IF NOT FOUND THEN RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id; END IF;
        ELSE
          RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
      END CASE;
      RETURN NEW;
    END;
    $$;
  `);

  // Recreate trigger
  await sql.unsafe(`
    CREATE TRIGGER trg_apply_stock_movement
      AFTER INSERT ON stock_movements
      FOR EACH ROW
      EXECUTE FUNCTION apply_stock_movement();
  `);

  console.log('Trigger fixed — no search_path, CANCELLATION support added');

  await sql.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
