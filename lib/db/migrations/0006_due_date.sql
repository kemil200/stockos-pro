-- Migration 0006: due_date + cancel_reason
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancel_reason text;
