// Utilities for product management
import { getApiBaseUrl } from './utils';
// - API base URL resolution
// - Token retrieval from storage
// - Media URL helpers
// - Date formatting

export function getProductImageUrl(product) {
    if (!product) return null;
    const byObject = product?.defaultMedia?.mediaUrl || (typeof product?.defaultMedia === 'string' ? product.defaultMedia : null);
    const byField = product?.defaultMediaUrl || null;
    const byList = Array.isArray(product?.mediaUrls) && product.mediaUrls.length > 0 ? product.mediaUrls[0] : null;
    return byObject || byField || byList || null;
}

/**
 * Chuyển đổi URL media thành URL đầy đủ để hiển thị
 * 
 * Ví dụ:
 * - Input: "/product_media/abc123.jpg"
 * - Output: "http://localhost:8080/lumina_book/product_media/abc123.jpg"
 * 
 * @param {string} url - URL cần chuẩn hóa (có thể là relative hoặc absolute)
 * @param {string} apiBaseUrl - Base URL của backend (optional)
 * @returns {string|null} URL đầy đủ hoặc null nếu không hợp lệ
 */
export function normalizeMediaUrl(url, apiBaseUrl) {
    // Kiểm tra đầu vào
    if (!url) return null;

    // Nếu đã là URL đầy đủ (http:// hoặc https://) thì trả về luôn
    const lower = String(url).toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
        return url;
    }

    // Lấy thông tin backend
    const base = apiBaseUrl || getApiBaseUrl();

    // Tách URL thành 2 phần:
    // - backendOrigin: domain + port (ví dụ: "http://localhost:8080")
    // - ctx: context path (ví dụ: "/lumina_book")
    let backendOrigin = base;
    let contextPath = '';
    try {
        const urlObj = new URL(base);
        backendOrigin = urlObj.origin; // "http://localhost:8080"
        contextPath = urlObj.pathname.replace(/\/?$/, ''); // "/lumina_book"
    } catch (_) {
        // Nếu parse lỗi, dùng giá trị mặc định
        backendOrigin = window.location.origin;
        contextPath = '/lumina_book';
    }

    // Hàm helper: ghép URL và xóa dấu / dư thừa
    const joinUrl = (...parts) => {
        return parts.join('').replace(/([^:]\/)\/+/, '$1');
    };

    // Xử lý các trường hợp URL khác nhau

    // Trường hợp 1: URL đã có context path ở đầu
    // Ví dụ: "/lumina_book/product_media/abc123.jpg"
    // → Chỉ cần thêm domain vào đầu
    if (url.startsWith(contextPath + '/')) {
        return joinUrl(backendOrigin, url);
    }

    // Trường hợp 2: URL bắt đầu bằng "/product_media/"
    // Ví dụ: "/product_media/abc123.jpg"
    // → Cần thêm context path vào giữa: domain + context + url
    if (url.startsWith('/product_media/')) {
        return joinUrl(backendOrigin, contextPath, url);
    }

    // Trường hợp 3: Chỉ có tên file (không có dấu / ở đầu)
    // Ví dụ: "abc123.jpg"
    // → Mặc định file nằm trong /product_media/
    if (!url.startsWith('/')) {
        return joinUrl(backendOrigin, contextPath, '/product_media/', url);
    }

    // Trường hợp 4: URL bắt đầu bằng "/" nhưng không phải /product_media/
    // Ví dụ: "/some/path/file.jpg"
    // → Ghép thẳng domain vào đầu
    return joinUrl(backendOrigin, url);
}
