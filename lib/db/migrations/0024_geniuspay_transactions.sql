CREATE TABLE IF NOT EXISTS geniuspay_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC(12,2) NOT NULL,
  fees NUMERIC(12,2),
  net_amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  gp_reference TEXT,
  gp_payment_method TEXT,
  payment_id UUID REFERENCES payments(id),
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE geniuspay_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geniuspay_tx_isolation" ON geniuspay_transactions
  FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE auth.uid()::text = user_id));
