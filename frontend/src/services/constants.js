// Constants
// Hằng số của ứng dụng

// =========== API Configuration ===========
// API Base URL fallback - được cấu hình trong backend/application.yaml: app.frontend.base-url
export const API_BASE_URL_FALLBACK = 'http://localhost:8080/lumina_book';

// =========== API Routes ===========
export const API_ROUTES = {
    auth: {
        login: '/auth/token',
        register: '/users',
        refresh: '/auth/refresh',
        changePassword: '/auth/change-password',
        resetPassword: '/auth/reset-password',
        sendOtp: (email, mode) =>
            `/auth/send-otp?email=${encodeURIComponent(email ?? '')}&mode=${encodeURIComponent(mode ?? '')}`,
        verifyOtp: '/auth/verify-otp',
    },
    users: {
        root: '/users',
        detail: (userId) => `/users/${userId}`,
        myInfo: '/users/my-info',
        staff: '/users/staff',
    },
    categories: {
        root: '/categories',
        active: '/categories/active',
        rootOnly: '/categories/root',
        subCategories: (parentId) => `/categories/${parentId}/subcategories`,
        detail: (categoryId) => `/categories/${categoryId}`,
    },
    products: {
        root: '/products',
        active: '/products/active',
        detail: (productId) => `/products/${productId}`,
        myProducts: '/products/my-products',
        pending: '/products/pending',
        byCategory: (categoryId) => `/products/category/${categoryId}`,
        search: (keyword) => `/products/search?keyword=${encodeURIComponent(keyword ?? '')}`,
        priceRange: (minPrice, maxPrice) =>
            `/products/price-range?minPrice=${minPrice ?? ''}&maxPrice=${maxPrice ?? ''}`,
        approve: '/products/approve',
        defaultMedia: (productId, mediaUrl) =>
            `/products/${productId}/default-media?mediaUrl=${encodeURIComponent(mediaUrl ?? '')}`,
        restock: (productId) => `/products/${productId}/restock`,
    },
    media: {
        uploadProfile: '/media/upload',
        uploadProduct: '/media/upload-product',
        uploadVoucher: '/media/upload-voucher',
        uploadPromotion: '/media/upload-promotion',
    },
    vouchers: {
        root: '/vouchers',
        mine: '/vouchers/my',
        active: '/vouchers/active',
        detail: (voucherId) => `/vouchers/${voucherId}`,
        approve: '/vouchers/approve',
        pending: '/vouchers/pending',
        byStatus: (status) => `/vouchers/status/${status}`,
    },
    promotions: {
        root: '/promotions',
        mine: '/promotions/my-promotions',
        active: '/promotions/active',
        detail: (promotionId) => `/promotions/${promotionId}`,
        approve: '/promotions/approve',
        pending: '/promotions/pending',
        byStatus: (status) => `/promotions/status/${status}`,
    },
    addresses: {
        root: '/addresses',
        detail: (addressId) => `/addresses/${addressId}`,
    },
    ghn: {
        provinces: '/shipments/ghn/provinces',
        districts: (provinceId) => `/shipments/ghn/districts?province_id=${provinceId}`,
        wards: (districtId) => `/shipments/ghn/wards?district_id=${districtId}`,
        shippingFees: '/shipments/ghn/fees',
        leadtime: '/shipments/ghn/leadtime',
    },
    shipments: {
        root: '/shipments',
        pickShifts: '/shipments/pick-shifts',
        calculateFee: (orderId) => `/shipments/calculate-fee/${orderId}`,
        leadtime: (orderId) => `/shipments/leadtime/${orderId}`,
        preview: (orderId) => `/shipments/preview/${orderId}`,
        create: (orderId) => `/shipments/create/${orderId}`,
        byOrderId: (orderId) => `/shipments/order/${orderId}`,
        byGhnCode: (orderCode) => `/shipments/ghn-code/${orderCode}`,
    },
    notifications: {
        root: '/notifications',
        mine: '/notifications/my',
        sendToStaff: '/notifications/send-to-staff',
        sendToUser: (userId) => `/notifications/send-to-user/${userId}`,
        markAsRead: (notificationId) => `/notifications/${notificationId}/mark-as-read`,
        markAllAsRead: '/notifications/mark-all-as-read',
        delete: (notificationId) => `/notifications/${notificationId}`,
        deleteAllRead: '/notifications/delete-all-read',
    },
    financial: {
        revenueByDay: (start, end, timeMode = 'day') => `/api/financial/revenue/day?start=${start}&end=${end}&timeMode=${timeMode}`,
        revenueByPayment: (start, end) => `/api/financial/revenue/payment?start=${start}&end=${end}`,
        revenueSummary: (start, end) => `/api/financial/revenue/summary?start=${start}&end=${end}`,
        summary: (start, end) => `/api/financial/summary?start=${start}&end=${end}`,
        topProducts: (start, end, limit = 10) => `/api/financial/top-products?start=${start}&end=${end}&limit=${limit}`,
    },
    orders: {
        root: '/orders',
        checkout: '/orders/checkout',
        checkoutDirect: '/orders/checkout-direct',
        detail: (orderId) => `/orders/${orderId}`,
        myOrders: '/orders/my-orders',
        confirm: (orderId) => `/orders/${orderId}/confirm`,
        cancel: (orderId) => `/orders/${orderId}/cancel`,
        resendEmail: (orderId) => `/orders/${orderId}/resend-email`,
        verifyPayment: (orderId) => `/orders/${orderId}/verify-payment`,
        statistics: (start, end) => `/orders/statistics?start=${start}&end=${end}`,
        recent: (start, end, page = 0, size = 20) => `/orders/recent?start=${start}&end=${end}&page=${page}&size=${size}`,
    },
    chat: {
        send: '/chat/send',
        conversations: '/chat/conversations',
        conversation: (partnerId) => `/chat/conversation/${partnerId}`,
        markAsRead: (partnerId) => `/chat/conversation/${partnerId}/read`,
        unreadCount: '/chat/unread-count',
        customerSupport: '/chat/customer-support',
    },
};

// =========== GHN Constants ===========

// Default shop info (from api_ghn.txt)
export const GHN_DEFAULT_FROM_NAME = 'LuminaShop';
export const GHN_DEFAULT_FROM_PHONE = '0846120004';
export const GHN_DEFAULT_FROM_ADDRESS = '136 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội, Vietnam';
export const GHN_DEFAULT_FROM_WARD_CODE = '1A0602';
export const GHN_DEFAULT_FROM_DISTRICT_ID = 1485;
export const GHN_DEFAULT_FROM_PROVINCE_ID = 201;

// Service type
export const GHN_SERVICE_TYPE_LIGHT = 2; // < 20kg
export const GHN_SERVICE_TYPE_HEAVY = 5; // >= 20kg

// Weight threshold
export const GHN_HEAVY_SERVICE_WEIGHT_THRESHOLD = 20000; // 20kg in grams

// Default dimensions and weight
export const GHN_DEFAULT_DIMENSION = 12; // cm
export const GHN_DEFAULT_WEIGHT = 1200; // grams

// Other constants
export const GHN_REQUIRED_NOTE = 'CHOTHUHANG';
export const GHN_CONTENT = 'Sách từ LuminaBook';

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
    purchasePrice: 0.0,
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


// Trạng thái ban đầu của form thêm address
export const INITIAL_FORM_STATE_ADDRESS = {
    recipientName: '',
    recipientPhoneNumber: '',
    provinceID: '',
    provinceName: '',
    districtID: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    address: '',
    postalCode: '',
    defaultAddress: false,
};

export const INITIAL_FORM_STATE_ADDRESS_DETAIL = {
    id: '',
    recipientName: '',
    recipientPhoneNumber: '',
    provinceID: '',
    provinceName: '',
    districtID: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    address: '',
    postalCode: '',
    defaultAddress: false,
};