import { useEffect, useState, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerVoucherPromotionPage.module.scss';
import {
    getActiveVouchers,
    getActivePromotions,
    getStoredToken,
    getApiBaseUrl,
    formatCurrency,
    normalizeMediaUrl,
} from '../../../services';
import voucherIcon from '../../../assets/icons/icon_voucher.png';

const cx = classNames.bind(styles);

function CustomerVoucherPromotionPage() {
    const [activeTab, setActiveTab] = useState('voucher'); // 'voucher' | 'promotion'
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [vouchers, setVouchers] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

    // Fetch vouchers and promotions
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = getStoredToken();
                const [vouchersData, promotionsData, bannersData] = await Promise.all([
                    getActiveVouchers(token).catch(() => []),
                    getActivePromotions(token).catch(() => []),
                    fetch(`${apiBaseUrl}/banners/active`)
                        .then((resp) => resp.json().catch(() => ({})))
                        .catch(() => ({})),
                ]);
                setVouchers(Array.isArray(vouchersData) ? vouchersData : []);
                setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const safeBanners = Array.isArray(bannersData?.result)
                    ? bannersData.result
                    : [];
                const activeBanners = safeBanners
                    .filter((b) => b?.status === true && b?.pendingReview !== true)
                    .filter((b) => {
                        const start = b.startDate ? new Date(b.startDate) : null;
                        const end = b.endDate ? new Date(b.endDate) : null;
                        if (start) start.setHours(0, 0, 0, 0);
                        if (end) end.setHours(0, 0, 0, 0);
                        const afterStart = !start || now >= start;
                        const beforeEnd = !end || now <= end;
                        return afterStart && beforeEnd;
                    })
                    .sort((a, b) => {
                        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                        return timeB - timeA;
                    })
                    .slice(0, 3)
                    .map((banner) => ({
                        id: banner.id,
                        title: banner.title,
                        description: banner.description,
                        imageUrl: normalizeMediaUrl(banner.imageUrl, apiBaseUrl),
                        linkUrl: banner.linkUrl || '',
                    }));
                setBanners(activeBanners);
            } catch (error) {
                console.error('Error fetching vouchers/promotions:', error);
                setVouchers([]);
                setPromotions([]);
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [apiBaseUrl]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch {
            return dateString;
        }
    };

    const toInputDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch {
            return '';
        }
    };

    // Format discount value (voucher & promotion)
    const formatDiscount = (voucher) => {
        if (!voucher) return '';
        const { discountValue, discountValueType } = voucher;
        if (discountValueType === 'PERCENTAGE') {
            return `${discountValue}%`;
        }
        return formatCurrency(discountValue || 0);
    };

    const formatPromotionDiscount = (promotion) => {
        if (!promotion) return '';
        const { discountValue, discountValueType } = promotion;
        if (discountValueType === 'PERCENTAGE') {
            return `${discountValue}%`;
        }
        if (!discountValue) return '--';
        return formatCurrency(discountValue);
    };

    const getPromotionStatusInfo = (promotion) => {
        if (!promotion) return { label: '--', type: 'unknown' };
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let start = promotion.startDate ? new Date(promotion.startDate) : null;
        let end = promotion.expiryDate ? new Date(promotion.expiryDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(0, 0, 0, 0);

        if (start && now < start) {
            return { label: 'Sắp diễn ra', type: 'upcoming' };
        }
        if (end && now > end) {
            return { label: 'Đã kết thúc', type: 'ended' };
        }
        return { label: 'Đang diễn ra', type: 'running' };
    };

    // Filter and search vouchers
    const filteredVouchers = useMemo(() => {
        let filtered = [...vouchers];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (v) =>
                    (v.code && v.code.toLowerCase().includes(query)) ||
                    (v.name && v.name.toLowerCase().includes(query))
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter((v) => {
                const target = new Date(dateFilter);
                target.setHours(0, 0, 0, 0);
                const start = v.startDate ? new Date(v.startDate) : null;
                const end = v.expiryDate ? new Date(v.expiryDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(0, 0, 0, 0);
                const afterStart = !start || target >= start;
                const beforeEnd = !end || target <= end;
                return afterStart && beforeEnd;
            });
        }

        // Sort filter (status)
        if (sortFilter !== 'all') {
            // For now, we only show active vouchers, so this is mainly for future use
        }

        return filtered;
    }, [vouchers, searchQuery, dateFilter, sortFilter]);

    // Filter and search promotions
    const filteredPromotions = useMemo(() => {
        let filtered = [...promotions];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    (p.code && p.code.toLowerCase().includes(query)) ||
                    (p.name && p.name.toLowerCase().includes(query))
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter((p) => {
                const target = new Date(dateFilter);
                target.setHours(0, 0, 0, 0);
                const start = p.startDate ? new Date(p.startDate) : null;
                const end = p.expiryDate ? new Date(p.expiryDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(0, 0, 0, 0);
                const afterStart = !start || target >= start;
                const beforeEnd = !end || target <= end;
                return afterStart && beforeEnd;
            });
        }

        return filtered;
    }, [promotions, searchQuery, dateFilter, sortFilter]);

    const handleSearch = () => {
        // Search is handled by useMemo filters
    };

    return (
        <div className={cx('page')}>
            {/* Header */}
            <div className={cx('header')}>
                <div className={cx('title-section')}>
                    <img src={voucherIcon} alt="voucher" className={cx('title-icon')} />
                    <h1 className={cx('title')}>Voucher và khuyến mãi</h1>
                </div>

                {/* Tabs */}
                <div className={cx('tabs')}>
                    <button
                        className={cx('tab', { active: activeTab === 'voucher' })}
                        onClick={() => setActiveTab('voucher')}
                    >
                        Voucher
                    </button>
                    <button
                        className={cx('tab', { active: activeTab === 'promotion' })}
                        onClick={() => setActiveTab('promotion')}
                    >
                        Khuyến mãi
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className={cx('search-bar')}>
                <input
                    type="text"
                    className={cx('search-input')}
                    placeholder="Tìm kiếm theo mã voucher, tên khuyến mãi,....."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <input
                    type="date"
                    className={cx('date-input')}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                <button className={cx('search-btn')} onClick={handleSearch}>
                    Tìm kiếm
                </button>
                <div className={cx('sort-section')}>
                    <span className={cx('sort-label')}>Sắp xếp:</span>
                    <select
                        className={cx('sort-select')}
                        value={sortFilter}
                        onChange={(e) => setSortFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="expired">Hết hạn</option>
                    </select>
                </div>
            </div>

            {/* Voucher List */}
            {activeTab === 'voucher' && (
                <div className={cx('voucher-list')}>
                    {loading ? (
                        <div className={cx('loading')}>Đang tải...</div>
                    ) : filteredVouchers.length === 0 ? (
                        <div className={cx('empty')}>Không có voucher nào</div>
                    ) : (
                        filteredVouchers.map((voucher) => (
                            <div key={voucher.id || voucher.code} className={cx('voucher-card')}>
                                <div className={cx('voucher-content')}>
                                    <div className={cx('voucher-text')}>
                                        <div className={cx('voucher-title')}>
                                            Giảm {formatDiscount(voucher)} cho đơn hàng từ{' '}
                                            {voucher.minOrderValue
                                                ? formatCurrency(voucher.minOrderValue)
                                                : '0đ'}
                                        </div>
                                        <div className={cx('voucher-meta')}>
                                            <span className={cx('voucher-code')}>
                                                Mã: <strong>{voucher.code || '--'}</strong>
                                            </span>
                                            {voucher.name && (
                                                <span className={cx('voucher-name')}>
                                                    {voucher.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className={cx('voucher-expiry')}>
                                            Hạn sử dụng: {formatDate(voucher.expiryDate)}
                                        </div>
                                    </div>
                                    <div className={cx('voucher-icon')}>
                                        <img
                                            src={require('../../../assets/icons/icon_voucher.png')}
                                            alt="voucher"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Promotion List (table with 5 columns) */}
            {activeTab === 'promotion' && (
                <div className={cx('promotion-table-wrapper')}>
                    {loading ? (
                        <div className={cx('loading')}>Đang tải...</div>
                    ) : filteredPromotions.length === 0 ? (
                        <div className={cx('empty')}>Không có khuyến mãi nào</div>
                    ) : (
                        <>
                            <h2 className={cx('promotion-table-title')}>
                                Thông tin các chương trình khuyến mãi hiện có
                            </h2>
                            <div className={cx('promotion-table-scroll')}>
                                <table className={cx('promotion-table')}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Tên chương trình</th>
                                            <th>Thời gian áp dụng</th>
                                            <th>Giảm giá</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPromotions.map((promotion, index) => {
                                            const statusInfo = getPromotionStatusInfo(promotion);
                                            return (
                                                <tr key={promotion.id || index}>
                                                    <td>{index + 1}</td>
                                                    <td>{promotion.name || '--'}</td>
                                                    <td>
                                                        {promotion.startDate
                                                            ? formatDate(promotion.startDate)
                                                            : '--'}{' '}
                                                        -{' '}
                                                        {promotion.expiryDate
                                                            ? formatDate(promotion.expiryDate)
                                                            : '--'}
                                                    </td>
                                                    <td>{formatPromotionDiscount(promotion)}</td>
                                                    <td>
                                                        <span
                                                            className={cx(
                                                                'status-badge',
                                                                `status-${statusInfo.type}`,
                                                            )}
                                                        >
                                                            {statusInfo.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Active banners (voucher tab only) */}
            {activeTab === 'voucher' && banners.length > 0 && (
                <div className={cx('banners-section')}>
                    <h2 className={cx('banners-title')}>Banner đang hoạt động</h2>
                    <div className={cx('banners-grid')}>
                        {banners.map((banner) => (
                            <div key={banner.id} className={cx('banner-card')}>
                                {banner.imageUrl && (
                                    <img
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        className={cx('banner-image')}
                                    />
                                )}
                                <div className={cx('banner-content')}>
                                    <h3 className={cx('banner-title')}>{banner.title}</h3>
                                    {banner.description && (
                                        <p className={cx('banner-description')}>
                                            {banner.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerVoucherPromotionPage;
