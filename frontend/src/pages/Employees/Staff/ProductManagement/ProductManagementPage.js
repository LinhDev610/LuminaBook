import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { useProducts } from '../../../../hooks/useProducts';
import { useActiveCategories } from '../../../../hooks/useActiveCategories';
import {
    filterByActiveCategories,
    filterByKeyword,
    filterByStatus,
    filterByDate,
    sortByDate,
} from '../../../../services/productUtils';
import { STATUS_MAP, FALLBACK_THUMB } from '../../../../services/constants';
import SearchAndSort from '../../../../components/Common/SearchAndSort';
import StatusBadge from '../../../../components/Common/StatusBadge';

const cx = classNames.bind(styles);

// Quản lý sản phẩm của staff (chỉ sản phẩm do staff này tạo)
export default function ProductManagementPage() {
    const navigate = useNavigate();
    const [token] = useLocalStorage('token', null);
    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [tab, setTab] = useState('all');

    // Fetch data using custom hooks (API endpoint (backend)
    const { products: allProducts, loading, error } = useProducts({
        endpoint: '/products/my-products', // API endpoint để lấy sản phẩm của staff hiện tại
        token,
    });
    const { activeCategoryIdSet, activeCategoryNameSet, loaded: activeLoaded } = useActiveCategories(token);

    // ========== Filter Logic ==========

    // Filter products using utility functions
    const filtered = useMemo(() => {
        let result = allProducts;
        if (activeLoaded) {
            result = filterByActiveCategories(result, activeCategoryIdSet, activeCategoryNameSet);
        }
        result = filterByStatus(result, tab, STATUS_MAP);
        result = filterByKeyword(result, keyword);
        result = filterByDate(result, dateFilter);
        return sortByDate(result);
    }, [allProducts, tab, keyword, dateFilter, activeCategoryIdSet, activeCategoryNameSet, activeLoaded]);

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
                <SearchAndSort
                    searchPlaceholder="Tìm kiếm theo mã, tên sản phẩm,..."
                    searchValue={keyword}
                    onSearchChange={(e) => setKeyword(e.target.value)}
                    onSearchClick={() => { }}
                    dateFilter={dateFilter}
                    onDateChange={(value) => setDateFilter(value)}
                    dateLabel="Ngày"
                />

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
                                        <StatusBadge status={p.status} />
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
