// Products routes
import { Hono } from 'hono';
import type { Bindings, ProductWithCampaign, ApiResponse } from '../types';
import { formatPrice, getTimeRemaining, isClosingSoon, calculateDiscountPercentage } from '../lib/utils';

const products = new Hono<{ Bindings: Bindings }>();

// Get all active campaigns
products.get('/', async (c) => {
  try {
    const featured = c.req.query('featured');
    const closing_soon = c.req.query('closing_soon');
    const category = c.req.query('category');
    const search = c.req.query('search');

    let query = `
      SELECT 
        p.*,
        c.id as category_name,
        cw.id as campaign_id,
        cw.start_date,
        cw.end_date,
        cw.status as campaign_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN campaign_windows cw ON p.id = cw.product_id 
        AND cw.status = 'active'
        AND cw.start_date <= datetime('now')
        AND cw.end_date > datetime('now')
      WHERE p.is_active = 1
    `;

    const params: any[] = [];

    if (featured === 'true') {
      query += ' AND p.is_featured = 1';
    }

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY p.is_featured DESC, cw.end_date ASC';

    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const result = await stmt.all();

    let productsData: ProductWithCampaign[] = result.results as any[];

    // Filter closing soon if requested
    if (closing_soon === 'true') {
      productsData = productsData.filter(p => 
        p.end_date && isClosingSoon(p.end_date)
      );
    }

    // Add time remaining and discount info
    productsData = productsData.map(p => ({
      ...p,
      time_remaining: p.end_date ? getTimeRemaining(p.end_date).total : 0,
      discount_percentage: calculateDiscountPercentage(p.original_price, p.campaign_price)
    }));

    return c.json<ApiResponse>({
      success: true,
      data: productsData
    });

  } catch (error) {
    console.error('Get products error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get single product with campaign
products.get('/:id', async (c) => {
  try {
    const productId = c.req.param('id');

    const product = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          cat.name as category_name,
          cat.slug as category_slug,
          cw.id as campaign_id,
          cw.start_date,
          cw.end_date,
          cw.status as campaign_status
        FROM products p
        LEFT JOIN categories cat ON p.category_id = cat.id
        LEFT JOIN campaign_windows cw ON p.id = cw.product_id 
          AND cw.status = 'active'
          AND cw.start_date <= datetime('now')
          AND cw.end_date > datetime('now')
        WHERE p.id = ? AND p.is_active = 1
      `)
      .bind(productId)
      .first<any>();

    if (!product) {
      return c.json<ApiResponse>({ success: false, error: 'מוצר לא נמצא' }, 404);
    }

    // Get variants
    const variants = await c.env.DB
      .prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1 ORDER BY sort_order')
      .bind(productId)
      .all();

    const productData: ProductWithCampaign = {
      ...product,
      time_remaining: product.end_date ? getTimeRemaining(product.end_date).total : 0,
      discount_percentage: calculateDiscountPercentage(product.original_price, product.campaign_price),
      variants: variants.results as any[]
    };

    return c.json<ApiResponse>({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('Get product error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get categories
products.get('/categories/list', async (c) => {
  try {
    const result = await c.env.DB
      .prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name')
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get featured campaigns (homepage)
products.get('/featured/campaigns', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          cat.name as category_name,
          cw.id as campaign_id,
          cw.end_date,
          cw.status as campaign_status
        FROM products p
        LEFT JOIN categories cat ON p.category_id = cat.id
        INNER JOIN campaign_windows cw ON p.id = cw.product_id
        WHERE p.is_featured = 1 
          AND p.is_active = 1
          AND cw.status = 'active'
          AND cw.end_date > datetime('now')
        ORDER BY cw.end_date ASC
        LIMIT 6
      `)
      .all();

    const productsData = (result.results as any[]).map(p => ({
      ...p,
      time_remaining: getTimeRemaining(p.end_date).total,
      discount_percentage: calculateDiscountPercentage(p.original_price, p.campaign_price)
    }));

    return c.json<ApiResponse>({
      success: true,
      data: productsData
    });

  } catch (error) {
    console.error('Get featured campaigns error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get closing soon campaigns
products.get('/closing-soon/campaigns', async (c) => {
  try {
    const result = await c.env.DB
      .prepare(`
        SELECT 
          p.*,
          cat.name as category_name,
          cw.id as campaign_id,
          cw.end_date,
          cw.status as campaign_status
        FROM products p
        LEFT JOIN categories cat ON p.category_id = cat.id
        INNER JOIN campaign_windows cw ON p.id = cw.product_id
        WHERE p.is_active = 1
          AND cw.status = 'active'
          AND cw.end_date > datetime('now')
          AND cw.end_date < datetime('now', '+24 hours')
        ORDER BY cw.end_date ASC
        LIMIT 8
      `)
      .all();

    const productsData = (result.results as any[]).map(p => ({
      ...p,
      time_remaining: getTimeRemaining(p.end_date).total,
      discount_percentage: calculateDiscountPercentage(p.original_price, p.campaign_price)
    }));

    return c.json<ApiResponse>({
      success: true,
      data: productsData
    });

  } catch (error) {
    console.error('Get closing soon error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

export default products;
