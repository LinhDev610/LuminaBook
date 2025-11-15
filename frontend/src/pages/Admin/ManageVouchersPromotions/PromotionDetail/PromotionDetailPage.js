import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './PromotionDetailPage.module.scss';
import {
    getPromotionById,
    getStoredToken,
    formatDateTime,
    getApiBaseUrl,
    mapPromotionStatus,
    APPLY_SCOPE_OPTIONS,
    approvePromotion,
    deletePromotion,
    getPromotionImageUrl,
    normalizePromotionImageUrl
} from '../../../../services';
import { useNotification } from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

function PromotionDetailPage() {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const navigate = useNavigate();
    const location = useLocation();
    const { success, error: notifyError } = useNotification();
    const { id } = useParams();
    const [promotion, setPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // Check if admin or staff
    const isAdmin = location.pathname.startsWith('/admin');

    // Fetch promotion detail
    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                const promotionData = await getPromotionById(id, token);
                console.log('Promotion data from API:', promotionData);
                console.log('ImageUrl from API:', promotionData?.imageUrl);
                setPromotion(promotionData);
            } catch (e) {
                setError(e?.message || 'Không thể tải thông tin chương trình khuyến mãi');
                setPromotion(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPromotion();
        }
    }, [id, API_BASE_URL]);

    const handleApprove = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const result = await approvePromotion(
                {
                    promotionId: id,
                    action: 'APPROVE',
                },
                token,
            );

            if (result.ok && result.data) {
                setPromotion(result.data);
                setShowApproveModal(false);
                success('Chương trình khuyến mãi đã được duyệt thành công!');
            } else {
                throw new Error('Không thể duyệt chương trình khuyến mãi');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể duyệt chương trình khuyến mãi'));
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            notifyError('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const result = await approvePromotion(
                {
                    promotionId: id,
                    action: 'REJECT',
                    reason: rejectReason,
                },
                token,
            );

            if (result.ok && result.data) {
                setPromotion(result.data);
                setShowRejectModal(false);
                setRejectReason('');
                success('Chương trình khuyến mãi đã bị từ chối!');
            } else {
                throw new Error('Không thể từ chối chương trình khuyến mãi');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể từ chối chương trình khuyến mãi'));
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const result = await deletePromotion(id, token);

            if (result.ok) {
                setShowDeleteModal(false);
                success('Chương trình khuyến mãi đã được xóa thành công!');
                navigate(isAdmin ? '/admin/vouchers-promotions' : '/staff/vouchers-promotions');
            } else {
                throw new Error(result.data?.message || 'Không thể xóa chương trình khuyến mãi');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể xóa chương trình khuyến mãi'));
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/vouchers-promotions');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (date) => {
        if (!date) return '';
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

    const getStatusInfo = (status) => {
        return mapPromotionStatus(status);
    };

    const getStatusClass = (status) => {
        const statusInfo = getStatusInfo(status);
        return statusInfo?.filterKey || 'pending';
    };

    const getDiscountValueText = () => {
        if (!promotion) return '';
        const { discountValue, discountValueType, maxDiscountValue } = promotion;

        if (discountValueType === 'PERCENTAGE') {
            const percentText = `Giảm ${discountValue}%`;
            if (maxDiscountValue && maxDiscountValue > 0) {
                return `${percentText} tối đa ${formatPrice(maxDiscountValue)}`;
            }
            return percentText;
        } else {
            return formatPrice(discountValue || 0);
        }
    };

    const getApplyScopeText = () => {
        if (!promotion) return '';
        const scopeOption = APPLY_SCOPE_OPTIONS.find((opt) => opt.value === promotion.applyScope);
        return scopeOption?.label || promotion.applyScope || '';
    };

    // Calculate image URL (before early returns)
    const promotionImageUrl = promotion ? getPromotionImageUrl(promotion) : '';
    const imageUrl = promotion ? normalizePromotionImageUrl(promotionImageUrl, API_BASE_URL) : '';

    // Debug: Log URL để kiểm tra (must be before early returns)
    useEffect(() => {
        if (promotion) {
            console.log('Promotion data:', promotion);
            console.log('Raw imageUrl from API:', promotionImageUrl);
            console.log('Normalized imageUrl:', imageUrl);
            console.log('API_BASE_URL:', API_BASE_URL);
        }
    }, [promotion, promotionImageUrl, imageUrl, API_BASE_URL]);

    // Loading state
    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    // Error state
    if (error || !promotion) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error')}>
                    <p>{error || 'Không tìm thấy chương trình khuyến mãi'}</p>
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(promotion.status);
    const statusClass = getStatusClass(promotion.status);
    const isPending = promotion.status === 'PENDING';

    return (
        <div className={cx('wrap')}>
            {/* Header */}
            <div className={cx('header')}>
                <button className={cx('back-btn')} onClick={handleBack}>
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
                <h1 className={cx('title')}>Chi tiết Chương trình khuyến mãi</h1>
                {statusInfo && (
                    <span className={cx('status-badge', statusClass)}>
                        {statusInfo.label}
                    </span>
                )}
            </div>

            {/* Promotion Detail Card */}
            <div className={cx('detail-card')}>
                <div className={cx('form-content')}>
                    {/* Tên chương trình */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Tên chương trình</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={promotion.name || ''}
                            readOnly
                        />
                    </div>

                    {/* Loại ưu đãi */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Loại ưu đãi</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={`${getDiscountValueText()} - ${getApplyScopeText()}`}
                            readOnly
                        />
                    </div>

                    {/* Điều kiện áp dụng */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Điều kiện áp dụng</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={
                                promotion.minOrderValue && promotion.minOrderValue > 0
                                    ? `Giá trị đơn hàng từ ${formatPrice(promotion.minOrderValue)} trở lên`
                                    : ''
                            }
                            readOnly
                        />
                    </div>

                    {/* Áp dụng theo */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Áp dụng theo</label>
                        <div className={cx('radio-group')}>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={promotion.applyScope === 'CATEGORY'}
                                    readOnly
                                />
                                <span>Theo loại sách</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={promotion.applyScope === 'PRODUCT'}
                                    readOnly
                                />
                                <span>Theo sách cụ thể</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={promotion.applyScope === 'ORDER'}
                                    readOnly
                                />
                                <span>Toàn sàn</span>
                            </label>
                        </div>
                    </div>

                    {/* Tên sách cụ thể (nếu applyScope là PRODUCT) */}
                    {promotion.applyScope === 'PRODUCT' && promotion.productIds && (
                        <div className={cx('form-row')}>
                            <label className={cx('form-label')}>Tên sách cụ thể</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={`${promotion.productIds.length} sản phẩm đã chọn`}
                                readOnly
                            />
                        </div>
                    )}

                    {/* Hạn mức */}
                    {promotion.maxDiscountValue && promotion.maxDiscountValue > 0 && (
                        <div className={cx('form-row')}>
                            <label className={cx('form-label')}>Hạn mức</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={`Tối đa ${formatPrice(promotion.maxDiscountValue)} / đơn`}
                                readOnly
                            />
                        </div>
                    )}

                    {/* Loại sách áp dụng (nếu applyScope là CATEGORY) */}
                    {promotion.applyScope === 'CATEGORY' && promotion.categoryIds && (
                        <div className={cx('form-row')}>
                            <label className={cx('form-label')}>Loại sách áp dụng</label>
                            <select className={cx('form-select')} disabled>
                                <option>{promotion.categoryIds.length} danh mục đã chọn</option>
                            </select>
                        </div>
                    )}

                    {/* Thời gian áp dụng */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Thời gian áp dụng</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={`${formatDate(promotion.startDate)} - ${formatDate(promotion.expiryDate)}`}
                            readOnly
                        />
                    </div>

                    {/* Ảnh khuyến mãi */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ảnh khuyến mãi</label>
                        <div className={cx('image-container')}>
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Promotion"
                                    className={cx('promotion-image')}
                                    onError={(e) => {
                                        e.target.src =
                                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không có hình ảnh</text></svg>';
                                    }}
                                />
                            ) : (
                                <div className={cx('image-placeholder')}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 2L2 7L12 12L22 7L12 2Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M2 17L12 22L22 17"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M2 12L12 17L22 12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ghi chú / Lý do đề xuất */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>
                            Ghi chú / Lý do đề xuất
                        </label>
                        <textarea
                            className={cx('form-textarea')}
                            value={promotion.description || ''}
                            readOnly
                            rows={4}
                        />
                    </div>

                    {/* Lý do từ chối */}
                    {promotion.rejectionReason && (
                        <div className={cx('form-row')}>
                            <label className={cx('form-label')}>Lý do từ chối</label>
                            <div className={cx('rejection-box')}>
                                <p>{promotion.rejectionReason}</p>
                                {promotion.approvedAt && (
                                    <p className={cx('rejection-date')}>
                                        Ngày giờ kiểm duyệt: {formatDateTime(promotion.approvedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    {isAdmin && isPending && (
                        <>
                            <button
                                className={cx('btn', 'btn-approve')}
                                onClick={() => setShowApproveModal(true)}
                                disabled={processing}
                            >
                                Duyệt
                            </button>
                            <button
                                className={cx('btn', 'btn-reject')}
                                onClick={() => setShowRejectModal(true)}
                                disabled={processing}
                            >
                                Không duyệt
                            </button>
                        </>
                    )}
                    <button
                        className={cx('btn', 'btn-delete')}
                        onClick={() => setShowDeleteModal(true)}
                        disabled={processing}
                    >
                        Xóa chương trình khuyến mãi
                    </button>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div
                    className={cx('modal-overlay')}
                    onClick={() => setShowApproveModal(false)}
                >
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận duyệt</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn duyệt chương trình khuyến mãi này không?
                        </p>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => setShowApproveModal(false)}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-approve')}
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Duyệt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div
                    className={cx('modal-overlay')}
                    onClick={() => setShowRejectModal(false)}
                >
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận từ chối</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn từ chối chương trình khuyến mãi này không?
                        </p>
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
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-reject')}
                                onClick={handleReject}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div
                    className={cx('modal-overlay')}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận xóa chương trình khuyến mãi</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn xóa chương trình khuyến mãi này không?
                        </p>
                        <p className={cx('modal-warning')}>
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-delete')}
                                onClick={handleDelete}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PromotionDetailPage;

