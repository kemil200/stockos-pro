require('dotenv/config');
const postgres = require('postgres');

async function fixLinter() {
  const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require', max: 1 });

  // Revoke public execute on rls_auto_enable to prevent anon/authenticated abuse
  try {
    await sql.unsafe(`REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC`);
    console.log('Revoked EXECUTE on rls_auto_enable');
  } catch (e) {
    console.log('Skip rls_auto_enable:', e.message);
  }

  // Fix apply_stock_movement search_path
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.apply_stock_movement()
      RETURNS trigger
      LANGUAGE plpgsql
      SET search_path = ''
      AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.movement_type = 'IN' THEN
            UPDATE stock_items SET quantity = quantity + NEW.quantity, updated_at = now() WHERE id = NEW.stock_item_id;
          ELSIF NEW.movement_type IN ('OUT', 'SALE') THEN
            UPDATE stock_items SET quantity = quantity + NEW.quantity, updated_at = now() WHERE id = NEW.stock_item_id;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'stock_item_id not found';
            END IF;
            IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
              RAISE EXCEPTION 'stock insuffisant';
            END IF;
          ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
            UPDATE stock_items SET quantity = NEW.quantity, updated_at = now() WHERE id = NEW.stock_item_id;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$;
    `);
    console.log('Fixed apply_stock_movement search_path');
  } catch (e) {
    console.log('Skip apply_stock_movement:', e.message);
  }

  console.log('Linter fixes applied');
  await sql.end();
}

fixLinter().catch((e) => { console.error(e); process.exit(1); });
