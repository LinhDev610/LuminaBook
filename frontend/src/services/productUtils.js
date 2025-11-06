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

export function normalizeMediaUrl(url, apiBaseUrl) {
    // Kiểm tra giá trị đầu vào
    if (!url) return null;
    const lower = String(url).toLowerCase();

    // Đường dẫn tuyệt đối không xử lý
    if (lower.startsWith('http://') || lower.startsWith('https://')) return url;

    const base = apiBaseUrl || getApiBaseUrl(); // Lấy base URL của backend

    // Phân tách base URL thành origin và pathname
    let backendOrigin = base;
    let ctx = '';
    try {
        const u = new URL(base); // tách origin và path
        backendOrigin = u.origin; // http://localhost:8080/lumina_book
        ctx = u.pathname.replace(/\/?$/, '');
    } catch (_) {
        backendOrigin = window.location.origin;
        ctx = '/lumina_book';
    }

    // TH1: URL này đã bao gồm /api/, nghĩa là nó đã chỉ đến đúng đường dẫn upload của backend rồi. → Ta chỉ cần nối thêm domain thôi.
    if (url.startsWith(ctx + '/')) {
        return (backendOrigin + url).replace(/([^:]\/)\/+/, '$1'); // regex xóa bớt dấu / dư thừa.
    }

    // TH2: File nằm trong thư mục uploads, nhưng thiếu /api ở đầu. Nên ta phải thêm /api (ctx) vào giữa.
    if (url.startsWith('/uploads/')) {
        return (backendOrigin + ctx + url).replace(/([^:]\/)\/+/, '$1');
    }

    // TH3: Đây là đường dẫn tương đối, không có dấu / ở đầu. Tức là chỉ có tên file, chưa biết ở thư mục nào. Hệ thống sẽ mặc định nó nằm trong /uploads/.
    if (!url.startsWith('/')) {
        return (backendOrigin + ctx + '/uploads/' + url).replace(/([^:]\/)\/+/, '$1');
    }
    // TH4: Không bắt đầu bằng /api, không phải /uploads/, không phải file trơ tên. Thì cứ ghép thẳng domain vào.
    return (backendOrigin + url).replace(/([^:]\/)\/+/, '$1');
}
