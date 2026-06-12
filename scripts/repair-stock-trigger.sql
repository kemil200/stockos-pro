-- =============================================
-- STOCK TRIGGER REPAIR — Complete fix
-- Run this in Supabase SQL Editor if needed
-- =============================================

-- 1. Drop old trigger and function (safe, with CASCADE)
DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements CASCADE;
DROP FUNCTION IF EXISTS apply_stock_movement CASCADE;

-- 2. Create the new function with ALL valid movement types
CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  CASE NEW.movement_type
    WHEN 'PURCHASE', 'RETURN', 'TRANSFER_IN', 'INITIAL' THEN
      UPDATE stock_items
      SET quantity = quantity + NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.stock_item_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;

    WHEN 'SALE', 'TRANSFER_OUT', 'LOSS' THEN
      UPDATE stock_items
      SET quantity = quantity + NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.stock_item_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;
      IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
        RAISE EXCEPTION 'Stock insuffisant';
      END IF;

    WHEN 'ADJUSTMENT' THEN
      UPDATE stock_items
      SET quantity = NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.stock_item_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;

    WHEN 'IN', 'OUT' THEN
      -- Legacy types from old code — map silently
      IF NEW.movement_type = 'IN' THEN
        UPDATE stock_items
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.stock_item_id;
      ELSE
        UPDATE stock_items
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.stock_item_id;
        IF (SELECT quantity FROM stock_items WHERE id = NEW.stock_item_id) < 0 THEN
          RAISE EXCEPTION 'Stock insuffisant';
        END IF;
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
  END CASE;

  RETURN NEW;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements;
CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION apply_stock_movement();

-- 4. Repair stock: recalculate all stock_items from stock_movements
-- Skips ADJUSTMENT movements (they use absolute values — adjust manually if needed)
UPDATE stock_items si
SET quantity = COALESCE(sub.computed, 0),
    updated_at = NOW()
FROM (
  SELECT
    stock_item_id,
    SUM(CASE WHEN movement_type <> 'ADJUSTMENT' THEN quantity ELSE 0 END) AS computed
  FROM stock_movements
  GROUP BY stock_item_id
) sub
WHERE si.id = sub.stock_item_id;

-- 5. Reset stock_items with NO movements to 0
UPDATE stock_items
SET quantity = 0
WHERE id NOT IN (SELECT DISTINCT stock_item_id FROM stock_movements);
