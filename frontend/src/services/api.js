// API Service
import { API_BASE_URL_FALLBACK, API_ROUTES } from './constants';

const {
    auth,
    users,
    categories,
    products,
    media,
    vouchers,
    promotions,
    addresses,
    ghn,
    notifications,
    financial,
    orders,
    shipments,
    chat,
} = API_ROUTES;

// Get API base URL
// Priority: Environment Variable → Fallback
export function getApiBaseUrl() {
    const envUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
    return (envUrl && String(envUrl).trim()) || API_BASE_URL_FALLBACK;
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
            // Xóa prefix Bearer và khoảng trắng
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

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// Helper function to save token to storage (both localStorage and sessionStorage)
function saveTokenToStorage(token) {
    try {
        // Check if token exists in localStorage (remember me) or sessionStorage
        const hasLocalToken = localStorage.getItem('token');
        const hasSessionToken = sessionStorage.getItem('token');

        if (hasLocalToken) {
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', token);
        }
        if (hasSessionToken) {
            sessionStorage.setItem('token', token);
        }

        // Dispatch event to notify other components
        window.dispatchEvent(new Event('tokenUpdated'));
    } catch (error) {
        console.error('Error saving token:', error);
    }
}

// Helper function to attempt token refresh
async function attemptTokenRefresh(currentToken) {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const apiBaseUrl = getApiBaseUrl();
            const refreshResponse = await fetch(`${apiBaseUrl}${auth.refresh}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: currentToken }),
            });

            const refreshData = await refreshResponse.json().catch(() => ({}));

            if (refreshResponse.ok && refreshData?.result?.token) {
                const newToken = refreshData.result.token;
                saveTokenToStorage(newToken);
                return { success: true, token: newToken };
            } else {
                // Refresh failed - token is beyond refreshable duration
                return { success: false, error: refreshData?.message || 'Token refresh failed' };
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            return { success: false, error: error.message };
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// Helper function to clear all tokens and logout
function clearTokensAndLogout() {
    // Prevent multiple simultaneous logout attempts
    if (isLoggingOut) {
        return;
    }

    isLoggingOut = true;

    try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('displayName');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('_checking_role');

        // Dispatch events to notify other components
        window.dispatchEvent(new Event('tokenUpdated'));
        window.dispatchEvent(new CustomEvent('displayNameUpdated'));

        // Only redirect if we're in browser environment
        if (typeof window !== 'undefined' && window.location) {
            // Don't redirect if already on login page or home page
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && currentPath !== '/') {
                // Use setTimeout to allow current request to complete
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error clearing tokens:', error);
    } finally {
        // Reset flag after a delay to allow redirect
        setTimeout(() => {
            isLoggingOut = false;
        }, 1000);
    }
}

// Hàm helper để tạo request API
async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', body = null, token = null, isFormData = false, skipAuthCheck = false, isRetry = false } = options;
    const apiBaseUrl = getApiBaseUrl();
    let tokenToUse = token || getStoredToken('token');

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

        // Auto-handle 401 Unauthorized (token expired/invalid)
        if (resp.status === 401 && !skipAuthCheck && tokenToUse && !isRetry) {
            let errorData = {};
            try {
                const contentType = resp.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const text = await resp.text();
                    if (text && text.trim()) {
                        errorData = JSON.parse(text);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
            const errorMessage = errorData?.message || errorData?.error || 'Token invalid';
            const errorCode = errorData?.code;

            // Check if it's a token validation error
            if (errorMessage.includes('Token invalid') || errorMessage.includes('expired') || errorMessage.includes('Unauthorized') || errorMessage.includes('UNAUTHENTICATED')) {
                // Don't try to refresh if we're already calling the refresh endpoint
                if (endpoint === auth.refresh) {
                    console.warn('Refresh token endpoint returned 401. Token is beyond refreshable duration.');
                    clearTokensAndLogout();
                    return {
                        ok: false,
                        status: 401,
                        data: {
                            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                            autoLoggedOut: true
                        }
                    };
                }

                // Try to refresh token automatically
                console.log('Token expired. Attempting to refresh...');
                const refreshResult = await attemptTokenRefresh(tokenToUse);

                if (refreshResult.success && refreshResult.token) {
                    // Retry the original request with new token
                    console.log('Token refreshed successfully. Retrying request...');
                    return apiRequest(endpoint, {
                        ...options,
                        token: refreshResult.token,
                        isRetry: true,
                    });
                } else {
                    // Refresh failed - token is beyond refreshable duration
                    console.warn('Token refresh failed. Auto-logging out...');
                    clearTokensAndLogout();
                    return {
                        ok: false,
                        status: 401,
                        data: {
                            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                            autoLoggedOut: true
                        }
                    };
                }
            }

            // Nếu 401 nhưng không phải lỗi token, trả data gốc cho FE xử lý
            return { ok: false, status: resp.status, data: errorData };
        }

        // Parse response body safely
        let data = {};
        try {
            // Check if response has a body (status 204 No Content doesn't have body)
            if (resp.status !== 204 && resp.body) {
                const contentType = resp.headers.get('content-type') || '';
                const text = await resp.text().catch(() => '');

                if (text && text.trim()) {
                    // Try to parse as JSON if content-type suggests JSON or if text looks like JSON
                    if (contentType.includes('application/json') ||
                        (text.trim().startsWith('{') || text.trim().startsWith('['))) {
                        try {
                            data = JSON.parse(text);
                        } catch (parseError) {
                            // If JSON parsing fails, return as plain text message
                            console.warn(`Failed to parse JSON response for ${endpoint}:`, parseError);
                            data = { message: text, raw: text };
                        }
                    } else {
                        // Not JSON, return as plain text message
                        data = { message: text, raw: text };
                    }
                }
            }
        } catch (error) {
            // If anything fails, return empty object
            console.warn(`Failed to read response for ${endpoint}:`, error);
            data = {};
        }

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
    const { data } = await apiRequest(users.myInfo, { token });
    return extractResult(data);
}

export async function getAllUsers(token = null) {
    const { data } = await apiRequest(users.root, { token });
    return extractResult(data, true);
}

export async function getUserById(userId, token = null) {
    const { data } = await apiRequest(users.detail(userId), { token });
    return extractResult(data);
}

export async function updateUser(userId, userData, token = null) {
    const { data } = await apiRequest(users.detail(userId), { method: 'PUT', body: userData, token });
    return extractResult(data);
}

export async function deleteUser(userId, token = null) {
    const { data, ok } = await apiRequest(users.detail(userId), { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function createStaff(staffData, token = null) {
    const { data } = await apiRequest(users.staff, { method: 'POST', body: staffData, token });
    return extractResult(data);
}

export async function getUserRole(apiBaseUrl, token) {
    const { data } = await apiRequest(users.myInfo, { token });
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
    const { data, ok, status } = await apiRequest(auth.login, { method: 'POST', body: credentials });
    // Nếu ok = true → backend trả ApiResponse<AuthenticationResponse> với field result chứa token
    // Trả về data đã extract để FE dùng trực tiếp loginData.token
    if (ok) {
        return { ok, status, data: extractResult(data) };
    }
    // Nếu lỗi → giữ nguyên cấu trúc để FE đọc code/message
    return { ok, status, data };
}

export async function register(userData) {
    const { data, ok, status } = await apiRequest(auth.register, { method: 'POST', body: userData });
    // Nếu ok = true → backend trả ApiResponse<UserResponse> với field result chứa user data
    // Trả về data đã extract để FE dùng trực tiếp
    if (ok) {
        return { ok, status, data: extractResult(data) };
    }
    // Nếu lỗi → giữ nguyên cấu trúc để FE đọc code/message
    return { ok, status, data };
}

export async function refreshToken(token = null) {
    // Backend expects JSON body: { token: "<token>" }
    // Endpoint /auth/refresh đã được phép PUBLIC, nên không cần Authorization header riêng.
    // Use skipAuthCheck to prevent infinite loop when refresh endpoint returns 401
    const tokenToUse = token || getStoredToken('token') || getStoredToken('refreshToken');
    if (!tokenToUse) {
        return { ok: false, data: { message: 'No token available to refresh' } };
    }
    const body = { token: tokenToUse };
    const { data, ok } = await apiRequest(auth.refresh, { method: 'POST', body, skipAuthCheck: true });
    if (ok && data?.result?.token) {
        saveTokenToStorage(data.result.token);
    }
    return { ok, data: extractResult(data) };
}

export async function changePassword(passwordData, token = null) {
    const { data, ok } = await apiRequest(auth.changePassword, { method: 'POST', body: passwordData, token });
    return { ok, data };
}

export async function resetPassword(passwordData) {
    // passwordData có thể là { email } hoặc { email, otp, newPassword }
    const { data, ok, status } = await apiRequest(auth.resetPassword, { method: 'POST', body: passwordData });
    console.log('🔍 resetPassword API response:', { ok, status, data });
    return { ok, data, status };
}

export async function sendOTP(email, mode) {
    const { data, ok } = await apiRequest(auth.sendOtp(email, mode), { method: 'POST' });
    return { ok, data };
}

export async function verifyOTP(email, otp, mode) {
    const { data, ok } = await apiRequest(auth.verifyOtp, { method: 'POST', body: { email, otp, mode } });
    return { ok, data };
}

// ========== ORDER ACTIONS ==========
export async function confirmOrder(orderId, token = null) {
    const { data, ok, status } = await apiRequest(orders.confirm(orderId), { method: 'POST', token });
    return { ok, status, data: extractResult(data) };
}

// ========== ORDERS QUERY (ADMIN/STAFF) ==========
export async function getAllOrders(token = null) {
    const { data } = await apiRequest(orders.root, { token });
    return extractResult(data, true);
}

export async function cancelOrder(orderId, reason = '', token = null) {
    const { data, ok, status } = await apiRequest(orders.cancel(orderId), {
        method: 'POST',
        body: { reason },
        token,
    });
    return { ok, status, data: extractResult(data) };
}

export async function createShipment(orderId, payload = null, token = null) {
    const { data, ok, status } = await apiRequest(shipments.create(orderId), {
        method: 'POST',
        body: payload,
        token,
    });
    return { ok, status, data: extractResult(data) };
}

// ========== CATEGORIES API ==========
export async function getAllCategories(token = null) {
    const { data } = await apiRequest(categories.root, { token });
    return extractResult(data, true);
}

export async function getActiveCategories(token = null) {
    const { data } = await apiRequest(categories.active, { token });
    return extractResult(data, true);
}

export async function getRootCategories(token = null) {
    const { data } = await apiRequest(categories.rootOnly, { token });
    return extractResult(data, true);
}

export async function getSubCategories(parentId, token = null) {
    const { data } = await apiRequest(categories.subCategories(parentId), { token });
    return extractResult(data, true);
}

export async function getCategoryById(categoryId, token = null) {
    const { data } = await apiRequest(categories.detail(categoryId), { token });
    return extractResult(data);
}

export async function createCategory(categoryData, token = null) {
    const { data, ok } = await apiRequest(categories.root, { method: 'POST', body: categoryData, token });
    return { ok, data: extractResult(data) };
}

export async function updateCategory(categoryId, categoryData, token = null) {
    const { data, ok } = await apiRequest(categories.detail(categoryId), {
        method: 'PUT',
        body: categoryData,
        token,
    });
    return { ok, data: extractResult(data) };
}

export async function deleteCategory(categoryId, token = null) {
    const { data, ok } = await apiRequest(categories.detail(categoryId), { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

// ========== PRODUCTS API ==========
export async function getAllProducts(token = null) {
    const { data } = await apiRequest(products.root, { token });
    return extractResult(data, true);
}

export async function getActiveProducts(token = null) {
    const { data } = await apiRequest(products.active, { token });
    return extractResult(data, true);
}

export async function getProductById(productId, token = null) {
    const { data } = await apiRequest(products.detail(productId), { token });
    return extractResult(data);
}

export async function getProductsByIds(productIds, token = null) {
    if (!productIds || productIds.length === 0) return [];
    const { data } = await apiRequest(products.root, { token });
    const allProducts = extractResult(data, true) || [];
    return allProducts.filter(p => productIds.includes(p.id));
}

export async function getMyProducts(token = null) {
    const { data } = await apiRequest(products.myProducts, { token });
    return extractResult(data, true);
}

export async function getPendingProducts(token = null) {
    const { data } = await apiRequest(products.pending, { token });
    return extractResult(data, true);
}

export async function getProductsByCategory(categoryId, token = null) {
    const { data } = await apiRequest(products.byCategory(categoryId), { token });
    return extractResult(data, true);
}

export async function searchProducts(keyword, token = null) {
    const { data } = await apiRequest(products.search(keyword), { token });
    return extractResult(data, true);
}

export async function getProductsByPriceRange(minPrice, maxPrice, token = null) {
    const { data } = await apiRequest(products.priceRange(minPrice, maxPrice), { token });
    return extractResult(data, true);
}

export async function createProduct(productData, token = null) {
    const { data, ok, status } = await apiRequest(products.root, { method: 'POST', body: productData, token });
    return { ok, status, data: extractResult(data) };
}

export async function updateProduct(productId, productData, token = null) {
    const { data, ok } = await apiRequest(products.detail(productId), { method: 'PUT', body: productData, token });
    return { ok, data: extractResult(data) };
}

export async function restockProduct(productId, quantity, token = null) {
    const { data, ok } = await apiRequest(products.restock(productId), {
        method: 'POST',
        body: { quantity },
        token,
    });
    return { ok, data: extractResult(data) };
}

export async function approveProduct(approveData, token = null) {
    const { data, ok } = await apiRequest(products.approve, { method: 'POST', body: approveData, token });
    return { ok, data: extractResult(data) };
}

export async function setProductDefaultMedia(productId, mediaUrl, token = null) {
    const { data, ok } = await apiRequest(products.defaultMedia(productId, mediaUrl), { method: 'POST', token });
    return { ok, data: extractResult(data) };
}

// ========== MEDIA API ==========
export async function uploadMediaProfile(file, token = null) {
    const formData = new FormData();
    formData.append('file', file);
    const { data, ok } = await apiRequest(media.uploadProfile, {
        method: 'POST',
        body: formData,
        token,
        isFormData: true,
    });
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
    return uploadMediaFiles(media.uploadProduct, file, token);
}

export async function uploadVoucherMedia(file, token = null) {
    return uploadMediaFiles(media.uploadVoucher, file, token);
}

export async function uploadPromotionMedia(file, token = null) {
    return uploadMediaFiles(media.uploadPromotion, file, token);
}

// ========== VOUCHER API ==========
export async function getStaffVouchers(token = null) {
    const { data } = await apiRequest(vouchers.mine, { token });
    return extractResult(data, true);
}

export async function getActiveVouchers(token = null) {
    const { data } = await apiRequest(vouchers.active, { token });
    return extractResult(data, true);
}

export async function getVoucherById(voucherId, token = null) {
    const { data } = await apiRequest(vouchers.detail(voucherId), { token });
    return extractResult(data);
}

export async function createVoucher(voucherData, token = null) {
    const { data, ok } = await apiRequest(vouchers.root, { method: 'POST', body: voucherData, token });
    return { ok, data: extractResult(data) };
}

export async function updateVoucher(voucherId, voucherData, token = null) {
    const { data, ok } = await apiRequest(vouchers.detail(voucherId), { method: 'PUT', body: voucherData, token });
    return { ok, data: extractResult(data) };
}

export async function deleteVoucher(voucherId, token = null) {
    const { data, ok } = await apiRequest(vouchers.detail(voucherId), { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function approveVoucher(approvalData, token = null) {
    const { data, ok } = await apiRequest(vouchers.approve, { method: 'POST', body: approvalData, token });
    return { ok, data: extractResult(data) };
}

export async function getPendingVouchers(token = null) {
    const { data } = await apiRequest(vouchers.pending, { token });
    return extractResult(data, true);
}

export async function getVouchersByStatus(status, token = null) {
    const { data } = await apiRequest(vouchers.byStatus(status), { token });
    return extractResult(data, true);
}

// ========== PROMOTION API ==========
export async function getStaffPromotions(token = null) {
    const { data } = await apiRequest(promotions.mine, { token });
    return extractResult(data, true);
}

export async function getActivePromotions(token = null) {
    const { data } = await apiRequest(promotions.active, { token });
    return extractResult(data, true);
}

export async function getPromotionById(promotionId, token = null) {
    const { data } = await apiRequest(promotions.detail(promotionId), { token });
    return extractResult(data);
}

export async function createPromotion(promotionData, token = null) {
    const { data, ok, status } = await apiRequest(promotions.root, { method: 'POST', body: promotionData, token });
    return { ok, status, data, result: extractResult(data) };
}

export async function updatePromotion(promotionId, promotionData, token = null) {
    const { data, ok } = await apiRequest(promotions.detail(promotionId), {
        method: 'PUT',
        body: promotionData,
        token,
    });
    return { ok, data: extractResult(data) };
}

export async function deletePromotion(promotionId, token = null) {
    const { data, ok } = await apiRequest(promotions.detail(promotionId), { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

export async function approvePromotion(approvalData, token = null) {
    const { data, ok } = await apiRequest(promotions.approve, { method: 'POST', body: approvalData, token });
    return { ok, data: extractResult(data) };
}

export async function getPendingPromotions(token = null) {
    const { data } = await apiRequest(promotions.pending, { token });
    return extractResult(data, true);
}

export async function getPromotionsByStatus(status, token = null) {
    const { data } = await apiRequest(promotions.byStatus(status), { token });
    return extractResult(data, true);
}

// ========== ADDRESS API ==========
// Lấy danh sách địa chỉ của user hiện tại
export async function getMyAddresses(token = null) {
    const { data } = await apiRequest(addresses.root, { token });
    return extractResult(data, true);
}

export async function getAddressById(addressId, token = null) {
    const { data } = await apiRequest(addresses.detail(addressId), { token });
    return extractResult(data);
}

export async function createAddress(addressData, token = null) {
    const { data, ok } = await apiRequest(addresses.root, { method: 'POST', body: addressData, token });
    return { ok, data: extractResult(data) };
}

export async function updateAddress(addressId, addressData, token = null) {
    const { data, ok } = await apiRequest(addresses.detail(addressId), {
        method: 'PUT',
        body: addressData,
        token,
    });
    return { ok, data: extractResult(data) };
}

export async function deleteAddress(addressId, token = null) {
    const { data, ok } = await apiRequest(addresses.detail(addressId), { method: 'DELETE', token });
    return { ok, data: extractResult(data) };
}

// ========== GHN API (Qua Backend) ==========
// Các API gọi qua backend để bảo mật token và shopId
export async function getGhnProvinces(token = null) {
    const { data } = await apiRequest(ghn.provinces, { token });
    return extractResult(data, true);
}

export async function getGhnDistricts(provinceId, token = null) {
    const { data } = await apiRequest(ghn.districts(provinceId), { token });
    return extractResult(data, true);
}

export async function getGhnWards(districtId, token = null) {
    const { data } = await apiRequest(ghn.wards(districtId), { token });
    return extractResult(data, true);
}

// ========== REVIEW API ==========
export async function getReviewsByProduct(productId, token = null) {
    const { data } = await apiRequest(`/reviews/product/${productId}`, { token });
    return extractResult(data, true);
}

export async function getAllReviews(token = null) {
    const { data } = await apiRequest('/reviews/all-reviews', { token });
    return extractResult(data, true);
}

export async function createReview(reviewData, token = null) {
    const { data, ok, status } = await apiRequest('/reviews', {
        method: 'POST',
        body: reviewData,
        token,
    });
    return { ok, status, data: extractResult(data) };
}

export async function replyToReview(reviewId, replyData, token = null) {
    const { data, ok, status } = await apiRequest(`/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: replyData,
        token,
    });
    return { ok, status, data: extractResult(data) };
}

// Xóa đánh giá theo ID (dùng cho trang Admin ReviewAndComment)
export async function deleteReview(reviewId, token = null) {
    const { data, ok, status } = await apiRequest(`/reviews/${reviewId}`, {
        method: 'DELETE',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

// ========== CART API ==========
export async function addCartItem(productId, quantity, token = null) {
    const { data, ok, status } = await apiRequest(
        `/cart/items?productId=${encodeURIComponent(productId)}&quantity=${quantity}`,
        {
            method: 'POST',
            token,
        }
    );
    return { ok, status, data: extractResult(data) };
}

export async function getCart(token = null) {
    const { data, ok, status } = await apiRequest('/cart', { token });
    return { ok, status, data: extractResult(data, false) };
}

export async function updateCartItemQuantity(cartItemId, quantity, token = null) {
    const { data, ok, status } = await apiRequest(
        `/cart/items/${encodeURIComponent(cartItemId)}?quantity=${quantity}`,
        {
            method: 'PUT',
            token,
        }
    );
    return { ok, status, data: extractResult(data) };
}

export async function removeCartItem(cartItemId, token = null) {
    const { data, ok, status } = await apiRequest(
        `/cart/items/${encodeURIComponent(cartItemId)}`,
        {
            method: 'DELETE',
            token,
        }
    );
    return { ok, status, data: extractResult(data) };
}

export async function applyVoucherToCart(voucherCode, token = null) {
    const { data, ok, status } = await apiRequest(
        `/cart/apply-voucher?code=${encodeURIComponent(voucherCode)}`,
        {
            method: 'POST',
            token,
        }
    );
    return { ok, status, data: extractResult(data) };
}

export async function clearVoucherFromCart(token = null) {
    const { data, ok, status } = await apiRequest('/cart/clear-voucher', {
        method: 'POST',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

export async function calculateGhnShippingFee(feeData, token = null) {
    const { data, ok } = await apiRequest(ghn.shippingFees, { method: 'POST', body: feeData, token });
    return { ok, data: extractResult(data) };
}

export async function calculateGhnLeadtime(leadtimeData, token = null) {
    const { data, ok } = await apiRequest(ghn.leadtime, { method: 'POST', body: leadtimeData, token });
    return { ok, data: extractResult(data) };
}

// ========== NOTIFICATION API ==========
/**
 * Gửi thông báo cho tất cả nhân viên
 * @param {Object} notificationData - { title, message, type?, link? }
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function sendNotificationToStaff(notificationData, token = null) {
    const { data, ok, status } = await apiRequest(notifications.sendToStaff, {
        method: 'POST',
        body: notificationData,
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Gửi thông báo cho một user cụ thể
 * @param {string} userId - ID của user
 * @param {Object} notificationData - { title, message, type?, link? }
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function sendNotificationToUser(userId, notificationData, token = null) {
    const { data, ok, status } = await apiRequest(notifications.sendToUser(userId), {
        method: 'POST',
        body: notificationData,
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Helper function: Gửi thông báo cho tất cả nhân viên khi admin duyệt
 * @param {string} itemType - Loại item được duyệt: 'product', 'banner', 'voucher', 'promotion'
 * @param {string} itemName - Tên của item được duyệt
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function notifyStaffOnApproval(itemType, itemName, token = null) {
    try {
        const typeLabels = {
            product: 'Sản phẩm',
            banner: 'Banner',
            slider: 'Slider',
            voucher: 'Mã giảm giá',
            promotion: 'Chương trình khuyến mãi',
        };

        const typeLabel = typeLabels[itemType] || itemType;
        const notificationData = {
            title: `Admin đã duyệt ${typeLabel.toLowerCase()}`,
            message: `${typeLabel} "${itemName}" đã được admin duyệt thành công.`,
            type: 'SUCCESS',
        };

        await sendNotificationToStaff(notificationData, token);
    } catch (error) {
        // Không throw error để không ảnh hưởng đến flow chính
        // Chỉ log để debug
        console.error('Error sending notification to staff:', error);
    }
}

/**
 * Helper function: Gửi thông báo cho tất cả nhân viên khi admin từ chối
 * @param {string} itemType - Loại item bị từ chối: 'product', 'banner', 'voucher', 'promotion'
 * @param {string} itemName - Tên của item bị từ chối
 * @param {string} reason - Lý do từ chối
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function notifyStaffOnRejection(itemType, itemName, reason, token = null) {
    try {
        const typeLabels = {
            product: 'Sản phẩm',
            banner: 'Banner',
            slider: 'Slider',
            voucher: 'Mã giảm giá',
            promotion: 'Chương trình khuyến mãi',
        };

        const typeLabel = typeLabels[itemType] || itemType;
        const notificationData = {
            title: `Admin đã từ chối ${typeLabel.toLowerCase()}`,
            message: `${typeLabel} "${itemName}" đã bị admin từ chối. Lý do: ${reason}`,
            type: 'ERROR',
        };

        await sendNotificationToStaff(notificationData, token);
    } catch (error) {
        console.error('Error sending notification to staff:', error);
    }
}

/**
 * Helper function: Gửi thông báo cho tất cả nhân viên khi admin xóa
 * @param {string} itemType - Loại item bị xóa: 'product', 'banner', 'voucher', 'promotion'
 * @param {string} itemName - Tên của item bị xóa
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function notifyStaffOnDelete(itemType, itemName, token = null) {
    try {
        const typeLabels = {
            product: 'Sản phẩm',
            banner: 'Banner',
            slider: 'Slider',
            voucher: 'Mã giảm giá',
            promotion: 'Chương trình khuyến mãi',
        };

        const typeLabel = typeLabels[itemType] || itemType;
        const notificationData = {
            title: `Admin đã xóa ${typeLabel.toLowerCase()}`,
            message: `${typeLabel} "${itemName}" đã bị admin xóa khỏi hệ thống.`,
            type: 'WARNING',
        };

        await sendNotificationToStaff(notificationData, token);
    } catch (error) {
        console.error('Error sending notification to staff:', error);
    }
}

/**
 * Helper function: Gửi thông báo cho tất cả nhân viên khi admin cập nhật/sửa
 * @param {string} itemType - Loại item được sửa: 'product', 'banner', 'voucher', 'promotion'
 * @param {string} itemName - Tên của item được sửa
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export async function notifyStaffOnUpdate(itemType, itemName, token = null) {
    try {
        const typeLabels = {
            product: 'Sản phẩm',
            banner: 'Banner',
            slider: 'Slider',
            voucher: 'Mã giảm giá',
            promotion: 'Chương trình khuyến mãi',
        };

        const typeLabel = typeLabels[itemType] || itemType;
        const notificationData = {
            title: `Admin đã cập nhật ${typeLabel.toLowerCase()}`,
            message: `${typeLabel} "${itemName}" đã được admin cập nhật thông tin.`,
            type: 'INFO',
        };

        await sendNotificationToStaff(notificationData, token);
    } catch (error) {
        console.error('Error sending notification to staff:', error);
    }
}

/**
 * Lấy danh sách thông báo của user hiện tại
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any[]}>}
 */
export async function getMyNotifications(token = null) {
    const { data, ok, status } = await apiRequest(notifications.mine, { token });
    return { ok, status, data: extractResult(data, true) };
}

/**
 * Đánh dấu thông báo là đã đọc
 * @param {string} notificationId - ID của thông báo
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function markNotificationAsRead(notificationId, token = null) {
    const { data, ok, status } = await apiRequest(notifications.markAsRead(notificationId), {
        method: 'PUT',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function markAllNotificationsAsRead(token = null) {
    const { data, ok, status } = await apiRequest(notifications.markAllAsRead, {
        method: 'PUT',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Xóa thông báo
 * @param {string} notificationId - ID của thông báo
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function deleteNotification(notificationId, token = null) {
    const { data, ok, status } = await apiRequest(notifications.delete(notificationId), {
        method: 'DELETE',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Xóa tất cả thông báo đã đọc
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function deleteAllReadNotifications(token = null) {
    const { data, ok, status } = await apiRequest(notifications.deleteAllRead, {
        method: 'DELETE',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

// ========== ORDERS API ==========
/**
 * Verify payment status và gửi email nếu payment thành công.
 * Được gọi khi user quay lại từ MoMo sau khi thanh toán.
 */
export async function verifyPaymentAndSendEmail(orderId, token = null) {
    const { data, ok, status } = await apiRequest(orders.verifyPayment(orderId), {
        method: 'POST',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

// ========== CHAT API ==========
/**
 * Gửi tin nhắn
 * @param {string} message - Nội dung tin nhắn
 * @param {string} receiverId - ID người nhận
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function sendChatMessage(message, receiverId, token = null) {
    const { data, ok, status } = await apiRequest(chat.send, {
        method: 'POST',
        body: { message, receiverId },
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Lấy danh sách cuộc trò chuyện
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function getChatConversations(token = null) {
    const { data, ok, status } = await apiRequest(chat.conversations, {
        method: 'GET',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Lấy tin nhắn trong một cuộc trò chuyện
 * @param {string} partnerId - ID người chat
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function getChatConversation(partnerId, token = null) {
    const { data, ok, status } = await apiRequest(chat.conversation(partnerId), {
        method: 'GET',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Đánh dấu tin nhắn đã đọc
 * @param {string} partnerId - ID người chat
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function markChatAsRead(partnerId, token = null) {
    const { data, ok, status } = await apiRequest(chat.markAsRead(partnerId), {
        method: 'POST',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Lấy số tin nhắn chưa đọc
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function getChatUnreadCount(token = null) {
    const { data, ok, status } = await apiRequest(chat.unreadCount, {
        method: 'GET',
        token,
    });
    return { ok, status, data: extractResult(data) };
}

/**
 * Lấy CSKH đầu tiên (cho customer)
 * @param {string} token - Authentication token
 * @returns {Promise<{ok: boolean, data: any}>}
 */
export async function getFirstCustomerSupport(token = null) {
    const { data, ok, status } = await apiRequest(chat.customerSupport, {
        method: 'GET',
        token,
    });
    return { ok, status, data: extractResult(data) };
}