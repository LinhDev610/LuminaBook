import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentManagementPage.module.scss';
import { useSearchAndFilter } from '../../../../hooks';
import { SearchFilterBar } from '../../../../components/Common';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';

const cx = classNames.bind(styles);

export default function ContentManagementPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                    const dateStr = banner.createdAt
                        ? formatDateTime(banner.createdAt).split(' ')[0]
                        : '';

                    const isRejected =
                        banner.status === false &&
                        banner.createdAt &&
                        banner.updatedAt &&
                        banner.createdAt !== banner.updatedAt;

                    const statusDisplay =
                        banner.status === true ? 'Đã duyệt' : isRejected ? 'Từ chối' : 'Chờ duyệt';

                    return {
                        id: banner.id,
                        title: banner.title,
                        createDate: dateStr,
                        status: statusDisplay,
                        creator: banner.createdByName || banner.createdBy || 'N/A',
                        createdAt: banner.createdAt,
                        updatedAt: banner.updatedAt,
                    };
                });

                setContents(mappedBanners);
            } catch (err) {
                console.error('Error fetching banners:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách banner');
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, [API_BASE_URL]);

    // Sử dụng hook dùng chung để filter
    const filtered = useSearchAndFilter(contents, {
        searchQuery,
        statusFilter: sortFilter,
        dateFilter,
        searchFields: ['title'], // Tìm kiếm theo title
        statusField: 'status',
        statusMap: {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
        },
    });

    const handleViewDetail = (id) => {
        navigate(`/staff/content/${id}`);
    };

    const handleAddBanner = () => {
        navigate('/staff/content/add-banner');
    };

    const handleSearch = () => {
        // Filter đã được tính toán real-time trong filtered
        // Có thể thêm logic bổ sung nếu cần
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý nội dung</h1>
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

            <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Tìm kiếm theo mã voucher, tên khuyến mãi,......"
                dateFilter={dateFilter}
                onDateChange={(e) => setDateFilter(e.target.value)}
                onSearchClick={handleSearch}
                sortFilter={sortFilter}
                onSortChange={(e) => setSortFilter(e.target.value)}
                sortOptions={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'approved', label: 'Đã duyệt' },
                ]}
                actionButtons={[
                    { label: 'Thêm Banner/ Slider', onClick: handleAddBanner },
                ]}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải danh sách banner...</p>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                </div>
            ) : (
                <div className={cx('table-container')}>
                    <table className={cx('content-table')}>
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Người tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={cx('empty-cell')}>
                                        Không có nội dung phù hợp.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((content) => (
                                <tr key={content.id}>
                                    <td className={cx('title-cell')}>{content.title}</td>
                                    <td className={cx('date-cell')}>{content.createDate}</td>
                                    <td className={cx('status-cell')}>
                                        <span
                                            className={cx('status-badge', {
                                                pending: content.status === 'Chờ duyệt',
                                                approved: content.status === 'Đã duyệt',
                                                rejected: content.status === 'Từ chối',
                                            })}
                                        >
                                            {content.status}
                                        </span>
                                    </td>
                                    <td className={cx('creator-cell')}>{content.creator}</td>
                                    <td className={cx('action-cell')}>
                                        <button
                                            className={cx('btn', 'btn-detail')}
                                            onClick={() => handleViewDetail(content.id)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

