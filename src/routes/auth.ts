// Authentication routes
import { Hono } from 'hono';
import type { Bindings, User, ApiResponse, LoginRequest, RegisterRequest, JWTPayload } from '../types';
import { hashPassword, verifyPassword, generateToken, isValidEmail, isValidIsraeliPhone, sanitizeInput, logAudit } from '../lib/utils';

const auth = new Hono<{ Bindings: Bindings }>();

// Register new user
auth.post('/register', async (c) => {
  try {
    const body: RegisterRequest = await c.req.json();
    const { email, password, first_name, last_name, phone } = body;

    // Validation
    if (!email || !password || !first_name || !last_name || !phone) {
      return c.json<ApiResponse>({ success: false, error: 'כל השדות הם חובה' }, 400);
    }

    if (!isValidEmail(email)) {
      return c.json<ApiResponse>({ success: false, error: 'אימייל לא תקין' }, 400);
    }

    if (password.length < 6) {
      return c.json<ApiResponse>({ success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }, 400);
    }

    if (!isValidIsraeliPhone(phone)) {
      return c.json<ApiResponse>({ success: false, error: 'מספר טלפון לא תקין' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      return c.json<ApiResponse>({ success: false, error: 'המייל כבר רשום במערכת' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await c.env.DB
      .prepare(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?) RETURNING id, email, first_name, last_name, phone'
      )
      .bind(
        email.toLowerCase(),
        passwordHash,
        sanitizeInput(first_name),
        sanitizeInput(last_name),
        phone
      )
      .first<User>();

    if (!result) {
      return c.json<ApiResponse>({ success: false, error: 'שגיאה ביצירת משתמש' }, 500);
    }

    // Log audit
    await logAudit(c.env.DB, result.id, 'register', 'user', result.id, { email }, c.req.header('cf-connecting-ip'), c.req.header('user-agent'));

    // Generate token
    const payload: JWTPayload = {
      userId: result.id,
      email: result.email,
      isAdmin: false,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    const token = await generateToken(payload);

    return c.json<ApiResponse>({
      success: true,
      data: {
        token,
        user: {
          id: result.id,
          email: result.email,
          first_name: result.first_name,
          last_name: result.last_name,
          phone: result.phone
        }
      },
      message: 'נרשמת בהצלחה!'
    });

  } catch (error) {
    console.error('Register error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json<ApiResponse>({ success: false, error: 'אנא מלא את כל השדות' }, 400);
    }

    // Get user
    const user = await c.env.DB
      .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
      .bind(email.toLowerCase())
      .first<User>();

    if (!user || !user.password_hash) {
      return c.json<ApiResponse>({ success: false, error: 'אימייל או סיסמה שגויים' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json<ApiResponse>({ success: false, error: 'אימייל או סיסמה שגויים' }, 401);
    }

    // Update last login
    await c.env.DB
      .prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();

    // Log audit
    await logAudit(c.env.DB, user.id, 'login', 'user', user.id, { email }, c.req.header('cf-connecting-ip'), c.req.header('user-agent'));

    // Generate token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    const token = await generateToken(payload);

    // Check membership status
    const membership = await c.env.DB
      .prepare('SELECT status, end_date FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(user.id)
      .first();

    return c.json<ApiResponse>({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin === 1
        },
        membership: membership || null
      },
      message: 'התחברת בהצלחה!'
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get current user profile
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json<ApiResponse>({ success: false, error: 'אנא התחבר למערכת' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await import('../lib/utils').then(m => m.verifyToken(token));

    if (!payload) {
      return c.json<ApiResponse>({ success: false, error: 'טוקן לא תקין' }, 401);
    }

    const user = await c.env.DB
      .prepare('SELECT id, email, first_name, last_name, phone, phone_verified, is_admin, created_at FROM users WHERE id = ?')
      .bind(payload.userId)
      .first<User>();

    if (!user) {
      return c.json<ApiResponse>({ success: false, error: 'משתמש לא נמצא' }, 404);
    }

    // Get membership
    const membership = await c.env.DB
      .prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(user.id)
      .first();

    // Get addresses
    const addresses = await c.env.DB
      .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC')
      .bind(user.id)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: {
        user,
        membership: membership || null,
        addresses: addresses.results || []
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

export default auth;
