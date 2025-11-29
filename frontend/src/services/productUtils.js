// Product utilities
import { STATUS_MAP, STATUS_TO_CLASS } from './constants';

export const getProductImageUrl = (product) => {
    if (!product) return '';
    return (
        product.defaultMediaUrl ||
        product.imageUrl ||
        product.thumbnailUrl ||
        (product.media && product.media.length > 0 && product.media[0].mediaUrl) ||
        (product.productMedia && product.productMedia.length > 0 && product.productMedia.find(m => m.isDefault)?.mediaUrl) ||
        ''
    );
};

// Chuẩn hóa URL media thành URL đầy đủ
export const normalizeMediaUrl = (url, apiBaseUrl) => {
    if (!url) return '';
    // Nếu URL đã là absolute, trả về như là
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Nếu URL bắt đầu với /, thêm base URL
    if (url.startsWith('/')) return `${apiBaseUrl}${url}`;
    // Nếu không, giả sử URL là relative đến product_media
    return `${apiBaseUrl}/product_media/${url}`;
};

// Lấy tên class của status
export const getStatusClass = (status) => STATUS_TO_CLASS[status] || '';

// Định dạng giá
export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

// Mappping sản phẩm từ API sang định dạng hiển thị
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
            stockQuantity:
                typeof product.stockQuantity === 'number'
                    ? product.stockQuantity
                    : product.inventory?.stockQuantity ??
                    product.availableQuantity ??
                    null,
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

// Lọc sản phẩm theo danh mục hoạt động
export const filterByActiveCategories = (products, activeCategoryIdSet, activeCategoryNameSet) => {
    return products.filter((p) => {
        const pid = String(p.categoryId || '').trim();
        const pname = String(p.category || '').toLowerCase().trim();
        const idOk = pid && activeCategoryIdSet.has(pid);
        const nameOk = pname && activeCategoryNameSet.has(pname);
        return idOk || nameOk;
    });
};

// Lọc sản phẩm theo từ khóa tìm kiếm
export const filterByKeyword = (products, keyword) => {
    if (!keyword?.trim()) return products;
    const searchLower = keyword.toLowerCase().trim();
    return products.filter(
        (p) =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.id?.toLowerCase().includes(searchLower),
    );
};

// Lọc sản phẩm theo trạng thái
export const filterByStatus = (products, status, statusMap = STATUS_MAP) => {
    if (!status || status === 'all') return products;
    const statusValue = statusMap[status] || status;
    return products.filter((p) => p.status === statusValue);
};

// Lọc sản phẩm theo ngày (ngày đơn)
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

// Sắp xếp sản phẩm theo ngày (giảm dần)
export const sortByDate = (products, dateField = 'updatedAt') => {
    return [...products].sort(
        (a, b) => new Date(b[dateField] || 0) - new Date(a[dateField] || 0),
    );
};
