// Type definitions for CH Vendors Sales

export type Bindings = {
  DB: D1Database;
}

// User types
export interface User {
  id: number;
  email: string;
  phone?: string;
  phone_verified: number;
  password_hash?: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: number;
  is_admin: number;
}

// Membership types
export interface Membership {
  id: number;
  user_id: number;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  start_date?: string;
  end_date?: string;
  monthly_fee: number;
  payment_method_id?: number;
  auto_renew: number;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: number;
  category_id?: number;
  title: string;
  description?: string;
  long_description?: string;
  original_price: number;
  campaign_price: number;
  fixed_shipping_cost: number;
  image_url?: string;
  images?: string;
  is_featured: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: number;
  created_at: string;
}

// Campaign types
export interface CampaignWindow {
  id: number;
  product_id: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'active' | 'closed' | 'cancelled';
  min_buyers: number;
  max_buyers?: number;
  closed_at?: string;
  closed_by?: number;
  admin_notified: number;
  created_at: string;
}

// Product with campaign info
export interface ProductWithCampaign extends Product {
  campaign?: CampaignWindow;
  category_name?: string;
  time_remaining?: number;
  variants?: ProductVariant[];
}

// Product variant
export interface ProductVariant {
  id: number;
  product_id: number;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  is_available: number;
  sort_order: number;
}

// Campaign participant
export interface CampaignParticipant {
  id: number;
  campaign_id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  selected_variant_id?: number;
  shipping_address_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  payment_status: 'pending' | 'authorized' | 'charged' | 'failed' | 'refunded';
  payment_method_id?: number;
  payment_intent_id?: string;
  joined_at: string;
  updated_at: string;
}

// Address
export interface Address {
  id: number;
  user_id: number;
  address_type: 'billing' | 'shipping';
  full_name?: string;
  street: string;
  city: string;
  postal_code?: string;
  country: string;
  phone?: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

// Session/Auth
export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Login/Register
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

// Payment method
export interface PaymentMethod {
  id: number;
  user_id: number;
  payment_type: string;
  provider?: string;
  provider_payment_method_id?: string;
  last_four?: string;
  card_brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Legal consent
export interface LegalConsent {
  id: number;
  user_id: number;
  consent_type: string;
  version: string;
  consented: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
