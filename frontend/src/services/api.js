// API Service
// Tất cả API calls

// Get API base URL
export function getApiBaseUrl() {
    const envUrl =
        typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
    const fallback = 'http://localhost:8080/lumina_book';
    return (envUrl && String(envUrl).trim()) || fallback;
}

// Get stored token from localStorage or sessionStorage
export function getStoredToken(key = 'token') {
    try {
        const pick = (val) => {
            if (!val) return null;
            let t = String(val).trim();

            // Loại bỏ dấu ngoặc kép hoặc nháy đơn nếu có
            if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
                t = t.substring(1, t.length - 1);
            }

            // Nếu value là JSON, parse một lần
            if (t.startsWith('{') || t.startsWith('[')) {
                try {
                    const parsed = JSON.parse(t);
                    t = typeof parsed === 'string' ? parsed : '';
                } catch (_) { }
            }
            t = t.trim();
            // Remove accidental Bearer prefix and whitespace
            if (t.toLowerCase().startsWith('bearer ')) {
                t = t.slice(7);
            }
            return t.trim() || null;
        };
        const fromSession = pick(sessionStorage.getItem(key));
        if (fromSession) return fromSession;
        return pick(localStorage.getItem(key));
    } catch (_) {
        return null;
    }
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', body = null, token = null, isFormData = false } = options;
    const apiBaseUrl = getApiBaseUrl();
    const tokenToUse = token || getStoredToken('token');

    const headers = {};
    // Nếu không phải FormData, đặt Content-Type là application/json
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    if (tokenToUse) {
        headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    try {
        const resp = await fetch(`${apiBaseUrl}${endpoint}`, {
            method,
            headers,
            ...(body && { body: isFormData ? body : JSON.stringify(body) }),
        });
        const data = await resp.json().catch(() => ({}));
        return { ok: resp.ok, status: resp.status, data };
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        return { ok: false, status: 0, data: {}, error };
    }
}

// Helper to extract result from API response
const extractResult = (data, isArray = false) => {
    if (isArray) {
        return Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
    }
    return data?.result || data || null;
};

// ========== USER API ==========
export async function getMyInfo(token = null) {
    const { data } = await apiRequest('/users/my-info', { token });
    return extractResult(data);
}

export async function getAllUsers(token = null) {
    const { data } = await apiRequest('/users', { token });
    return extractResult(data, true);
}

export async function getUserById(userId, token = null) {
    const { data } = await apiRequest(`/users/${userId}`, { token });
    return extractResult(data);
}

export async function updateUser(userId, userData, token = null) {
    const { data } = await apiRequest(`/users/${userId}`, { method: 'PUT', body: userData, token });
    return extractResult(data);
}

export async function deleteUser(userId, token = null) {
    const { data, ok } = await apiRequest(`/users/${userId}`, { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function createStaff(staffData, token = null) {
    const { data } = await apiRequest('/users/staff', { method: 'POST', body: staffData, token });
    return extractResult(data);
}

export async function getUserRole(apiBaseUrl, token) {
    const { data } = await apiRequest('/users/my-info', { token });
    return (
        data?.result?.role?.name ||
        data?.role?.name ||
        data?.result?.role ||
        data?.role ||
        data?.result?.authorities?.[0]?.authority ||
        data?.authorities?.[0]?.authority ||
        null
    );
}

// ========== AUTH API ==========
export async function login(credentials) {
    const { data, ok } = await apiRequest('/auth/token', { method: 'POST', body: credentials });
    return { ok, data: extractResult(data) };
}

export async function register(userData) {
    const { data, ok } = await apiRequest('/users', { method: 'POST', body: userData });
    return { ok, data: extractResult(data) };
}

export async function refreshToken(token = null) {
    // Backend expects JSON body: { token: "<token>" }
    // Endpoint /auth/refresh đã được phép PUBLIC, nên không cần Authorization header.
    const tokenToUse = token || getStoredToken('token');
    const body = { token: tokenToUse };
    const { data, ok } = await apiRequest('/auth/refresh', { method: 'POST', body });
    return { ok, data: extractResult(data) };
}

export async function changePassword(passwordData, token = null) {
    const { data, ok } = await apiRequest('/auth/change-password', { method: 'POST', body: passwordData, token });
    return { ok, data };
}

export async function resetPassword(passwordData) {
    // passwordData có thể là { email } hoặc { email, otp, newPassword }
    const { data, ok } = await apiRequest('/auth/reset-password', { method: 'POST', body: passwordData });
    return { ok, data };
}

export async function sendOTP(email, mode) {
    const { data, ok } = await apiRequest(`/auth/send-otp?email=${encodeURIComponent(email)}&mode=${mode}`, { method: 'POST' });
    return { ok, data };
}

export async function verifyOTP(email, otp, mode) {
    const { data, ok } = await apiRequest('/auth/verify-otp', { method: 'POST', body: { email, otp, mode } });
    return { ok, data };
}

// ========== CATEGORIES API ==========
export async function getAllCategories(token = null) {
    const { data } = await apiRequest('/categories', { token });
    return extractResult(data, true);
}

export async function getActiveCategories(token = null) {
    const { data } = await apiRequest('/categories/active', { token });
    return extractResult(data, true);
}

export async function getRootCategories(token = null) {
    const { data } = await apiRequest('/categories/root', { token });
    return extractResult(data, true);
}

export async function getSubCategories(parentId, token = null) {
    const { data } = await apiRequest(`/categories/${parentId}/subcategories`, { token });
    return extractResult(data, true);
}

export async function getCategoryById(categoryId, token = null) {
    const { data } = await apiRequest(`/categories/${categoryId}`, { token });
    return extractResult(data);
}

export async function createCategory(categoryData, token = null) {
    const { data, ok } = await apiRequest('/categories', { method: 'POST', body: categoryData, token });
    return { ok, data: extractResult(data) };
}

export async function updateCategory(categoryId, categoryData, token = null) {
    const { data, ok } = await apiRequest(`/categories/${categoryId}`, { method: 'PUT', body: categoryData, token });
    return { ok, data: extractResult(data) };
}

export async function deleteCategory(categoryId, token = null) {
    const { data, ok } = await apiRequest(`/categories/${categoryId}`, { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

// ========== PRODUCTS API ==========
export async function getAllProducts(token = null) {
    const { data } = await apiRequest('/products', { token });
    return extractResult(data, true);
}

export async function getActiveProducts(token = null) {
    const { data } = await apiRequest('/products/active', { token });
    return extractResult(data, true);
}

export async function getProductById(productId, token = null) {
    const { data } = await apiRequest(`/products/${productId}`, { token });
    return extractResult(data);
}

// Get products by IDs (for displaying product names in promotions/vouchers)
export async function getProductsByIds(productIds, token = null) {
    if (!productIds || productIds.length === 0) return [];
    // Fetch all products and filter by IDs (backend doesn't have a bulk endpoint)
    const { data } = await apiRequest('/products', { token });
    const allProducts = extractResult(data, true) || [];
    return allProducts.filter(p => productIds.includes(p.id));
}

export async function getMyProducts(token = null) {
    const { data } = await apiRequest('/products/my-products', { token });
    return extractResult(data, true);
}

export async function getPendingProducts(token = null) {
    const { data } = await apiRequest('/products/pending', { token });
    return extractResult(data, true);
}

export async function getProductsByCategory(categoryId, token = null) {
    const { data } = await apiRequest(`/products/category/${categoryId}`, { token });
    return extractResult(data, true);
}

export async function searchProducts(keyword, token = null) {
    const { data } = await apiRequest(`/products/search?keyword=${encodeURIComponent(keyword)}`, { token });
    return extractResult(data, true);
}

export async function getProductsByPriceRange(minPrice, maxPrice, token = null) {
    const { data } = await apiRequest(`/products/price-range?minPrice=${minPrice}&maxPrice=${maxPrice}`, { token });
    return extractResult(data, true);
}

export async function createProduct(productData, token = null) {
    const { data, ok } = await apiRequest('/products', { method: 'POST', body: productData, token });
    return { ok, data: extractResult(data) };
}

export async function updateProduct(productId, productData, token = null) {
    const { data, ok } = await apiRequest(`/products/${productId}`, { method: 'PUT', body: productData, token });
    return { ok, data: extractResult(data) };
}

export async function approveProduct(approveData, token = null) {
    const { data, ok } = await apiRequest('/products/approve', { method: 'POST', body: approveData, token });
    return { ok, data: extractResult(data) };
}

export async function setProductDefaultMedia(productId, mediaUrl, token = null) {
    const { data, ok } = await apiRequest(`/products/${productId}/default-media?mediaUrl=${encodeURIComponent(mediaUrl)}`, { method: 'POST', token });
    return { ok, data: extractResult(data) };
}

// ========== MEDIA API ==========
export async function uploadMediaProfile(file, token = null) {
    const formData = new FormData();
    formData.append('file', file);
    const { data, ok } = await apiRequest('/media/upload', { method: 'POST', body: formData, token, isFormData: true });
    return { ok, data: extractResult(data) };
}

async function uploadMediaFiles(endpoint, file, token = null) {
    const formData = new FormData();
    // Backend expects 'files' part name
    // Support both single file and array of files
    if (Array.isArray(file)) {
        file.forEach((f) => formData.append('files', f));
    } else {
        formData.append('files', file);
    }
    const { data, ok, status } = await apiRequest(endpoint, {
        method: 'POST',
        body: formData,
        token,
        isFormData: true,
    });
    // API returns ApiResponse<List<String>> with result being array of URLs
    const urls = extractResult(data, true);
    const url = Array.isArray(urls) ? urls[0] : null;
    const message =
        data?.message ||
        data?.error ||
        (status && !ok ? `Upload failed with status ${status}` : null);
    return { ok, status, url, urls: Array.isArray(urls) ? urls : [], message };
}

export async function uploadProductMedia(file, token = null) {
    return uploadMediaFiles('/media/upload-product', file, token);
}

export async function uploadVoucherMedia(file, token = null) {
    return uploadMediaFiles('/media/upload-voucher', file, token);
}

export async function uploadPromotionMedia(file, token = null) {
    return uploadMediaFiles('/media/upload-promotion', file, token);
}

// ========== VOUCHER API ==========
export async function getStaffVouchers(token = null) {
    const { data } = await apiRequest('/vouchers/my', { token });
    return extractResult(data, true);
}

export async function getActiveVouchers(token = null) {
    const { data } = await apiRequest('/vouchers/active', { token });
    return extractResult(data, true);
}

export async function getVoucherById(voucherId, token = null) {
    const { data } = await apiRequest(`/vouchers/${voucherId}`, { token });
    return extractResult(data);
}

export async function createVoucher(voucherData, token = null) {
    const { data, ok } = await apiRequest('/vouchers', { method: 'POST', body: voucherData, token });
    return { ok, data: extractResult(data) };
}

export async function updateVoucher(voucherId, voucherData, token = null) {
    const { data, ok } = await apiRequest(`/vouchers/${voucherId}`, { method: 'PUT', body: voucherData, token });
    return { ok, data: extractResult(data) };
}

export async function deleteVoucher(voucherId, token = null) {
    const { data, ok } = await apiRequest(`/vouchers/${voucherId}`, { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function approveVoucher(approvalData, token = null) {
    const { data, ok } = await apiRequest('/vouchers/approve', { method: 'POST', body: approvalData, token });
    return { ok, data: extractResult(data) };
}

export async function getPendingVouchers(token = null) {
    const { data } = await apiRequest('/vouchers/pending', { token });
    return extractResult(data, true);
}

export async function getVouchersByStatus(status, token = null) {
    const { data } = await apiRequest(`/vouchers/status/${status}`, { token });
    return extractResult(data, true);
}

// ========== PROMOTION API ==========
export async function getStaffPromotions(token = null) {
    const { data } = await apiRequest('/promotions/my-promotions', { token });
    return extractResult(data, true);
}

export async function getActivePromotions(token = null) {
    const { data } = await apiRequest('/promotions/active', { token });
    return extractResult(data, true);
}

export async function getPromotionById(promotionId, token = null) {
    const { data } = await apiRequest(`/promotions/${promotionId}`, { token });
    return extractResult(data);
}

export async function createPromotion(promotionData, token = null) {
    const { data, ok, status } = await apiRequest('/promotions', { method: 'POST', body: promotionData, token });
    return { ok, status, data, result: extractResult(data) };
}

export async function updatePromotion(promotionId, promotionData, token = null) {
    const { data, ok } = await apiRequest(`/promotions/${promotionId}`, { method: 'PUT', body: promotionData, token });
    return { ok, data: extractResult(data) };
}

export async function deletePromotion(promotionId, token = null) {
    const { data, ok } = await apiRequest(`/promotions/${promotionId}`, { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function approvePromotion(approvalData, token = null) {
    const { data, ok } = await apiRequest('/promotions/approve', { method: 'POST', body: approvalData, token });
    return { ok, data: extractResult(data) };
}

export async function getPendingPromotions(token = null) {
    const { data } = await apiRequest('/promotions/pending', { token });
    return extractResult(data, true);
}

export async function getPromotionsByStatus(status, token = null) {
    const { data } = await apiRequest(`/promotions/status/${status}`, { token });
    return extractResult(data, true);
}