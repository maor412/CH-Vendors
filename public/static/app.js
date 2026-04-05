// CH Vendors Sales - Frontend JavaScript
const API_BASE = '/api';
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ============================================
// AUTH
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
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'מתחבר...'; }
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.data.token);
            // Redirect back to where user came from, or homepage
            const returnTo = new URLSearchParams(window.location.search).get('return') || '/';
            window.location.href = returnTo;
        }
    } catch (error) {
        if (btn) { btn.disabled = false; btn.textContent = 'התחבר'; }
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
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'נרשם...'; }
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, { first_name, last_name, email, phone, password });
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.data.token);
            const returnTo = new URLSearchParams(window.location.search).get('return') || '/';
            window.location.href = returnTo;
        }
    } catch (error) {
        if (btn) { btn.disabled = false; btn.textContent = 'הירשם'; }
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

function showUserMenu() {
    const isAdmin = currentUser?.is_admin;
    const menu = document.createElement('div');
    menu.id = 'user-dropdown';
    menu.className = 'fixed top-16 left-4 bg-gray-900 border border-red-900/50 rounded-xl shadow-2xl z-50 min-w-48 p-2';
    menu.innerHTML = `
        <div class="px-4 py-2 border-b border-gray-700 mb-2">
            <p class="font-bold">${currentUser?.first_name} ${currentUser?.last_name}</p>
            <p class="text-gray-400 text-sm">${currentUser?.email}</p>
        </div>
        <a href="/dashboard" class="block px-4 py-2 hover:bg-gray-800 rounded-lg text-white"><i class="fas fa-tachometer-alt ml-2 text-red-600"></i>לוח בקרה</a>
        ${isAdmin ? '<a href="/admin" class="block px-4 py-2 hover:bg-gray-800 rounded-lg text-white"><i class="fas fa-cog ml-2 text-red-600"></i>פאנל ניהול</a>' : ''}
        <button onclick="logout()" class="block w-full text-right px-4 py-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-600 mt-2 border-t border-gray-700 pt-2">
            <i class="fas fa-sign-out-alt ml-2"></i>התנתק
        </button>
    `;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
}

// ============================================
// HOMEPAGE
// ============================================

async function loadHomepage() {
    await Promise.all([loadFeaturedProducts(), loadClosingSoonProducts(), loadCategories()]);
}

async function loadFeaturedProducts() {
    try {
        const response = await axios.get(`${API_BASE}/products/featured/campaigns`);
        if (response.data.success) {
            const container = document.getElementById('featured-products');
            const products = response.data.data;
            if (!products.length) {
                container.innerHTML = '<p class="text-gray-400 text-center col-span-3 py-8">אין קמפיינים פעילים כרגע</p>';
                return;
            }
            container.innerHTML = products.map(p => createProductCard(p)).join('');
            products.forEach(p => { if (p.campaign_id) startCountdown(p.campaign_id, p.end_date); });
        }
    } catch (error) { console.error('Failed to load featured:', error); }
}

async function loadClosingSoonProducts() {
    try {
        const response = await axios.get(`${API_BASE}/products/closing-soon/campaigns`);
        if (response.data.success) {
            const container = document.getElementById('closing-soon-products');
            const products = response.data.data;
            if (!products.length) {
                container.innerHTML = '<p class="text-gray-400 text-center col-span-4 py-8">אין קמפיינים הנסגרים בקרוב</p>';
                return;
            }
            container.innerHTML = products.map(p => createProductCard(p, true)).join('');
            products.forEach(p => { if (p.campaign_id) startCountdown(p.campaign_id, p.end_date); });
        }
    } catch (error) { console.error('Failed to load closing soon:', error); }
}

async function loadCategories() {
    try {
        const response = await axios.get(`${API_BASE}/products/categories/list`);
        if (response.data.success) {
            const container = document.getElementById('categories');
            container.innerHTML = response.data.data.map(category => `
                <a href="/products?category=${category.slug}" class="luxury-card rounded-xl p-6 text-center hover:scale-105 transition block">
                    <h3 class="text-2xl font-bold">${category.name}</h3>
                </a>
            `).join('');
        }
    } catch (error) { console.error('Failed to load categories:', error); }
}

// ============================================
// PRODUCT CARD
// ============================================

function createProductCard(product, isSmall = false) {
    const originalPrice = formatPrice(product.original_price);
    const campaignPrice = formatPrice(product.campaign_price);
    const discount = product.discount_percentage || 0;
    const cardHeight = isSmall ? '' : 'min-h-[480px]';

    return `
        <div class="luxury-card rounded-xl overflow-hidden flex flex-col ${cardHeight}">
            ${product.time_remaining && product.time_remaining < 86400000 ?
                '<div class="badge-closing px-4 py-2 text-center text-white font-bold text-sm animate-pulse">🔥 נסגר בקרוב!</div>' : ''}
            <div class="${isSmall ? 'h-48' : 'h-56'} bg-cover bg-center bg-gray-800 flex items-center justify-center" style="background-image: url('${product.image_url || ''}')">
                ${!product.image_url ? '<i class="fas fa-gem text-5xl text-red-900"></i>' : ''}
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-xl font-bold mb-1">${product.title}</h3>
                <p class="text-gray-400 text-sm mb-3 flex-1 line-clamp-2">${product.description || ''}</p>
                <div class="mb-3">
                    <span class="price-original text-base">${originalPrice}</span>
                    ${discount > 0 ? `<span class="mr-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">-${discount}%</span>` : ''}
                    <div class="price-campaign text-2xl">${campaignPrice}</div>
                </div>
                ${product.campaign_id ? `
                    <div class="countdown-timer rounded-lg p-2 mb-3 text-center text-sm" id="countdown-${product.campaign_id}">
                        <i class="fas fa-clock ml-1 text-xs"></i><span>טוען...</span>
                    </div>
                ` : '<div class="text-gray-500 text-sm mb-3">אין קמפיין פעיל</div>'}
                <a href="/product/${product.id}" class="luxury-btn w-full py-2.5 rounded-lg text-center text-white font-semibold text-sm block">
                    <i class="fas fa-eye ml-1"></i>צפה והצטרף
                </a>
            </div>
        </div>
    `;
}

// ============================================
// PRODUCT PAGE (join flow)
// ============================================

async function loadProductPage(productId) {
    const container = document.getElementById('product-container');
    try {
        const res = await axios.get(`${API_BASE}/products/${productId}`);
        if (!res.data.success) {
            container.innerHTML = '<p class="text-red-400 text-center py-20">מוצר לא נמצא</p>'; return;
        }
        const p = res.data.data;
        const discount = p.original_price > 0 ? Math.round((1 - p.campaign_price / p.original_price) * 100) : 0;
        const hasCampaign = p.campaign_id && p.end_date;
        document.title = p.title + ' - CH Vendors Sales';

        container.innerHTML = `
            <a href="javascript:history.back()" class="text-gray-400 hover:text-white mb-8 inline-block transition">
                <i class="fas fa-arrow-right ml-2"></i>חזרה
            </a>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                <!-- Image -->
                <div class="luxury-card rounded-2xl overflow-hidden flex items-center justify-center min-h-72 bg-gray-900">
                    ${p.image_url
                        ? `<img src="${p.image_url}" alt="${p.title}" class="w-full object-contain max-h-[420px] p-4">`
                        : '<div class="text-center text-gray-700 p-12"><i class="fas fa-gem text-8xl mb-4"></i></div>'}
                </div>
                <!-- Info -->
                <div class="space-y-5">
                    ${p.category_name ? `<span class="text-red-600 text-sm font-bold uppercase tracking-widest">${p.category_name}</span>` : ''}
                    <h1 class="text-4xl font-black leading-tight">${p.title}</h1>
                    <p class="text-gray-400 text-lg leading-relaxed">${p.description || ''}</p>
                    <!-- Price box -->
                    <div class="luxury-card rounded-2xl p-6">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="text-gray-500 line-through text-lg">${formatPrice(p.original_price)}</span>
                            ${discount > 0 ? `<span class="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">חסכון ${discount}%</span>` : ''}
                        </div>
                        <div class="text-4xl font-black text-red-600">${formatPrice(p.campaign_price)}</div>
                        ${p.fixed_shipping_cost > 0
                            ? `<p class="text-gray-400 text-sm mt-1">+ משלוח ${formatPrice(p.fixed_shipping_cost)}</p>`
                            : '<p class="text-green-500 text-sm mt-2"><i class="fas fa-check ml-1"></i>משלוח חינם</p>'}
                    </div>
                    <!-- Countdown -->
                    ${hasCampaign ? `
                        <div class="countdown-timer rounded-xl p-4 text-center">
                            <p class="text-gray-400 text-xs mb-1 uppercase tracking-widest">הקמפיין נסגר בעוד</p>
                            <div id="countdown-${p.campaign_id}" class="text-2xl font-bold text-red-400">טוען...</div>
                        </div>
                    ` : `<div class="luxury-card rounded-xl p-4 text-center text-gray-500">אין קמפיין פעיל כרגע</div>`}
                    <!-- Join button -->
                    ${hasCampaign
                        ? `<button id="join-btn" onclick="openJoinModal(${p.campaign_id}, ${productId}, '${p.title}', ${p.campaign_price}, ${p.fixed_shipping_cost || 0})"
                                class="luxury-btn w-full py-4 rounded-xl text-white font-bold text-xl">
                                <i class="fas fa-bolt ml-2"></i>הצטרף לקמפיין
                           </button>`
                        : ''}
                    <!-- Variants -->
                    ${p.variants && p.variants.length > 0 ? `
                        <div class="luxury-card rounded-xl p-4">
                            <p class="font-semibold mb-3">אפשרויות זמינות:</p>
                            <div class="flex flex-wrap gap-2">
                                ${p.variants.map(v => `
                                    <button onclick="selectVariant(this, ${v.id})"
                                        class="variant-btn px-4 py-2 border border-gray-600 rounded-lg text-sm hover:border-red-600 transition"
                                        data-variant-id="${v.id}">
                                        ${v.variant_value}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            ${p.long_description ? `
                <div class="luxury-card rounded-2xl p-8 mt-12">
                    <h2 class="text-2xl font-bold mb-4">תיאור מפורט</h2>
                    <p class="text-gray-300 leading-relaxed whitespace-pre-line">${p.long_description}</p>
                </div>
            ` : ''}
        `;

        if (hasCampaign) startCountdown(p.campaign_id, p.end_date);
    } catch (e) {
        container.innerHTML = '<p class="text-red-400 text-center py-20">שגיאה בטעינת המוצר</p>';
    }
}

let selectedVariantId = null;

function selectVariant(btn, variantId) {
    document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('border-red-600', 'bg-red-900/20'));
    btn.classList.add('border-red-600', 'bg-red-900/20');
    selectedVariantId = variantId;
}

// ============================================
// JOIN MODAL
// ============================================

async function openJoinModal(campaignId, productId, productTitle, campaignPrice, shippingCost) {
    // Check auth
    if (!authToken) {
        window.location.href = '/login?return=' + encodeURIComponent(window.location.pathname);
        return;
    }
    // Check membership
    try {
        const memRes = await axios.get(`${API_BASE}/membership/status`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!memRes.data.data?.isActive) {
            showToast('נדרש מנוי פעיל כדי להצטרף לקמפיין', 'error');
            setTimeout(() => window.location.href = '/membership', 1500);
            return;
        }
    } catch (e) {
        window.location.href = '/login?return=' + encodeURIComponent(window.location.pathname);
        return;
    }
    // Load addresses
    let addresses = [];
    try {
        const addrRes = await axios.get(`${API_BASE}/user/addresses`, { headers: { Authorization: `Bearer ${authToken}` } });
        addresses = addrRes.data.data || [];
    } catch (e) {}

    const totalPerUnit = campaignPrice + shippingCost;
    const modal = document.createElement('div');
    modal.id = 'join-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="closeJoinModal()"></div>
        <div class="relative bg-gray-900 border border-red-900/50 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <button onclick="closeJoinModal()" class="absolute top-4 left-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h2 class="text-2xl font-bold mb-1">הצטרפות לקמפיין</h2>
            <p class="text-gray-400 mb-6">${productTitle}</p>

            <!-- Quantity -->
            <div class="mb-5">
                <label class="block text-gray-300 mb-2 font-semibold">כמות</label>
                <div class="flex items-center gap-4">
                    <button onclick="changeQty(-1)" class="w-10 h-10 rounded-full border border-gray-600 text-xl hover:border-red-600 transition">−</button>
                    <span id="qty-display" class="text-2xl font-bold w-8 text-center">1</span>
                    <button onclick="changeQty(1)" class="w-10 h-10 rounded-full border border-gray-600 text-xl hover:border-red-600 transition">+</button>
                    <span class="text-gray-400 text-sm mr-4">סה"כ: <span id="total-display" class="text-white font-bold">${formatPrice(totalPerUnit)}</span></span>
                </div>
            </div>

            <!-- Address -->
            <div class="mb-5">
                <label class="block text-gray-300 mb-2 font-semibold">כתובת משלוח</label>
                ${addresses.length > 0 ? `
                    <select id="address-select" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none mb-3">
                        ${addresses.map(a => `<option value="${a.id}">${a.street}, ${a.city}${a.postal_code ? ' ' + a.postal_code : ''}</option>`).join('')}
                        <option value="new">+ הוסף כתובת חדשה</option>
                    </select>
                ` : ''}
                <div id="new-address-form" class="${addresses.length > 0 ? 'hidden' : ''}">
                    <input id="addr-street" type="text" placeholder="רחוב ומספר בית *" required
                        class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none mb-2">
                    <div class="grid grid-cols-2 gap-2">
                        <input id="addr-city" type="text" placeholder="עיר *" required
                            class="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
                        <input id="addr-zip" type="text" placeholder="מיקוד"
                            class="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-red-600 focus:outline-none">
                    </div>
                </div>
            </div>

            <!-- Consents -->
            <div class="mb-6 space-y-3 bg-gray-800/50 rounded-xl p-4">
                <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" id="agree-terms" class="mt-1 accent-red-600">
                    <span class="text-gray-300 text-sm">קראתי ואני מסכים ל<a href="/legal/terms" target="_blank" class="text-red-500 hover:underline">תנאי השימוש</a></span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" id="agree-cancel" class="mt-1 accent-red-600">
                    <span class="text-gray-300 text-sm">קראתי ואני מסכים ל<a href="/legal/cancellation" target="_blank" class="text-red-500 hover:underline">מדיניות הביטול</a></span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" id="agree-charge" class="mt-1 accent-red-600">
                    <span class="text-gray-300 text-sm">אני מאשר חיוב כרטיס האשראי שלי בסך <strong class="text-white" id="charge-amount">${formatPrice(totalPerUnit)}</strong> בסגירת הקמפיין</span>
                </label>
            </div>

            <div id="join-error" class="hidden bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm"></div>

            <button id="confirm-join-btn" onclick="confirmJoin(${campaignId}, ${productId}, ${totalPerUnit})"
                class="luxury-btn w-full py-4 rounded-xl text-white font-bold text-lg">
                <i class="fas fa-check ml-2"></i>אישור הצטרפות
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle address dropdown change
    const sel = document.getElementById('address-select');
    if (sel) {
        sel.addEventListener('change', () => {
            document.getElementById('new-address-form').classList.toggle('hidden', sel.value !== 'new');
        });
    }

    // Store per-unit price for quantity update
    modal._pricePerUnit = totalPerUnit;
}

let _currentQty = 1;

function changeQty(delta) {
    _currentQty = Math.max(1, Math.min(10, _currentQty + delta));
    document.getElementById('qty-display').textContent = _currentQty;
    const modal = document.getElementById('join-modal');
    if (modal) {
        const total = modal._pricePerUnit * _currentQty;
        document.getElementById('total-display').textContent = formatPrice(total);
        document.getElementById('charge-amount').textContent = formatPrice(total);
    }
}

function closeJoinModal() {
    const modal = document.getElementById('join-modal');
    if (modal) modal.remove();
    _currentQty = 1;
}

async function confirmJoin(campaignId, productId, pricePerUnit) {
    const btn = document.getElementById('confirm-join-btn');
    const errorDiv = document.getElementById('join-error');
    errorDiv.classList.add('hidden');

    // Validate consents
    if (!document.getElementById('agree-terms').checked) {
        errorDiv.textContent = 'יש לאשר את תנאי השימוש'; errorDiv.classList.remove('hidden'); return;
    }
    if (!document.getElementById('agree-cancel').checked) {
        errorDiv.textContent = 'יש לאשר את מדיניות הביטול'; errorDiv.classList.remove('hidden'); return;
    }
    if (!document.getElementById('agree-charge').checked) {
        errorDiv.textContent = 'יש לאשר את החיוב'; errorDiv.classList.remove('hidden'); return;
    }

    // Get or create address
    let addressId = null;
    const addressSelect = document.getElementById('address-select');
    if (addressSelect && addressSelect.value && addressSelect.value !== 'new') {
        addressId = parseInt(addressSelect.value);
    } else {
        // Create new address
        const street = document.getElementById('addr-street')?.value?.trim();
        const city = document.getElementById('addr-city')?.value?.trim();
        const zip = document.getElementById('addr-zip')?.value?.trim();
        if (!street || !city) {
            errorDiv.textContent = 'יש להזין רחוב ועיר'; errorDiv.classList.remove('hidden'); return;
        }
        try {
            const addrRes = await axios.post(`${API_BASE}/user/addresses`,
                { street, city, zip_code: zip || null, is_default: true },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (!addrRes.data.success) {
                errorDiv.textContent = addrRes.data.error || 'שגיאה בשמירת כתובת'; errorDiv.classList.remove('hidden'); return;
            }
            addressId = addrRes.data.data.id;
        } catch (e) {
            errorDiv.textContent = 'שגיאה בשמירת כתובת'; errorDiv.classList.remove('hidden'); return;
        }
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>מצטרף...';

    try {
        const joinRes = await axios.post(`${API_BASE}/user/campaigns/join`, {
            campaign_window_id: campaignId,
            product_id: productId,
            quantity: _currentQty,
            variant_id: selectedVariantId || null,
            address_id: addressId,
            agree_terms: true,
            agree_cancellation: true,
            agree_charge: true
        }, { headers: { Authorization: `Bearer ${authToken}` } });

        if (joinRes.data.success) {
            closeJoinModal();
            showSuccessModal(joinRes.data.message || 'הצטרפת לקמפיין בהצלחה!');
        } else {
            errorDiv.textContent = joinRes.data.error || 'שגיאה בהצטרפות';
            errorDiv.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check ml-2"></i>אישור הצטרפות';
        }
    } catch (e) {
        errorDiv.textContent = e.response?.data?.error || 'שגיאה בהצטרפות לקמפיין';
        errorDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check ml-2"></i>אישור הצטרפות';
    }
}

function showSuccessModal(message) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80"></div>
        <div class="relative bg-gray-900 border border-green-500/50 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
            <div class="text-7xl mb-4">🎉</div>
            <h2 class="text-3xl font-black text-white mb-3">${message}</h2>
            <p class="text-gray-400 mb-8">נרשמת לקמפיין. לאחר סגירתו תקבל עדכון.</p>
            <div class="flex gap-4 justify-center">
                <a href="/dashboard" class="luxury-btn px-8 py-3 rounded-xl text-white font-bold">לוח הבקרה שלי</a>
                <a href="/" onclick="this.closest('.fixed').remove()" class="px-8 py-3 rounded-xl border border-gray-600 text-white hover:border-red-600 transition font-bold">המשך קנייה</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================
// TOAST
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = { info: 'bg-gray-800 border-gray-600', error: 'bg-red-900/80 border-red-600', success: 'bg-green-900/80 border-green-600' };
    toast.className = `fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl border ${colors[type]} text-white text-center shadow-2xl transition-all`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ============================================
// UTILITIES
// ============================================

function formatPrice(agorot) {
    const ils = agorot / 100;
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(ils);
}

function startCountdown(campaignId, endDate) {
    const el = document.getElementById(`countdown-${campaignId}`);
    if (!el) return;
    const update = () => {
        const distance = new Date(endDate).getTime() - Date.now();
        if (distance < 0) { el.innerHTML = '<span class="text-red-600">הסתיים</span>'; return; }
        const days = Math.floor(distance / 86400000);
        const hours = Math.floor((distance % 86400000) / 3600000);
        const mins = Math.floor((distance % 3600000) / 60000);
        const secs = Math.floor((distance % 60000) / 1000);
        if (days > 0) el.innerHTML = `${days}ד׳ ${hours}ש׳ ${String(mins).padStart(2,'0')}ד`;
        else if (hours > 0) el.innerHTML = `${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        else el.innerHTML = `<span class="text-red-500 font-black">${mins}:${String(secs).padStart(2,'0')}</span>`;
    };
    update();
    setInterval(update, 1000);
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    if (!authToken) { window.location.href = '/login'; return; }
    try {
        const response = await axios.get(`${API_BASE}/user/dashboard`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.data.success) renderDashboard(response.data.data);
    } catch (error) {
        if (error.response?.status === 401) { logout(); }
    }
}

function renderDashboard(data) {
    const container = document.getElementById('dashboard-content');
    const isActive = data.membership?.status === 'active' &&
        data.membership?.end_date &&
        new Date(data.membership.end_date) > new Date();
    const endDate = data.membership?.end_date ? new Date(data.membership.end_date).toLocaleDateString('he-IL') : '';

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="luxury-card rounded-2xl p-6">
                <h3 class="text-gray-400 text-sm font-semibold uppercase mb-3">סטטוס מנוי</h3>
                <p class="text-3xl font-bold ${isActive ? 'text-green-400' : 'text-red-500'}">
                    ${isActive ? '✓ פעיל' : '✗ לא פעיל'}
                </p>
                ${isActive ? `<p class="text-gray-400 text-sm mt-1">בתוקף עד ${endDate}</p>` : ''}
                ${!isActive ? `<a href="/membership" class="luxury-btn inline-block mt-3 px-5 py-2 rounded-lg text-white text-sm">הרשם למנוי</a>` : ''}
            </div>
            <div class="luxury-card rounded-2xl p-6">
                <h3 class="text-gray-400 text-sm font-semibold uppercase mb-3">קמפיינים שהצטרפתי</h3>
                <p class="text-5xl font-black text-red-600">${data.campaigns.length}</p>
            </div>
            <div class="luxury-card rounded-2xl p-6">
                <h3 class="text-gray-400 text-sm font-semibold uppercase mb-3">פרטים אישיים</h3>
                <p class="font-bold text-lg">${data.user.first_name} ${data.user.last_name}</p>
                <p class="text-gray-400 text-sm">${data.user.email}</p>
                <p class="text-gray-400 text-sm">${data.user.phone || ''}</p>
            </div>
        </div>

        <!-- Quick actions -->
        <div class="flex flex-wrap gap-3 mb-8">
            <a href="/products" class="luxury-btn px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
                <i class="fas fa-shopping-bag ml-2"></i>גלה קמפיינים חדשים
            </a>
            <a href="/membership" class="px-6 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:border-red-600 transition text-sm font-semibold">
                <i class="fas fa-crown ml-2"></i>ניהול מנוי
            </a>
        </div>

        <!-- Campaigns list -->
        <div class="luxury-card rounded-2xl p-6">
            <h3 class="text-2xl font-bold mb-6">הקמפיינים שלי</h3>
            ${data.campaigns.length > 0 ? `
                <div class="space-y-4">
                    ${data.campaigns.map(c => `
                        <div class="bg-gray-800/70 rounded-xl p-5 flex items-center gap-5">
                            ${c.product_image
                                ? `<img src="${c.product_image}" class="w-20 h-20 object-cover rounded-xl flex-shrink-0">`
                                : `<div class="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0"><i class="fas fa-gem text-2xl text-red-900"></i></div>`}
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-lg mb-1 truncate">${c.product_title}</h4>
                                <div class="flex flex-wrap gap-3 text-sm text-gray-400">
                                    <span>כמות: <strong class="text-white">${c.quantity}</strong></span>
                                    <span class="${c.status === 'pending' ? 'text-yellow-400' : c.status === 'confirmed' ? 'text-green-400' : 'text-gray-400'}">
                                        ● ${c.status === 'pending' ? 'ממתין' : c.status === 'confirmed' ? 'מאושר' : c.status}
                                    </span>
                                    ${c.street ? `<span>📦 ${c.street}, ${c.city}</span>` : ''}
                                </div>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <p class="text-2xl font-bold text-red-500">${formatPrice(c.total_amount)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-12">
                    <i class="fas fa-shopping-bag text-5xl text-gray-700 mb-4"></i>
                    <p class="text-gray-400 text-lg mb-4">עדיין לא הצטרפת לקמפיינים</p>
                    <a href="/products" class="luxury-btn px-8 py-3 rounded-xl text-white font-bold inline-block">גלה מוצרים עכשיו</a>
                </div>
            `}
        </div>
        <div class="mt-6 text-center">
            <button onclick="logout()" class="text-gray-500 hover:text-red-600 text-sm transition">
                <i class="fas fa-sign-out-alt ml-2"></i>התנתק
            </button>
        </div>
    `;
}

// ============================================
// ADMIN PANEL
// ============================================

async function loadAdminPanel() {
    if (!authToken) { window.location.href = '/login'; return; }
    try {
        const response = await axios.get(`${API_BASE}/admin/dashboard`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.data.success) renderAdminPanel(response.data.data);
    } catch (error) {
        if (error.response?.status === 403) { alert('אין לך הרשאות מנהל'); window.location.href = '/'; }
        else if (error.response?.status === 401) { logout(); }
    }
}

function renderAdminPanel(data) {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            ${[['משתמשים', data.stats.totalUsers, 'fa-users'], ['מנויים פעילים', data.stats.activeMembers, 'fa-crown'], ['קמפיינים פעילים', data.stats.activeCampaigns, 'fa-fire'], ['הכנסות', formatPrice(data.stats.totalRevenue || 0), 'fa-shekel-sign']].map(([label, val, icon]) => `
                <div class="bg-gray-900 rounded-2xl p-5 border border-red-900/40">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas ${icon} text-red-600"></i>
                        <h3 class="text-gray-400 text-sm font-semibold">${label}</h3>
                    </div>
                    <p class="text-3xl font-black text-white">${val}</p>
                </div>
            `).join('')}
        </div>
        <div class="flex flex-wrap gap-3 mb-6">
            <button onclick="adminShowSection('campaigns')" class="admin-tab luxury-btn px-5 py-2 rounded-xl text-white text-sm font-semibold">קמפיינים</button>
            <button onclick="adminShowSection('products')" class="admin-tab px-5 py-2 rounded-xl border border-gray-600 text-gray-300 hover:border-red-600 transition text-sm font-semibold">מוצרים</button>
            <button onclick="adminShowSection('users')" class="admin-tab px-5 py-2 rounded-xl border border-gray-600 text-gray-300 hover:border-red-600 transition text-sm font-semibold">משתמשים</button>
        </div>
        <div id="admin-section">
            ${renderAdminCampaigns(data.recentCampaigns)}
        </div>
        <div class="mt-6 text-center">
            <button onclick="logout()" class="text-gray-500 hover:text-red-600 text-sm transition"><i class="fas fa-sign-out-alt ml-2"></i>התנתק</button>
        </div>
    `;
}

function renderAdminCampaigns(campaigns) {
    return `
        <div class="bg-gray-900 rounded-2xl p-6 border border-red-900/40">
            <h3 class="text-xl font-bold mb-5">קמפיינים פעילים</h3>
            ${campaigns.length ? `
                <div class="space-y-3">
                    ${campaigns.map(c => `
                        <div class="bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div>
                                <h4 class="font-bold">${c.product_title}</h4>
                                <p class="text-gray-400 text-sm">משתתפים: ${c.participants_count || 0} | הכנסה: ${formatPrice(c.total_revenue || 0)}</p>
                                <p class="text-gray-500 text-xs">עד: ${new Date(c.end_date).toLocaleDateString('he-IL')}</p>
                            </div>
                            <button onclick="adminCloseCampaign(${c.id})" class="px-4 py-2 bg-red-900/40 hover:bg-red-900/70 border border-red-700 rounded-xl text-sm text-white transition flex-shrink-0">
                                סגור קמפיין
                            </button>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-gray-400 text-center py-6">אין קמפיינים פעילים</p>'}
        </div>
    `;
}

async function adminShowSection(section) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.remove('luxury-btn');
        t.classList.add('border', 'border-gray-600', 'text-gray-300');
    });
    event.target.classList.add('luxury-btn');
    event.target.classList.remove('border', 'border-gray-600', 'text-gray-300');

    const el = document.getElementById('admin-section');
    el.innerHTML = '<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-red-600"></i></div>';
    try {
        if (section === 'campaigns') {
            const r = await axios.get(`${API_BASE}/admin/campaigns`, { headers: { Authorization: `Bearer ${authToken}` } });
            el.innerHTML = renderAdminCampaigns(r.data.data || []);
        } else if (section === 'products') {
            const r = await axios.get(`${API_BASE}/admin/products`, { headers: { Authorization: `Bearer ${authToken}` } });
            el.innerHTML = `<div class="bg-gray-900 rounded-2xl p-6 border border-red-900/40">
                <h3 class="text-xl font-bold mb-5">מוצרים (${r.data.data?.length || 0})</h3>
                <div class="space-y-2">${(r.data.data || []).map(p => `
                    <div class="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                        <div><h4 class="font-bold">${p.title}</h4><p class="text-gray-400 text-sm">${formatPrice(p.campaign_price)} | ${p.is_active ? '✓ פעיל' : '✗ לא פעיל'}</p></div>
                    </div>`).join('')}
                </div></div>`;
        } else if (section === 'users') {
            const r = await axios.get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${authToken}` } });
            el.innerHTML = `<div class="bg-gray-900 rounded-2xl p-6 border border-red-900/40">
                <h3 class="text-xl font-bold mb-5">משתמשים (${r.data.data?.length || 0})</h3>
                <div class="space-y-2">${(r.data.data || []).map(u => `
                    <div class="bg-gray-800 rounded-xl p-3 flex items-center justify-between text-sm">
                        <span>${u.first_name} ${u.last_name} — <span class="text-gray-400">${u.email}</span></span>
                        <span class="${u.membership_status === 'active' ? 'text-green-400' : 'text-gray-500'}">${u.membership_status === 'active' ? '✓ מנוי' : 'אין מנוי'}</span>
                    </div>`).join('')}
                </div></div>`;
        }
    } catch (e) { el.innerHTML = '<p class="text-red-400 text-center py-6">שגיאה בטעינת הנתונים</p>'; }
}

async function adminCloseCampaign(campaignId) {
    if (!confirm('האם לסגור את הקמפיין? לא ניתן לבטל פעולה זו.')) return;
    try {
        const r = await axios.post(`${API_BASE}/admin/campaigns/${campaignId}/close`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
        if (r.data.success) { showToast('הקמפיין נסגר בהצלחה', 'success'); setTimeout(() => adminShowSection('campaigns'), 1000); }
        else showToast(r.data.error || 'שגיאה בסגירת הקמפיין', 'error');
    } catch (e) { showToast('שגיאה בסגירת הקמפיין', 'error'); }
}
