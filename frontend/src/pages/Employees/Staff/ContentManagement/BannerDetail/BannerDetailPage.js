import classNames from 'classnames/bind';
import styles from './BannerDetailPage.module.scss';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    formatDateTime,
    getApiBaseUrl,
    getStoredToken,
} from '../../../../../services/utils';
import { normalizeMediaUrl } from '../../../../../services/productUtils';
import { useNotification } from '../../../../../components/Common/Notification';

const cx = classNames.bind(styles);

export default function BannerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const { error: notifyError, success: notifySuccess } = useNotification();

    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Normalize LocalDate from backend (can be 'YYYY-MM-DD', ISO string, or [yyyy, mm, dd])
    const formatLocalDateValue = (value) => {
        if (!value) return '';
        // Array form [yyyy, mm, dd]
        if (Array.isArray(value) && value.length >= 3) {
            const y = String(value[0]).padStart(4, '0');
            const m = String(value[1]).padStart(2, '0');
            const d = String(value[2]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        // String 'YYYY-MM-DD' or ISO
        if (typeof value === 'string') {
            // If ISO with time, take date part
            const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
            if (isoMatch) return isoMatch[1];
            // If plain date already
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        }
        // Fallback: try Date parsing and format to YYYY-MM-DD
        try {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        } catch (e) {
            // ignore
        }
        return '';
    };

    useEffect(() => {
        const fetchBannerDetail = async () => {
            setLoading(true);
            try {
                const token = getStoredToken();
                if (!token) {
                    notifyError('Vui lòng đăng nhập');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải chi tiết banner');
                }

                const detail = data?.result;
                if (detail) {
                    setBanner({
                        id: detail.id,
                        title: detail.title || '',
                        description: detail.description || '',
                        status: detail.status, // could be true/false/undefined
                        pendingReview: detail.pendingReview === true,
                        imageUrl: detail.imageUrl || '',
                        linkUrl: detail.linkUrl || '',
                        createdByName: detail.createdByName || detail.createdBy || 'N/A',
                        createdDate: detail.createdAt
                            ? formatDateTime(detail.createdAt).split(' ')[0]
                            : '',
                        createdAt: detail.createdAt,
                        updatedAt: detail.updatedAt,
                        startDate: formatLocalDateValue(detail.startDate),
                        endDate: formatLocalDateValue(detail.endDate),
                        productIds: detail.productIds || [],
                        rejectionReason: detail.rejectionReason || '',
                    });
                } else {
                    setBanner(null);
                }
            } catch (err) {
                console.error('Error fetching banner detail:', err);
                notifyError(err.message || 'Đã xảy ra lỗi khi tải chi tiết banner');
                setBanner(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBannerDetail();
        }
    }, [API_BASE_URL, id, notifyError]);

    const handleBack = () => {
        navigate('/staff/content');
    };

    const handleViewBooks = () => {
        if (banner?.productIds?.length) {
            navigate(`/staff/content/${banner.id}/books`);
        }
    };

    const handleEdit = () => {
        navigate(`/staff/content/${id}/edit`);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsDeleting(false);
                return;
            }

            const deleteResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const deleteData = await deleteResponse.json();

            if (!deleteResponse.ok) {
                throw new Error(deleteData?.message || 'Không thể xóa banner');
            }

            notifySuccess('Đã xóa banner thành công!');
            setTimeout(() => {
                navigate('/staff/content');
            }, 1500);
        } catch (err) {
            console.error('Error deleting banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi xóa banner');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading-state')}>Đang tải chi tiết banner...</div>
            </div>
        );
    }

    if (!banner) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error-state')}>Không tìm thấy thông tin banner</div>
                <button className={cx('back-cta')} onClick={handleBack}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const imageSrc = banner.imageUrl
        ? normalizeMediaUrl(banner.imageUrl, API_BASE_URL)
        : '';

    const isApproved = banner.status === true;
    const isPending = banner.status !== true && banner.pendingReview === true;
    const isRejected = banner.status === false && !isPending;
    const statusDisplay = isApproved ? 'Đã duyệt' : isRejected ? 'Từ chối' : 'Chờ duyệt';

    const hasRejectionInfo = banner.rejectionReason !== undefined && banner.rejectionReason !== null;
    const showRejectionInfo = hasRejectionInfo && (isRejected || isPending);
    const rejectionReasonText =
        banner.rejectionReason && banner.rejectionReason.trim().length > 0
            ? banner.rejectionReason
            : 'Không có lý do';
    const rejectionTimestamp = banner.updatedAt ? formatDateTime(banner.updatedAt) : '';

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-icon-btn')} onClick={handleBack} aria-label="Quay lại">
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

            <div className={cx('content')}>
                <div className={cx('banner-card')}>
                    <h2 className={cx('card-title')}>Chi tiết Banner</h2>

                    {showRejectionInfo && (
                        <div className={cx('rejection-box')}>
                            <h3 className={cx('rejection-title')}>Lý do không duyệt banner</h3>
                            <p className={cx('rejection-text')}>{rejectionReasonText}</p>
                            {rejectionTimestamp && (
                                <p className={cx('rejection-date')}>
                                    Ngày giờ kiểm duyệt: {rejectionTimestamp}
                                </p>
                            )}
                        </div>
                    )}

                    <div className={cx('banner-visual')}>
                        {imageSrc ? (
                            <img src={imageSrc} alt={banner.title} />
                        ) : (
                            <div className={cx('image-placeholder')}>Không có hình ảnh</div>
                        )}
                    </div>

                    <div className={cx('detail-section')}>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Tiêu đề:</span>
                            <span className={cx('detail-value', 'title-value')}>{banner.title || '-'}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Mô tả:</span>
                            <span className={cx('detail-value')}>{banner.description || '-'}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Ngày tạo:</span>
                            <span className={cx('detail-value')}>{banner.createdDate || '-'}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Ngày bắt đầu:</span>
                            <span className={cx('detail-value')}>{banner.startDate || '-'}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Ngày kết thúc:</span>
                            <span className={cx('detail-value')}>{banner.endDate || '-'}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Trạng thái:</span>
                            <span
                                className={cx('status-badge', {
                                    approved: isApproved,
                                    rejected: isRejected,
                                    pending: !isApproved && !isRejected,
                                })}
                            >
                                {statusDisplay}
                            </span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Người tạo:</span>
                            <span className={cx('detail-value')}>Nhân viên - {banner.createdByName}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <span className={cx('detail-label')}>Liên kết sản phẩm:</span>
                            {banner.productIds && banner.productIds.length > 0 ? (
                                <button className={cx('link-btn')} onClick={handleViewBooks}>
                                    Xem danh sách sách
                                </button>
                            ) : (
                                <span className={cx('detail-value')}>-</span>
                            )}
                        </div>
                    </div>

                    <div className={cx('actions')}>
                        {isRejected ? (
                            <button 
                                className={cx('btn', 'btn-edit')} 
                                onClick={handleEdit}
                            >
                                Sửa lại
                            </button>
                        ) : (
                            <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                                Quay lại
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowDeleteModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h2 className={cx('modal-title')}>Xác nhận xóa banner</h2>
                            <button className={cx('modal-close')} onClick={() => setShowDeleteModal(false)} aria-label="Đóng">×</button>
                        </div>
                        <div className={cx('modal-content')}>
                            <p className={cx('modal-message')}>
                                Bạn có chắc chắn muốn xóa banner <span className={cx('banner-title-highlight')}>"{banner?.title || ''}"</span> không?
                            </p>
                            <p className={cx('modal-message')}>
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-delete')}
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Đang xử lý...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
