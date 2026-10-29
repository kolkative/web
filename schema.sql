CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'pending', 'paid', 'expired', 'failed')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total > 0),
  mayar_payment_id TEXT UNIQUE,
  mayar_transaction_id TEXT UNIQUE,
  payment_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_mayar_transaction ON orders(mayar_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
