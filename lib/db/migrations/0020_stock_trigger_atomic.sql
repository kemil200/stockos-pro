-- Fix stock trigger: atomic read-check-write to prevent race condition
-- Uses RETURNING + RAISE instead of separate SELECT then RAISE

CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _new_qty numeric;
BEGIN
  CASE NEW.movement_type
    WHEN 'PURCHASE', 'RETURN', 'TRANSFER_IN', 'INITIAL', 'IN' THEN
      UPDATE stock_items
      SET quantity = quantity + NEW.quantity, updated_at = NOW()
      WHERE id = NEW.stock_item_id
      RETURNING quantity INTO _new_qty;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;

    WHEN 'SALE', 'TRANSFER_OUT', 'LOSS', 'OUT' THEN
      UPDATE stock_items
      SET quantity = quantity + NEW.quantity, updated_at = NOW()
      WHERE id = NEW.stock_item_id AND (quantity + NEW.quantity) >= 0
      RETURNING quantity INTO _new_qty;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock insuffisant ou stock item % not found', NEW.stock_item_id;
      END IF;

    WHEN 'ADJUSTMENT' THEN
      UPDATE stock_items
      SET quantity = NEW.quantity, updated_at = NOW()
      WHERE id = NEW.stock_item_id
      RETURNING quantity INTO _new_qty;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
  END CASE;
  RETURN NEW;
END;
$$;
