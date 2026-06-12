DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements;
--> statement-breakpoint
DROP FUNCTION IF EXISTS apply_stock_movement;
--> statement-breakpoint
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
    ELSE
      RAISE EXCEPTION 'Unknown movement type: %', NEW.movement_type;
  END CASE;

  RETURN NEW;
END;
$$;
