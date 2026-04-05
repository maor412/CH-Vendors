-- CH Vendors Sales - Seed Data
-- Sample data for testing the platform

-- ============================================
-- ADMIN USER
-- ============================================
INSERT INTO users (id, email, phone, phone_verified, password_hash, first_name, last_name, is_admin) VALUES 
(1, 'admin@chvendors.com', '0501234567', 1, '$2a$10$demoHashForAdminUser123456789012345678901234567890', 'אדמין', 'ראשי', 1);

-- ============================================
-- DEMO USERS
-- ============================================
INSERT INTO users (id, email, phone, phone_verified, password_hash, first_name, last_name) VALUES 
(2, 'sarah@example.com', '0521111111', 1, '$2a$10$demoHashForUser123456789012345678901234567890123456', 'שרה', 'כהן'),
(3, 'david@example.com', '0522222222', 1, '$2a$10$demoHashForUser223456789012345678901234567890123456', 'דוד', 'לוי'),
(4, 'rachel@example.com', '0523333333', 1, '$2a$10$demoHashForUser323456789012345678901234567890123456', 'רחל', 'אברהם');

-- ============================================
-- MEMBERSHIPS (Active)
-- ============================================
INSERT INTO memberships (user_id, status, start_date, end_date, monthly_fee) VALUES 
(2, 'active', datetime('now', '-10 days'), datetime('now', '+20 days'), 9900),
(3, 'active', datetime('now', '-5 days'), datetime('now', '+25 days'), 9900);

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, name, name_en, slug, description) VALUES 
(1, 'אופנה', 'Fashion', 'fashion', 'בגדים ואקססוריז יוקרתיים'),
(2, 'תכשיטים', 'Jewelry', 'jewelry', 'תכשיטי יוקרה - זהב, יהלומים וכסף'),
(3, 'שעונים', 'Watches', 'watches', 'שעונים יוקרתיים ממותגים'),
(4, 'אלקטרוניקה', 'Electronics', 'electronics', 'מוצרי אלקטרוניקה פרימיום');

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO products (id, category_id, title, description, long_description, original_price, campaign_price, fixed_shipping_cost, image_url, is_featured, is_active, created_by) VALUES 
(1, 3, 'שעון רולקס סאבמרינר', 'שעון יוקרה אוטומטי מפלדת אל-חלד', 'שעון רולקס סאבמרינר המפורסם - אייקון של שעוני צלילה יוקרתיים. תנועה אוטומטית, עמידות במים עד 300 מטר, זכוכית ספיר עמידה לשריטות. קופסה מקורית ואחריות בינלאומית.', 4500000, 3890000, 0, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800', 1, 1, 1),

(2, 2, 'שרשרת יהלומים 18K', 'שרשרת זהב 18 קראט משובצת יהלומים', 'שרשרת זהב לבן 18 קראט עם תליון משובץ 50 יהלומים במשקל כולל של 2 קראט. עיצוב אלגנטי ומתוחכם, מתאימה לכל אירוע. מגיעה עם תעודת אותנטיות ואריזה יוקרתית.', 1850000, 1499000, 5000, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', 1, 1, 1),

(3, 1, 'מעיל עור איטלקי GUCCI', 'מעיל עור אמיתי מתוצרת גוצ׳י', 'מעיל עור איטלקי מפואר מבית האופנה GUCCI. עור נאפה איכותי, בטנה משי, גזרה מושלמת. קולקציית 2024. זמין במידות מגוון. מגיע בקופסה מקורית עם תעודת אותנטיות.', 1200000, 899000, 0, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', 1, 1, 1),

(4, 4, 'אוזניות SONY WH-1000XM5', 'אוזניות אלחוטיות עם ביטול רעשים מתקדם', 'אוזניות SONY WH-1000XM5 הדור החדש - ביטול רעשים מתקדם ביותר, איכות סאונד Hi-Res, עד 30 שעות סוללה, טעינה מהירה. מושלם לטיסות ולשימוש יומיומי. אחריות יבואן רשמי.', 149900, 119900, 3000, 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800', 0, 1, 1),

(5, 2, 'טבעת אירוסין יהלום 1ct', 'טבעת זהב לבן עם יהלום מרכזי 1 קראט', 'טבעת אירוסין מהממת - זהב לבן 18 קראט עם יהלום מרכזי 1 קראט (F color, VS1 clarity). עיצוב סוליטר קלאסי עם 6 שיניים. כולל תעודה גמולוגית בינלאומית (GIA).', 3500000, 2990000, 0, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800', 1, 1, 1),

(6, 3, 'שעון TAG HEUER Carrera', 'שעון כרונוגרף שוויצרי', 'שעון TAG HEUER מסדרת Carrera - כרונוגרף מכני אוטומטי, קליבר Heuer 02 מתוצרת עצמית. רצועת עור תנין אמיתית, קופסה מקורית ואחריות בינלאומית 5 שנים.', 2800000, 2399000, 0, 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800', 0, 1, 1);

-- ============================================
-- PRODUCT VARIANTS (for products with options)
-- ============================================
-- Leather jacket sizes
INSERT INTO product_variants (product_id, variant_type, variant_value, sort_order) VALUES 
(3, 'size', 'S', 1),
(3, 'size', 'M', 2),
(3, 'size', 'L', 3),
(3, 'size', 'XL', 4);

-- Headphones colors
INSERT INTO product_variants (product_id, variant_type, variant_value, sort_order) VALUES 
(4, 'color', 'שחור', 1),
(4, 'color', 'כסוף', 2);

-- ============================================
-- ACTIVE CAMPAIGNS
-- ============================================
-- Campaign 1: Rolex (closing in 2 days)
INSERT INTO campaign_windows (id, product_id, start_date, end_date, status) VALUES 
(1, 1, datetime('now', '-5 days'), datetime('now', '+2 days'), 'active');

-- Campaign 2: Diamond Necklace (closing in 5 hours - "closing soon")
INSERT INTO campaign_windows (id, product_id, start_date, end_date, status) VALUES 
(2, 2, datetime('now', '-3 days'), datetime('now', '+5 hours'), 'active');

-- Campaign 3: GUCCI Jacket (closing in 1 day)
INSERT INTO campaign_windows (id, product_id, start_date, end_date, status) VALUES 
(3, 3, datetime('now', '-2 days'), datetime('now', '+1 day'), 'active');

-- Campaign 4: Engagement Ring (closing in 3 days)
INSERT INTO campaign_windows (id, product_id, start_date, end_date, status) VALUES 
(4, 5, datetime('now', '-1 day'), datetime('now', '+3 days'), 'active');

-- ============================================
-- ADDRESSES
-- ============================================
INSERT INTO addresses (user_id, address_type, full_name, street, city, postal_code, phone, is_default) VALUES 
(2, 'shipping', 'שרה כהן', 'רחוב הרצל 123', 'תל אביב', '6801234', '0521111111', 1),
(3, 'shipping', 'דוד לוי', 'שדרות בן גוריון 45', 'ירושלים', '9101234', '0522222222', 1),
(4, 'shipping', 'רחל אברהם', 'רחוב ויצמן 78', 'חיפה', '3201234', '0523333333', 1);

-- ============================================
-- SAMPLE PARTICIPANTS (users who joined campaigns)
-- ============================================
INSERT INTO campaign_participants (campaign_id, user_id, product_id, quantity, shipping_address_id, total_amount, status, payment_status) VALUES 
(1, 2, 1, 1, 1, 3890000, 'confirmed', 'authorized'),
(2, 3, 2, 1, 2, 1504000, 'confirmed', 'authorized');

-- ============================================
-- LEGAL CONSENTS (sample)
-- ============================================
INSERT INTO legal_consents (user_id, consent_type, version, ip_address) VALUES 
(2, 'terms_of_use', '1.0', '192.168.1.100'),
(2, 'privacy_policy', '1.0', '192.168.1.100'),
(3, 'terms_of_use', '1.0', '192.168.1.101'),
(3, 'privacy_policy', '1.0', '192.168.1.101');
