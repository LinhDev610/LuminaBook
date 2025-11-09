import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageProductsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import { formatDateTime } from '../../../services/utils';
import { getAllProducts, getActiveCategories } from '../../../services';

const cx = classNames.bind(styles);

function ManageProductsPage() {
    // ========== Constants ==========
    const navigate = useNavigate();
    const productSearchPlaceholder = 'Tìm kiếm theo mã đơn, tên sản phẩm,......';
    const statusOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'Chờ duyệt', label: 'Chờ duyệt' },
        { value: 'Đã duyệt', label: 'Đã duyệt' },
        { value: 'Từ chối', label: 'Từ chối' },
    ];

    // ========== State Management ==========
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([
        { value: 'all', label: 'Tất cả danh mục' },
    ]);
    const [activeCategoryIdSet, setActiveCategoryIdSet] = useState(new Set());
    const [activeCategoryNameSet, setActiveCategoryNameSet] = useState(new Set());
    const [activeLoaded, setActiveLoaded] = useState(false);

    const categoryOptions = categories;

    // ========== Data Fetching ==========
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const list = await getAllProducts();
            const mapped = list.map((p) => ({
                id: p.id || '',
                name: p.name || '',
                category: p.categoryName || '-',
                categoryId: p.categoryId || '',
                price: p.price || 0,
                status: p.status || 'Chờ duyệt',
                createdAt: p.createdAt || p.updatedAt,
                updatedAt: p.updatedAt || p.createdAt,
            }));
            const sorted = [...mapped].sort(
                (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
            );
            setAllProducts(sorted);
        } catch (e) {
            setAllProducts([]);
            setFilteredProducts([]);
            setError(e?.message || 'Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const list = await getActiveCategories();
            const opts = [{ value: 'all', label: 'Tất cả danh mục' }].concat(
                list.map((c) => ({ value: c.id || c.categoryId, label: c.name })),
            );
            setCategories(opts);
            const idSet = new Set(list.map((c) => String(c.id || c.categoryId)));
            const nameSet = new Set(list.map((c) => String(c.name || '').toLowerCase()));
            setActiveCategoryIdSet(idSet);
            setActiveCategoryNameSet(nameSet);
            setActiveLoaded(true);
        } catch (_) {
            setCategories([{ value: 'all', label: 'Tất cả danh mục' }]);
            setActiveCategoryIdSet(new Set());
            setActiveCategoryNameSet(new Set());
            setActiveLoaded(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    // Re-apply filters when data or filters change
    useEffect(() => {
        applyFiltersWithSource(allProducts, searchTerm, categoryFilter, statusFilter);
    }, [allProducts, searchTerm, categoryFilter, statusFilter, activeLoaded, activeCategoryIdSet, activeCategoryNameSet]);

    // ========== Event Handlers ==========

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        applyFilters(newSearchTerm, categoryFilter, statusFilter);
    };

    const handleCategoryChange = (e) => {
        const newCategoryId = e.target.value;
        setCategoryFilter(newCategoryId);
        // Filter client-side từ allProducts (đã có tất cả sản phẩm)
        applyFilters(searchTerm, newCategoryId, statusFilter);
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        applyFilters(searchTerm, categoryFilter, newStatus);
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, categoryFilter, statusFilter);
    };

    // ========== Filter Logic ==========

    /**
     * Áp dụng các filter lên danh sách sản phẩm
     * @param {Array} source - Danh sách sản phẩm nguồn
     * @param {string} search - Từ khóa tìm kiếm
     * @param {string} categoryId - ID danh mục (hoặc 'all')
     * @param {string} status - Trạng thái (hoặc 'all')
     */
    const applyFiltersWithSource = (source, search, categoryId, status) => {
        let filtered = source;

        // Filter by search term (product ID, name)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(
                (product) =>
                    product.id.toLowerCase().includes(searchLower) ||
                    product.name.toLowerCase().includes(searchLower),
            );
        }

        // Filter by category ID
        if (categoryId && categoryId !== 'all') {
            filtered = filtered.filter(
                (product) => String(product.categoryId) === String(categoryId),
            );
        }

        // Hide products of locked categories once active categories are loaded
        if (activeLoaded) {
            filtered = filtered.filter((p) => {
                const pid = String(p.categoryId || '').trim();
                const pname = String(p.category || '').toLowerCase().trim();
                const idOk = pid && activeCategoryIdSet.has(pid);
                const nameOk = pname && activeCategoryNameSet.has(pname);
                return idOk || nameOk;
            });
        }

        // Filter by status
        if (status !== 'all') {
            filtered = filtered.filter((product) => product.status === status);
        }

        // Sort by updatedAt desc
        const sorted = [...filtered].sort(
            (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
        setFilteredProducts(sorted);
    };

    // Áp dụng filter lên danh sách sản phẩm hiện tại
    const applyFilters = (search, category, status) => {
        applyFiltersWithSource(allProducts, search, category, status);
    };

    // ========== Utility Functions ==========

    const getStatusClass = (status) => {
        switch (status) {
            case 'Chờ duyệt':
                return 'pending';
            case 'Đã duyệt':
                return 'approved';
            case 'Từ chối':
                return 'rejected';
            case 'Vô hiệu hóa':
                return 'disabled';
            default:
                return '';
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // ========== Render States ==========

    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý sản phẩm</h1>
                <div style={{ padding: '16px' }}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý sản phẩm</h1>
                <div style={{ padding: '16px', color: '#EF4444' }}>Lỗi: {error}</div>
            </div>
        );
    }

    // ========== Main Render ==========

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý sản phẩm</h1>

            {/* Search and Filter Controls */}
            <SearchAndSort
                searchPlaceholder={productSearchPlaceholder}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onSearchClick={handleSearchClick}
                filters={[
                    {
                        label: 'Danh mục:',
                        options: categoryOptions,
                        value: categoryFilter,
                        onChange: handleCategoryChange
                    },
                    {
                        options: statusOptions,
                        value: statusFilter,
                        onChange: handleStatusChange
                    }
                ]}
            />

            {/* Products Table */}
            <div className={cx('table-container')}>
                <table className={cx('data-table')}>
                    <thead>
                        <tr className={cx('table-header')}>
                            <th>Mã sản phẩm</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo/Cập nhật</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{ textAlign: 'center', padding: '20px' }}
                                >
                                    {allProducts.length === 0
                                        ? 'Không có sản phẩm nào.'
                                        : 'Không có sản phẩm phù hợp với bộ lọc.'}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className={cx('table-row')}>
                                    <td>{product.id}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{formatPrice(product.price)}</td>
                                    <td
                                        className={cx(
                                            'status',
                                            getStatusClass(product.status),
                                        )}
                                    >
                                        {product.status}
                                    </td>
                                    <td>
                                        {formatDateTime(
                                            product.updatedAt || product.createdAt,
                                        )}
                                    </td>
                                    <td className={cx('actions')}>
                                        <button
                                            className={cx('btn', 'view-btn')}
                                            onClick={() =>
                                                navigate(`/admin/products/${product.id}`)
                                            }
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ManageProductsPage;
