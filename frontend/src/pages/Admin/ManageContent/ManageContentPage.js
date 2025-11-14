import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageContentPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../services/utils';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import ReviewAndCommentPage from './ReviewAndComment';

const cx = classNames.bind(styles);

export default function ManageContentPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [activeTab, setActiveTab] = useState('banner'); // 'banner' or 'reviews'
    const [banners, setBanners] = useState([]);
    const [filteredBanners, setFilteredBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Determine label/class using timestamps to know if rejected
    const getStatusDisplayFromRecord = (status, pendingReview) => {
        if (status === true) return 'Đã duyệt';
        if (status === false && pendingReview !== true) return 'Không duyệt';
        return 'Chờ duyệt';
    };

    const getStatusClassFromRecord = (status, pendingReview) => {
        if (status === true) return 'approved';
        if (status === false && pendingReview !== true) return 'rejected';
        return 'pending';
    };

    // Fetch banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để xem danh sách banner');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/banners`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải danh sách banner');
                }

                // Map backend data to display format
                const mappedBanners = (data?.result || []).map((banner) => {
                    // Format date as dd/mm/yyyy
                    const dateStr = banner.createdAt
                        ? formatDateTime(banner.createdAt).split(' ')[0]
                        : '';

                    return {
                        id: banner.id,
                        title: banner.title,
                        linkUrl: banner.linkUrl || '',
                        creator: banner.createdByName || banner.createdBy || '',
                        status: banner.status,
                        pendingReview: banner.pendingReview === true,
                        statusDisplay: getStatusDisplayFromRecord(banner.status, banner.pendingReview),
                        statusClass: getStatusClassFromRecord(banner.status, banner.pendingReview),
                        date: dateStr,
                        createdAt: banner.createdAt,
                        updatedAt: banner.updatedAt,
                        productIds: banner.productIds || [],
                        productNames: banner.productNames || [],
                    };
                });

                setBanners(mappedBanners);
                setFilteredBanners(mappedBanners);
            } catch (err) {
                console.error('Error fetching banners:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách banner');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'banner') {
            fetchBanners();
        }
    }, [API_BASE_URL, activeTab]);

    // Filter banners
    useEffect(() => {
        if (activeTab !== 'banner') return;

        let filtered = [...banners];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.title?.toLowerCase().includes(term) ||
                    b.creator?.toLowerCase().includes(term),
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter((b) => {
                if (!b.createdAt) return false;
                // Convert dateFilter (YYYY-MM-DD) to Date object
                const filterDate = new Date(dateFilter);
                const complaintDate = new Date(b.createdAt);
                // Compare dates (ignore time)
                return (
                    filterDate.getFullYear() === complaintDate.getFullYear() &&
                    filterDate.getMonth() === complaintDate.getMonth() &&
                    filterDate.getDate() === complaintDate.getDate()
                );
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'Đã duyệt') {
                filtered = filtered.filter((b) => b.statusClass === 'approved');
            } else if (statusFilter === 'Chờ duyệt') {
                filtered = filtered.filter((b) => b.statusClass === 'pending');
            } else if (statusFilter === 'Không duyệt') {
                filtered = filtered.filter((b) => b.statusClass === 'rejected');
            }
        }

        setFilteredBanners(filtered);
    }, [banners, searchTerm, dateFilter, statusFilter, activeTab]);

    const handleSearch = () => {
        // Filter is handled by useEffect
    };

    const handleViewDetail = (bannerId) => {
        navigate(`/admin/content/${bannerId}`);
    };

    const getLinkDisplay = (banner) => {
        if (banner.productIds && banner.productIds.length > 0) {
            return 'Xem sản phẩm';
        }
        if (banner.linkUrl) {
            return banner.linkUrl;
        }
        return '-';
    };

    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý nội dung</h1>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải danh sách...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý nội dung</h1>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý nội dung</h1>

            {/* Tabs */}
            <div className={cx('tabs')}>
                <button
                    className={cx('tab', { active: activeTab === 'banner' })}
                    onClick={() => setActiveTab('banner')}
                >
                    Banner/ Slider
                </button>
                <button
                    className={cx('tab', { active: activeTab === 'reviews' })}
                    onClick={() => setActiveTab('reviews')}
                >
                    Đánh giá và bình luận
                </button>
            </div>

            {activeTab === 'banner' && (
                <>
                    {/* Search and Filter */}
                    <SearchAndSort
                        searchPlaceholder="Tìm kiếm theo tiêu đề,......"
                        searchValue={searchTerm}
                        onSearchChange={(e) => setSearchTerm(e.target.value)}
                        onSearchClick={handleSearch}
                        dateFilter={dateFilter}
                        onDateChange={setDateFilter}
                        dateLabel="Ngày"
                        sortLabel="Sắp xếp:"
                        sortOptions={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'Chờ duyệt', label: 'Chờ duyệt' },
                            { value: 'Đã duyệt', label: 'Đã duyệt' },
                            { value: 'Không duyệt', label: 'Không duyệt' },
                        ]}
                        sortValue={statusFilter}
                        onSortChange={(e) => setStatusFilter(e.target.value)}
                    />

                    {/* Banner List Table */}
                    <div className={cx('table-container')}>
                        <h2 className={cx('table-title')}>Danh sách Banner/ Slider</h2>
                        {filteredBanners.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p>Không tìm thấy banner nào</p>
                            </div>
                        ) : (
                            <table className={cx('content-table')}>
                                <thead>
                                    <tr>
                                        <th>Tiêu đề</th>
                                        <th>Liên kết</th>
                                        <th>Người tạo</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBanners.map((banner, index) => (
                                        <tr key={banner.id} className={index % 2 === 1 ? cx('odd-row') : ''}>
                                            <td className={cx('title-cell')}>{banner.title}</td>
                                            <td className={cx('link-cell')}>
                                                {banner.productIds && banner.productIds.length > 0 ? (
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // Navigate to products or show products
                                                        }}
                                                        className={cx('link-text')}
                                                    >
                                                        Xem sản phẩm
                                                    </a>
                                                ) : banner.linkUrl ? (
                                                    <a
                                                        href={banner.linkUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cx('link-text')}
                                                    >
                                                        {banner.linkUrl}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>{banner.creator}</td>
                                            <td>
                                                <span
                                                    className={cx(
                                                        'status-tag',
                                                        `status-${banner.statusClass}`,
                                                    )}
                                                >
                                                    {banner.statusDisplay}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={cx('view-btn')}
                                                    onClick={() => handleViewDetail(banner.id)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'reviews' && <ReviewAndCommentPage />}
        </div>
    );
}
