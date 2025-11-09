import { useState, useEffect } from 'react';
import { getStoredToken, getApiBaseUrl } from '../services';
import { getAllProducts, getMyProducts, getActiveProducts, getPendingProducts } from '../services';
import { mapProduct } from '../services/productUtils';

/**
 * Custom hook để fetch products từ API backend
 * 
 * @param {Object} options - Options
 * @param {string} options.endpoint - API endpoint (default: '/products')
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

                let productsList = [];
                try {
                    if (endpoint === '/products/my-products') {
                        productsList = await getMyProducts(tokenToUse);
                    } else if (endpoint === '/products/active') {
                        productsList = await getActiveProducts(tokenToUse);
                    } else if (endpoint === '/products/pending') {
                        productsList = await getPendingProducts(tokenToUse);
                    } else {
                        productsList = await getAllProducts(tokenToUse);
                    }
                } catch (err) {
                    if (endpoint === '/products/my-products') {
                        console.warn('Endpoint /products/my-products not found, falling back to /products');
                        productsList = await getAllProducts(tokenToUse);
                    } else {
                        throw err;
                    }
                }

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
    }, [endpoint, token, requireAuth, API_BASE_URL]);

    return { products, loading, error, refetch: () => { } };
};

