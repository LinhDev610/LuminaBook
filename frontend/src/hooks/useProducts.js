import { useState, useEffect } from 'react';
import { getApiBaseUrl, getStoredToken } from '../services/utils';
import { mapProduct } from '../services/productUtils';

/**
 * Custom hook để fetch products từ API backend
 * 
 * Lưu ý: endpoint ở đây là API endpoint (backend), KHÔNG phải frontend route
 * Ví dụ:
 * - API endpoint: '/products/my-products' -> gọi API backend
 * - Frontend route: '/staff/products' -> hiển thị trang UI (định nghĩa trong routes.js)
 * 
 * @param {Object} options - Options
 * @param {string} options.endpoint - API endpoint URL (default: '/products')
 *   - '/products' - Lấy tất cả sản phẩm
 *   - '/products/my-products' - Lấy sản phẩm của user hiện tại (staff)
 *   - '/products/active' - Lấy sản phẩm đã được duyệt
 *   - '/products/pending' - Lấy sản phẩm chờ duyệt (admin only)
 * @param {string} options.token - Token (optional)
 * @param {boolean} options.requireAuth - Require auth (default: true)
 */
export const useProducts = ({ endpoint = '/products', token, requireAuth = true } = {}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const tokenToUse = token || getStoredToken('token');
                if (requireAuth && !tokenToUse) {
                    setError('Vui lòng đăng nhập để xem danh sách sản phẩm');
                    setLoading(false);
                    return;
                }

                let url = `${API_BASE_URL}${endpoint}`;
                let resp = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });

                // Fallback: Nếu endpoint /products/my-products không tồn tại (404),
                // fallback về /products để lấy tất cả sản phẩm
                // (Trường hợp backend chưa implement endpoint này)
                if (resp.status === 404 && endpoint === '/products/my-products') {
                    console.warn('Endpoint /products/my-products not found, falling back to /products');
                    url = `${API_BASE_URL}/products`;
                    resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                        },
                    });
                }

                if (!resp.ok) {
                    const errorText = await resp.text().catch(() => '');
                    throw new Error(errorText || `HTTP ${resp.status}`);
                }

                const data = await resp.json().catch(() => ({}));
                let productsList = data?.result || data || [];
                if (!Array.isArray(productsList)) productsList = [];

                const mapped = productsList.map((p) => mapProduct(p, API_BASE_URL));
                setProducts(mapped);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Không thể tải danh sách sản phẩm');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [endpoint, token, requireAuth]);

    return { products, loading, error, refetch: () => { } };
};

