import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import useLocalStorage from '../../../hooks/useLocalStorage';
import styles from './ManageCategoriesPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);
const API_BASE_URL = 'http://localhost:8080/lumina_book';

function ManageCategoriesPage() {
    const navigate = useNavigate();
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allCategories, setAllCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getStoredToken = () => {
        // Ưu tiên sessionStorage (không bị stringify)
        const sessionToken = sessionStorage.getItem('token');
        if (sessionToken) return sessionToken;

        // Nếu không có, đọc từ localStorage và parse
        try {
            const raw = localStorage.getItem('token');
            if (!raw) return null;
            // Nếu giá trị được stringify, parse ra; nếu không, dùng trực tiếp
            if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
                const parsed = JSON.parse(raw);
                return typeof parsed === 'string' ? parsed : raw;
            }
            return raw;
        } catch (_) {
            // Nếu parse lỗi, thử dùng trực tiếp từ hook
            return token;
        }
    };

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get token properly (handle JSON.stringify from useLocalStorage)
                const tokenToUse = getStoredToken();

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

    // Apply filters function
    const applyFilters = useCallback((search, status) => {
        let filtered = allCategories;

        // Filter by search term (name, description)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(category =>
                category.name?.toLowerCase().includes(searchLower) ||
                category.description?.toLowerCase().includes(searchLower) ||
                category.id?.toLowerCase().includes(searchLower)
            );
        }

        // Filter by status - only if not "all"
        if (status !== 'all') {
            const isActive = status === 'active';
            filtered = filtered.filter(category => {
                // status is Boolean in API response
                return category.status === isActive;
            });
        }

        setFilteredCategories(filtered);
    }, [allCategories]);

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

    const getStatusText = (status) => {
        return status === true || status === 'active' ? 'Hoạt động' : 'Đã khóa';
    };

    const getStatusClass = (status) => {
        return status === true || status === 'active' ? 'active' : 'locked';
    };

    const handleAddCategory = () => {
        navigate('/admin/add-category');
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, sortBy);
    };

    // Search and sort options for categories
    const categorySearchPlaceholder = "Tìm kiếm theo tên, mô tả, mã danh mục...";
    const categorySortOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'locked', label: 'Đã khóa' }
    ];

    const additionalButtons = [
        {
            text: 'Thêm danh mục',
            className: 'add-btn',
            onClick: handleAddCategory
        }
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
                                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
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
                                    <td className={cx('status', getStatusClass(category.status))}>
                                        {getStatusText(category.status)}
                                    </td>
                                    <td className={cx('actions')}>
                                        <button className={cx('btn', 'edit-btn')}>Sửa</button>
                                        {category.status === true || category.status === 'active' ? (
                                            <button className={cx('btn', 'lock-btn')}>Khóa</button>
                                        ) : (
                                            <button className={cx('btn', 'unlock-btn')}>Mở khóa</button>
                                        )}
                                        <button className={cx('btn', 'delete-btn')}>Xóa</button>
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
