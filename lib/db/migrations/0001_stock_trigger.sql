CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  CASE NEW.movement_type
    WHEN 'IN' THEN
      UPDATE stock_items
      SET quantity = quantity + NEW.quantity,
          updated_at = NOW()
      WHERE id = NEW.stock_item_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock item % not found', NEW.stock_item_id;
      END IF;
    WHEN 'OUT', 'SALE' THEN
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
--> statement-breakpoint
CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION apply_stock_movement();
