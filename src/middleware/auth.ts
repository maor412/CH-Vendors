// Authentication middleware for Hono
import { Context, Next } from 'hono';
import { verifyToken } from '../lib/utils';
import type { Bindings, JWTPayload } from '../types';

// Extend Context with user
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'אנא התחבר למערכת' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ success: false, error: 'טוקן לא תקין או פג תוקפו' }, 401);
  }

  // Verify user exists and is active
  const user = await c.env.DB
    .prepare('SELECT id, email, is_admin, is_active FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!user || !user.is_active) {
    return c.json({ success: false, error: 'משתמש לא פעיל' }, 401);
  }

  c.set('user', payload);
  await next();
}

export async function adminMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user');
  
  if (!user || !user.isAdmin) {
    return c.json({ success: false, error: 'נדרשות הרשאות מנהל' }, 403);
  }

  await next();
}

export async function membershipMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ success: false, error: 'נדרש אימות' }, 401);
  }

  // Check if user has active membership
  const membership = await c.env.DB
    .prepare('SELECT id, status, end_date FROM memberships WHERE user_id = ? AND status = ? AND end_date > datetime("now")')
    .bind(user.userId, 'active')
    .first();

  if (!membership) {
    return c.json({ 
      success: false, 
      error: 'נדרשת מנוי פעיל',
      requiresMembership: true 
    }, 403);
  }

  await next();
}
