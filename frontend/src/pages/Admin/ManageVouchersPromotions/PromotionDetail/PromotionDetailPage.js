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
    DISCOUNT_VALUE_TYPES,
    approvePromotion,
    deletePromotion,
    getPromotionImageUrl,
    normalizePromotionImageUrl,
    getProductsByIds,
    getActiveCategories,
    notifyStaffOnApproval,
    notifyStaffOnRejection,
    notifyStaffOnDelete,
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
    const [productNames, setProductNames] = useState([]);
    const [categories, setCategories] = useState([]);

    // Check if admin or staff
    const isAdmin = location.pathname.startsWith('/admin');

    // Fetch promotion detail and categories
    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                const [promotionData, categoryData] = await Promise.all([
                    getPromotionById(id, token),
                    getActiveCategories(token).catch(() => [])
                ]);
                console.log('Promotion data from API:', promotionData);
                console.log('ImageUrl from API:', promotionData?.imageUrl);
                setPromotion(promotionData);
                setCategories(Array.isArray(categoryData) ? categoryData : []);
                if (promotionData?.productNames && Array.isArray(promotionData.productNames)) {
                    setProductNames(promotionData.productNames);
                } else if (promotionData?.applyScope === 'PRODUCT' && promotionData?.productIds && promotionData.productIds.length > 0) {
                    try {
                        const products = await getProductsByIds(Array.from(promotionData.productIds), token);
                        setProductNames(products.map(p => p.name).filter(Boolean));
                    } catch (e) {
                        console.error('Error fetching product names:', e);
                        setProductNames([]);
                    }
                } else {
                    setProductNames([]);
                }
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
                
                // Gửi thông báo cho nhân viên
                const promotionName = result.data?.name || promotion?.name || 'Chương trình khuyến mãi';
                await notifyStaffOnApproval('promotion', promotionName, token);
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
                const reason = rejectReason;
                setRejectReason('');
                success('Chương trình khuyến mãi đã bị từ chối!');
                
                // Gửi thông báo cho nhân viên
                const promotionName = result.data?.name || promotion?.name || 'Chương trình khuyến mãi';
                await notifyStaffOnRejection('promotion', promotionName, reason, token);
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
                
                // Gửi thông báo cho nhân viên
                const promotionName = promotion?.name || 'Chương trình khuyến mãi';
                await notifyStaffOnDelete('promotion', promotionName, token);
                
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
        const { discountValue, discountValueType } = promotion;

        if (discountValueType === 'PERCENTAGE') {
            return `${discountValue}%`;
        } else {
            return formatPrice(discountValue || 0);
        }
    };

    const getConditionText = () => {
        if (!promotion) return '';
        const conditions = [];
        if (promotion.minOrderValue && promotion.minOrderValue > 0) {
            conditions.push(`Đơn hàng từ ${formatPrice(promotion.minOrderValue)} trở lên`);
        }
        return conditions.join(', ') || '-';
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
    const isPending = promotion.status === 'PENDING_APPROVAL';
    const isRejected = promotion.status === 'REJECTED';

    return (
        <div className={cx('wrap')}>
            {/* Top Header */}
            <div className={cx('top-header')}>
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
            </div>

            {/* Promotion Detail Card */}
            <div className={cx('detail-card')}>
                {/* Header with title and status badge */}
                <div className={cx('card-header')}>
                    <h1 className={cx('title')}>Chi tiết Chương trình Khuyến Mãi</h1>
                    {statusInfo && (
                        <span className={cx('status-badge', statusClass)}>
                            {statusInfo.label}
                        </span>
                    )}
                </div>

                {/* Lý do từ chối */}
                {promotion.rejectionReason && (
                    <div className={cx('rejection-box', 'rejection-box-top')}>
                        <h3 className={cx('rejection-title')}>Lý do không duyệt</h3>
                        <p className={cx('rejection-text')}>{promotion.rejectionReason}</p>
                        {promotion.approvedAt && (
                            <p className={cx('rejection-date')}>
                                Ngày giờ kiểm duyệt: {formatDateTime(promotion.approvedAt)}
                            </p>
                        )}
                    </div>
                )}

                <div className={cx('form-content')}>
                    {/* 1. Tên chương trình */}
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Tên chương trình</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={promotion.name || ''}
                            readOnly
                        />
                    </div>

                    {/* 2. Mã khuyến mãi */}
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Mã khuyến mãi</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={promotion.code || ''}
                            readOnly
                        />
                    </div>

                    {/* 3. Loại giảm giá và Giá trị (2 cột) */}
                    <div className={cx('form-row')}>
                        <div className={cx('form-group', 'form-group-half')}>
                            <label className={cx('form-label')}>Loại giảm giá</label>
                            <select className={cx('form-select')} value={promotion.discountValueType || ''} readOnly>
                                {DISCOUNT_VALUE_TYPES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={cx('form-group', 'form-group-half')}>
                            <label className={cx('form-label')}>Giá trị</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={getDiscountValueText()}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 4. Điều kiện áp dụng - Giá trị đơn từ */}
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Điều kiện áp dụng</label>
                        <div className={cx('condition-row')}>
                            <label className={cx('condition-label')}>Giá trị đơn từ (VNĐ):</label>
                            <input
                                type="text"
                                className={cx('form-input', 'condition-input')}
                                value={promotion.minOrderValue ? formatPrice(promotion.minOrderValue) : ''}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 5. Radio buttons: Theo loại sách / Theo sách cụ thể */}
                    <div className={cx('form-group')}>
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
                        </div>
                    </div>

                    {/* 6. Hạn mức và Loại sách áp dụng (2 cột) - chỉ hiện khi chọn "Theo loại sách" */}
                    {promotion.applyScope === 'CATEGORY' && (
                        <div className={cx('form-row')}>
                            {promotion.discountValueType === 'PERCENTAGE' && (
                                <div className={cx('form-group', 'form-group-half')}>
                                    <label className={cx('form-label')}>Hạn mức</label>
                                    <input
                                        type="text"
                                        className={cx('form-input')}
                                        value={promotion.maxDiscountValue && promotion.maxDiscountValue > 0
                                            ? formatPrice(promotion.maxDiscountValue)
                                            : ''}
                                        readOnly
                                    />
                                </div>
                            )}
                            <div className={cx('form-group', 'form-group-half')}>
                                <label className={cx('form-label')}>Loại sách áp dụng</label>
                                <select className={cx('form-select')} value={promotion.categoryIds?.[0] || ''} readOnly>
                                    <option value="">-- Chọn loại sách --</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 7. Hạn mức và Sản phẩm áp dụng (2 cột) - chỉ hiện khi chọn "Theo sách cụ thể" */}
                    {promotion.applyScope === 'PRODUCT' && (
                        <div className={cx('form-row')}>
                            {promotion.discountValueType === 'PERCENTAGE' && (
                                <div className={cx('form-group', 'form-group-half')}>
                                    <label className={cx('form-label')}>Hạn mức</label>
                                    <input
                                        type="text"
                                        className={cx('form-input')}
                                        value={promotion.maxDiscountValue && promotion.maxDiscountValue > 0
                                            ? formatPrice(promotion.maxDiscountValue)
                                            : ''}
                                        readOnly
                                    />
                                </div>
                            )}
                            <div className={cx('form-group', 'form-group-half')}>
                                <label className={cx('form-label')}>Sản phẩm áp dụng</label>
                                <div className={cx('product-list')}>
                                    {productNames.length > 0 ? (
                                        <div className={cx('product-names')}>
                                            {productNames.map((name, index) => (
                                                <div key={index} className={cx('product-item')}>
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className={cx('empty-text')}>Chưa có sản phẩm</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 8. Ngày bắt đầu, Ngày kết thúc (2 cột) */}
                    <div className={cx('form-row', 'form-row-three')}>
                        <div className={cx('form-group', 'form-group-third')}>
                            <label className={cx('form-label')}>Ngày bắt đầu</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={formatDate(promotion.startDate)}
                                readOnly
                            />
                        </div>
                        <div className={cx('form-group', 'form-group-third')}>
                            <label className={cx('form-label')}>Ngày kết thúc</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={formatDate(promotion.expiryDate)}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 9. Ảnh khuyến mãi */}
                    <div className={cx('form-group')}>
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

                    {/* 10. Ghi chú / Lý do đề xuất */}
                    <div className={cx('form-group', 'form-group-notes')}>
                        <label className={cx('form-label')}>Ghi chú / Lý do đề xuất</label>
                        <textarea
                            className={cx('form-textarea')}
                            value={promotion.description || ''}
                            readOnly
                            rows={4}
                        />
                    </div>
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


