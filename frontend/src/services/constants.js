// Constants
// Hằng số của ứng dụng

// =========== API Endpoints ===========
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
    },
    PRODUCTS: {
        LIST: '/products',
        DETAIL: '/products/:id',
        SEARCH: '/products/search',
    },
    CART: {
        GET: '/cart',
        ADD: '/cart/add',
        UPDATE: '/cart/items/:id',
        REMOVE: '/cart/items/:id',
    },
};

// =========== Product Constants ===========

export const PRODUCT_CATEGORIES = {
    NOVEL: 'novel',
    BUSINESS: 'business',
    TECHNOLOGY: 'technology',
    EDUCATION: 'education',
    CHILDREN: 'children',
};

export const STATUS_MAP = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    disabled: 'Tạm dừng',
    expired: 'Hết hạn',
};

export const STATUS_TO_CLASS = {
    'Chờ duyệt': 'pending',
    'Đã duyệt': 'approved',
    'Từ chối': 'rejected',
    'Không được duyệt': 'rejected',
    'Tạm dừng': 'disabled',
    'Hết hạn': 'expired',
};

// =========== Voucher & Promotion Status Constants ===========

// Danh sách tất cả các status chung cho Voucher và Promotion
export const VOUCHER_PROMOTION_STATUSES = [
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'DISABLED',
];

export const STATUS_FILTER_MAP = {
    all: 'all',
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    disabled: 'disabled',
    expired: 'expired',
};

export const VOUCHER_PROMOTION_SORT_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'disabled', label: 'Tạm dừng' },
    { value: 'expired', label: 'Hết hạn' },
];

// Hàm mapping status chung cho cả Voucher và Promotion
export const mapVoucherPromotionStatus = (status) => {
    switch (status) {
        case 'APPROVED':
            return { label: 'Đã duyệt', filterKey: 'approved' };
        case 'REJECTED':
            return { label: 'Không được duyệt', filterKey: 'rejected' };
        case 'DISABLED':
            return { label: 'Tạm dừng', filterKey: 'disabled' };
        case 'EXPIRED':
            return { label: 'Hết hạn', filterKey: 'expired' };
        case 'PENDING_APPROVAL':
        default:
            return { label: 'Chờ duyệt', filterKey: 'pending' };
    }
};

// Alias để tương thích với code cũ
export const mapVoucherStatus = mapVoucherPromotionStatus;
export const mapPromotionStatus = mapVoucherPromotionStatus;

export const FALLBACK_THUMB =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e5e7eb"/><path d="M8 28l6-7 5 6 4-5 9 10H8z" fill="%23cbd5e1"/><circle cx="14" cy="14" r="4" fill="%23cbd5e1"/></svg>';

// =========== Sort Constants ===========

export const SORT_OPTIONS = {
    NEWEST: 'newest',
    PRICE_LOW: 'price-low',
    PRICE_HIGH: 'price-high',
    RATING: 'rating',
    POPULAR: 'popular',
};

// =========== Error Messages ===========

export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Trường này là bắt buộc',
    INVALID_EMAIL: 'Email không hợp lệ',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    SERVER_ERROR: 'Lỗi máy chủ',
};

// =========== Discount Constants ===========

export const DISCOUNT_VALUE_TYPES = [
    { value: 'PERCENTAGE', label: 'Giảm theo %' },
    { value: 'AMOUNT', label: 'Giảm số tiền cố định' },
];

export const APPLY_SCOPE_OPTIONS = [
    { value: 'ORDER', label: 'Toàn bộ đơn hàng' },
    { value: 'CATEGORY', label: 'Theo danh mục sách' },
    { value: 'PRODUCT', label: 'Theo sách cụ thể' },
];

// =========== Initial Form State ===========

// Trạng thái ban đầu của form thêm sản phẩm
export const INITIAL_FORM_STATE_PRODUCT = {
    productId: '',
    name: '',
    description: '',
    author: '',
    publisher: '',
    weight: 0.0,
    length: 1,
    width: 1,
    height: 1,
    price: 0.0,
    taxPercent: '0',
    discountValue: 0.0,
    categoryId: '',
    publicationDate: '',
    stockQuantity: '',
    mediaFiles: [],
    defaultMediaUrl: '',
    errors: {},
};

// Trạng thái ban đầu của form thêm voucher
export const INITIAL_FORM_STATE_VOUCHER = {
    name: '',
    code: '',
    imageUrl: '',
    description: '',
    discountValue: '',
    discountValueType: 'PERCENTAGE',
    minOrderValue: '',
    maxDiscountValue: '',
    startDate: '',
    expiryDate: '',
    applyScope: 'CATEGORY', // Default to CATEGORY to match image
    categoryIds: [],
    productIds: [],
};

// Trạng thái ban đầu của form thêm promotion
export const INITIAL_FORM_STATE_PROMOTION = {
    name: '',
    code: '',
    imageUrl: '',
    description: '',
    discountValue: '',
    discountValueType: 'PERCENTAGE',
    minOrderValue: '',
    maxDiscountValue: '',
    startDate: '',
    expiryDate: '',
    applyScope: 'CATEGORY',
    categoryIds: [],
    productIds: [],
};
