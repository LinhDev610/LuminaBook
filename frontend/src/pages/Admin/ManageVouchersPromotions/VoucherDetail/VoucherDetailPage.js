import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './VoucherDetailPage.module.scss';
import {
    getVoucherById,
    getStoredToken,
    formatDateTime,
    getApiBaseUrl,
    mapVoucherStatus,
    APPLY_SCOPE_OPTIONS,
    approveVoucher,
    deleteVoucher,
    getVoucherImageUrl,
    normalizeVoucherImageUrl,
    getProductsByIds
} from '../../../../services';
import { useNotification } from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

function VoucherDetailPage() {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const navigate = useNavigate();
    const location = useLocation();
    const { success, error: notifyError } = useNotification();
    const { id } = useParams();
    const [voucher, setVoucher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [productNames, setProductNames] = useState([]);

    // Check if admin or staff
    const isAdmin = location.pathname.startsWith('/admin');

    // Fetch voucher detail
    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                const voucherData = await getVoucherById(id, token);
                setVoucher(voucherData);

                if (voucherData?.productNames && Array.isArray(voucherData.productNames)) {
                    setProductNames(voucherData.productNames);
                } else if (voucherData?.applyScope === 'PRODUCT' && voucherData?.productIds && voucherData.productIds.length > 0) {
                    try {
                        const products = await getProductsByIds(Array.from(voucherData.productIds), token);
                        setProductNames(products.map(p => p.name).filter(Boolean));
                    } catch (e) {
                        console.error('Error fetching product names:', e);
                        setProductNames([]);
                    }
                } else {
                    setProductNames([]);
                }
            } catch (e) {
                setError(e?.message || 'Không thể tải thông tin voucher');
                setVoucher(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchVoucher();
        }
    }, [id, API_BASE_URL]);

    const handleApprove = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const result = await approveVoucher(
                {
                    voucherId: id,
                    action: 'APPROVE',
                },
                token,
            );

            if (result.ok && result.data) {
                setVoucher(result.data);
                setShowApproveModal(false);
                success('Voucher đã được duyệt thành công!');
            } else {
                throw new Error('Không thể duyệt voucher');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể duyệt voucher'));
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
            const result = await approveVoucher(
                {
                    voucherId: id,
                    action: 'REJECT',
                    reason: rejectReason,
                },
                token,
            );

            if (result.ok && result.data) {
                setVoucher(result.data);
                setShowRejectModal(false);
                setRejectReason('');
                success('Voucher đã bị từ chối!');
            } else {
                throw new Error('Không thể từ chối voucher');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể từ chối voucher'));
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const result = await deleteVoucher(id, token);

            if (result.ok) {
                setShowDeleteModal(false);
                success('Voucher đã được xóa thành công!');
                navigate(isAdmin ? '/admin/vouchers-promotions' : '/staff/vouchers-promotions');
            } else {
                throw new Error(result.data?.message || 'Không thể xóa voucher');
            }
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể xóa voucher'));
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        navigate(isAdmin ? '/admin/vouchers-promotions' : '/staff/vouchers-promotions');
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
        return mapVoucherStatus(status);
    };

    const getStatusClass = (status) => {
        const statusInfo = getStatusInfo(status);
        return statusInfo?.filterKey || 'pending';
    };

    const getDiscountValueText = () => {
        if (!voucher) return '';
        const { discountValue, discountValueType, maxDiscountValue } = voucher;

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
        if (!voucher) return '';
        const scopeOption = APPLY_SCOPE_OPTIONS.find((opt) => opt.value === voucher.applyScope);
        return scopeOption?.label || voucher.applyScope || '';
    };


    // Loading state
    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    // Error state
    if (error || !voucher) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error')}>
                    <p>{error || 'Không tìm thấy voucher'}</p>
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(voucher.status);
    const statusClass = getStatusClass(voucher.status);
    const voucherImageUrl = getVoucherImageUrl(voucher);
    const imageUrl = normalizeVoucherImageUrl(voucherImageUrl, API_BASE_URL);
    const isPending = voucher.status === 'PENDING_APPROVAL';

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
                <h1 className={cx('title')}>Chi tiết Voucher</h1>
                {statusInfo && (
                    <span className={cx('status-badge', statusClass)}>
                        {statusInfo.label}
                    </span>
                )}
            </div>

            {/* Voucher Detail Card */}
            <div className={cx('detail-card')}>
                <div className={cx('form-content')}>
                    {/* Tên chương trình */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Tên chương trình</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={voucher.name || ''}
                            readOnly
                        />
                    </div>

                    {/* Mã voucher */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Mã voucher</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={voucher.code || ''}
                            readOnly
                        />
                    </div>

                    {/* Giá trị */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Giá trị</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={getDiscountValueText()}
                            readOnly
                        />
                    </div>

                    {/* Điều kiện áp dụng */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Điều kiện áp dụng</label>
                        <div className={cx('conditions-list')}>
                            {voucher.minOrderValue && voucher.minOrderValue > 0 && (
                                <div className={cx('condition-item')}>
                                    Giá trị đơn tối thiểu: {formatPrice(voucher.minOrderValue)}
                                </div>
                            )}
                            {voucher.applyScope === 'CATEGORY' && voucher.categoryNames && voucher.categoryNames.length > 0 && (
                                <div className={cx('condition-item')}>
                                    Áp dụng theo loại sách: {voucher.categoryNames.join(', ')}
                                </div>
                            )}
                            {voucher.applyScope === 'PRODUCT' && productNames.length > 0 && (
                                <div className={cx('condition-item')}>
                                    Áp dụng theo sách: {productNames.join(', ')}
                                </div>
                            )}
                            {voucher.applyScope === 'ORDER' && (
                                <div className={cx('condition-item')}>
                                    Áp dụng cho toàn bộ đơn hàng
                                </div>
                            )}
                            {(!voucher.minOrderValue || voucher.minOrderValue <= 0) &&
                                (!voucher.applyScope ||
                                    (voucher.applyScope !== 'CATEGORY' &&
                                        voucher.applyScope !== 'PRODUCT' &&
                                        voucher.applyScope !== 'ORDER')) && (
                                    <div className={cx('condition-item')}>-</div>
                                )}
                        </div>
                    </div>

                    {/* Áp dụng theo */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Áp dụng theo</label>
                        <div className={cx('radio-group')}>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'CATEGORY'}
                                    readOnly
                                />
                                <span>Theo loại sách</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'PRODUCT'}
                                    readOnly
                                />
                                <span>Theo sách cụ thể</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'ORDER'}
                                    readOnly
                                />
                                <span>Toàn sàn</span>
                            </label>
                        </div>
                    </div>

                    {/* Hạn mức */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Hạn mức</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={voucher.maxDiscountValue && voucher.maxDiscountValue > 0
                                ? `Tối đa ${formatPrice(voucher.maxDiscountValue)} / đơn`
                                : ''}
                            readOnly
                        />
                    </div>

                    {/* Số lượng voucher */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Số lượng voucher</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={voucher.usageLimit !== null && voucher.usageLimit !== undefined
                                ? voucher.usageLimit
                                : ''}
                            readOnly
                        />
                    </div>

                    {/* Ngày bắt đầu */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ngày bắt đầu</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={formatDate(voucher.startDate)}
                            readOnly
                        />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ngày kết thúc</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={formatDate(voucher.expiryDate)}
                            readOnly
                        />
                    </div>

                    {/* Ảnh voucher */}
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ảnh voucher</label>
                        <div className={cx('image-container')}>
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Voucher"
                                    className={cx('voucher-image')}
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
                            value={voucher.description || ''}
                            readOnly
                            rows={4}
                        />
                    </div>

                    {/* Lý do từ chối */}
                    {voucher.rejectionReason && (
                        <div className={cx('form-row')}>
                            <label className={cx('form-label')}>Lý do từ chối</label>
                            <div className={cx('rejection-box')}>
                                <p>{voucher.rejectionReason}</p>
                                {voucher.approvedAt && (
                                    <p className={cx('rejection-date')}>
                                        Ngày giờ kiểm duyệt: {formatDateTime(voucher.approvedAt)}
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
                        Xóa voucher
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
                            Bạn có chắc chắn muốn duyệt voucher này không?
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
                            Bạn có chắc chắn muốn từ chối voucher này không?
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
                        <h2 className={cx('modal-title')}>Xác nhận xóa voucher</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn xóa voucher này không?
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

export default VoucherDetailPage;
