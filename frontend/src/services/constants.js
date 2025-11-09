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
    disabled: 'Vô hiệu hóa',
};

export const STATUS_TO_CLASS = {
    'Chờ duyệt': 'pending',
    'Đã duyệt': 'approved',
    'Từ chối': 'rejected',
    'Không được duyệt': 'rejected',
    'Vô hiệu hóa': 'disabled',
};

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

// =========== Initial Form State ===========

// Trạng thái ban đầu của form thêm sản phẩm
export const INITIAL_FORM_STATE = {
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