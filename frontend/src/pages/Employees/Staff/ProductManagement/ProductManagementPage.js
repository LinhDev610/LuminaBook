import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { getProductImageUrl, normalizeMediaUrl } from '../../../../services/productUtils';
import {
    getApiBaseUrl,
    getStoredToken as getStoredTokenUtil,
    formatDateTime,
} from '../../../../services/utils';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();
const FALLBACK_THUMB =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e5e7eb"/><path d="M8 28l6-7 5 6 4-5 9 10H8z" fill="%23cbd5e1"/><circle cx="14" cy="14" r="4" fill="%23cbd5e1"/></svg>';

// Quản lý sản phẩm của staff (chỉ sản phẩm do staff này tạo)
export default function ProductManagementPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [keyword, setKeyword] = useState('');
    const [tab, setTab] = useState('all');
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategoryIdSet, setActiveCategoryIdSet] = useState(new Set());
    const [activeCategoryNameSet, setActiveCategoryNameSet] = useState(new Set());
    const [activeLoaded, setActiveLoaded] = useState(false);

    // ========== Helper Functions ==========

    const getStoredToken = () => getStoredTokenUtil('token') || token;

    // ========== Data Fetching ==========

    // Fetch sản phẩm của staff từ API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const tokenToUse = getStoredToken();
                if (!tokenToUse) {
                    setError('Vui lòng đăng nhập để xem danh sách sản phẩm');
                    setLoading(false);
                    return;
                }

                // Try my-products endpoint fist
                let url = `${API_BASE_URL}/products/my-products`;
                let resp = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });

                // Fallback: get all products if my-products endpoint not found
                if (resp.status === 404) {
                    url = `${API_BASE_URL}/products`;
                    resp = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${tokenToUse}`,
                        },
                    });
                }

                if (!resp.ok) {
                    const errorText = await resp.text().catch(() => '');
                    throw new Error(
                        `Failed to fetch products: ${resp.status} - ${errorText || resp.statusText
                        }`,
                    );
                }

                const data = await resp.json().catch(() => ({}));
                let products = data?.result || data || [];
                if (!Array.isArray(products)) {
                    products = [];
                }

                // Map API response to display format
                const mappedProducts = products.map((product) => {
                    try {
                        const imageUrl = getProductImageUrl(product);
                        const imageUrlNormalized = normalizeMediaUrl(
                            imageUrl,
                            API_BASE_URL,
                        );
                        return {
                            id: product.id || '',
                            name: product.name || '',
                            category: product.categoryName || '-',
                            categoryId: product.categoryId || product.category?.id || '',
                            price: product.price || 0,
                            status: product.status || 'Chờ duyệt',
                            updatedAt: product.updatedAt || product.createdAt,
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
                });

                setAllProducts(mappedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Không thể tải danh sách sản phẩm');
                setAllProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [token]);

    // Fetch danh sách danh mục active để ẩn sp thuộc danh mục bị khóa
    useEffect(() => {
        const fetchActiveCategories = async () => {
            try {
                const tokenToUse = getStoredToken();
                const resp = await fetch(`${API_BASE_URL}/categories/active`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });
                const data = await resp.json().catch(() => ({}));
                const list = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
                const idSet = new Set(list.map((c) => String(c.id || c.categoryId)));
                const nameSet = new Set(list.map((c) => String(c.name || '').toLowerCase()));
                setActiveCategoryIdSet(idSet);
                setActiveCategoryNameSet(nameSet);
                setActiveLoaded(true);
            } catch (_) {
                setActiveCategoryIdSet(new Set());
                setActiveCategoryNameSet(new Set());
                setActiveLoaded(false);
            }
        };
        fetchActiveCategories();
    }, [token]);

    // Lắng nghe sự kiện danh mục thay đổi để refresh tập active
    useEffect(() => {
        const onCategoriesUpdated = () => {
            // refetch active categories
            (async () => {
                try {
                    const tokenToUse = getStoredToken();
                    const resp = await fetch(`${API_BASE_URL}/categories/active`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                        },
                    });
                    const data = await resp.json().catch(() => ({}));
                    const list = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
                    const idSet = new Set(list.map((c) => String(c.id || c.categoryId)));
                    const nameSet = new Set(list.map((c) => String(c.name || '').toLowerCase()));
                    setActiveCategoryIdSet(idSet);
                    setActiveCategoryNameSet(nameSet);
                    setActiveLoaded(true);
                } catch (_) { }
            })();
            sessionStorage.removeItem('categories_dirty');
        };
        window.addEventListener('categories-updated', onCategoriesUpdated);
        if (sessionStorage.getItem('categories_dirty') === '1') onCategoriesUpdated();
        return () => window.removeEventListener('categories-updated', onCategoriesUpdated);
    }, []);

    // ========== Filter Logic ==========

    // Filter sản phẩm theo tab (status) và keyword tìm kiếm
    const getFilteredProducts = useCallback(() => {
        let filtered = allProducts;

        // Ẩn sản phẩm thuộc danh mục đã khóa (theo categoryId hoặc tên danh mục)
        // Chỉ hiển thị sản phẩm thuộc danh mục đang hoạt động khi danh sách active đã được tải
        if (activeLoaded) {
            filtered = filtered.filter((p) => {
                const pid = String(p.categoryId || '').trim();
                const pname = String(p.category || '').toLowerCase().trim();
                const idOk = pid && activeCategoryIdSet.has(pid);
                const nameOk = pname && activeCategoryNameSet.has(pname);
                return idOk || nameOk;
            });
        }

        // Filter by status tab
        if (tab !== 'all') {
            // Map tab value (tiếng Anh) sang status value (tiếng Việt)
            const tabToStatusMap = {
                pending: 'Chờ duyệt',
                approved: 'Đã duyệt',
                rejected: 'Từ chối',
            };
            const statusValue = tabToStatusMap[tab] || tab;
            filtered = filtered.filter((p) => p.status === statusValue);
        }

        // Filter by search keyword
        if (keyword && keyword.trim()) {
            const searchLower = keyword.toLowerCase().trim();
            filtered = filtered.filter(
                (p) =>
                    p.name?.toLowerCase().includes(searchLower) ||
                    p.id?.toLowerCase().includes(searchLower),
            );
        }

        return filtered;
    }, [allProducts, tab, keyword, activeCategoryIdSet, activeCategoryNameSet, activeLoaded]);

    const filtered = getFilteredProducts().sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    );

    // ========== Render States ==========

    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('header')}>
                    <h2 className={cx('title')}>Quản lý sản phẩm</h2>
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('header')}>
                    <h2 className={cx('title')}>Quản lý sản phẩm</h2>
                </div>
                <div style={{ padding: '20px', color: '#EF4444' }}>Lỗi: {error}</div>
            </div>
        );
    }

    // ========== Main Render ==========

    return (
        <div>
            {/* Header */}
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý sản phẩm</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>
            
            <div className={cx('wrap')}>
                {/* Search Controls */}
                <div className={cx('controls-top')}>
                    <input
                        className={cx('search-large')}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm kiếm theo mã, tên sản phẩm,..."
                    />
                    <button className={cx('btn', 'secondary')}>Tìm kiếm</button>
                </div>

                {/* Action Buttons */}
                <div className={cx('bottom-actions')}>
                    <button
                        className={cx('btn', 'primary')}
                        onClick={() => navigate('/staff/products/new')}
                    >
                        Thêm sản phẩm
                    </button>
                </div>

                {/* Status Tabs */}
                <div className={cx('controls')}>
                    <div className={cx('tabs')}>
                        <button
                            className={cx('tab', { active: tab === 'all' })}
                            onClick={() => setTab('all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={cx('tab', { active: tab === 'pending' })}
                            onClick={() => setTab('pending')}
                        >
                            Chờ duyệt
                        </button>
                        <button
                            className={cx('tab', { active: tab === 'approved' })}
                            onClick={() => setTab('approved')}
                        >
                            Đã duyệt
                        </button>
                        <button
                            className={cx('tab', { active: tab === 'rejected' })}
                            onClick={() => setTab('rejected')}
                        >
                            Từ chối
                        </button>
                    </div>
                </div>

                {/* Products Table */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách sản phẩm</div>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td className={cx('thumb-cell')}>
                                        {p.imageUrl ? (
                                            <img
                                                src={p.imageUrl}
                                                alt=""
                                                title={p.imageUrl}
                                                className={cx('thumb')}
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    if (img.dataset.fallbackApplied === '1')
                                                        return;
                                                    img.dataset.fallbackApplied = '1';
                                                    img.src = FALLBACK_THUMB;
                                                }}
                                            />
                                        ) : null}
                                    </td>
                                    <td className={cx('product-cell')}>
                                        <div className={cx('prod-name')}>{p.name}</div>
                                    </td>
                                    <td>{p.category}</td>
                                    <td>{p.price.toLocaleString('vi-VN')}₫</td>
                                    <td>
                                        <span
                                            className={cx(
                                                'badge',
                                                p.status === 'Chờ duyệt'
                                                    ? 'pending'
                                                    : p.status === 'Đã duyệt'
                                                        ? 'approved'
                                                        : p.status === 'Từ chối' || p.status === 'Không được duyệt'
                                                            ? 'rejected'
                                                            : 'disabled',
                                            )}
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={cx('btn', 'view-btn')}
                                            onClick={() =>
                                                navigate(`/staff/products/${p.id}`)
                                            }
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        {allProducts.length === 0
                                            ? 'Bạn chưa tạo sản phẩm nào.'
                                            : 'Không có sản phẩm phù hợp.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
