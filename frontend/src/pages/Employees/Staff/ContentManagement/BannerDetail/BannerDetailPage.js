import classNames from 'classnames/bind';
import styles from './BannerDetailPage.module.scss';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../../../../../services/utils';
const cx = classNames.bind(styles);

// Dữ liệu mẫu - sau này sẽ thay bằng API
const mockBannerDetail = {
    id: 1,
    title: 'Sách mới tháng 10',
    description: 'Banner giới thiệu những cuốn sách nổi bật phát hành trong tháng 10.',
    status: 'Chờ duyệt',
    creator: 'Lê Hòa',
    books: [1, 2, 3], // Danh sách ID sách liên quan
};

export default function BannerDetailPage() {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const navigate = useNavigate();
    const { id } = useParams();
    const [banner, setBanner] = useState(mockBannerDetail);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // TODO: Fetch banner detail from API
        // const fetchBanner = async () => {
        //     setLoading(true);
        //     try {
        //         const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        //         const resp = await fetch(`${API_BASE_URL}/content/banner/${id}`, {
        //             headers: {
        //                 Authorization: `Bearer ${token}`,
        //                 'Content-Type': 'application/json',
        //             },
        //         });
        //         const data = await resp.json();
        //         setBanner(data.result || data);
        //     } catch (err) {
        //         console.error('Error fetching banner:', err);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        // fetchBanner();
    }, [id]);

    const handleBack = () => {
        navigate('/staff/content');
    };

    const handleViewBooks = () => {
        // TODO: Navigate to books list related to this banner
        // navigate(`/staff/content/${id}/books`);
    };

    if (loading) {
        return <div className={cx('wrap')}>Đang tải...</div>;
    }

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-icon-btn')} onClick={handleBack}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className={cx('title')}>Quản lý nội dung</h1>
                </div>
                <button
                    className={cx('dashboard-btn')}
                    onClick={() => navigate('/staff')}
                >
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

            <div className={cx('content')}>
                <div className={cx('detail-card')}>
                    <h2 className={cx('card-title')}>Chi tiết Banner</h2>

                    <div className={cx('detail-section')}>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Tiêu đề:</span>
                            <span className={cx('detail-value', 'title-value')}>
                                {banner.title}
                            </span>
                        </div>

                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Mô tả:</span>
                            <span className={cx('detail-value')}>
                                {banner.description}
                            </span>
                        </div>

                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Trạng thái:</span>
                            <span
                                className={cx('status-badge', {
                                    pending: banner.status === 'Chờ duyệt',
                                    approved: banner.status === 'Đã duyệt',
                                })}
                            >
                                {banner.status}
                            </span>
                        </div>

                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Người tạo:</span>
                            <span className={cx('detail-value')}>{banner.creator}</span>
                        </div>

                        {banner.books && banner.books.length > 0 && (
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}></span>
                                <button
                                    className={cx('link-btn')}
                                    onClick={handleViewBooks}
                                >
                                    Xem danh sách sách
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={cx('actions')}>
                        <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
