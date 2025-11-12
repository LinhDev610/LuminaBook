import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';
import { useNotification } from '../../../../components/Common/Notification';
import { normalizeMediaUrl } from '../../../../services/productUtils';

const cx = classNames.bind(styles);

export default function ContentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const { success: notifySuccess, error: notifyError } = useNotification();
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch banner detail
    useEffect(() => {
        const fetchBanner = async () => {
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

                const bannerData = data?.result;
                if (bannerData) {
                    // Format dates
                    const createdDate = bannerData.createdAt
                        ? formatDateTime(bannerData.createdAt).split(' ')[0]
                        : '';
                    // Note: startDate and endDate may not be in backend yet
                    const startDate = bannerData.startDate || '';
                    const endDate = bannerData.endDate || '';

                    setBanner({
                        id: bannerData.id,
                        title: bannerData.title,
                        description: bannerData.description || '',
                        status: bannerData.status,
                        imageUrl: bannerData.imageUrl,
                        linkUrl: bannerData.linkUrl || '',
                        createdBy: bannerData.createdBy || '',
                        createdByName: bannerData.createdByName || 'N/A',
                        createdDate: createdDate,
                        createdAt: bannerData.createdAt,
                        updatedAt: bannerData.updatedAt,
                        startDate: startDate,
                        endDate: endDate,
                        productIds: bannerData.productIds || [],
                        productNames: bannerData.productNames || [],
                        rejectionReason: bannerData.rejectionReason || '',
                    });
                }
            } catch (err) {
                console.error('Error fetching banner:', err);
                notifyError(err.message || 'Đã xảy ra lỗi khi tải chi tiết banner');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBanner();
        }
    }, [id, API_BASE_URL, notifyError]);


    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsSubmitting(false);
                return;
            }

            const updatePayload = {
                status: true,
            };

            const updateResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });

            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
                throw new Error(updateData?.message || 'Không thể duyệt banner');
            }

            notifySuccess('Đã duyệt banner thành công!');
            setTimeout(() => {
                navigate('/admin/content');
            }, 1500);
        } catch (err) {
            console.error('Error approving banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi duyệt banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) {
            notifyError('Vui lòng nhập lý do từ chối');
            return;
        }
        setIsSubmitting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsSubmitting(false);
                return;
            }

            const updatePayload = {
                status: false,
                rejectionReason: rejectReason.trim(),
            };

            const updateResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            });

            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
                throw new Error(updateData?.message || 'Không thể từ chối banner');
            }

            // Cập nhật ngay trên UI
            setBanner((prev) => ({ ...prev, status: false, rejectionReason: rejectReason.trim(), updatedAt: new Date().toISOString() }));
            setShowRejectModal(false);
            setRejectReason('');
            notifySuccess('Đã từ chối banner');
        } catch (err) {
            console.error('Error rejecting banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi từ chối banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = () => {
        // Navigate to edit page
        navigate(`/admin/content/${id}/edit`);
    };

    if (loading) {
        return (
            <div className={cx('content-detail-page')}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải chi tiết banner...</p>
                </div>
            </div>
        );
    }

    if (!banner) {
        return (
            <div className={cx('content-detail-page')}>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>Không tìm thấy banner</p>
                </div>
            </div>
        );
    }

    const displayImageUrl = banner?.imageUrl
        ? normalizeMediaUrl(banner.imageUrl, API_BASE_URL)
        : '';

    // Helpers to unify status display same as listing
    const getStatusDisplayFromRecord = (status, createdAt, updatedAt) => {
        if (status === true) return 'Đã duyệt';
        if (status === false) {
            const c = createdAt ? new Date(createdAt).getTime() : NaN;
            const u = updatedAt ? new Date(updatedAt).getTime() : NaN;
            const hasReviewed =
                (Number.isFinite(c) && Number.isFinite(u) && u > c) ||
                Boolean(banner?.rejectionReason); // fallback: có lý do => không duyệt
            return hasReviewed ? 'Từ chối' : 'Chờ duyệt';
        }
        return 'Chờ duyệt';
    };

    const getStatusClassFromRecord = (status, createdAt, updatedAt) => {
        if (status === true) return 'approved';
        if (status === false) {
            const c = createdAt ? new Date(createdAt).getTime() : NaN;
            const u = updatedAt ? new Date(updatedAt).getTime() : NaN;
            const hasReviewed =
                (Number.isFinite(c) && Number.isFinite(u) && u > c) ||
                Boolean(banner?.rejectionReason);
            return hasReviewed ? 'rejected' : 'pending';
        }
        return 'pending';
    };

    const statusDisplay = getStatusDisplayFromRecord(banner.status, banner.createdAt, banner.updatedAt);
    const statusClass = getStatusClassFromRecord(banner.status, banner.createdAt, banner.updatedAt);

    return (
        <div className={cx('content-detail-page')}>
            <div className={cx('page-header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-btn')} onClick={() => navigate('/admin/content')}>
                        ←
                    </button>
                    <h1 className={cx('page-title')}>Chi tiết banner/ Slider</h1>
                </div>
            </div>

            {/* One unified card: Title + Image + Detail fields */}
            <div className={cx('form-container')}>
                {displayImageUrl && (
                    <div className={cx('banner-preview')}>
                        <img src={displayImageUrl} alt="Banner" />
                    </div>
                )}
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Tiêu đề</label>
                    <div className={cx('form-value')}>{banner.title || '-'}</div>
                </div>
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Người tạo</label>
                    <div className={cx('form-value')}>
                        Nhân viên - {banner.createdByName}
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Ngày tạo</label>
                    <div className={cx('form-value')}>
                        {banner.createdDate}
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Ngày bắt đầu</label>
                    <div className={cx('form-value')}>
                        {banner.startDate || '-'}
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Ngày kết thúc</label>
                    <div className={cx('form-value')}>
                        {banner.endDate || '-'}
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Trạng thái</label>
                    <div className={cx('form-value')}>
                        <span className={cx('status-badge', statusClass)}>
                            {statusDisplay}
                        </span>
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Mô tả</label>
                    <div className={cx('form-value', 'description-value')}>
                        {banner.description || '-'}
                    </div>
                </div>

                {banner.rejectionReason && (
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Lý do từ chối</label>
                        <div className={cx('form-value', 'rejection-value')}>
                            {banner.rejectionReason}
                        </div>
                    </div>
                )}

                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Liên kết đến sản phẩm</label>
                    <div className={cx('form-value')}>
                        {banner.productIds && banner.productIds.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/content/${id}/books`)}
                                className={cx('product-link')}
                            >
                                Xem danh sách sách
                            </button>
                        ) : (
                            '-'
                        )}
                    </div>
                </div>

                <div className={cx('form-actions')}>
                    <button
                        type="button"
                        className={cx('btn', 'btn-edit')}
                        onClick={handleEdit}
                        disabled={isSubmitting}
                    >
                        Chỉnh sửa
                    </button>
                    <button
                        type="button"
                        className={cx('btn', 'btn-approve')}
                        onClick={handleApprove}
                        disabled={isSubmitting || banner.status === true}
                    >
                        Duyệt
                    </button>
                    <button
                        type="button"
                        className={cx('btn', 'btn-reject')}
                        onClick={() => setShowRejectModal(true)}
                        disabled={
                            isSubmitting ||
                            (banner.status === false &&
                                banner.createdAt &&
                                banner.updatedAt &&
                                banner.createdAt !== banner.updatedAt)
                        }
                    >
                        Từ chối
                    </button>
                </div>
            </div>
            {/* Reject Modal */}
            {showRejectModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowRejectModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h2 className={cx('modal-title')}>Xác nhận từ chối</h2>
                            <button className={cx('modal-close')} onClick={() => setShowRejectModal(false)} aria-label="Đóng">×</button>
                        </div>
                        <div className={cx('modal-content')}>
                            <p className={cx('modal-message')}>Bạn có chắc chắn muốn từ chối banner này không?</p>
                            <div className={cx('modal-input-section')}>
                                <label className={cx('modal-label')}>Lý do từ chối</label>
                                <textarea
                                    className={cx('modal-textarea')}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do từ chối..."
                                    rows={5}
                                />
                            </div>
                        </div>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-reject')}
                                onClick={handleRejectConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

