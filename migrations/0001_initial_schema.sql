-- CH Vendors Sales - Complete Database Schema
-- Premium group-buy marketplace with membership system

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Main users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified INTEGER DEFAULT 0,
  password_hash TEXT, -- NULL for OAuth users
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login TEXT,
  is_active INTEGER DEFAULT 1,
  is_admin INTEGER DEFAULT 0
);

-- OAuth providers (Google, Apple)
CREATE TABLE IF NOT EXISTS auth_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'apple', 'email'
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- Phone verification codes
CREATE TABLE IF NOT EXISTS phone_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions for JWT alternative
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- MEMBERSHIP SYSTEM
-- ============================================

-- User memberships (99 ILS/month)
CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'expired', 'cancelled'
  start_date TEXT,
  end_date TEXT,
  monthly_fee INTEGER DEFAULT 99, -- in ILS cents (9900 = 99 ILS)
  payment_method_id INTEGER,
  auto_renew INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- Membership payment history
CREATE TABLE IF NOT EXISTS membership_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'ILS',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_intent_id TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (membership_id) REFERENCES memberships(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- ADDRESSES
-- ============================================

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  address_type TEXT DEFAULT 'shipping', -- 'billing', 'shipping'
  full_name TEXT,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'IL',
  phone TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- CATEGORIES & PRODUCTS
-- ============================================

-- Product categories (scalable structure)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT, -- for future use
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  original_price INTEGER NOT NULL, -- in agorot (cents)
  campaign_price INTEGER NOT NULL,
  fixed_shipping_cost INTEGER DEFAULT 0,
  image_url TEXT,
  images TEXT, -- JSON array of image URLs
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Product variants (optional: size, color, model)
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  variant_type TEXT NOT NULL, -- 'size', 'color', 'model'
  variant_value TEXT NOT NULL,
  price_adjustment INTEGER DEFAULT 0, -- additional cost
  is_available INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- CAMPAIGN WINDOWS
-- ============================================

-- Campaign windows (limited-time offers)
CREATE TABLE IF NOT EXISTS campaign_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'closed', 'cancelled'
  min_buyers INTEGER DEFAULT 1, -- not displayed, just for internal logic
  max_buyers INTEGER, -- optional cap
  closed_at TEXT,
  closed_by INTEGER,
  admin_notified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (closed_by) REFERENCES users(id)
);

-- ============================================
-- PURCHASES & PARTICIPANTS
-- ============================================

-- Campaign participants (users who joined)
CREATE TABLE IF NOT EXISTS campaign_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  selected_variant_id INTEGER,
  shipping_address_id INTEGER NOT NULL,
  total_amount INTEGER NOT NULL, -- campaign_price * quantity + shipping
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'cancelled'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'authorized', 'charged', 'failed', 'refunded'
  payment_method_id INTEGER,
  payment_intent_id TEXT,
  joined_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaign_windows(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (selected_variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  UNIQUE(campaign_id, user_id) -- one participation per user per campaign
);

-- ============================================
-- PAYMENT ABSTRACTION LAYER
-- ============================================

-- Payment methods (future Israeli gateway integration)
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  payment_type TEXT NOT NULL, -- 'credit_card', 'bank_transfer', 'digital_wallet'
  provider TEXT, -- 'stripe', 'tranzila', 'cardcom', 'paypal', etc.
  provider_payment_method_id TEXT,
  last_four TEXT,
  card_brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment intents (authorization before charge)
CREATE TABLE IF NOT EXISTS payment_intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  participant_id INTEGER,
  membership_payment_id INTEGER,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'ILS',
  status TEXT NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'cancelled'
  provider TEXT,
  provider_intent_id TEXT,
  payment_method_id INTEGER,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (participant_id) REFERENCES campaign_participants(id),
  FOREIGN KEY (membership_payment_id) REFERENCES membership_payments(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- Receipts (email receipts after successful charge)
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  payment_intent_id INTEGER,
  receipt_number TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'ILS',
  receipt_type TEXT NOT NULL, -- 'product_purchase', 'membership_fee'
  description TEXT,
  issued_at TEXT DEFAULT (datetime('now')),
  email_sent INTEGER DEFAULT 0,
  email_sent_at TEXT,
  pdf_url TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (payment_intent_id) REFERENCES payment_intents(id)
);

-- ============================================
-- LEGAL & COMPLIANCE
-- ============================================

-- Legal consent records (GDPR-style)
CREATE TABLE IF NOT EXISTS legal_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consent_type TEXT NOT NULL, -- 'terms_of_use', 'privacy_policy', 'cancellation_policy', 'purchase_commitment', 'membership_terms'
  version TEXT NOT NULL, -- version of terms accepted
  consented INTEGER DEFAULT 1,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Purchase commitment consents (cancellation fee acknowledgment)
CREATE TABLE IF NOT EXISTS purchase_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  terms_accepted INTEGER NOT NULL DEFAULT 0,
  cancellation_policy_accepted INTEGER NOT NULL DEFAULT 0,
  charge_authorization INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (participant_id) REFERENCES campaign_participants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaign_windows(id)
);

-- ============================================
-- AUDIT & LOGGING
-- ============================================

-- Audit logs (security and compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'payment', etc.
  resource_type TEXT, -- 'user', 'product', 'campaign', 'payment', etc.
  resource_id INTEGER,
  details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email notification logs
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'welcome', 'verification', 'receipt', 'campaign_closed', 'membership_reminder', etc.
  subject TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SMS logs (for phone verification)
CREATE TABLE IF NOT EXISTS sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  phone TEXT NOT NULL,
  message TEXT,
  sms_type TEXT NOT NULL, -- 'verification', 'notification', 'alert'
  status TEXT DEFAULT 'pending',
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

CREATE INDEX IF NOT EXISTS idx_auth_providers_user ON auth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_providers_provider ON auth_providers(provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_product ON campaign_windows(product_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaign_windows(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaign_windows(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_participants_campaign ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON campaign_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON campaign_participants(status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_participant ON payment_intents(participant_id);

CREATE INDEX IF NOT EXISTS idx_legal_consents_user ON legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_consents_participant ON purchase_consents(participant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
