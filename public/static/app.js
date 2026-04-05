// CH Vendors Sales - Frontend JavaScript
const API_BASE = '/api';
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ============================================
// AUTH FUNCTIONS
// ============================================

function checkAuth() {
    authToken = localStorage.getItem('auth_token');
    if (authToken) {
        fetchCurrentUser();
    }
}

async function fetchCurrentUser() {
    try {
        const response = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            currentUser = response.data.data.user;
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Failed to fetch user:', error);
        if (error.response?.status === 401) {
            logout();
        }
    }
}

function updateUIForLoggedInUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) {
        userMenu.classList.remove('hidden');
        if (userName) userName.textContent = currentUser.first_name;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email,
            password
        });
        
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.data.token);
            window.location.href = '/dashboard';
        }
    } catch (error) {
        errorDiv.textContent = error.response?.data?.error || 'שגיאה בהתחברות';
        errorDiv.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
            first_name,
            last_name,
            email,
            phone,
            password
        });
        
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.data.token);
            window.location.href = '/dashboard';
        }
    } catch (error) {
        errorDiv.textContent = error.response?.data?.error || 'שגיאה בהרשמה';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    authToken = null;
    currentUser = null;
    window.location.href = '/';
}

// ============================================
// HOMEPAGE FUNCTIONS
// ============================================

async function loadHomepage() {
    await loadFeaturedProducts();
    await loadClosingSoonProducts();
    await loadCategories();
}

async function loadFeaturedProducts() {
    try {
        const response = await axios.get(`${API_BASE}/products/featured/campaigns`);
        
        if (response.data.success) {
            const container = document.getElementById('featured-products');
            container.innerHTML = response.data.data.map(product => createProductCard(product)).join('');
            
            // Start countdown timers
            response.data.data.forEach(product => {
                if (product.campaign_id) {
                    startCountdown(product.campaign_id, product.end_date);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load featured products:', error);
    }
}

async function loadClosingSoonProducts() {
    try {
        const response = await axios.get(`${API_BASE}/products/closing-soon/campaigns`);
        
        if (response.data.success) {
            const container = document.getElementById('closing-soon-products');
            container.innerHTML = response.data.data.map(product => createProductCard(product, true)).join('');
            
            // Start countdown timers
            response.data.data.forEach(product => {
                if (product.campaign_id) {
                    startCountdown(product.campaign_id, product.end_date);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load closing soon products:', error);
    }
}

async function loadCategories() {
    try {
        const response = await axios.get(`${API_BASE}/products/categories/list`);
        
        if (response.data.success) {
            const container = document.getElementById('categories');
            container.innerHTML = response.data.data.map(category => `
                <a href="/products?category=${category.slug}" 
                   class="luxury-card rounded-xl p-6 text-center hover:scale-105 transition">
                    <h3 class="text-2xl font-bold">${category.name}</h3>
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function createProductCard(product, isSmall = false) {
    const originalPrice = formatPrice(product.original_price);
    const campaignPrice = formatPrice(product.campaign_price);
    const discount = product.discount_percentage || 0;
    
    const cardSize = isSmall ? 'h-96' : 'h-[500px]';
    
    return `
        <div class="luxury-card rounded-xl overflow-hidden ${cardSize} flex flex-col">
            ${product.time_remaining && product.time_remaining < 86400000 ? 
                '<div class="badge-closing px-4 py-2 text-center font-bold">נסגר בקרוב!</div>' : ''}
            <div class="h-64 bg-cover bg-center" style="background-image: url('${product.image_url || 'https://via.placeholder.com/400'}')"></div>
            <div class="p-6 flex-1 flex flex-col">
                <h3 class="text-2xl font-bold mb-2">${product.title}</h3>
                <p class="text-gray-400 mb-4 flex-1">${product.description || ''}</p>
                
                <div class="mb-4">
                    <div class="price-original text-xl">${originalPrice}</div>
                    <div class="price-campaign">${campaignPrice}</div>
                    <div class="text-red-600 font-semibold">חסכון ${discount}%</div>
                </div>
                
                ${product.campaign_id ? `
                    <div class="countdown-timer rounded-lg p-3 mb-4 text-center" id="countdown-${product.campaign_id}">
                        <i class="fas fa-clock ml-2"></i>
                        <span class="font-bold">טוען...</span>
                    </div>
                ` : ''}
                
                <a href="/product/${product.id}" class="luxury-btn w-full py-3 rounded-lg text-center font-semibold">
                    הצטרף עכשיו
                </a>
            </div>
        </div>
    `;
}

function formatPrice(agorot) {
    const ils = agorot / 100;
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(ils);
}

function startCountdown(campaignId, endDate) {
    const countdownElement = document.getElementById(`countdown-${campaignId}`);
    if (!countdownElement) return;
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const end = new Date(endDate).getTime();
        const distance = end - now;
        
        if (distance < 0) {
            countdownElement.innerHTML = '<span class="text-red-600 font-bold">הסתיים</span>';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        let html = '<i class="fas fa-clock ml-2"></i>';
        if (days > 0) {
            html += `<span class="font-bold">${days} ימים ${hours} שעות</span>`;
        } else if (hours > 0) {
            html += `<span class="font-bold">${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>`;
        } else {
            html += `<span class="font-bold text-red-600">${minutes}:${seconds.toString().padStart(2, '0')}</span>`;
        }
        
        countdownElement.innerHTML = html;
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

async function loadDashboard() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await axios.get(`${API_BASE}/user/dashboard`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            const data = response.data.data;
            renderDashboard(data);
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
    }
}

function renderDashboard(data) {
    const container = document.getElementById('dashboard-content');
    
    const hasMembership = data.membership && data.membership.status === 'active';
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="luxury-card rounded-xl p-6">
                <h3 class="text-xl font-semibold mb-2">סטטוס מנוי</h3>
                <p class="text-3xl font-bold ${hasMembership ? 'text-green-500' : 'text-red-500'}">
                    ${hasMembership ? 'פעיל ✓' : 'לא פעיל'}
                </p>
                ${!hasMembership ? '<a href="/membership" class="luxury-btn inline-block mt-4 px-6 py-2 rounded-lg">הירשם למנוי</a>' : ''}
            </div>
            
            <div class="luxury-card rounded-xl p-6">
                <h3 class="text-xl font-semibold mb-2">קמפיינים</h3>
                <p class="text-3xl font-bold text-red-600">${data.campaigns.length}</p>
            </div>
            
            <div class="luxury-card rounded-xl p-6">
                <h3 class="text-xl font-semibold mb-2">פרופיל</h3>
                <p class="text-lg">${data.user.first_name} ${data.user.last_name}</p>
                <p class="text-gray-400">${data.user.email}</p>
            </div>
        </div>
        
        <div class="luxury-card rounded-xl p-6">
            <h3 class="text-2xl font-bold mb-6">הקמפיינים שלי</h3>
            ${data.campaigns.length > 0 ? `
                <div class="space-y-4">
                    ${data.campaigns.map(campaign => `
                        <div class="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                            <img src="${campaign.product_image}" class="w-20 h-20 object-cover rounded-lg">
                            <div class="flex-1">
                                <h4 class="font-bold text-lg">${campaign.product_title}</h4>
                                <p class="text-gray-400">כמות: ${campaign.quantity}</p>
                                <p class="text-gray-400">סטטוס: ${campaign.status}</p>
                            </div>
                            <div class="text-left">
                                <p class="text-2xl font-bold text-red-600">${formatPrice(campaign.total_amount)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-gray-400 text-center py-8">עדיין לא הצטרפת לקמפיינים</p>'}
        </div>
        
        <div class="mt-6 text-center">
            <button onclick="logout()" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-sign-out-alt ml-2"></i> התנתק
            </button>
        </div>
    `;
}

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

async function loadAdminPanel() {
    if (!authToken) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await axios.get(`${API_BASE}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            renderAdminPanel(response.data.data);
        }
    } catch (error) {
        console.error('Failed to load admin panel:', error);
        if (error.response?.status === 403) {
            alert('אין לך הרשאות מנהל');
            window.location.href = '/';
        }
    }
}

function renderAdminPanel(data) {
    const container = document.getElementById('admin-content');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-900 rounded-xl p-6 border border-red-600">
                <h3 class="text-lg font-semibold mb-2">משתמשים</h3>
                <p class="text-4xl font-bold text-red-600">${data.stats.totalUsers}</p>
            </div>
            <div class="bg-gray-900 rounded-xl p-6 border border-red-600">
                <h3 class="text-lg font-semibold mb-2">מנויים פעילים</h3>
                <p class="text-4xl font-bold text-red-600">${data.stats.activeMembers}</p>
            </div>
            <div class="bg-gray-900 rounded-xl p-6 border border-red-600">
                <h3 class="text-lg font-semibold mb-2">קמפיינים פעילים</h3>
                <p class="text-4xl font-bold text-red-600">${data.stats.activeCampaigns}</p>
            </div>
            <div class="bg-gray-900 rounded-xl p-6 border border-red-600">
                <h3 class="text-lg font-semibold mb-2">הכנסות</h3>
                <p class="text-3xl font-bold text-red-600">${formatPrice(data.stats.totalRevenue || 0)}</p>
            </div>
        </div>
        
        <div class="bg-gray-900 rounded-xl p-6 border border-red-600">
            <h3 class="text-2xl font-bold mb-6">קמפיינים אחרונים</h3>
            <div class="space-y-4">
                ${data.recentCampaigns.map(campaign => `
                    <div class="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-lg">${campaign.product_title}</h4>
                            <p class="text-gray-400">משתתפים: ${campaign.participants_count || 0}</p>
                        </div>
                        <div>
                            <p class="text-xl font-bold text-red-600">${formatPrice(campaign.total_revenue || 0)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mt-6 text-center">
            <button onclick="logout()" class="text-gray-400 hover:text-red-600">
                <i class="fas fa-sign-out-alt ml-2"></i> התנתק
            </button>
        </div>
    `;
}
