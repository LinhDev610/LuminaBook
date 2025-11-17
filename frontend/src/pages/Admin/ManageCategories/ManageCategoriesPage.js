import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import useLocalStorage from '../../../hooks/useLocalStorage';
import styles from './ManageCategoriesPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import DeleteCategoryDialog from '../../../components/Common/ConfirmDialog/DeleteCategoryDialog';
import SetStatusCategoryDialog from '../../../components/Common/ConfirmDialog/SetStatusCategoryDialog';
import { getStoredToken } from '../../../services/utils';
import { getAllCategories, getCategoryById, deleteCategory, updateCategory } from '../../../services';
import { useNotification } from '../../../components/Common/Notification';

const cx = classNames.bind(styles);

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
    const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null, loading: false });
    const [statusDialog, setStatusDialog] = useState({
        open: false,
        category: null,
        targetStatus: true,
        loading: false,
    });

    // ========== Helper Functions ==========
    // Dùng utils để đọc token thống nhất với các trang chi tiết
    const getToken = () => getStoredToken('token') || token;

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
                const tokenToUse = getToken();

                if (!tokenToUse) {
                    setError('Vui lòng đăng nhập để xem danh sách danh mục');
                    setLoading(false);
                    return;
                }

                const categories = await getAllCategories(tokenToUse);
                setAllCategories(categories);
                setFilteredCategories(categories);
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
        status === true || status === 'active' ? 'Hiển thị' : 'Ẩn';
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
    const performDeleteCategory = async (id) => {
        if (!id) return;
        try {
            const tokenToUse = getToken();
            let resolvedId = String(id).trim();
            try {
                const cat = (await getCategoryById(resolvedId, tokenToUse)) || {};
                resolvedId = resolveCategoryId(cat) || resolvedId;
            } catch (_) { }

            const { ok } = await deleteCategory(resolvedId, tokenToUse);
            if (!ok) {
                throw new Error('Không thể xóa danh mục');
            }
            const next = allCategories.filter((c) => resolveCategoryId(c) !== String(resolvedId));
            setAllCategories(next);
            applyFilters(searchTerm, sortBy);
            success('Xóa danh mục thành công');
        } catch (e) {
            notifyError(e?.message || 'Không thể xóa danh mục');
            throw e;
        }
    };

    const updateCategoryStatus = async (id, newStatus) => {
        const tokenToUse = getToken();
        // Lấy dữ liệu đầy đủ hiện tại để tránh backend yêu cầu các trường bắt buộc (ví dụ: name không được null)
        const cat = await getCategoryById(id, tokenToUse) || {};

        const payload = {
            name: (cat.name || '').trim(),
            description: (cat.description || '').trim() || null,
            status: Boolean(newStatus),
            parentId: cat.parentId ?? null,
            promotion: cat.promotion ?? null,
        };

        const { ok, data } = await updateCategory(id, payload, tokenToUse);
        if (!ok) {
            throw new Error('Không thể cập nhật danh mục');
        }
        return data || {};
    };

    const applyStatusChange = async (id, newStatus) => {
        if (!id) return;
        try {
            await updateCategoryStatus(id, newStatus);
            const next = allCategories.map((c) =>
                resolveCategoryId(c) === String(id) ? { ...c, status: Boolean(newStatus) } : c,
            );
            setAllCategories(next);
            applyFilters(searchTerm, sortBy);
            success(Boolean(newStatus) ? 'Đã hiển thị danh mục' : 'Đã ẩn danh mục');
        } catch (e) {
            notifyError(e?.message || 'Không thể cập nhật trạng thái danh mục');
            throw e;
        }
    };

    const requestDeleteCategory = (category) => {
        setDeleteDialog({
            open: true,
            category: {
                id: resolveCategoryId(category),
                name: category.name,
            },
            loading: false,
        });
    };

    const closeDeleteDialog = () => setDeleteDialog({ open: false, category: null, loading: false });

    const confirmDeleteCategory = async () => {
        if (!deleteDialog.category?.id) return;
        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        try {
            await performDeleteCategory(deleteDialog.category.id);
            closeDeleteDialog();
        } catch (_) {
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const requestStatusDialog = (category, targetStatus) => {
        setStatusDialog({
            open: true,
            category: {
                id: resolveCategoryId(category),
                name: category.name,
            },
            targetStatus,
            loading: false,
        });
    };

    const closeStatusDialog = () =>
        setStatusDialog({ open: false, category: null, targetStatus: true, loading: false });

    const confirmStatusChange = async () => {
        if (!statusDialog.category?.id) return;
        setStatusDialog((prev) => ({ ...prev, loading: true }));
        try {
            await applyStatusChange(statusDialog.category.id, statusDialog.targetStatus);
            closeStatusDialog();
        } catch (_) {
            setStatusDialog((prev) => ({ ...prev, loading: false }));
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
                                    <td>
                                        <span
                                            className={cx(
                                                'badge',
                                                getStatusClass(category.status),
                                            )}
                                        >
                                            {getStatusText(category.status)}
                                        </span>
                                    </td>
                                    <td className={cx('actions')}>
                                        <button
                                            className={cx('btn', 'edit-btn')}
                                            onClick={() =>
                                                handleEditCategory(
                                                    resolveCategoryId(category),
                                                )
                                            }
                                        >
                                            Chi tiết
                                        </button>
                                        <button
                                            className={cx('btn', 'delete-btn')}
                                            onClick={() => requestDeleteCategory(category)}
                                        >
                                            Xóa
                                        </button>
                                        {category.status === true ||
                                            category.status === 'active' ? (
                                            <button
                                                className={cx('btn', 'lock-btn')}
                                                onClick={() => requestStatusDialog(category, false)}
                                            >
                                                Ẩn
                                            </button>
                                        ) : (
                                            <button
                                                className={cx('btn', 'unlock-btn')}
                                                onClick={() => requestStatusDialog(category, true)}
                                            >
                                                Hiển thị
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <DeleteCategoryDialog
                open={deleteDialog.open}
                categoryName={deleteDialog.category?.name}
                categoryId={deleteDialog.category?.id}
                loading={deleteDialog.loading}
                onCancel={closeDeleteDialog}
                onConfirm={confirmDeleteCategory}
            />
            <SetStatusCategoryDialog
                open={statusDialog.open}
                categoryName={statusDialog.category?.name}
                categoryId={statusDialog.category?.id}
                targetStatus={statusDialog.targetStatus}
                loading={statusDialog.loading}
                onCancel={closeStatusDialog}
                onConfirm={confirmStatusChange}
            />
        </div>
    );
}

export default ManageCategoriesPage;
