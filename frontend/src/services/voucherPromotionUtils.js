// Voucher and Promotion utilities
import { getApiBaseUrl } from './utils';
import { VOUCHER_PROMOTION_STATUSES } from './constants';
import { getVouchersByStatus, getPromotionsByStatus } from './api';

// Lấy image URL từ voucher
export const getVoucherImageUrl = (voucher) => {
    if (!voucher) return '';
    return voucher.imageUrl || '';
};

// Lấy image URL từ promotion
export const getPromotionImageUrl = (promotion) => {
    if (!promotion) return '';
    return promotion.imageUrl || '';
};

// Chuẩn hóa URL ảnh voucher thành URL đầy đủ
// Tương tự normalizeMediaUrl nhưng cho vouchers
export const normalizeVoucherImageUrl = (url, apiBaseUrl = null) => {
    if (!url) return '';

    const baseUrl = apiBaseUrl || getApiBaseUrl();

    // Nếu URL đã là absolute, chuẩn hóa path legacy
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url.replace('/vouchers/', '/voucher_media/').replace('/promotions/', '/promotion_media/');
    }

    // Nếu URL bắt đầu với /, thêm base URL
    if (url.startsWith('/')) {
        // Loại bỏ context path nếu có
        let cleanPath = url;
        if (cleanPath.startsWith('/lumina_book')) {
            cleanPath = cleanPath.substring('/lumina_book'.length);
        }

        // Nếu đã có /voucher_media/ trong path, giữ nguyên
        if (cleanPath.includes('/voucher_media/')) {
            return `${baseUrl}${cleanPath}`;
        }
        // Legacy path support: /vouchers/
        if (cleanPath.includes('/vouchers/')) {
            const converted = cleanPath.replace('/vouchers/', '/voucher_media/');
            return `${baseUrl}${converted}`;
        }
        // Nếu không, thêm prefix /vouchers/
        return `${baseUrl}/voucher_media${cleanPath}`;
    }

    // Nếu URL chỉ là filename, thêm prefix
    return `${baseUrl}/voucher_media/${url}`;
};

// Chuẩn hóa URL ảnh promotion thành URL đầy đủ
// Tương tự normalizeMediaUrl nhưng cho promotions
export const normalizePromotionImageUrl = (url, apiBaseUrl = null) => {
    if (!url) return '';

    const baseUrl = apiBaseUrl || getApiBaseUrl();

    // Nếu URL đã là absolute, chuẩn hóa path legacy
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url.replace('/promotions/', '/promotion_media/').replace('/vouchers/', '/voucher_media/');
    }

    // Nếu URL bắt đầu với /, thêm base URL
    if (url.startsWith('/')) {
        // Loại bỏ context path nếu có
        let cleanPath = url;
        if (cleanPath.startsWith('/lumina_book')) {
            cleanPath = cleanPath.substring('/lumina_book'.length);
        }

        // Nếu đã có /promotion_media/ trong path, giữ nguyên
        if (cleanPath.includes('/promotion_media/')) {
            return `${baseUrl}${cleanPath}`;
        }
        // Legacy path support: /promotions/
        if (cleanPath.includes('/promotions/')) {
            const converted = cleanPath.replace('/promotions/', '/promotion_media/');
            return `${baseUrl}${converted}`;
        }
        // Nếu không, thêm prefix /promotions/
        return `${baseUrl}/promotion_media${cleanPath}`;
    }

    // Nếu URL chỉ là filename, thêm prefix
    return `${baseUrl}/promotion_media/${url}`;
};

/**
 * Fetch all items (vouchers or promotions) by all statuses
 * @param {'voucher' | 'promotion'} type - Type of item to fetch
 * @param {string|null} token - Authentication token
 * @returns {Promise<Array>} Array of items (deduplicated by id)
 */
export async function fetchAllItemsByStatus(type, token = null) {
    try {
        const fetchFunction = type === 'voucher' ? getVouchersByStatus : getPromotionsByStatus;
        const results = await Promise.all(
            VOUCHER_PROMOTION_STATUSES.map(status =>
                fetchFunction(status, token).catch(() => [])
            )
        );

        // Merge và loại bỏ duplicate dựa trên id
        const allItems = results.flat();
        return Array.from(
            new Map(allItems.map(item => [item.id, item])).values()
        );
    } catch (error) {
        console.error(`Error fetching all ${type}s:`, error);
        return [];
    }
}
