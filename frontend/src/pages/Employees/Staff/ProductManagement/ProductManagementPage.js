import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState, useMemo, useEffect } from 'react';
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
    STATUS_MAP, FALLBACK_THUMB,
    restockProduct,
} from '../../../../services';
import SearchAndSort from '../../../../components/Common/SearchAndSort';
import StatusBadge from '../../../../components/Common/StatusBadge';
import RestockProductDialog from '../../../../components/Common/RestockProductDialog';
import RestockDialog from '../../../../components/Common/ConfirmDialog/RestockDialog';

const cx = classNames.bind(styles);

// Quản lý sản phẩm của staff (chỉ sản phẩm do staff này tạo)
export default function ProductManagementPage() {
    const navigate = useNavigate();
    const [token] = useLocalStorage('token', null);
    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [tab, setTab] = useState('all');
    const [productsData, setProductsData] = useState([]);
    const [restockTarget, setRestockTarget] = useState(null);
    const [restockOpen, setRestockOpen] = useState(false);
    const [restockConfirmOpen, setRestockConfirmOpen] = useState(false);
    const [restockLoading, setRestockLoading] = useState(false);
    const [restockSuccess, setRestockSuccess] = useState('');
    const [restockErrorMsg, setRestockErrorMsg] = useState('');
    const [pendingQuantity, setPendingQuantity] = useState(null);

    // Fetch data using custom hooks (API endpoint (backend)
    const { products: allProducts, loading, error } = useProducts({
        endpoint: '/products/my-products', // API endpoint để lấy sản phẩm của staff hiện tại
        token,
    });
    const { activeCategoryIdSet, activeCategoryNameSet, loaded: activeLoaded } = useActiveCategories(token);

    useEffect(() => {
        setProductsData(allProducts);
    }, [allProducts]);

    // ========== Filter Logic ==========

    // Filter products using utility functions
    const filtered = useMemo(() => {
        let result = productsData;
        if (activeLoaded) {
            result = filterByActiveCategories(result, activeCategoryIdSet, activeCategoryNameSet);
        }
        result = filterByStatus(result, tab, STATUS_MAP);
        result = filterByKeyword(result, keyword);
        result = filterByDate(result, dateFilter);
        return sortByDate(result);
    }, [productsData, tab, keyword, dateFilter, activeCategoryIdSet, activeCategoryNameSet, activeLoaded]);

    const resetRestockFlow = () => {
        setRestockOpen(false);
        setRestockConfirmOpen(false);
        setRestockTarget(null);
        setPendingQuantity(null);
    };

    const handleOpenRestock = (product) => {
        setRestockTarget(product);
        setPendingQuantity(null);
        setRestockOpen(true);
        setRestockConfirmOpen(false);
        setRestockErrorMsg('');
        setRestockSuccess('');
    };

    const handleDialogCancel = () => {
        if (restockLoading) return;
        resetRestockFlow();
    };

    const handleConfirmCancel = () => {
        if (restockLoading) return;
        setRestockConfirmOpen(false);
        setRestockOpen(true);
    };

    const clearRestockAlert = () => {
        setRestockSuccess('');
        setRestockErrorMsg('');
    };

    const handleRestockFormSubmit = (quantity) => {
        setPendingQuantity(quantity);
        setRestockOpen(false);
        setRestockConfirmOpen(true);
        setRestockErrorMsg('');
    };

    const handleRestockSubmit = async () => {
        if (!restockTarget) return;
        if (!token) {
            setRestockErrorMsg('Vui lòng đăng nhập để bổ sung tồn kho.');
            setRestockConfirmOpen(false);
            setRestockOpen(true);
            return;
        }

        const quantityValue = Number(pendingQuantity);
        if (!quantityValue || Number.isNaN(quantityValue) || quantityValue <= 0) {
            setRestockErrorMsg('Số lượng bổ sung không hợp lệ.');
            setRestockConfirmOpen(false);
            setRestockOpen(true);
            return;
        }

        const targetId = restockTarget.id;
        const targetName = restockTarget.name;

        try {
            setRestockLoading(true);
            const response = await restockProduct(targetId, quantityValue, token);

            if (!response?.ok) {
                throw new Error(response?.data?.message || 'Không thể cập nhật tồn kho.');
            }

            const updatedStock =
                typeof response?.data?.stockQuantity === 'number'
                    ? response.data.stockQuantity
                    : (restockTarget.stockQuantity ?? 0) + quantityValue;

            setProductsData((prev) =>
                prev.map((p) => (p.id === targetId ? { ...p, stockQuantity: updatedStock } : p)),
            );
            setRestockSuccess(`Đã bổ sung ${quantityValue} sản phẩm cho "${targetName}".`);
            setRestockErrorMsg('');
            resetRestockFlow();
        } catch (err) {
            setRestockErrorMsg(err.message || 'Không thể bổ sung tồn kho. Vui lòng thử lại.');
            setRestockConfirmOpen(false);
            setRestockOpen(true);
        } finally {
            setRestockLoading(false);
        }
    };

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

                {(restockSuccess || restockErrorMsg) && (
                    <div className={cx('alert', restockErrorMsg ? 'error' : 'success')}>
                        <span>{restockErrorMsg || restockSuccess}</span>
                        <button
                            type="button"
                            className={cx('alert-close')}
                            onClick={clearRestockAlert}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                )}

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
                                        <div className={cx('action-group')}>
                                            <button
                                                className={cx('btn', 'view-btn')}
                                                onClick={() =>
                                                    navigate(`/staff/products/${p.id}`)
                                                }
                                            >
                                                Xem chi tiết
                                            </button>
                                            <button
                                                type="button"
                                                className={cx('btn', 'restock-btn')}
                                                onClick={() => handleOpenRestock(p)}
                                            >
                                                Bổ sung kho
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        {productsData.length === 0
                                            ? 'Bạn chưa tạo sản phẩm nào.'
                                            : 'Không có sản phẩm phù hợp.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RestockProductDialog
                open={restockOpen}
                product={restockTarget}
                defaultQuantity={pendingQuantity}
                loading={restockLoading}
                onSubmit={handleRestockFormSubmit}
                onCancel={handleDialogCancel}
            />
            <RestockDialog
                open={restockConfirmOpen}
                product={restockTarget}
                quantity={pendingQuantity}
                loading={restockLoading}
                onConfirm={handleRestockSubmit}
                onCancel={handleConfirmCancel}
            />
        </div>
    );
}
