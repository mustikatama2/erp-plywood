-- ══════════════════════════════════════════════════════════════════════════════
--  Seed data for fresh installation
--  Passwords hashed with bcrypt (rounds=10):
--    admin123, sari123, budi123, wahyu123, doni123, rini123, viewer123
-- ══════════════════════════════════════════════════════════════════════════════

-- Users
INSERT INTO users (username, password_hash, name, role, dept, avatar, avatar_color, is_active, synced) VALUES
  ('admin',  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmYNliG6oQHhbqMOsJ3lHtE1LQFW4i', 'Administrator',    'admin',     'Management', 'A', 'bg-red-600',    true, true),
  ('sari',   '$2b$10$8K8nZqT.9kR2QvDfRtqJceaRm8YVmqXXX5H5QJW3HGLzXoSU4sQoq', 'Sari Dewi',        'finance',   'Finance',    'S', 'bg-green-600',  true, true),
  ('budi',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'Budi Santoso',     'sales',     'Sales',      'B', 'bg-blue-600',   true, true),
  ('wahyu',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'Wahyu Prasetyo',   'purchasing','Purchasing', 'W', 'bg-purple-600', true, true),
  ('doni',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'Doni Kurniawan',   'warehouse', 'Warehouse',  'D', 'bg-teal-600',   true, true),
  ('rini',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'Rini Setiawati',   'hr',        'HR',         'R', 'bg-pink-600',   true, true),
  ('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'Read-Only User',   'viewer',    '—',          'V', 'bg-gray-600',   true, true)
ON CONFLICT (username) DO NOTHING;

-- Accounts (key ones)
INSERT INTO accounts (code, name, type, normal, is_header, synced) VALUES
  ('1000','Current Assets',         'asset',    NULL,    true,  true),
  ('1110','Bank BCA — IDR',         'asset',    'debit', false, true),
  ('1120','Bank Mandiri — IDR',     'asset',    'debit', false, true),
  ('1130','Bank BCA — USD',         'asset',    'debit', false, true),
  ('1200','Accounts Receivable',    'asset',    'debit', false, true),
  ('1300','Inventory - Raw Material','asset',   'debit', false, true),
  ('1320','Inventory - Finished Goods','asset', 'debit', false, true),
  ('1500','Fixed Assets',           'asset',    NULL,    true,  true),
  ('1520','Machinery & Equipment',  'asset',    'debit', false, true),
  ('2000','Current Liabilities',    'liability',NULL,    true,  true),
  ('2100','Accounts Payable',       'liability','credit',false, true),
  ('2300','Tax Payable - PPN',      'liability','credit',false, true),
  ('3000','Equity',                 'equity',   NULL,    true,  true),
  ('3100','Paid-in Capital',        'equity',   'credit',false, true),
  ('3200','Retained Earnings',      'equity',   'credit',false, true),
  ('4000','Revenue',                'revenue',  NULL,    true,  true),
  ('4100','Sales - Plywood Export', 'revenue',  'credit',false, true),
  ('4110','Sales - Domestic',       'revenue',  'credit',false, true),
  ('5000','Cost of Goods Sold',     'expense',  NULL,    true,  true),
  ('5100','Raw Material Cost',      'expense',  'debit', false, true),
  ('6000','Operating Expenses',     'expense',  NULL,    true,  true),
  ('6100','Salaries & Wages',       'expense',  'debit', false, true),
  ('6200','Freight & Logistics',    'expense',  'debit', false, true),
  ('6900','Interest Expense',       'expense',  'debit', false, true)
ON CONFLICT (code) DO NOTHING;

-- NOTE: Additional seed data (customers, products, etc.) is loaded
-- from the application's demo data on first run.
-- To load full demo data: docker compose exec api node db/seed-demo.js
