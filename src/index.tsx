// CH Vendors Sales - Main Application Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import routes
import auth from './routes/auth';
import products from './routes/products';
import user from './routes/user';
import membership from './routes/membership';
import admin from './routes/admin';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/auth', auth);
app.route('/api/products', products);
app.route('/api/user', user);
app.route('/api/membership', membership);
app.route('/api/admin', admin);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'CH Vendors Sales' });
});

// ============================================
// FRONTEND PAGES
// ============================================

// Homepage
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CH Vendors Sales - קניות קבוצתיות יוקרתיות</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        
        * {
            font-family: 'Heebo', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #000000 0%, #1a0000 100%);
            color: #ffffff;
        }
        
        .luxury-gradient {
            background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%);
        }
        
        .luxury-card {
            background: rgba(20, 20, 20, 0.9);
            border: 1px solid rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
        }
        
        .luxury-card:hover {
            transform: translateY(-5px);
            border-color: rgba(220, 38, 38, 0.8);
            box-shadow: 0 10px 40px rgba(220, 38, 38, 0.3);
        }
        
        .luxury-btn {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            transition: all 0.3s ease;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .luxury-btn:hover {
            background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
        }
        
        .hero-section {
            min-height: 80vh;
            background: 
                linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)),
                url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920') center/cover;
            position: relative;
        }
        
        .countdown-timer {
            background: rgba(220, 38, 38, 0.2);
            border: 2px solid #dc2626;
        }
        
        .price-original {
            text-decoration: line-through;
            color: #9ca3af;
        }
        
        .price-campaign {
            color: #dc2626;
            font-size: 2rem;
            font-weight: 800;
        }
        
        .badge-closing {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .section-title {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ffffff 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .nav-link {
            transition: all 0.3s ease;
        }
        
        .nav-link:hover {
            color: #dc2626;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-red-900/30">
        <div class="container mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-8">
                    <h1 class="text-3xl font-bold">
                        <span class="text-red-600">CH</span> Vendors Sales
                    </h1>
                    <div class="hidden md:flex gap-6">
                        <a href="/" class="nav-link text-white hover:text-red-600">בית</a>
                        <a href="/products" class="nav-link text-white hover:text-red-600">מוצרים</a>
                        <a href="/categories" class="nav-link text-white hover:text-red-600">קטגוריות</a>
                        <a href="/membership" class="nav-link text-white hover:text-red-600">מנוי</a>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div id="auth-buttons" class="flex gap-3">
                        <a href="/login" class="px-6 py-2 text-white hover:text-red-600 transition">התחברות</a>
                        <a href="/register" class="luxury-btn px-6 py-2 rounded-lg text-white">הרשמה</a>
                    </div>
                    <div id="user-menu" class="hidden">
                        <button onclick="showUserMenu()" class="flex items-center gap-2 text-white hover:text-red-600 transition">
                            <i class="fas fa-user-circle text-2xl"></i>
                            <span id="user-name"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section flex items-center justify-center text-center px-6 pt-20">
        <div class="max-w-5xl">
            <h1 class="text-6xl md:text-8xl font-black mb-6 leading-tight">
                קניות יוקרה<br/>
                <span class="text-red-600">במחיר שלא יחזור</span>
            </h1>
            <p class="text-2xl md:text-3xl mb-8 text-gray-300 font-light">
                מוצרי פרימיום במחירי קבוצה בלעדיים למנויים
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/products" class="luxury-btn px-12 py-4 rounded-lg text-xl text-white">
                    <i class="fas fa-shopping-bag ml-2"></i>
                    גלו את המבצעים
                </a>
                <a href="/membership" class="px-12 py-4 rounded-lg text-xl border-2 border-white text-white hover:bg-white hover:text-black transition">
                    הצטרפו כמנויים
                </a>
            </div>
            <div class="mt-12 flex gap-16 justify-center text-center">
                <div>
                    <div class="text-5xl font-bold text-red-600">99₪</div>
                    <div class="text-gray-400 mt-2">מנוי חודשי</div>
                </div>
                <div>
                    <div class="text-5xl font-bold text-red-600">50%</div>
                    <div class="text-gray-400 mt-2">הנחה ממוצעת</div>
                </div>
                <div>
                    <div class="text-5xl font-bold text-red-600">24/7</div>
                    <div class="text-gray-400 mt-2">מבצעים חדשים</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Campaigns -->
    <section class="container mx-auto px-6 py-20">
        <h2 class="section-title text-center mb-12">המבצעים המובילים</h2>
        <div id="featured-products" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Products loaded via JavaScript -->
        </div>
    </section>

    <!-- Closing Soon -->
    <section class="container mx-auto px-6 py-20">
        <div class="flex items-center justify-between mb-12">
            <h2 class="section-title">נסגר בקרוב <i class="fas fa-fire text-red-600 mr-3"></i></h2>
            <div class="text-red-600 text-xl font-semibold animate-pulse">זמן אוזל!</div>
        </div>
        <div id="closing-soon-products" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Products loaded via JavaScript -->
        </div>
    </section>

    <!-- Categories -->
    <section class="container mx-auto px-6 py-20">
        <h2 class="section-title text-center mb-12">קטגוריות</h2>
        <div id="categories" class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <!-- Categories loaded via JavaScript -->
        </div>
    </section>

    <!-- Membership CTA -->
    <section class="container mx-auto px-6 py-20">
        <div class="luxury-gradient rounded-3xl p-12 text-center">
            <h2 class="text-5xl font-black mb-6">הצטרפו למועדון היוקרה</h2>
            <p class="text-2xl mb-8 text-gray-200">מנוי חודשי ב-99₪ בלבד - גישה בלתי מוגבלת לכל המבצעים</p>
            <a href="/membership" class="inline-block bg-white text-red-600 px-12 py-4 rounded-lg text-xl font-bold hover:bg-gray-100 transition">
                הרשמה למנוי
            </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black border-t border-red-900/30 mt-20">
        <div class="container mx-auto px-6 py-12">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-2xl font-bold mb-4"><span class="text-red-600">CH</span> Vendors</h3>
                    <p class="text-gray-400">קניות יוקרה במחירי קבוצה</p>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-4">קישורים</h4>
                    <div class="flex flex-col gap-2">
                        <a href="/about" class="text-gray-400 hover:text-red-600">אודות</a>
                        <a href="/how-it-works" class="text-gray-400 hover:text-red-600">איך זה עובד</a>
                        <a href="/contact" class="text-gray-400 hover:text-red-600">צור קשר</a>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-4">משפטי</h4>
                    <div class="flex flex-col gap-2">
                        <a href="/legal/terms" class="text-gray-400 hover:text-red-600">תנאי שימוש</a>
                        <a href="/legal/privacy" class="text-gray-400 hover:text-red-600">מדיניות פרטיות</a>
                        <a href="/legal/cancellation" class="text-gray-400 hover:text-red-600">מדיניות ביטול</a>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-4">עקבו אחרינו</h4>
                    <div class="flex gap-4 text-2xl">
                        <a href="#" class="text-gray-400 hover:text-red-600"><i class="fab fa-facebook"></i></a>
                        <a href="#" class="text-gray-400 hover:text-red-600"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="text-gray-400 hover:text-red-600"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>
            </div>
            <div class="border-t border-red-900/30 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 CH Vendors Sales. כל הזכויות שמורות.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        // Load homepage data
        loadHomepage();
    </script>
</body>
</html>
  `);
});

// Login page
app.get('/login', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>התחברות - CH Vendors Sales</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', sans-serif; }
        body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); }
        .luxury-btn {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            transition: all 0.3s ease;
        }
        .luxury-btn:hover {
            background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6">
    <div class="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-900/30">
        <h1 class="text-4xl font-bold text-center mb-8">
            <span class="text-red-600">התחברות</span>
        </h1>
        
        <form id="login-form" class="space-y-6">
            <div>
                <label class="block text-gray-300 mb-2">אימייל</label>
                <input type="email" id="email" required 
                    class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
            </div>
            
            <div>
                <label class="block text-gray-300 mb-2">סיסמה</label>
                <input type="password" id="password" required 
                    class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
            </div>
            
            <div id="error-message" class="hidden bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg"></div>
            
            <button type="submit" class="luxury-btn w-full py-3 rounded-lg text-white font-semibold text-lg">
                התחבר
            </button>
        </form>
        
        <p class="text-center mt-6 text-gray-400">
            אין לך חשבון? <a href="/register" class="text-red-600 hover:underline">הירשם כעת</a>
        </p>
        
        <div class="mt-6 text-center">
            <a href="/" class="text-gray-400 hover:text-red-600">← חזרה לדף הבית</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    </script>
</body>
</html>
  `);
});

// Register page
app.get('/register', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>הרשמה - CH Vendors Sales</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', sans-serif; }
        body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); }
        .luxury-btn {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            transition: all 0.3s ease;
        }
        .luxury-btn:hover {
            background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6">
    <div class="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-900/30">
        <h1 class="text-4xl font-bold text-center mb-8">
            <span class="text-red-600">הרשמה</span>
        </h1>
        
        <form id="register-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-300 mb-2">שם פרטי</label>
                    <input type="text" id="first_name" required 
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-gray-300 mb-2">שם משפחה</label>
                    <input type="text" id="last_name" required 
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
                </div>
            </div>
            
            <div>
                <label class="block text-gray-300 mb-2">אימייל</label>
                <input type="email" id="email" required 
                    class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
            </div>
            
            <div>
                <label class="block text-gray-300 mb-2">טלפון</label>
                <input type="tel" id="phone" placeholder="0501234567" required 
                    class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
            </div>
            
            <div>
                <label class="block text-gray-300 mb-2">סיסמה (לפחות 6 תווים)</label>
                <input type="password" id="password" required minlength="6" 
                    class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
            </div>
            
            <div id="error-message" class="hidden bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg"></div>
            
            <button type="submit" class="luxury-btn w-full py-3 rounded-lg text-white font-semibold text-lg">
                הירשם
            </button>
        </form>
        
        <p class="text-center mt-6 text-gray-400">
            כבר יש לך חשבון? <a href="/login" class="text-red-600 hover:underline">התחבר</a>
        </p>
        
        <div class="mt-6 text-center">
            <a href="/" class="text-gray-400 hover:text-red-600">← חזרה לדף הבית</a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    </script>
</body>
</html>
  `);
});

// Dashboard page (user must be logged in)
app.get('/dashboard', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>לוח בקרה - CH Vendors Sales</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', sans-serif; }
        body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); }
        .luxury-card {
            background: rgba(20, 20, 20, 0.9);
            border: 1px solid rgba(220, 38, 38, 0.3);
        }
    </style>
</head>
<body class="min-h-screen text-white p-6">
    <div class="container mx-auto max-w-6xl">
        <h1 class="text-4xl font-bold mb-8">לוח בקרה אישי</h1>
        
        <div id="dashboard-content">
            <div class="text-center py-20">
                <i class="fas fa-spinner fa-spin text-4xl text-red-600"></i>
                <p class="mt-4 text-gray-400">טוען...</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        loadDashboard();
    </script>
</body>
</html>
  `);
});

// Admin panel (admin users only)
app.get('/admin', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ניהול - CH Vendors Sales</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', sans-serif; }
        body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); }
    </style>
</head>
<body class="min-h-screen text-white p-6">
    <div class="container mx-auto">
        <h1 class="text-4xl font-bold mb-8"><i class="fas fa-cog ml-2"></i> פאנל ניהול</h1>
        
        <div id="admin-content">
            <div class="text-center py-20">
                <i class="fas fa-spinner fa-spin text-4xl text-red-600"></i>
                <p class="mt-4 text-gray-400">טוען...</p>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
    <script>
        loadAdminPanel();
    </script>
</body>
</html>
  `);
});

// Membership page
app.get('/membership', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>מנוי - CH Vendors Sales</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Heebo', sans-serif; }
        body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); }
        .luxury-btn {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        }
    </style>
</head>
<body class="min-h-screen text-white p-6">
    <div class="container mx-auto max-w-4xl text-center py-20">
        <h1 class="text-6xl font-bold mb-6">הצטרפו למועדון היוקרה</h1>
        <p class="text-2xl text-gray-300 mb-12">מנוי חודשי ב-99₪ בלבד</p>
        
        <div class="bg-gray-900 rounded-2xl p-12 border-2 border-red-600">
            <div class="text-8xl font-black text-red-600 mb-4">99₪</div>
            <div class="text-2xl text-gray-400 mb-8">לחודש</div>
            
            <ul class="text-right mb-12 space-y-4 max-w-md mx-auto text-xl">
                <li><i class="fas fa-check text-red-600 ml-3"></i> גישה לכל המבצעים</li>
                <li><i class="fas fa-check text-red-600 ml-3"></i> הנחות עד 70%</li>
                <li><i class="fas fa-check text-red-600 ml-3"></i> משלוח מהיר</li>
                <li><i class="fas fa-check text-red-600 ml-3"></i> ללא התחייבות</li>
            </ul>
            
            <a href="/register" class="luxury-btn inline-block px-12 py-4 rounded-lg text-white font-bold text-xl">
                הצטרפו עכשיו
            </a>
        </div>
    </div>
</body>
</html>
  `);
});

// ============================================
// MISSING PAGES (Products, Categories, Legal)
// ============================================

const luxuryStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap');
  * { font-family: 'Heebo', sans-serif; }
  body { background: linear-gradient(135deg, #000000 0%, #1a0000 100%); color: #fff; }
  .luxury-btn { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); transition: all 0.3s ease; }
  .luxury-btn:hover { background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); box-shadow: 0 0 30px rgba(220,38,38,0.6); }
  .luxury-card { background: rgba(20,20,20,0.9); border: 1px solid rgba(220,38,38,0.3); transition: all 0.3s ease; }
  .luxury-card:hover { transform: translateY(-5px); border-color: rgba(220,38,38,0.8); box-shadow: 0 10px 40px rgba(220,38,38,0.3); }
  .section-title { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #fff 0%, #dc2626 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
`;

const navHtml = `
<nav class="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-red-900/30">
  <div class="container mx-auto px-6 py-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-8">
        <a href="/" class="text-3xl font-bold"><span class="text-red-600">CH</span> Vendors Sales</a>
        <div class="hidden md:flex gap-6">
          <a href="/" class="text-white hover:text-red-600 transition">בית</a>
          <a href="/products" class="text-white hover:text-red-600 transition">מוצרים</a>
          <a href="/categories" class="text-white hover:text-red-600 transition">קטגוריות</a>
          <a href="/membership" class="text-white hover:text-red-600 transition">מנוי</a>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div id="auth-buttons" class="flex gap-3">
          <a href="/login" class="px-6 py-2 text-white hover:text-red-600 transition">התחברות</a>
          <a href="/register" class="luxury-btn px-6 py-2 rounded-lg text-white">הרשמה</a>
        </div>
        <div id="user-menu" class="hidden">
          <button onclick="showUserMenu()" class="flex items-center gap-2 text-white hover:text-red-600 transition">
            <i class="fas fa-user-circle text-2xl"></i>
            <span id="user-name"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</nav>`;

// Products page
app.get('/products', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מוצרים - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>${luxuryStyles}
    .countdown-timer { background: rgba(220,38,38,0.2); border: 2px solid #dc2626; }
    .price-original { text-decoration: line-through; color: #9ca3af; }
    .price-campaign { color: #dc2626; font-size: 1.5rem; font-weight: 800; }
  </style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20">
    <h1 class="section-title text-center mb-4">כל המוצרים</h1>
    <p class="text-center text-gray-400 mb-12 text-lg">מוצרי פרימיום בקמפיינים פעילים</p>

    <!-- Search & Filter -->
    <div class="flex flex-col md:flex-row gap-4 mb-10 justify-center">
      <input type="text" id="search-input" placeholder="חפש מוצר..." 
        class="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none w-full md:w-96"
        oninput="filterProducts()">
      <select id="category-filter" onchange="filterProducts()"
        class="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
        <option value="">כל הקטגוריות</option>
      </select>
    </div>

    <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="text-center col-span-3 py-20">
        <i class="fas fa-spinner fa-spin text-4xl text-red-600"></i>
        <p class="mt-4 text-gray-400">טוען מוצרים...</p>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>
    let allProducts = [];
    async function loadProductsPage() {
      try {
        checkAuthStatus();
        const [prodsRes, catsRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/products/categories/list')
        ]);
        allProducts = prodsRes.data.data || [];
        const cats = catsRes.data.data || [];
        const sel = document.getElementById('category-filter');
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.slug; opt.textContent = c.name;
          sel.appendChild(opt);
        });
        renderProducts(allProducts);
      } catch(e) { document.getElementById('products-grid').innerHTML = '<p class="text-red-400 col-span-3 text-center">שגיאה בטעינת מוצרים</p>'; }
    }
    function filterProducts() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const cat = document.getElementById('category-filter').value;
      const filtered = allProducts.filter(p =>
        (!q || p.title.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)) &&
        (!cat || p.category_slug === cat || p.category_name?.toLowerCase() === cat)
      );
      renderProducts(filtered);
    }
    function renderProducts(products) {
      const grid = document.getElementById('products-grid');
      if (!products.length) { grid.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-20">לא נמצאו מוצרים</p>'; return; }
      grid.innerHTML = products.map(p => createProductCard(p)).join('');
      startAllCountdowns();
    }
    loadProductsPage();
  </script>
</body>
</html>`);
});

// Categories page
app.get('/categories', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קטגוריות - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20">
    <h1 class="section-title text-center mb-4">קטגוריות</h1>
    <p class="text-center text-gray-400 mb-12 text-lg">בחרו קטגוריה לצפייה במוצרים</p>
    <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="text-center col-span-4 py-20">
        <i class="fas fa-spinner fa-spin text-4xl text-red-600"></i>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>
    const categoryIcons = { 'fashion': 'fa-tshirt', 'jewelry': 'fa-gem', 'watches': 'fa-clock', 'electronics': 'fa-mobile-alt' };
    async function loadCategories() {
      checkAuthStatus();
      const res = await axios.get('/api/products/categories/list');
      const cats = res.data.data || [];
      const grid = document.getElementById('categories-grid');
      if (!cats.length) { grid.innerHTML = '<p class="text-gray-400 col-span-4 text-center">אין קטגוריות</p>'; return; }
      grid.innerHTML = cats.map(cat => \`
        <a href="/products?category=\${cat.slug}" class="luxury-card rounded-2xl p-8 text-center cursor-pointer block">
          <i class="fas \${categoryIcons[cat.slug] || 'fa-tag'} text-5xl text-red-600 mb-4"></i>
          <h3 class="text-xl font-bold">\${cat.name}</h3>
          \${cat.description ? \`<p class="text-gray-400 mt-2 text-sm">\${cat.description}</p>\` : ''}
        </a>
      \`).join('');
    }
    loadCategories();
  </script>
</body>
</html>`);
});

// About page
app.get('/about', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>אודות - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-4xl">
    <h1 class="section-title text-center mb-12">אודות CH Vendors Sales</h1>
    <div class="space-y-10 text-gray-300 text-lg leading-relaxed">
      <div class="luxury-card rounded-2xl p-8">
        <h2 class="text-2xl font-bold text-white mb-4"><i class="fas fa-gem text-red-600 ml-2"></i>מי אנחנו?</h2>
        <p>CH Vendors Sales היא פלטפורמת קניות קבוצתיות יוקרתית ישראלית, המאפשרת לחברי המועדון לרכוש מוצרי פרימיום — תכשיטים, שעונים, אופנה ואלקטרוניקה — במחירי קבוצה בלעדיים.</p>
      </div>
      <div class="luxury-card rounded-2xl p-8">
        <h2 class="text-2xl font-bold text-white mb-4"><i class="fas fa-lightbulb text-red-600 ml-2"></i>הרעיון שלנו</h2>
        <p>מוצרי יוקרה אמיתיים היו תמיד נחלת המעטים. אנחנו שינינו את המשוואה: באמצעות כוח הקנייה הקבוצתית, חברי המועדון שלנו נהנים מהנחות של 30-70% על מותגים מובילים בעולם.</p>
      </div>
      <div class="luxury-card rounded-2xl p-8">
        <h2 class="text-2xl font-bold text-white mb-4"><i class="fas fa-shield-alt text-red-600 ml-2"></i>שקיפות ואמינות</h2>
        <p>אנחנו מאמינים בשקיפות מלאה: מחירים אמיתיים, ספירות אמיתיות, ללא טריקים. כל הסכמה משפטית מתועדת, וזכויות הביטול שלך מוגנות.</p>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

// How it works page
app.get('/how-it-works', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>איך זה עובד - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-4xl">
    <h1 class="section-title text-center mb-4">איך זה עובד?</h1>
    <p class="text-center text-gray-400 mb-12 text-lg">4 צעדים פשוטים לקניית יוקרה במחיר שלא יחזור</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      ${[
        ['1', 'fa-user-plus', 'הירשמו', 'צרו חשבון חינם תוך 30 שניות. שם, אימייל, טלפון — וזהו.'],
        ['2', 'fa-crown', 'הצטרפו למנוי', 'מנוי חודשי ב-99₪ בלבד. ביטול בכל עת, ללא התחייבות.'],
        ['3', 'fa-shopping-bag', 'בחרו מוצר', 'גלשו בקמפיינים הפעילים, בחרו מוצר שאתם אוהבים, הצטרפו לפני שייגמר הזמן.'],
        ['4', 'fa-truck', 'קבלו את המוצר', 'לאחר סגירת הקמפיין, המוצר יישלח ישירות אליכם הביתה.']
      ].map(([num, icon, title, desc]) => `
        <div class="luxury-card rounded-2xl p-8">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl">${num}</div>
            <i class="fas ${icon} text-3xl text-red-600"></i>
          </div>
          <h3 class="text-2xl font-bold mb-3">${title}</h3>
          <p class="text-gray-400">${desc}</p>
        </div>
      `).join('')}
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

// Contact page
app.get('/contact', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>צור קשר - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-2xl">
    <h1 class="section-title text-center mb-12">צור קשר</h1>
    <div class="luxury-card rounded-2xl p-8 mb-8">
      <div class="space-y-6">
        <div class="flex items-center gap-4 text-lg">
          <i class="fas fa-envelope text-red-600 text-2xl w-8"></i>
          <div><div class="text-gray-400 text-sm">אימייל</div><div>support@chvendors.com</div></div>
        </div>
        <div class="flex items-center gap-4 text-lg">
          <i class="fab fa-whatsapp text-red-600 text-2xl w-8"></i>
          <div><div class="text-gray-400 text-sm">WhatsApp</div><div>+972-50-000-0000</div></div>
        </div>
        <div class="flex items-center gap-4 text-lg">
          <i class="fas fa-clock text-red-600 text-2xl w-8"></i>
          <div><div class="text-gray-400 text-sm">שעות פעילות</div><div>א'-ה' 09:00-18:00</div></div>
        </div>
      </div>
    </div>
    <div class="luxury-card rounded-2xl p-8">
      <h2 class="text-xl font-bold mb-6">שלחו הודעה</h2>
      <form class="space-y-4" onsubmit="event.preventDefault(); alert('ההודעה נשלחה! נחזור אליכם בהקדם.');">
        <input type="text" placeholder="שמכם" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
        <input type="email" placeholder="אימייל" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
        <textarea placeholder="ההודעה שלכם..." rows="5" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none"></textarea>
        <button type="submit" class="luxury-btn w-full py-3 rounded-lg text-white font-semibold">שלח הודעה</button>
      </form>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

// Legal pages
app.get('/legal/terms', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תנאי שימוש - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
    <h1 class="section-title text-center mb-12">תנאי שימוש</h1>
    <div class="luxury-card rounded-2xl p-8 space-y-6 text-gray-300 leading-relaxed">
      <p class="text-gray-400 text-sm">עדכון אחרון: אפריל 2026</p>
      <h2 class="text-xl font-bold text-white">1. הסכמה לתנאים</h2>
      <p>השימוש בפלטפורמת CH Vendors Sales מהווה הסכמה מלאה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באתר.</p>
      <h2 class="text-xl font-bold text-white">2. המנוי</h2>
      <p>המנוי החודשי עומד על 99 ₪ לחודש. ניתן לבטל את המנוי בכל עת. ביטול לאחר חיוב חודשי לא יזכה בהחזר כספי.</p>
      <h2 class="text-xl font-bold text-white">3. קמפיינים ורכישות</h2>
      <p>הצטרפות לקמפיין מהווה התחייבות לרכישה בתנאי שהקמפיין יסגר בהצלחה. החיוב יבוצע בסגירת הקמפיין.</p>
      <h2 class="text-xl font-bold text-white">4. מדיניות ביטול</h2>
      <p>ניתן לבטל הצטרפות לקמפיין עד 24 שעות לפני סגירתו. לאחר סגירת הקמפיין, לא ניתן לבטל.</p>
      <h2 class="text-xl font-bold text-white">5. אחריות</h2>
      <p>CH Vendors Sales פועלת כמתווך בין הלקוח לספק. האחריות על המוצרים חלה על הספק בהתאם לחוקי הגנת הצרכן.</p>
      <h2 class="text-xl font-bold text-white">6. יצירת קשר</h2>
      <p>לשאלות ובירורים: support@chvendors.com</p>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

app.get('/legal/privacy', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מדיניות פרטיות - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
    <h1 class="section-title text-center mb-12">מדיניות פרטיות</h1>
    <div class="luxury-card rounded-2xl p-8 space-y-6 text-gray-300 leading-relaxed">
      <p class="text-gray-400 text-sm">עדכון אחרון: אפריל 2026</p>
      <h2 class="text-xl font-bold text-white">1. מידע שאנו אוספים</h2>
      <p>אנו אוספים: שם, אימייל, מספר טלפון, כתובות משלוח, היסטוריית רכישות. מידע זה נדרש לניהול חשבונך.</p>
      <h2 class="text-xl font-bold text-white">2. שימוש במידע</h2>
      <p>המידע משמש לניהול חשבונות, עיבוד הזמנות, שליחת עדכונים ושיפור השירות. לא נמכור מידע לצד שלישי.</p>
      <h2 class="text-xl font-bold text-white">3. אבטחת מידע</h2>
      <p>אנו משתמשים בטכנולוגיות הצפנה מתקדמות להגנת המידע שלך. כל החיבורים מוצפנים ב-HTTPS.</p>
      <h2 class="text-xl font-bold text-white">4. זכויות המשתמש</h2>
      <p>יש לך זכות לעיין, לתקן ולמחוק את המידע שלך. לבקשות: privacy@chvendors.com</p>
      <h2 class="text-xl font-bold text-white">5. עוגיות (Cookies)</h2>
      <p>אנו משתמשים ב-JWT tokens לאימות. לא משתמשים בעוגיות מעקב של צד שלישי.</p>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

app.get('/legal/cancellation', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מדיניות ביטול - CH Vendors Sales</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${luxuryStyles}</style>
</head>
<body>
  ${navHtml}
  <div class="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
    <h1 class="section-title text-center mb-12">מדיניות ביטול</h1>
    <div class="luxury-card rounded-2xl p-8 space-y-6 text-gray-300 leading-relaxed">
      <p class="text-gray-400 text-sm">עדכון אחרון: אפריל 2026 | בהתאם לחוק הגנת הצרכן תשמ"א-1981</p>
      <h2 class="text-xl font-bold text-white">ביטול מנוי</h2>
      <p>ניתן לבטל את המנוי בכל עת דרך הגדרות החשבון. הביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית. לא יינתן החזר חלקי.</p>
      <h2 class="text-xl font-bold text-white">ביטול הצטרפות לקמפיין</h2>
      <p><strong class="text-white">לפני סגירת הקמפיין:</strong> ניתן לבטל עד 24 שעות לפני מועד הסגירה ללא עלות.</p>
      <p><strong class="text-white">אחרי סגירת הקמפיין:</strong> לא ניתן לבטל לאחר סגירה, אלא במקרי פגם או אי-התאמה.</p>
      <h2 class="text-xl font-bold text-white">החזרת מוצר</h2>
      <p>ניתן להחזיר מוצר פגום תוך 14 יום מקבלתו. יש לפנות לתמיכה ב-support@chvendors.com עם תמונות המוצר.</p>
      <h2 class="text-xl font-bold text-white">זיכויים</h2>
      <p>החזרים כספיים יבוצעו לכרטיס האשראי המקורי תוך 14 ימי עסקים.</p>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
  <script>checkAuthStatus();</script>
</body>
</html>`);
});

export default app;
