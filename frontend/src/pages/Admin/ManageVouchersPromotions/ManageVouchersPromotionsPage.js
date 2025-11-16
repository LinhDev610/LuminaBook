import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageVouchersPromotionsPage.module.scss';
import {
    getStoredToken,
    mapVoucherStatus,
    mapPromotionStatus,
    VOUCHER_PROMOTION_SORT_OPTIONS,
    fetchAllItemsByStatus,
} from '../../../services';

const cx = classNames.bind(styles);

function ManageVouchersPromotionsPage() {
    const navigate = useNavigate();
    const searchPlaceholder = 'Tìm kiếm theo mã voucher, tên khuyến mãi.....';
    const statusOptions = VOUCHER_PROMOTION_SORT_OPTIONS;

    // ========== State Management ==========
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [allVouchers, setAllVouchers] = useState([]);
    const [allPromotions, setAllPromotions] = useState([]);
    const [filteredVouchers, setFilteredVouchers] = useState([]);
    const [filteredPromotions, setFilteredPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ========== Data Fetching ==========
    // Sử dụng helper function chung để fetch tất cả items
    const fetchAllVouchers = (token) => fetchAllItemsByStatus('voucher', token);
    const fetchAllPromotions = (token) => fetchAllItemsByStatus('promotion', token);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = getStoredToken();

            const [vouchers, promotions] = await Promise.all([
                fetchAllVouchers(token),
                fetchAllPromotions(token),
            ]);

            // Map vouchers
            const mappedVouchers = vouchers.map((v) => {
                const { label, filterKey } = mapVoucherStatus(v.status);
                return {
                    id: v.id || '',
                    code: v.code || '',
                    name: v.name || '',
                    discountValue: v.discountValue || 0,
                    discountValueType: v.discountValueType || 'PERCENTAGE',
                    maxDiscountValue: v.maxDiscountValue || 0,
                    startDate: v.startDate || '',
                    expiryDate: v.expiryDate || '',
                    submittedBy: v.submittedByName || v.submittedBy || '-',
                    status: v.status || 'PENDING_APPROVAL',
                    statusLabel: label,
                    statusFilterKey: filterKey,
                };
            });

            // Map promotions
            const mappedPromotions = promotions.map((p) => {
                const { label, filterKey } = mapPromotionStatus(p.status);
                return {
                    id: p.id || '',
                    code: p.code || '',
                    name: p.name || '',
                    discountValue: p.discountValue || 0,
                    discountValueType: p.discountValueType || 'PERCENTAGE',
                    applyScope: p.applyScope || 'ORDER',
                    startDate: p.startDate || '',
                    expiryDate: p.expiryDate || '',
                    submittedBy: p.submittedByName || p.submittedBy || '-',
                    status: p.status || 'PENDING_APPROVAL',
                    statusLabel: label,
                    statusFilterKey: filterKey,
                };
            });

            // Sort by date (newest first)
            const sortedVouchers = [...mappedVouchers].sort(
                (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0),
            );
            const sortedPromotions = [...mappedPromotions].sort(
                (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0),
            );

            setAllVouchers(sortedVouchers);
            setAllPromotions(sortedPromotions);
        } catch (e) {
            setAllVouchers([]);
            setAllPromotions([]);
            setFilteredVouchers([]);
            setFilteredPromotions([]);
            setError(e?.message || 'Không thể tải danh sách voucher và khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, []);

    // Re-apply filters when data or filters change
    useEffect(() => {
        applyFilters();
    }, [allVouchers, allPromotions, searchTerm, dateFilter, statusFilter]);

    // ========== Event Handlers ==========
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDateChange = (date) => {
        setDateFilter(date);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleSearchClick = () => {
        applyFilters();
    };

    // ========== Filter Logic ==========
    const applyFilters = () => {
        let filteredV = allVouchers;
        let filteredP = allPromotions;

        // Filter by search term
        if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filteredV = filteredV.filter(
                (v) =>
                    v.code.toLowerCase().includes(searchLower) ||
                    v.name.toLowerCase().includes(searchLower),
            );
            filteredP = filteredP.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchLower),
            );
        }

        // Filter by date
        if (dateFilter) {
            const filterDate = new Date(dateFilter + 'T00:00:00');
            filterDate.setHours(0, 0, 0, 0);

            filteredV = filteredV.filter((v) => {
                if (!v.startDate) return false;
                const startDate = new Date(v.startDate);
                startDate.setHours(0, 0, 0, 0);
                return startDate.getTime() === filterDate.getTime();
            });

            filteredP = filteredP.filter((p) => {
                if (!p.startDate) return false;
                const startDate = new Date(p.startDate);
                startDate.setHours(0, 0, 0, 0);
                return startDate.getTime() === filterDate.getTime();
            });
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filteredV = filteredV.filter((v) => v.statusFilterKey === statusFilter);
            filteredP = filteredP.filter((p) => p.statusFilterKey === statusFilter);
        }

        setFilteredVouchers(filteredV);
        setFilteredPromotions(filteredP);
    };

    // ========== Utility Functions ==========
    const getStatusClass = (statusFilterKey) => {
        switch (statusFilterKey) {
            case 'pending':
                return 'pending';
            case 'approved':
                return 'approved';
            case 'rejected':
                return 'rejected';
            case 'disabled':
                return 'disabled';
            case 'expired':
                return 'expired';
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

    const formatDate = (date) => {
        if (!date) return '-';
        try {
            const d = new Date(date);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch (_) {
            return date;
        }
    };

    const getDiscountValueText = (item) => {
        if (item.discountValueType === 'PERCENTAGE') {
            return `${item.discountValue}%`;
        } else {
            return formatPrice(item.discountValue || 0);
        }
    };

    const getApplyScopeText = (applyScope) => {
        switch (applyScope) {
            case 'ORDER':
                return 'Toàn bộ đơn hàng';
            case 'CATEGORY':
                return 'Theo danh mục sách';
            case 'PRODUCT':
                return 'Theo sách cụ thể';
            default:
                return applyScope || '-';
        }
    };

    // ========== Render States ==========
    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý Voucher & Khuyến mãi</h1>
                <div style={{ padding: '16px' }}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý Voucher & Khuyến mãi</h1>
                <div style={{ padding: '16px', color: '#EF4444' }}>Lỗi: {error}</div>
            </div>
        );
    }

    // ========== Main Render ==========
    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý Voucher & Khuyến mãi</h1>

            {/* Search and Filter Controls */}
            <div className={cx('search-sort-container')}>
                <div className={cx('search-section')}>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className={cx('search-input')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <div className={cx('date-input-wrapper')}>
                        <input
                            type="date"
                            className={cx('date-input')}
                            value={dateFilter || ''}
                            onChange={(e) => handleDateChange(e.target.value)}
                        />
                    </div>
                    <button className={cx('search-btn')} onClick={handleSearchClick}>
                        Tìm kiếm
                    </button>
                </div>

                <div className={cx('sort-section')}>
                    <span className={cx('sort-label')}>Sắp xếp:</span>
                    <select
                        className={cx('sort-dropdown')}
                        value={statusFilter}
                        onChange={handleStatusChange}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vouchers Table */}
            <div className={cx('table-section')}>
                <h2 className={cx('table-title')}>Danh sách Voucher</h2>
                <div className={cx('table-container')}>
                    <table className={cx('data-table')}>
                        <thead>
                            <tr className={cx('table-header')}>
                                <th>Mã voucher</th>
                                <th>Tên chương trình</th>
                                <th>Giá trị giảm</th>
                                <th>Ngày bắt đầu</th>
                                <th>Ngày kết thúc</th>
                                <th>Người phụ trách</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVouchers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        style={{ textAlign: 'center', padding: '20px' }}
                                    >
                                        {allVouchers.length === 0
                                            ? 'Không có voucher nào.'
                                            : 'Không có voucher phù hợp với bộ lọc.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredVouchers.map((voucher) => (
                                    <tr key={voucher.id} className={cx('table-row')}>
                                        <td>{voucher.code}</td>
                                        <td>{voucher.name}</td>
                                        <td>{getDiscountValueText(voucher)}</td>
                                        <td>{formatDate(voucher.startDate)}</td>
                                        <td>{formatDate(voucher.expiryDate)}</td>
                                        <td>{voucher.submittedBy}</td>
                                        <td>
                                            <span
                                                className={cx(
                                                    'status',
                                                    getStatusClass(voucher.statusFilterKey),
                                                )}
                                            >
                                                {voucher.statusLabel}
                                            </span>
                                        </td>
                                        <td className={cx('actions')}>
                                            <button
                                                className={cx('btn', 'view-btn')}
                                                onClick={() =>
                                                    navigate(`/admin/vouchers/${voucher.id}`)
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

            {/* Promotions Table */}
            <div className={cx('table-section')}>
                <h2 className={cx('table-title')}>Danh sách Chương trình khuyến mãi</h2>
                <div className={cx('table-container')}>
                    <table className={cx('data-table')}>
                        <thead>
                            <tr className={cx('table-header')}>
                                <th>Mã CTKM</th>
                                <th>Tên chương trình</th>
                                <th>Loại ưu đãi</th>
                                <th>Thời gian áp dụng</th>
                                <th>Người phụ trách</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPromotions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{ textAlign: 'center', padding: '20px' }}
                                    >
                                        {allPromotions.length === 0
                                            ? 'Không có chương trình khuyến mãi nào.'
                                            : 'Không có chương trình khuyến mãi phù hợp với bộ lọc.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPromotions.map((promotion) => (
                                    <tr key={promotion.id} className={cx('table-row')}>
                                        <td>{promotion.code || '-'}</td>
                                        <td>{promotion.name}</td>
                                        <td>
                                            {getDiscountValueText(promotion)} - {getApplyScopeText(promotion.applyScope)}
                                        </td>
                                        <td>
                                            {formatDate(promotion.startDate)} - {formatDate(promotion.expiryDate)}
                                        </td>
                                        <td>{promotion.submittedBy}</td>
                                        <td>
                                            <span
                                                className={cx(
                                                    'status',
                                                    getStatusClass(promotion.statusFilterKey),
                                                )}
                                            >
                                                {promotion.statusLabel}
                                            </span>
                                        </td>
                                        <td className={cx('actions')}>
                                            <button
                                                className={cx('btn', 'view-btn')}
                                                onClick={() =>
                                                    navigate(`/admin/promotions/${promotion.id}`)
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
        </div>
    );
}

export default ManageVouchersPromotionsPage;

