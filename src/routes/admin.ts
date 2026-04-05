// Admin routes
import { Hono } from 'hono';
import type { Bindings, ApiResponse } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { sanitizeInput, logAudit, logEmail } from '../lib/utils';

const admin = new Hono<{ Bindings: Bindings }>();

// All admin routes require authentication and admin privileges
admin.use('/*', authMiddleware, adminMiddleware);

// ============================================
// DASHBOARD & STATS
// ============================================

admin.get('/dashboard', async (c) => {
  try {
    // Get stats
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<any>();
    const activeMembers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM memberships WHERE status = ?').bind('active').first<any>();
    const activeCampaigns = await c.env.DB.prepare('SELECT COUNT(*) as count FROM campaign_windows WHERE status = ?').bind('active').first<any>();
    const totalRevenue = await c.env.DB.prepare('SELECT SUM(amount) as total FROM membership_payments WHERE status = ?').bind('completed').first<any>();

    // Recent campaigns
    const recentCampaigns = await c.env.DB
      .prepare(`
        SELECT 
          cw.*,
          p.title as product_title,
          p.image_url,
          COUNT(cp.id) as participants_count,
          SUM(cp.total_amount) as total_revenue
        FROM campaign_windows cw
        INNER JOIN products p ON cw.product_id = p.id
        LEFT JOIN campaign_participants cp ON cw.id = cp.campaign_id
        WHERE cw.status = 'active'
        GROUP BY cw.id
        ORDER BY cw.created_at DESC
        LIMIT 5
      `)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers?.count || 0,
          activeMembers: activeMembers?.count || 0,
          activeCampaigns: activeCampaigns?.count || 0,
          totalRevenue: totalRevenue?.total || 0
        },
        recentCampaigns: recentCampaigns.results
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// ============================================
// PRODUCTS MANAGEMENT
// ============================================

// Get all products
admin.get('/products', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get products error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Create product
admin.post('/products', async (c) => {
  try {
    const currentUser = c.get('user');
    const {
      category_id,
      title,
      description,
      long_description,
      original_price,
      campaign_price,
      fixed_shipping_cost = 0,
      image_url,
      is_featured = 0
    } = await c.req.json();

    if (!title || !original_price || !campaign_price) {
      return c.json<ApiResponse>({ success: false, error: 'נתונים חסרים' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO products 
        (category_id, title, description, long_description, original_price, campaign_price, fixed_shipping_cost, image_url, is_featured, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        category_id ?? null,
        sanitizeInput(title),
        sanitizeInput(description || ''),
        sanitizeInput(long_description || ''),
        original_price,
        campaign_price,
        fixed_shipping_cost,
        image_url ?? null,
        is_featured ? 1 : 0,
        currentUser.userId
      )
      .first();

    await logAudit(c.env.DB, currentUser.userId, 'create_product', 'product', result?.id as number, { title });

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: 'מוצר נוסף בהצלחה'
    });

  } catch (error) {
    console.error('Create product error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Update product
admin.put('/products/:id', async (c) => {
  try {
    const currentUser = c.get('user');
    const productId = c.req.param('id');
    const {
      category_id,
      title,
      description,
      long_description,
      original_price,
      campaign_price,
      fixed_shipping_cost,
      image_url,
      is_featured,
      is_active
    } = await c.req.json();

    await c.env.DB
      .prepare(`
        UPDATE products 
        SET category_id = ?, title = ?, description = ?, long_description = ?, 
            original_price = ?, campaign_price = ?, fixed_shipping_cost = ?, 
            image_url = ?, is_featured = ?, is_active = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(
        category_id ?? null,
        sanitizeInput(title || ''),
        sanitizeInput(description || ''),
        sanitizeInput(long_description || ''),
        original_price,
        campaign_price,
        fixed_shipping_cost ?? 0,
        image_url ?? null,
        is_featured ? 1 : 0,
        is_active ?? 1,
        productId
      )
      .run();

    await logAudit(c.env.DB, currentUser.userId, 'update_product', 'product', parseInt(productId), { title });

    return c.json<ApiResponse>({
      success: true,
      message: 'מוצר עודכן בהצלחה'
    });

  } catch (error) {
    console.error('Update product error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Delete product
admin.delete('/products/:id', async (c) => {
  try {
    const currentUser = c.get('user');
    const productId = c.req.param('id');

    // Check if product has active campaigns
    const activeCampaign = await c.env.DB
      .prepare('SELECT id FROM campaign_windows WHERE product_id = ? AND status = ?')
      .bind(productId, 'active')
      .first();

    if (activeCampaign) {
      return c.json<ApiResponse>({ success: false, error: 'לא ניתן למחוק מוצר עם קמפיין פעיל' }, 400);
    }

    await c.env.DB
      .prepare('DELETE FROM products WHERE id = ?')
      .bind(productId)
      .run();

    await logAudit(c.env.DB, currentUser.userId, 'delete_product', 'product', parseInt(productId), {});

    return c.json<ApiResponse>({
      success: true,
      message: 'מוצר נמחק בהצלחה'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// ============================================
// CAMPAIGNS MANAGEMENT
// ============================================

// Get all campaigns
admin.get('/campaigns', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          cw.*,
          p.title as product_title,
          p.image_url,
          COUNT(cp.id) as participants_count
        FROM campaign_windows cw
        INNER JOIN products p ON cw.product_id = p.id
        LEFT JOIN campaign_participants cp ON cw.id = cp.campaign_id
        GROUP BY cw.id
        ORDER BY cw.created_at DESC
      `)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Create campaign
admin.post('/campaigns', async (c) => {
  try {
    const currentUser = c.get('user');
    const {
      product_id,
      start_date,
      end_date,
      min_buyers = 1,
      max_buyers
    } = await c.req.json();

    if (!product_id || !start_date || !end_date) {
      return c.json<ApiResponse>({ success: false, error: 'נתונים חסרים' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO campaign_windows 
        (product_id, start_date, end_date, status, min_buyers, max_buyers)
        VALUES (?, ?, ?, 'scheduled', ?, ?)
        RETURNING *
      `)
      .bind(product_id, start_date, end_date, min_buyers, max_buyers || null)
      .first();

    await logAudit(c.env.DB, currentUser.userId, 'create_campaign', 'campaign', result?.id as number, { product_id });

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: 'קמפיין נוצר בהצלחה'
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Close campaign
admin.post('/campaigns/:id/close', async (c) => {
  try {
    const currentUser = c.get('user');
    const campaignId = c.req.param('id');

    // Get campaign details with participants
    const campaign = await c.env.DB
      .prepare(`
        SELECT 
          cw.*,
          p.title as product_title
        FROM campaign_windows cw
        INNER JOIN products p ON cw.product_id = p.id
        WHERE cw.id = ?
      `)
      .bind(campaignId)
      .first<any>();

    if (!campaign) {
      return c.json<ApiResponse>({ success: false, error: 'קמפיין לא נמצא' }, 404);
    }

    // Get all participants
    const participants = await c.env.DB
      .prepare(`
        SELECT 
          cp.*,
          u.first_name, u.last_name, u.email, u.phone,
          a.street, a.city, a.postal_code, a.phone as address_phone,
          pv.variant_value
        FROM campaign_participants cp
        INNER JOIN users u ON cp.user_id = u.id
        LEFT JOIN addresses a ON cp.shipping_address_id = a.id
        LEFT JOIN product_variants pv ON cp.selected_variant_id = pv.id
        WHERE cp.campaign_id = ?
      `)
      .bind(campaignId)
      .all();

    // Update campaign status
    await c.env.DB
      .prepare('UPDATE campaign_windows SET status = ?, closed_at = datetime("now"), closed_by = ?, admin_notified = 1 WHERE id = ?')
      .bind('closed', currentUser.userId, campaignId)
      .run();

    // Log email to admin
    await logEmail(
      c.env.DB, 
      null, 
      'admin@chvendors.com', 
      'campaign_closed', 
      `קמפיין נסגר: ${campaign.product_title} - ${participants.results.length} משתתפים`
    );

    await logAudit(c.env.DB, currentUser.userId, 'close_campaign', 'campaign', parseInt(campaignId), {
      participants_count: participants.results.length
    });

    return c.json<ApiResponse>({
      success: true,
      data: {
        campaign,
        participants: participants.results
      },
      message: 'קמפיין נסגר בהצלחה'
    });

  } catch (error) {
    console.error('Close campaign error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// ============================================
// USERS MANAGEMENT
// ============================================

admin.get('/users', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, u.phone_verified,
          u.is_active, u.is_admin, u.created_at, u.last_login,
          m.status as membership_status,
          m.end_date as membership_end_date
        FROM users u
        LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
        ORDER BY u.created_at DESC
      `)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get users error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// ============================================
// CATEGORIES MANAGEMENT
// ============================================

admin.post('/categories', async (c) => {
  try {
    const currentUser = c.get('user');
    const { name, name_en, slug, description, parent_id, sort_order = 0 } = await c.req.json();

    if (!name || !slug) {
      return c.json<ApiResponse>({ success: false, error: 'שם וסלאג הם חובה' }, 400);
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO categories (name, name_en, slug, description, parent_id, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(sanitizeInput(name), name_en ?? null, slug, description ?? null, parent_id ?? null, sort_order)
      .first();

    await logAudit(c.env.DB, currentUser.userId, 'create_category', 'category', result?.id as number, { name });

    return c.json<ApiResponse>({
      success: true,
      data: result,
      message: 'קטגוריה נוספה בהצלחה'
    });

  } catch (error) {
    console.error('Create category error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

export default admin;
