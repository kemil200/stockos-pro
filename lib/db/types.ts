export interface Shop {
  id: string;
  name: string;
  user_id: string;
  currency: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  shop_id: string;
  invoice_number: string;
  client_name: string;
  client_phone: string | null;
  status: 'DRAFT' | 'VALIDATED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  currency: string;
  subtotal: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  validated_at: string | null;
  paid_at: string | null;
  created_by: string;
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
  discount_rate: string;
  discount_amount: string;
  line_total: string;
  sort_order: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  unit_price: string;
  purchase_price: string;
  unit_type: string;
  category: string | null;
  is_active: boolean;
}

export interface StockItem {
  id: string;
  shop_id: string;
  product_id: string;
  quantity: string;
  min_threshold: string;
  location: string | null;
}

export interface StockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  stock_item_id: string;
  movement_type: 'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT';
  quantity: string;
  unit_price: string | null;
  reference_id: string | null;
  reference_type: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  shop_id: string;
  invoice_id: string;
  amount: string;
  method: string;
  reference: string | null;
  notes: string | null;
  payment_date: string;
  received_by: string;
  created_at: string;
}

export interface CashMovement {
  id: string;
  shop_id: string;
  movement_type: string;
  amount: string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
}
