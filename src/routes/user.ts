// User routes (dashboard, profile, campaigns)
import { Hono } from 'hono';
import type { Bindings, ApiResponse } from '../types';
import { authMiddleware, membershipMiddleware } from '../middleware/auth';
import { logAudit, sanitizeInput } from '../lib/utils';

const user = new Hono<{ Bindings: Bindings }>();

// All user routes require authentication
user.use('/*', authMiddleware);

// Get user dashboard data
user.get('/dashboard', async (c) => {
  try {
    const currentUser = c.get('user');

    // Get user info
    const userInfo = await c.env.DB
      .prepare('SELECT id, email, first_name, last_name, phone, phone_verified, created_at FROM users WHERE id = ?')
      .bind(currentUser.userId)
      .first();

    // Get membership
    const membership = await c.env.DB
      .prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(currentUser.userId)
      .first();

    // Get participated campaigns
    const campaigns = await c.env.DB
      .prepare(`
        SELECT 
          cp.*,
          p.title as product_title,
          p.image_url as product_image,
          p.campaign_price,
          cw.end_date as campaign_end_date,
          cw.status as campaign_status,
          a.street, a.city
        FROM campaign_participants cp
        INNER JOIN products p ON cp.product_id = p.id
        INNER JOIN campaign_windows cw ON cp.campaign_id = cw.id
        LEFT JOIN addresses a ON cp.shipping_address_id = a.id
        WHERE cp.user_id = ?
        ORDER BY cp.joined_at DESC
        LIMIT 10
      `)
      .bind(currentUser.userId)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: {
        user: userInfo,
        membership,
        campaigns: campaigns.results
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Update profile
user.put('/profile', async (c) => {
  try {
    const currentUser = c.get('user');
    const { first_name, last_name, phone } = await c.req.json();

    if (!first_name || !last_name) {
      return c.json<ApiResponse>({ success: false, error: 'שם פרטי ושם משפחה הם חובה' }, 400);
    }

    await c.env.DB
      .prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(sanitizeInput(first_name), sanitizeInput(last_name), phone, currentUser.userId)
      .run();

    await logAudit(c.env.DB, currentUser.userId, 'update_profile', 'user', currentUser.userId, { first_name, last_name, phone });

    return c.json<ApiResponse>({
      success: true,
      message: 'הפרופיל עודכן בהצלחה'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get addresses
user.get('/addresses', async (c) => {
  try {
    const currentUser = c.get('user');

    const result = await c.env.DB
      .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC')
      .bind(currentUser.userId)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get addresses error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Add address
user.post('/addresses', async (c) => {
  try {
    const currentUser = c.get('user');
    const { full_name, street, city, postal_code, phone, is_default } = await c.req.json();

    if (!street || !city) {
      return c.json<ApiResponse>({ success: false, error: 'רחוב ועיר הם חובה' }, 400);
    }

    // If this is default, unset other defaults
    if (is_default) {
      await c.env.DB
        .prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?')
        .bind(currentUser.userId)
        .run();
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO addresses (user_id, address_type, full_name, street, city, postal_code, phone, is_default)
        VALUES (?, 'shipping', ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(currentUser.userId, full_name, street, city, postal_code, phone, is_default ? 1 : 0)
      .first();

    await logAudit(c.env.DB, currentUser.userId, 'add_address', 'address', result?.id as number, { street, city });

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: 'כתובת נוספה בהצלחה'
    });

  } catch (error) {
    console.error('Add address error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Join campaign (requires active membership)
user.post('/campaigns/join', membershipMiddleware, async (c) => {
  try {
    const currentUser = c.get('user');
    const { 
      campaign_id, 
      product_id, 
      quantity = 1, 
      variant_id, 
      address_id,
      terms_accepted,
      cancellation_accepted
    } = await c.req.json();

    // Validation
    if (!campaign_id || !product_id || !address_id) {
      return c.json<ApiResponse>({ success: false, error: 'נתונים חסרים' }, 400);
    }

    if (!terms_accepted || !cancellation_accepted) {
      return c.json<ApiResponse>({ success: false, error: 'יש לאשר את התנאים ומדיניות הביטול' }, 400);
    }

    // Check if campaign is active
    const campaign = await c.env.DB
      .prepare('SELECT * FROM campaign_windows WHERE id = ? AND status = ? AND end_date > datetime("now")')
      .bind(campaign_id, 'active')
      .first();

    if (!campaign) {
      return c.json<ApiResponse>({ success: false, error: 'הקמפיין אינו פעיל' }, 400);
    }

    // Check if already joined
    const existing = await c.env.DB
      .prepare('SELECT id FROM campaign_participants WHERE campaign_id = ? AND user_id = ?')
      .bind(campaign_id, currentUser.userId)
      .first();

    if (existing) {
      return c.json<ApiResponse>({ success: false, error: 'כבר הצטרפת לקמפיין זה' }, 400);
    }

    // Get product price
    const product = await c.env.DB
      .prepare('SELECT campaign_price, fixed_shipping_cost FROM products WHERE id = ?')
      .bind(product_id)
      .first<any>();

    if (!product) {
      return c.json<ApiResponse>({ success: false, error: 'מוצר לא נמצא' }, 404);
    }

    const total_amount = (product.campaign_price * quantity) + product.fixed_shipping_cost;

    // Insert participant
    const participant = await c.env.DB
      .prepare(`
        INSERT INTO campaign_participants 
        (campaign_id, user_id, product_id, quantity, selected_variant_id, shipping_address_id, total_amount, status, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
        RETURNING *
      `)
      .bind(campaign_id, currentUser.userId, product_id, quantity, variant_id, address_id, total_amount)
      .first();

    // Record consent
    const ip = c.req.header('cf-connecting-ip');
    const userAgent = c.req.header('user-agent');

    await c.env.DB
      .prepare(`
        INSERT INTO purchase_consents 
        (participant_id, user_id, campaign_id, terms_accepted, cancellation_policy_accepted, charge_authorization, ip_address, user_agent)
        VALUES (?, ?, ?, 1, 1, 1, ?, ?)
      `)
      .bind(participant?.id, currentUser.userId, campaign_id, ip, userAgent)
      .run();

    await logAudit(c.env.DB, currentUser.userId, 'join_campaign', 'campaign_participant', participant?.id as number, { campaign_id, product_id, quantity, total_amount }, ip, userAgent);

    return c.json<ApiResponse>({
      success: true,
      data: participant,
      message: 'הצטרפת לקמפיין בהצלחה!'
    });

  } catch (error) {
    console.error('Join campaign error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get my campaigns
user.get('/campaigns/my', async (c) => {
  try {
    const currentUser = c.get('user');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          cp.*,
          p.title as product_title,
          p.image_url as product_image,
          p.description as product_description,
          cw.end_date as campaign_end_date,
          cw.status as campaign_status,
          a.street, a.city, a.postal_code
        FROM campaign_participants cp
        INNER JOIN products p ON cp.product_id = p.id
        INNER JOIN campaign_windows cw ON cp.campaign_id = cw.id
        LEFT JOIN addresses a ON cp.shipping_address_id = a.id
        WHERE cp.user_id = ?
        ORDER BY cp.joined_at DESC
      `)
      .bind(currentUser.userId)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get my campaigns error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

export default user;
