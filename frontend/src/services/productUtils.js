// Utilities for product management
// - API base URL resolution
// - Token retrieval from storage
// - Media URL helpers
// - Date formatting

export function getApiBaseUrl() {
    const envUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined;
    const fallback = 'http://localhost:8080/lumina_book';
    return (envUrl && String(envUrl).trim()) || fallback;
}

export function getStoredToken(key = 'token') {
    try {
        const sessionToken = sessionStorage.getItem(key);
        if (sessionToken) return sessionToken;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
            const parsed = JSON.parse(raw);
            return typeof parsed === 'string' ? parsed : raw;
        }
        return raw;
    } catch (_) {
        return null;
    }
}

export function getProductImageUrl(product) {
    if (!product) return null;
    const byObject = product?.defaultMedia?.mediaUrl || (typeof product?.defaultMedia === 'string' ? product.defaultMedia : null);
    const byField = product?.defaultMediaUrl || null;
    const byList = Array.isArray(product?.mediaUrls) && product.mediaUrls.length > 0 ? product.mediaUrls[0] : null;
    return byObject || byField || byList || null;
}

export function normalizeMediaUrl(url, apiBaseUrl) {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return url;
    const base = apiBaseUrl || getApiBaseUrl();
    let backendOrigin = base;
    let ctx = '';
    try {
        const u = new URL(base);
        backendOrigin = u.origin;
        ctx = u.pathname.replace(/\/?$/, '');
    } catch (_) {
        backendOrigin = window.location.origin;
        ctx = '/lumina_book';
    }
    if (url.startsWith(ctx + '/')) {
        return (backendOrigin + url).replace(/([^:]\/)\/+/, '$1');
    }
    if (url.startsWith('/uploads/')) {
        return (backendOrigin + ctx + url).replace(/([^:]\/)\/+/, '$1');
    }
    if (!url.startsWith('/')) {
        return (backendOrigin + ctx + '/uploads/' + url).replace(/([^:]\/)\/+/, '$1');
    }
    return (backendOrigin + url).replace(/([^:]\/)\/+/, '$1');
}

export function formatDateTime(value) {
    try {
        const d = new Date(value);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch (_) {
        return value;
    }
}

