// Utility library for CH Vendors Sales

// Simple password hashing (for demo - in production use bcrypt with Web Crypto API)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Simple JWT-like token generation (for demo)
export async function generateToken(payload: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = await hashPassword(`${header}.${body}.secret`);
  return `${header}.${body}.${signature.substring(0, 43)}`;
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Format currency (agorot to ILS)
export function formatPrice(agorot: number): string {
  const ils = agorot / 100;
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(ils);
}

// Calculate time remaining
export function getTimeRemaining(endDate: string): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = Date.parse(endDate) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

// Validate email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Israeli phone
export function isValidIsraeliPhone(phone: string): boolean {
  const re = /^05\d{8}$/;
  return re.test(phone.replace(/[-\s]/g, ''));
}

// Generate verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Check if user has active membership
export async function hasActiveMembership(db: D1Database, userId: number): Promise<boolean> {
  const result = await db
    .prepare('SELECT id FROM memberships WHERE user_id = ? AND status = ? AND end_date > datetime("now")')
    .bind(userId, 'active')
    .first();
  
  return !!result;
}

// Log audit event
export async function logAudit(
  db: D1Database,
  userId: number | null,
  action: string,
  resourceType: string,
  resourceId: number | null,
  details: any,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress ?? null, userAgent ?? null)
    .run();
}

// Log email
export async function logEmail(
  db: D1Database,
  userId: number | null,
  recipientEmail: string,
  emailType: string,
  subject: string,
  status: string = 'pending'
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO email_logs (user_id, recipient_email, email_type, subject, status) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(userId, recipientEmail, emailType, subject, status)
    .run();
}

// Generate receipt number
export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CHV-${timestamp}-${random}`.toUpperCase();
}

// Calculate discount percentage
export function calculateDiscountPercentage(originalPrice: number, campaignPrice: number): number {
  return Math.round(((originalPrice - campaignPrice) / originalPrice) * 100);
}

// Check if campaign is closing soon (less than 24 hours)
export function isClosingSoon(endDate: string): boolean {
  const remaining = getTimeRemaining(endDate);
  return remaining.total > 0 && remaining.total < 24 * 60 * 60 * 1000;
}

// Get campaign status
export function getCampaignStatus(startDate: string, endDate: string): 'scheduled' | 'active' | 'closed' {
  const now = Date.now();
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  
  if (now < start) return 'scheduled';
  if (now > end) return 'closed';
  return 'active';
}
