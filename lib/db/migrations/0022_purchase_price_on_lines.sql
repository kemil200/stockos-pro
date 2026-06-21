ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);
