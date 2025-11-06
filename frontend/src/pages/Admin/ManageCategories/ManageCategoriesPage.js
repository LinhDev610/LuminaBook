import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import useLocalStorage from '../../../hooks/useLocalStorage';
import styles from './ManageCategoriesPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import { getApiBaseUrl, getStoredToken } from '../../../services/utils';
import { useNotification } from '../../../components/Common/Notification';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();

function ManageCategoriesPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { success, error: notifyError } = useNotification();
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allCategories, setAllCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ========== Helper Functions ==========
    // Dùng utils để đọc token thống nhất với các trang chi tiết
    const readToken = () => getStoredToken('token') || token;

    // Chuẩn hóa id danh mục từ object trả về API (hỗ trợ nhiều schema)
    const resolveCategoryId = useCallback((category) => {
        if (!category) return '';
        const idCandidate = category.categoryId ?? category.id ?? category.code ?? '';
        return String(idCandidate).trim();
    }, []);

    // ========== Data Fetching ==========
    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get token properly (handle JSON.stringify from useLocalStorage)
                const tokenToUse = readToken();

                if (!tokenToUse) {
                    setError('Vui lòng đăng nhập để xem danh sách danh mục');
                    setLoading(false);
                    return;
                }

                const resp = await fetch(`${API_BASE_URL}/categories`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });

                if (!resp.ok) {
                    throw new Error(`Failed to fetch categories: ${resp.status}`);
                }

                const data = await resp.json().catch(() => ({}));
                const categories = data?.result || data || [];
                setAllCategories(Array.isArray(categories) ? categories : []);
                setFilteredCategories(Array.isArray(categories) ? categories : []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(err.message || 'Không thể tải danh sách danh mục');
                setAllCategories([]);
                setFilteredCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [token]);

    // ========== Filter Logic ==========
    // Apply filters function
    const applyFilters = useCallback(
        (search, status) => {
            let filtered = allCategories;

            // Filter by search term (name, description)
            if (search && search.trim()) {
                const searchLower = search.toLowerCase().trim();
                filtered = filtered.filter(
                    (category) =>
                        category.name?.toLowerCase().includes(searchLower) ||
                        category.description?.toLowerCase().includes(searchLower) ||
                        category.id?.toLowerCase().includes(searchLower),
                );
            }

            // Filter by status - only if not "all"
            if (status !== 'all') {
                const isActive = status === 'active';
                filtered = filtered.filter((category) => {
                    // status is Boolean in API response
                    return category.status === isActive;
                });
            }

            setFilteredCategories(filtered);
        },
        [allCategories],
    );

    // Apply filters when search term or sort changes
    useEffect(() => {
        applyFilters(searchTerm, sortBy);
    }, [applyFilters, searchTerm, sortBy]);

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        applyFilters(newSearchTerm, sortBy);
    };

    const handleSort = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        applyFilters(searchTerm, newSortBy);
    };

    const getStatusText = (status) =>
        status === true || status === 'active' ? 'Hoạt động' : 'Đã khóa';
    const getStatusClass = (status) =>
        status === true || status === 'active' ? 'active' : 'locked';

    const handleAddCategory = () => {
        navigate('/admin/categories/new');
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, sortBy);
    };

    const handleEditCategory = (id) => {
        if (!id) return;
        navigate(`/admin/categories/${id}`);
    };

    // ========== Category Actions ==========
    const handleDeleteCategory = async (id) => {
        if (!id) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
        try {
            const tokenToUse = readToken();
            // Resolve real backend identifier before delete
            let resolvedId = String(id).trim();
            try {
                const probe = await fetch(`${API_BASE_URL}/categories/${resolvedId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });
                if (probe.ok) {
                    const probeData = await probe.json().catch(() => ({}));
                    const cat = probeData?.result || probeData || {};
                    resolvedId = resolveCategoryId(cat) || resolvedId;
                }
            } catch (_) { }

            const resp = await fetch(`${API_BASE_URL}/categories/${resolvedId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenToUse}`,
                },
            });
            if (!resp.ok) {
                // Parse error response từ backend
                let errorMessage = 'Không thể xóa danh mục';
                try {
                    const errorData = await resp.json().catch(() => ({}));
                    // Backend trả về message trong errorData.message hoặc errorData.result
                    errorMessage = errorData?.message || errorData?.result || errorMessage;
                } catch (_) {
                    const text = await resp.text().catch(() => '');
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }
            // Cập nhật danh sách local
            const next = allCategories.filter((c) => resolveCategoryId(c) !== String(resolvedId));
            setAllCategories(next);
            applyFilters(searchTerm, sortBy);
            success('Xóa danh mục thành công');
        } catch (e) {
            notifyError(e?.message || 'Không thể xóa danh mục');
        }
    };

    const updateCategoryStatus = async (id, newStatus) => {
        const tokenToUse = readToken();
        // Lấy dữ liệu đầy đủ hiện tại để tránh backend yêu cầu các trường bắt buộc (ví dụ: name không được null)
        const getResp = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenToUse}`,
            },
        });
        if (!getResp.ok) {
            const text = await getResp.text().catch(() => '');
            throw new Error(text || `HTTP ${getResp.status}`);
        }
        const current = await getResp.json().catch(() => ({}));
        const cat = current?.result || current || {};

        const payload = {
            name: (cat.name || '').trim(),
            description: (cat.description || '').trim() || null,
            status: Boolean(newStatus),
            parentId: cat.parentId ?? null,
            promotion: cat.promotion ?? null,
        };

        const resp = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenToUse}`,
            },
            body: JSON.stringify(payload),
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(text || `HTTP ${resp.status}`);
        }
        const data = await resp.json().catch(() => ({}));
        return data?.result || data;
    };

    const handleLockCategory = async (id) => {
        if (!id) return;
        try {
            const updated = await updateCategoryStatus(id, false);
            const next = allCategories.map((c) =>
                resolveCategoryId(c) === String(id) ? { ...c, status: false } : c,
            );
            setAllCategories(next);
            applyFilters(searchTerm, sortBy);
            success('Đã khóa danh mục');
        } catch (e) {
            notifyError(e?.message || 'Không thể khóa danh mục');
        }
    };

    const handleUnlockCategory = async (id) => {
        if (!id) return;
        try {
            const updated = await updateCategoryStatus(id, true);
            const next = allCategories.map((c) =>
                resolveCategoryId(c) === String(id) ? { ...c, status: true } : c,
            );
            setAllCategories(next);
            applyFilters(searchTerm, sortBy);
            success('Đã mở khóa danh mục');
        } catch (e) {
            notifyError(e?.message || 'Không thể mở khóa danh mục');
        }
    };

    // ========== UI Config ==========
    // Search and sort options for categories
    const categorySearchPlaceholder = 'Tìm kiếm theo tên, mô tả, mã danh mục...';
    const categorySortOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'locked', label: 'Đã khóa' },
    ];

    const additionalButtons = [
        {
            text: 'Thêm danh mục',
            className: 'add-btn',
            onClick: handleAddCategory,
        },
    ];

    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý danh mục</h1>
                <div>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý danh mục</h1>
                <div style={{ color: '#EF4444' }}>Lỗi: {error}</div>
            </div>
        );
    }

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý danh mục</h1>

            <SearchAndSort
                searchPlaceholder={categorySearchPlaceholder}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onSearchClick={handleSearchClick}
                sortLabel="Sắp xếp:"
                sortOptions={categorySortOptions}
                sortValue={sortBy}
                onSortChange={handleSort}
                additionalButtons={additionalButtons}
            />

            <div className={cx('table-container')}>
                <table className={cx('data-table')}>
                    <thead>
                        <tr className={cx('table-header')}>
                            <th>Mã danh mục</th>
                            <th>Tên danh mục</th>
                            <th>Mô tả</th>
                            <th>Danh mục cha</th>
                            <th>Số sản phẩm</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    style={{ textAlign: 'center', padding: '20px' }}
                                >
                                    Không có danh mục nào
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map((category) => (
                                <tr key={category.id} className={cx('table-row')}>
                                    <td>{category.id}</td>
                                    <td>{category.name}</td>
                                    <td>{category.description || '-'}</td>
                                    <td>{category.parentName || '-'}</td>
                                    <td>{category.productCount || 0}</td>
                                    <td
                                        className={cx(
                                            'status',
                                            getStatusClass(category.status),
                                        )}
                                    >
                                        {getStatusText(category.status)}
                                    </td>
                                    <td className={cx('actions')}>
                                        <button
                                            className={cx('btn', 'edit-btn')}
                                            onClick={() =>
                                                handleEditCategory(resolveCategoryId(category))
                                            }
                                        >
                                            Sửa
                                        </button>
                                        {category.status === true ||
                                            category.status === 'active' ? (
                                            <button
                                                className={cx('btn', 'lock-btn')}
                                                onClick={() =>
                                                    handleLockCategory(resolveCategoryId(category))
                                                }
                                            >
                                                Khóa
                                            </button>
                                        ) : (
                                            <button
                                                className={cx('btn', 'unlock-btn')}
                                                onClick={() =>
                                                    handleUnlockCategory(resolveCategoryId(category))
                                                }
                                            >
                                                Mở khóa
                                            </button>
                                        )}
                                        <button
                                            className={cx('btn', 'delete-btn')}
                                            onClick={() =>
                                                handleDeleteCategory(resolveCategoryId(category))
                                            }
                                        >
                                            Xóa
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

export default ManageCategoriesPage;
