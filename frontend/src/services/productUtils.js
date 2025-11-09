// Product utilities - tái sử dụng cho toàn bộ dự án

export const getProductImageUrl = (product) => {
    if (!product) return '';
    // Try multiple possible fields
    return (
        product.defaultMediaUrl ||
        product.imageUrl ||
        product.thumbnailUrl ||
        (product.media && product.media.length > 0 && product.media[0].mediaUrl) ||
        (product.productMedia && product.productMedia.length > 0 && product.productMedia.find(m => m.isDefault)?.mediaUrl) ||
        ''
    );
};

// Normalize media URL to full URL
export const normalizeMediaUrl = (url, apiBaseUrl) => {
    if (!url) return '';
    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // If starts with /, prepend base URL
    if (url.startsWith('/')) return `${apiBaseUrl}${url}`;
    // Otherwise, assume it's relative to product_media
    return `${apiBaseUrl}/product_media/${url}`;
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

// Get status class name
export const getStatusClass = (status) => STATUS_TO_CLASS[status] || '';

// Format price
export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

// Map product from API to display format
export const mapProduct = (product, apiBaseUrl) => {
    try {
        const imageUrl = getProductImageUrl(product);
        const imageUrlNormalized = normalizeMediaUrl(imageUrl, apiBaseUrl);
        return {
            id: product.id || '',
            name: product.name || '',
            category: product.categoryName || '-',
            categoryId: product.categoryId || product.category?.id || '',
            price: product.price || 0,
            status: product.status || 'Chờ duyệt',
            updatedAt: product.updatedAt || product.createdAt,
            createdAt: product.createdAt || product.updatedAt,
            imageUrl: imageUrlNormalized,
            description: product.description,
            author: product.author,
            publisher: product.publisher,
            rejectionReason: product.rejectionReason,
        };
    } catch (err) {
        console.error('Error mapping product:', product, err);
        return {
            id: product.id || '',
            name: product.name || '',
            category: product.categoryName || '-',
            price: product.price || 0,
            status: 'Chờ duyệt',
            updatedAt: product.updatedAt || product.createdAt,
        };
    }
};

// Filter products by active categories
export const filterByActiveCategories = (products, activeCategoryIdSet, activeCategoryNameSet) => {
    return products.filter((p) => {
        const pid = String(p.categoryId || '').trim();
        const pname = String(p.category || '').toLowerCase().trim();
        const idOk = pid && activeCategoryIdSet.has(pid);
        const nameOk = pname && activeCategoryNameSet.has(pname);
        return idOk || nameOk;
    });
};

// Filter products by search keyword
export const filterByKeyword = (products, keyword) => {
    if (!keyword?.trim()) return products;
    const searchLower = keyword.toLowerCase().trim();
    return products.filter(
        (p) =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.id?.toLowerCase().includes(searchLower),
    );
};

// Filter products by status
export const filterByStatus = (products, status, statusMap = STATUS_MAP) => {
    if (!status || status === 'all') return products;
    const statusValue = statusMap[status] || status;
    return products.filter((p) => p.status === statusValue);
};

// Filter products by date (single date)
export const filterByDate = (products, date, dateField = 'updatedAt') => {
    if (!date) return products;
    try {
        const filterDate = new Date(date + 'T00:00:00');
        filterDate.setHours(0, 0, 0, 0);
        return products.filter((p) => {
            if (!p[dateField]) return false;
            const productDate = new Date(p[dateField]);
            productDate.setHours(0, 0, 0, 0);
            return productDate.getTime() === filterDate.getTime();
        });
    } catch (err) {
        console.error('Error filtering by date:', err);
        return products;
    }
};

// Sort products by date (desc)
export const sortByDate = (products, dateField = 'updatedAt') => {
    return [...products].sort(
        (a, b) => new Date(b[dateField] || 0) - new Date(a[dateField] || 0),
    );
};
