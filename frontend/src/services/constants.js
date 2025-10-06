// Constants
// Hằng số của ứng dụng

// API Endpoints
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

// Product Categories
export const PRODUCT_CATEGORIES = {
    NOVEL: 'novel',
    BUSINESS: 'business',
    TECHNOLOGY: 'technology',
    EDUCATION: 'education',
    CHILDREN: 'children',
};

// Sort Options
export const SORT_OPTIONS = {
    NEWEST: 'newest',
    PRICE_LOW: 'price-low',
    PRICE_HIGH: 'price-high',
    RATING: 'rating',
    POPULAR: 'popular',
};

// Error Messages
export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'Trường này là bắt buộc',
    INVALID_EMAIL: 'Email không hợp lệ',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    SERVER_ERROR: 'Lỗi máy chủ',
};
