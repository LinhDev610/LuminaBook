import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import {
    getApiBaseUrl,
    getStoredToken as getStoredTokenUtil,
    getProductImageUrl,
    normalizeMediaUrl,
    formatDateTime,
} from '../../../../services/productUtils';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();
const FALLBACK_THUMB = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23e5e7eb"/><path d="M8 28l6-7 5 6 4-5 9 10H8z" fill="%23cbd5e1"/><circle cx="14" cy="14" r="4" fill="%23cbd5e1"/></svg>';

/**
 * Staff Product Management Page
 * Quản lý sản phẩm của staff (chỉ sản phẩm do staff này tạo)
 */
export default function ProductManagementPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [keyword, setKeyword] = useState('');
    const [date, setDate] = useState('');
    const [tab, setTab] = useState('all');
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    throw new Error(`Failed to fetch products: ${resp.status} - ${errorText || resp.statusText}`);
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
                        const imageUrlNormalized = normalizeMediaUrl(imageUrl, API_BASE_URL);
                        return {
                            id: product.id || '',
                            name: product.name || '',
                            category: product.categoryName || '-',
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

    // ========== Filter Logic ==========

    // Filter sản phẩm theo tab (status) và keyword tìm kiếm
    const getFilteredProducts = useCallback(() => {
        let filtered = allProducts;

        // Filter by status tab
        if (tab !== 'all') {
            // Map tab value (tiếng Anh) sang status value (tiếng Việt)
            const tabToStatusMap = {
                'pending': 'Chờ duyệt',
                'approved': 'Đã duyệt',
                'rejected': 'Từ chối',
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
                    p.id?.toLowerCase().includes(searchLower)
            );
        }

        // Filter theo ngày (phát triển sau này)
        if (date) { }

        return filtered;
    }, [allProducts, tab, keyword, date]);

    const filtered = getFilteredProducts().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

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
        <div className={cx('wrap')}>
            {/* Header */}
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý sản phẩm</h2>
            </div>

            {/* Search Controls */}
            <div className={cx('controls-top')}>
                <input
                    className={cx('search-large')}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm kiếm theo mã, tên sản phẩm,..."
                />
                <input
                    type="date"
                    className={cx('date-input')}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                            <th>Mã sách</th>
                            <th>Tên</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
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
                                                if (img.dataset.fallbackApplied === '1') return;
                                                img.dataset.fallbackApplied = '1';
                                                img.src = FALLBACK_THUMB;
                                            }}
                                        />
                                    ) : null}
                                </td>
                                <td>#{p.id}</td>
                                <td className={cx('product-cell')}>
                                    <div className={cx('prod-name')}>{p.name}</div>
                                </td>
                                <td>{p.category}</td>
                                <td>{p.price.toLocaleString('vi-VN')} đ</td>
                                <td>
                                    <span
                                        className={cx(
                                            'badge',
                                            p.status === 'Chờ duyệt'
                                                ? 'pending'
                                                : p.status === 'Đã duyệt'
                                                    ? 'approved'
                                                    : p.status === 'Từ chối'
                                                        ? 'rejected'
                                                        : 'disabled'
                                        )}
                                    >
                                        {p.status}
                                    </span>
                                </td>
                                <td>{formatDateTime(p.updatedAt)}</td>
                                <td>
                                    <button
                                        className={cx('btn', 'view-btn')}
                                        onClick={() => navigate(`/staff/products/${p.id}`)}
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className={cx('empty')}>
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
    );
}
