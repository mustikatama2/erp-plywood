-- ══════════════════════════════════════════════════════════════════════════════
--  Mustikatama ERP — PostgreSQL Schema
--  Works for BOTH: local on-prem PostgreSQL AND Supabase Cloud
--  All tables include: synced (for hybrid sync), soft-delete, audit timestamps
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for ILIKE search performance

-- ── Helper: standard audit columns ───────────────────────────────────────────
-- (applied to all tables below via template)

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','finance','sales','purchasing','warehouse','hr','viewer')),
  dept          TEXT,
  avatar        TEXT DEFAULT 'U',
  avatar_color  TEXT DEFAULT 'bg-gray-600',
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  synced        BOOLEAN DEFAULT FALSE
);

-- ── Chart of Accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id   UUID REFERENCES accounts(id),
  normal      TEXT CHECK (normal IN ('debit','credit')),
  is_header   BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Customers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  country       TEXT DEFAULT 'Indonesia',
  contact       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  payment_terms TEXT DEFAULT 'NET 30',
  currency      TEXT DEFAULT 'IDR',
  credit_limit  NUMERIC(18,2) DEFAULT 0,
  ar_balance    NUMERIC(18,2) DEFAULT 0,
  status        TEXT DEFAULT 'Active',
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  synced        BOOLEAN DEFAULT FALSE
);

-- ── Vendors ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT,
  contact       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  payment_terms TEXT DEFAULT 'NET 30',
  bank_name     TEXT,
  bank_account  TEXT,
  ap_balance    NUMERIC(18,2) DEFAULT 0,
  status        TEXT DEFAULT 'Active',
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  synced        BOOLEAN DEFAULT FALSE
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code        TEXT UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT,
  unit        TEXT DEFAULT 'sheets',
  spec        TEXT,
  price_idr   NUMERIC(18,2),
  price_usd   NUMERIC(10,4),
  stock_qty   NUMERIC(18,3) DEFAULT 0,
  reorder     NUMERIC(18,3) DEFAULT 0,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Bank Accounts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id  TEXT REFERENCES accounts(code),
  name        TEXT NOT NULL,
  bank        TEXT,
  account_no  TEXT,
  currency    TEXT DEFAULT 'IDR',
  balance     NUMERIC(18,2) DEFAULT 0,
  balance_idr NUMERIC(18,2),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Sales Orders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_orders (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  so_no          TEXT NOT NULL UNIQUE,
  customer_id    UUID REFERENCES customers(id),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date  DATE,
  status         TEXT DEFAULT 'Draft',
  currency       TEXT DEFAULT 'USD',
  incoterm       TEXT,
  payment_terms  TEXT,
  subtotal       NUMERIC(18,2) DEFAULT 0,
  tax_amount     NUMERIC(18,2) DEFAULT 0,
  total          NUMERIC(18,2) DEFAULT 0,
  total_idr      NUMERIC(18,2) DEFAULT 0,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  synced         BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS so_lines (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  so_id        UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  line_no      INT NOT NULL,
  product_id   UUID REFERENCES products(id),
  product_name TEXT,
  qty          NUMERIC(18,3) NOT NULL,
  unit         TEXT DEFAULT 'sheets',
  unit_price   NUMERIC(18,4) NOT NULL,
  total        NUMERIC(18,2) NOT NULL,
  delivered_qty NUMERIC(18,3) DEFAULT 0,
  synced       BOOLEAN DEFAULT FALSE
);

-- ── Purchase Orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_no         TEXT NOT NULL UNIQUE,
  vendor_id     UUID REFERENCES vendors(id),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status        TEXT DEFAULT 'Draft',
  total         NUMERIC(18,2) DEFAULT 0,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  synced        BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS po_lines (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_id        UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_no      INT NOT NULL,
  product_id   UUID REFERENCES products(id),
  product_name TEXT,
  qty          NUMERIC(18,3) NOT NULL,
  unit         TEXT,
  unit_price   NUMERIC(18,4),
  total        NUMERIC(18,2),
  received_qty NUMERIC(18,3) DEFAULT 0,
  synced       BOOLEAN DEFAULT FALSE
);

-- ── AR Invoices ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ar_invoices (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inv_no      TEXT NOT NULL UNIQUE,
  so_id       UUID REFERENCES sales_orders(id),
  customer_id UUID REFERENCES customers(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE,
  status      TEXT DEFAULT 'Unpaid',
  currency    TEXT DEFAULT 'IDR',
  subtotal    NUMERIC(18,2) DEFAULT 0,
  tax_amount  NUMERIC(18,2) DEFAULT 0,
  total       NUMERIC(18,2) DEFAULT 0,
  total_idr   NUMERIC(18,2) DEFAULT 0,
  paid        NUMERIC(18,2) DEFAULT 0,
  balance     NUMERIC(18,2) DEFAULT 0,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── AP Invoices ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ap_invoices (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inv_no      TEXT NOT NULL UNIQUE,
  po_id       UUID REFERENCES purchase_orders(id),
  vendor_id   UUID REFERENCES vendors(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE,
  status      TEXT DEFAULT 'Unpaid',
  description TEXT,
  total       NUMERIC(18,2) DEFAULT 0,
  paid        NUMERIC(18,2) DEFAULT 0,
  balance     NUMERIC(18,2) DEFAULT 0,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Journal Entries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_no    TEXT NOT NULL UNIQUE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  ref_type    TEXT,  -- 'SO','PO','AR','AP','PAYMENT','MANUAL'
  ref_id      UUID,
  status      TEXT DEFAULT 'Draft',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  synced      BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_id    UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id  TEXT NOT NULL REFERENCES accounts(code),
  description TEXT,
  debit       NUMERIC(18,2) DEFAULT 0,
  credit      NUMERIC(18,2) DEFAULT 0,
  partner_id  UUID,  -- customer or vendor
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Employees ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  emp_no      TEXT UNIQUE,
  name        TEXT NOT NULL,
  dept        TEXT,
  position    TEXT,
  hire_date   DATE,
  salary      NUMERIC(15,2) DEFAULT 0,
  status      TEXT DEFAULT 'Active',
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE
);

-- ── Fixed Assets ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_assets (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_no            TEXT UNIQUE,
  name                TEXT NOT NULL,
  category            TEXT,
  account_code        TEXT REFERENCES accounts(code),
  purchase_date       DATE,
  cost                NUMERIC(18,2) DEFAULT 0,
  salvage             NUMERIC(18,2) DEFAULT 0,
  life_years          INT,
  depreciation_method TEXT DEFAULT 'SL',
  book_value          NUMERIC(18,2) DEFAULT 0,
  accum_dep           NUMERIC(18,2) DEFAULT 0,
  status              TEXT DEFAULT 'Active',
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  synced              BOOLEAN DEFAULT FALSE
);

-- ── Indexes for performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_name   ON customers  USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_name     ON vendors    USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name    ON products   USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_so_customer      ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_so_status        ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_vendor        ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ar_customer      ON ar_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_ar_status        ON ar_invoices(status);
CREATE INDEX IF NOT EXISTS idx_ap_vendor        ON ap_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_synced_customers ON customers(synced) WHERE synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_synced_so        ON sales_orders(synced) WHERE synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_synced_ar        ON ar_invoices(synced) WHERE synced = FALSE;

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','customers','vendors','products','sales_orders',
    'purchase_orders','ar_invoices','ap_invoices','employees','fixed_assets','accounts','bank_accounts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;
