import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './VouchersPromotionsPage.module.scss';
import { useSearchAndFilter } from '../../../../hooks';
import StatusBadge from '../../../../components/Common/StatusBadge';
import { useNotification } from '../../../../components/Common/Notification';
import {
    getStoredToken,
    fetchAllItemsByStatus
} from '../../../../services';
import {
    STATUS_FILTER_MAP,
    VOUCHER_PROMOTION_SORT_OPTIONS,
    mapPromotionStatus,
    mapVoucherStatus,
} from '../../../../services/constants';

const cx = classNames.bind(styles);

const formatDateTime = (value) => {
    if (!value) return '--';
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '--';
        return new Intl.DateTimeFormat('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(date);
    } catch (err) {
        return '--';
    }
};

export default function VouchersPromotionsPage() {
    const navigate = useNavigate();
    const { error: notifyError } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            try {
                setIsLoading(true);
                const token = getStoredToken();

                // Lấy tất cả voucher và promotion theo tất cả các status (dùng helper function chung)
                const [uniqueVouchers, uniquePromotions] = await Promise.all([
                    fetchAllItemsByStatus('voucher', token).catch(() => []),
                    fetchAllItemsByStatus('promotion', token).catch(() => []),
                ]);

                if (!isMounted) return;

                // Đảm bảo là array trước khi map
                const vouchersArray = Array.isArray(uniqueVouchers) ? uniqueVouchers : [];
                const promotionsArray = Array.isArray(uniquePromotions) ? uniquePromotions : [];

                const normalizedVouchers = vouchersArray.map((item) => {
                    const { label, filterKey } = mapVoucherStatus(item.status);
                    const dateValue = item.submittedAt || item.createdAt;
                    return {
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        type: 'Voucher',
                        statusLabel: label,
                        statusFilterKey: filterKey,
                        createdAt: formatDateTime(dateValue),
                        createdAtRaw: dateValue ? new Date(dateValue).getTime() : 0,
                        entity: 'voucher',
                    };
                });

                const normalizedPromotions = promotionsArray.map((item) => {
                    const { label, filterKey } = mapPromotionStatus(item.status);
                    const dateValue = item.submittedAt || item.createdAt;
                    return {
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        type: 'Khuyến mãi',
                        statusLabel: label,
                        statusFilterKey: filterKey,
                        createdAt: formatDateTime(dateValue),
                        createdAtRaw: dateValue ? new Date(dateValue).getTime() : 0,
                        entity: 'promotion',
                    };
                });

                // Debug: Log để kiểm tra
                // console.log('Vouchers:', normalizedVouchers.length);
                // console.log('Promotions:', normalizedPromotions.length);
                // console.log('All records:', normalizedVouchers.length + normalizedPromotions.length);

                setRecords([...normalizedVouchers, ...normalizedPromotions]);
            } catch (err) {
                if (isMounted) {
                    notifyError('Không thể tải danh sách voucher / khuyến mãi. Vui lòng thử lại sau.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        fetchData();
        return () => {
            isMounted = false;
        };
    }, [notifyError]);

    // Sử dụng hook dùng chung để filter
    const filtered = useSearchAndFilter(records, {
        searchQuery,
        statusFilter: sortFilter,
        dateFilter,
        searchFields: ['code', 'name'], // Tìm kiếm theo mã và tên
        statusField: 'statusFilterKey',
        statusMap: {
            ...STATUS_FILTER_MAP,
        },
    });

    // Sắp xếp theo ngày tạo (mới nhất trước)
    const sortedAndFiltered = useMemo(() => {
        return [...filtered].sort((a, b) => {
            // Sắp xếp giảm dần (mới nhất trước)
            return (b.createdAtRaw || 0) - (a.createdAtRaw || 0);
        });
    }, [filtered]);

    const handleViewDetail = (record) => {
        if (record.entity === 'promotion') {
            navigate(`/staff/promotions/${record.id}`);
        } else {
            navigate(`/staff/vouchers/${record.id}`);
        }
    };

    const handleAddVoucher = () => {
        navigate('/staff/vouchers/new');
    };

    const handleAddPromotion = () => {
        navigate('/staff/promotions/new');
    };

    const sortOptions = useMemo(() => VOUCHER_PROMOTION_SORT_OPTIONS, []);

    return (
        <div>
            {/* Header */}
            <div className={cx('header')}>
                <h1 className={cx('title')}>Voucher & Khuyến mãi</h1>
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
                {/* Search và Filter */}
                <div className={cx('search-filter-container')}>
                    {/* Hàng 1: Search, Date, Search Button */}
                    <div className={cx('search-row')}>
                        <input
                            type="text"
                            className={cx('search-input')}
                            placeholder="Tìm kiếm theo mã voucher, tên khuyến mãi....."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className={cx('date-wrapper')}>
                            <input
                                type="date"
                                className={cx('date-input')}
                                value={dateFilter || ''}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <button className={cx('search-btn')} onClick={() => { }}>
                            Tìm kiếm
                        </button>
                    </div>

                    {/* Hàng 2: Sort (trái) và Action Buttons (phải) */}
                    <div className={cx('filter-row')}>
                        <div className={cx('sort-section')}>
                            <span className={cx('sort-label')}>Sắp xếp:</span>
                            <select
                                className={cx('sort-dropdown')}
                                value={sortFilter}
                                onChange={(e) => setSortFilter(e.target.value)}
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={cx('action-buttons')}>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={handleAddVoucher}
                            >
                                Thêm voucher
                            </button>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={handleAddPromotion}
                            >
                                Thêm khuyến mãi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bảng Voucher & Khuyến mãi */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách Voucher / Khuyến mãi</div>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên</th>
                                <th>Loại</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : sortedAndFiltered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        Không có voucher/khuyến mãi phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                sortedAndFiltered.map((record) => (
                                    <tr key={`${record.entity}-${record.id}`}>
                                        <td className={cx('code-cell')}>{record.code || '-'}</td>
                                        <td className={cx('name-cell')}>{record.name}</td>
                                        <td>{record.type}</td>
                                        <td>{record.createdAt}</td>
                                        <td>
                                            <StatusBadge status={record.statusLabel} />
                                        </td>
                                        <td>
                                            <button
                                                className={cx('btn', 'view-btn')}
                                                onClick={() => handleViewDetail(record)}
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

