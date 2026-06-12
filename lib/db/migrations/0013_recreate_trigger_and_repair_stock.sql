-- Recreate trigger (migration 0012 dropped it without recreating)
DROP TRIGGER IF EXISTS trg_apply_stock_movement ON stock_movements;
--> statement-breakpoint
CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION apply_stock_movement();
--> statement-breakpoint
-- Repair stock: sum all non-adjustment movements per stock_item
-- Adjustments are skipped (they use absolute quantity — use the stock adjust button if needed)
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
