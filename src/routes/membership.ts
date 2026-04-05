// Membership routes
import { Hono } from 'hono';
import type { Bindings, ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { logAudit, generateReceiptNumber, logEmail } from '../lib/utils';

const membership = new Hono<{ Bindings: Bindings }>();

// All routes require authentication
membership.use('/*', authMiddleware);

// Get membership status
membership.get('/status', async (c) => {
  try {
    const currentUser = c.get('user');

    const membershipData = await c.env.DB
      .prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(currentUser.userId)
      .first();

    if (!membershipData) {
      return c.json<ApiResponse>({
        success: true,
        data: {
          hasMembership: false,
          status: 'none'
        }
      });
    }

    const isActive = membershipData.status === 'active' && 
                     membershipData.end_date && 
                     new Date(membershipData.end_date as string) > new Date();

    return c.json<ApiResponse>({
      success: true,
      data: {
        hasMembership: true,
        membership: membershipData,
        isActive
      }
    });

  } catch (error) {
    console.error('Get membership status error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Subscribe to membership (99 ILS/month)
membership.post('/subscribe', async (c) => {
  try {
    const currentUser = c.get('user');
    const { payment_method_id } = await c.req.json();

    // Check if already has active membership
    const existing = await c.env.DB
      .prepare('SELECT id FROM memberships WHERE user_id = ? AND status = ? AND end_date > datetime("now")')
      .bind(currentUser.userId, 'active')
      .first();

    if (existing) {
      return c.json<ApiResponse>({ success: false, error: 'כבר יש לך מנוי פעיל' }, 400);
    }

    const monthlyFee = 9900; // 99 ILS in agorot
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create membership (payment_method_id kept NULL until real payment gateway integrated)
    const membershipResult = await c.env.DB
      .prepare(`
        INSERT INTO memberships 
        (user_id, status, start_date, end_date, monthly_fee, auto_renew)
        VALUES (?, 'active', ?, ?, ?, 1)
        RETURNING *
      `)
      .bind(
        currentUser.userId, 
        startDate.toISOString(), 
        endDate.toISOString(),
        monthlyFee
      )
      .first();

    if (!membershipResult) {
      return c.json<ApiResponse>({ success: false, error: 'שגיאה ביצירת מנוי' }, 500);
    }

    // Create membership payment record
    const paymentResult = await c.env.DB
      .prepare(`
        INSERT INTO membership_payments 
        (membership_id, user_id, amount, currency, status, paid_at)
        VALUES (?, ?, ?, 'ILS', 'completed', datetime('now'))
        RETURNING *
      `)
      .bind(membershipResult.id, currentUser.userId, monthlyFee)
      .first();

    // Generate receipt
    const receiptNumber = generateReceiptNumber();
    await c.env.DB
      .prepare(`
        INSERT INTO receipts 
        (user_id, receipt_number, amount, currency, receipt_type, description)
        VALUES (?, ?, ?, 'ILS', 'membership_fee', 'מנוי חודשי - CH Vendors Sales')
      `)
      .bind(currentUser.userId, receiptNumber, monthlyFee)
      .run();

    // Log email (receipt)
    const user = await c.env.DB
      .prepare('SELECT email, first_name FROM users WHERE id = ?')
      .bind(currentUser.userId)
      .first<any>();

    await logEmail(c.env.DB, currentUser.userId, user.email, 'membership_receipt', `קבלה על מנוי - ${receiptNumber}`);

    // Audit log
    await logAudit(
      c.env.DB, 
      currentUser.userId, 
      'subscribe_membership', 
      'membership', 
      membershipResult.id as number, 
      { amount: monthlyFee, receipt: receiptNumber }
    );

    return c.json<ApiResponse>({
      success: true,
      data: {
        membership: membershipResult,
        payment: paymentResult,
        receiptNumber
      },
      message: 'נרשמת למנוי בהצלחה! 🎉'
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Cancel membership
membership.post('/cancel', async (c) => {
  try {
    const currentUser = c.get('user');

    const membershipData = await c.env.DB
      .prepare('SELECT * FROM memberships WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1')
      .bind(currentUser.userId, 'active')
      .first();

    if (!membershipData) {
      return c.json<ApiResponse>({ success: false, error: 'אין מנוי פעיל לביטול' }, 404);
    }

    await c.env.DB
      .prepare('UPDATE memberships SET status = ?, auto_renew = 0, updated_at = datetime("now") WHERE id = ?')
      .bind('cancelled', membershipData.id)
      .run();

    await logAudit(c.env.DB, currentUser.userId, 'cancel_membership', 'membership', membershipData.id as number, {});

    return c.json<ApiResponse>({
      success: true,
      message: 'המנוי בוטל בהצלחה'
    });

  } catch (error) {
    console.error('Cancel membership error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

// Get membership payment history
membership.get('/payments', async (c) => {
  try {
    const currentUser = c.get('user');

    const result = await c.env.DB
      .prepare(`
        SELECT 
          mp.*,
          r.receipt_number,
          r.issued_at
        FROM membership_payments mp
        LEFT JOIN receipts r ON r.user_id = mp.user_id AND r.receipt_type = 'membership_fee'
        WHERE mp.user_id = ?
        ORDER BY mp.created_at DESC
      `)
      .bind(currentUser.userId)
      .all();

    return c.json<ApiResponse>({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return c.json<ApiResponse>({ success: false, error: 'שגיאת שרת' }, 500);
  }
});

export default membership;
