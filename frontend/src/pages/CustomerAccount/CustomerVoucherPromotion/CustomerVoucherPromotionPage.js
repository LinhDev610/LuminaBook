import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerVoucherPromotionPage.module.scss';
import {
    getActivePromotions,
    getActiveVouchers,
    getApiBaseUrl,
    getStoredToken,
    formatCurrency,
    normalizeMediaUrl,
} from '../../../services';
import voucherIcon from '../../../assets/icons/icon_voucher.png';

const cx = classNames.bind(styles);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
};

const isDateWithinRange = (target, start, end) => {
    const normalizedTarget = normalizeDate(target);
    if (!normalizedTarget) return true;
    const normalizedStart = start ? normalizeDate(start) : null;
    const normalizedEnd = end ? normalizeDate(end) : null;
    const afterStart = !normalizedStart || normalizedTarget >= normalizedStart;
    const beforeEnd = !normalizedEnd || normalizedTarget <= normalizedEnd;
    return afterStart && beforeEnd;
};

const formatDate = (value) => {
    const date = normalizeDate(value);
    if (!date) return '--';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const formatDiscountValue = (item) => {
    if (!item) return '';
    if (item.discountValueType === 'PERCENTAGE') {
        return `${item.discountValue || 0}%`;
    }
    const value = item.discountValue ?? 0;
    if (!value) return '0đ';
    return formatCurrency(value);
};

const getPromotionStatusInfo = (promotion) => {
    const now = normalizeDate(new Date());
    const start = normalizeDate(promotion?.startDate);
    const end = normalizeDate(promotion?.expiryDate);
    if (start && now < start) return { label: 'Sắp diễn ra', type: 'upcoming' };
    if (end && now > end) return { label: 'Đã kết thúc', type: 'ended' };
    return { label: 'Đang diễn ra', type: 'running' };
};

const filterVouchers = (vouchers, searchQuery, dateFilter) => {
    const targetDate = dateFilter ? normalizeDate(dateFilter) : null;
    const query = searchQuery.trim().toLowerCase();
    return ensureArray(vouchers).filter((voucher) => {
        const matchesSearch =
            !query ||
            (voucher.code && voucher.code.toLowerCase().includes(query)) ||
            (voucher.name && voucher.name.toLowerCase().includes(query));
        const matchesDate = !targetDate
            || isDateWithinRange(targetDate, voucher.startDate, voucher.expiryDate);
        return matchesSearch && matchesDate;
    });
};

const filterPromotions = (promotions, searchQuery, dateFilter) => {
    const targetDate = dateFilter ? normalizeDate(dateFilter) : null;
    const query = searchQuery.trim().toLowerCase();
    return ensureArray(promotions).filter((promotion) => {
        const matchesSearch =
            !query ||
            (promotion.code && promotion.code.toLowerCase().includes(query)) ||
            (promotion.name && promotion.name.toLowerCase().includes(query));
        const matchesDate =
            !targetDate ||
            isDateWithinRange(targetDate, promotion.startDate, promotion.expiryDate);
        return matchesSearch && matchesDate;
    });
};

const mapBannerResponse = (banners, apiBaseUrl) => {
    const now = normalizeDate(new Date());
    return ensureArray(banners)
        .filter((b) => b?.status === true && b?.pendingReview !== true)
        .filter((b) => isDateWithinRange(now, b.startDate, b.endDate))
        .sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0) -
                new Date(a.updatedAt || a.createdAt || 0),
        )
        .slice(0, 3)
        .map((banner) => ({
            id: banner.id,
            title: banner.title,
            description: banner.description,
            imageUrl: normalizeMediaUrl(banner.imageUrl, apiBaseUrl),
            linkUrl: banner.linkUrl || '',
        }));
};

const fetchActiveBanners = async (apiBaseUrl) => {
    try {
        const resp = await fetch(`${apiBaseUrl}/banners/active`);
        if (!resp.ok) return [];
        const data = await resp.json().catch(() => ({}));
        return mapBannerResponse(data?.result, apiBaseUrl);
    } catch {
        return [];
    }
};

const useVoucherPromotionData = (apiBaseUrl) => {
    const [state, setState] = useState({
        vouchers: [],
        promotions: [],
        banners: [],
        loading: false,
    });

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setState((prev) => ({ ...prev, loading: true }));
            try {
                const token = getStoredToken();
                const [voucherData, promotionData, bannerData] = await Promise.all([
                    getActiveVouchers(token).catch(() => []),
                    getActivePromotions(token).catch(() => []),
                    fetchActiveBanners(apiBaseUrl),
                ]);
                if (!cancelled) {
                    setState({
                        vouchers: ensureArray(voucherData),
                        promotions: ensureArray(promotionData),
                        banners: ensureArray(bannerData),
                        loading: false,
                    });
                }
            } catch (error) {
                console.error('Error fetching vouchers/promotions:', error);
                if (!cancelled) {
                    setState({ vouchers: [], promotions: [], banners: [], loading: false });
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl]);

    return state;
};

const VoucherList = ({ vouchers, loading }) => {
    if (loading) return <div className={cx('loading')}>Đang tải...</div>;
    if (!vouchers.length) return <div className={cx('empty')}>Không có voucher nào</div>;
    return (
        <div className={cx('voucher-list')}>
            {vouchers.map((voucher) => (
                <div key={voucher.id || voucher.code} className={cx('voucher-card')}>
                    <div className={cx('voucher-content')}>
                        <div className={cx('voucher-text')}>
                            <div className={cx('voucher-title')}>
                                Giảm {formatDiscountValue(voucher)} cho đơn hàng từ{' '}
                                {voucher.minOrderValue
                                    ? formatCurrency(voucher.minOrderValue)
                                    : '0đ'}
                            </div>
                            <div className={cx('voucher-meta')}>
                                <span className={cx('voucher-code')}>
                                    Mã: <strong>{voucher.code || '--'}</strong>
                                </span>
                                {voucher.name && (
                                    <span className={cx('voucher-name')}>{voucher.name}</span>
                                )}
                            </div>
                            <div className={cx('voucher-expiry')}>
                                Hạn sử dụng: {formatDate(voucher.expiryDate)}
                            </div>
                        </div>
                        <div className={cx('voucher-icon')}>
                            <img src={voucherIcon} alt="voucher" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PromotionTable = ({ promotions, loading }) => {
    if (loading) return <div className={cx('loading')}>Đang tải...</div>;
    if (!promotions.length) return <div className={cx('empty')}>Không có khuyến mãi nào</div>;
    return (
        <div className={cx('promotion-table-wrapper')}>
            <h2 className={cx('promotion-table-title')}>Thông tin các chương trình khuyến mãi hiện có</h2>
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
                        {promotions.map((promotion, index) => {
                            const statusInfo = getPromotionStatusInfo(promotion);
                            return (
                                <tr key={promotion.id || index}>
                                    <td>{index + 1}</td>
                                    <td>{promotion.name || '--'}</td>
                                    <td>
                                        {formatDate(promotion.startDate)} - {formatDate(promotion.expiryDate)}
                                    </td>
                                    <td>{formatDiscountValue(promotion)}</td>
                                    <td>
                                        <span className={cx('status-badge', `status-${statusInfo.type}`)}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BannerGrid = ({ banners }) => {
    if (!banners.length) return null;
    return (
        <div className={cx('banners-section')}>
            <h2 className={cx('banners-title')}>Banner đang hoạt động</h2>
            <div className={cx('banners-grid')}>
                {banners.map((banner) => (
                    <div key={banner.id} className={cx('banner-card')}>
                        {banner.imageUrl && (
                            <img src={banner.imageUrl} alt={banner.title} className={cx('banner-image')} />
                        )}
                        <div className={cx('banner-content')}>
                            <h3 className={cx('banner-title')}>{banner.title}</h3>
                            {banner.description && (
                                <p className={cx('banner-description')}>{banner.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

function CustomerVoucherPromotionPage() {
    const [activeTab, setActiveTab] = useState('voucher');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
    const { vouchers, promotions, banners, loading } = useVoucherPromotionData(apiBaseUrl);

    const filteredVouchers = useMemo(
        () => filterVouchers(vouchers, searchQuery, dateFilter),
        [vouchers, searchQuery, dateFilter],
    );
    const filteredPromotions = useMemo(
        () => filterPromotions(promotions, searchQuery, dateFilter),
        [promotions, searchQuery, dateFilter],
    );

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div className={cx('title-section')}>
                    <img src={voucherIcon} alt="voucher" className={cx('title-icon')} />
                    <h1 className={cx('title')}>Voucher và khuyến mãi</h1>
                </div>
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
                <button className={cx('search-btn')} onClick={() => { }}>
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

            {activeTab === 'voucher' && (
                <>
                    <VoucherList vouchers={filteredVouchers} loading={loading} />
                    <BannerGrid banners={banners} />
                </>
            )}

            {activeTab === 'promotion' && (
                <PromotionTable promotions={filteredPromotions} loading={loading} />
            )}
        </div>
    );
}

export default CustomerVoucherPromotionPage;
