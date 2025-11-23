import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime, notifyStaffOnApproval, notifyStaffOnRejection, notifyStaffOnDelete } from '../../../../services';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                    const startDate = bannerData.startDate || '';
                    const endDate = bannerData.endDate || '';

                    setBanner({
                        id: bannerData.id,
                        title: bannerData.title,
                        description: bannerData.description || '',
                        status: bannerData.status,
                        pendingReview: bannerData.pendingReview === true,
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
            
            // Gửi thông báo cho nhân viên
            const bannerName = updateData?.result?.name || updateData?.name || banner?.name || 'Banner';
            await notifyStaffOnApproval('banner', bannerName, token);
            
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
            console.log('Update response:', updateData);
            console.log('Rejection reason in update response:', updateData?.result?.rejectionReason);

            if (!updateResponse.ok) {
                throw new Error(updateData?.message || 'Không thể từ chối banner');
            }

            // Sử dụng dữ liệu từ update response nếu có, nếu không thì fetch lại
            let bannerData = updateData?.result;
            
            if (!bannerData || !bannerData.rejectionReason) {
                // Fetch lại banner để lấy dữ liệu mới nhất từ server
                const fetchResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const fetchData = await fetchResponse.json();
                if (fetchResponse.ok && fetchData?.result) {
                    bannerData = fetchData.result;
                }
            }

            if (bannerData) {
                console.log('Banner data after reject:', bannerData);
                console.log('Rejection reason from API:', bannerData.rejectionReason);
                const createdDate = bannerData.createdAt
                    ? formatDateTime(bannerData.createdAt).split(' ')[0]
                    : '';
                const startDate = bannerData.startDate || '';
                const endDate = bannerData.endDate || '';

                setBanner({
                    id: bannerData.id,
                    title: bannerData.title,
                    description: bannerData.description || '',
                    status: bannerData.status,
                    pendingReview: bannerData.pendingReview === true,
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

            setShowRejectModal(false);
            const reason = rejectReason;
            setRejectReason('');
            notifySuccess('Đã từ chối banner');
            
            // Gửi thông báo cho nhân viên
            const bannerName = bannerData?.title || banner?.title || 'Banner';
            await notifyStaffOnRejection('banner', bannerName, reason, token);
        } catch (err) {
            console.error('Error rejecting banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi từ chối banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsSubmitting(false);
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
            
            // Gửi thông báo cho nhân viên
            const bannerName = banner?.title || 'Banner';
            await notifyStaffOnDelete('banner', bannerName, token);
            
            setTimeout(() => {
                navigate('/admin/content');
            }, 1500);
        } catch (err) {
            console.error('Error deleting banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi xóa banner');
        } finally {
            setIsSubmitting(false);
            setShowDeleteModal(false);
        }
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
    const getStatusDisplayFromRecord = (status, pendingReview) => {
        if (status === true) return 'Đã duyệt';
        if (status === false && pendingReview !== true) return 'Từ chối';
        return 'Chờ duyệt';
    };

    const getStatusClassFromRecord = (status, pendingReview) => {
        if (status === true) return 'approved';
        if (status === false && pendingReview !== true) return 'rejected';
        return 'pending';
    };

    const statusDisplay = getStatusDisplayFromRecord(banner.status, banner.pendingReview);
    const statusClass = getStatusClassFromRecord(banner.status, banner.pendingReview);
    const isApproved = banner.status === true;
    const isPending = banner.status !== true && banner.pendingReview === true;
    const isRejected = banner.status === false && banner.pendingReview !== true;

    const hasRejectionInfo = banner.rejectionReason !== undefined && banner.rejectionReason !== null;
    const showRejectionInfo = hasRejectionInfo && (isRejected || isPending);
    const rejectionReasonText =
        banner.rejectionReason && banner.rejectionReason.trim().length > 0
            ? banner.rejectionReason
            : 'Không có lý do';
    const rejectionTimestamp = banner.updatedAt ? formatDateTime(banner.updatedAt) : '';

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
                {displayImageUrl && (
                    <div className={cx('banner-preview')}>
                        <img src={displayImageUrl} alt="Banner" />
                    </div>
                )}
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Tiêu đề</label>
                    <div className={cx('form-value', 'title-value')}>{banner.title || '-'}</div>
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
                    {isApproved ? (
                        <button
                            type="button"
                            className={cx('btn', 'btn-delete')}
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isSubmitting}
                        >
                            Xóa Banner/ Slider
                        </button>
                    ) : isRejected ? (
                        <button
                            type="button"
                            className={cx('btn', 'btn-delete')}
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isSubmitting}
                        >
                            Xóa Banner/ Slider
                        </button>
                    ) : (
                        <>
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
                                disabled={isSubmitting}
                            >
                                Không duyệt
                            </button>
                            <button
                                type="button"
                                className={cx('btn', 'btn-delete')}
                                onClick={() => setShowDeleteModal(true)}
                                disabled={isSubmitting}
                            >
                                Xóa Banner/ Slider
                            </button>
                        </>
                    )}
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
                                <label className={cx('modal-label')}>Lý do từ chối:</label>
                                <textarea
                                    className={cx('modal-textarea')}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Nhập lý do từ chối..."
                                    rows={4}
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
                                disabled={isSubmitting}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-delete')}
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

