import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './VoucherDetailPage.module.scss';
import {
    getVoucherById,
    getStoredToken,
    formatDateTime,
    getApiBaseUrl,
    mapVoucherStatus,
    APPLY_SCOPE_OPTIONS,
    getVoucherImageUrl,
    normalizeVoucherImageUrl
} from '../../../../../../services';

const cx = classNames.bind(styles);

function VoucherDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [voucher, setVoucher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch voucher detail
    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken();
                const voucherData = await getVoucherById(id, token);
                setVoucher(voucherData);
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
    }, [id]);

    const handleBack = () => {
        navigate('/staff/vouchers-promotions');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (date) => {
        if (!date) return '-';
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
        if (!voucher) return '-';
        const { discountValue, discountValueType, maxDiscountValue } = voucher;

        if (discountValueType === 'PERCENTAGE') {
            const percentText = `${discountValue}%`;
            if (maxDiscountValue && maxDiscountValue > 0) {
                return `${percentText}, tối đa ${formatPrice(maxDiscountValue)}`;
            }
            return percentText;
        } else {
            return formatPrice(discountValue || 0);
        }
    };

    const getApplyScopeText = () => {
        if (!voucher) return '-';
        const scopeOption = APPLY_SCOPE_OPTIONS.find(opt => opt.value === voucher.applyScope);
        return scopeOption?.label || voucher.applyScope || '-';
    };

    const getApplyConditions = () => {
        if (!voucher) return [];
        const conditions = [];

        if (voucher.minOrderValue && voucher.minOrderValue > 0) {
            conditions.push(`Giá trị đơn tối thiểu: ${formatPrice(voucher.minOrderValue)}`);
        }

        if (voucher.maxOrderValue && voucher.maxOrderValue > 0) {
            conditions.push(`Giá trị đơn tối đa: ${formatPrice(voucher.maxOrderValue)}`);
        }

        if (voucher.applyScope === 'CATEGORY' && voucher.categoryIds && voucher.categoryIds.length > 0) {
            conditions.push(`Áp dụng theo loại sách: ${voucher.categoryIds.length} danh mục`);
        } else if (voucher.applyScope === 'PRODUCT' && voucher.productIds && voucher.productIds.length > 0) {
            conditions.push(`Áp dụng theo sách: ${voucher.productIds.length} sản phẩm`);
        } else if (voucher.applyScope === 'ORDER') {
            conditions.push('Áp dụng cho toàn bộ đơn hàng');
        }

        return conditions;
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
    const conditions = getApplyConditions();
    const voucherImageUrl = getVoucherImageUrl(voucher);
    const imageUrl = normalizeVoucherImageUrl(voucherImageUrl, API_BASE_URL);

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
                <h1 className={cx('title')}>Chi tiết voucher</h1>
            </div>

            {/* Status Badge */}
            {statusInfo && (
                <div className={cx('status-badge', statusClass)}>
                    {statusInfo.label}
                </div>
            )}

            {/* Voucher Detail Card */}
            <div className={cx('detail-card')}>
                <div className={cx('detail-content')}>
                    {/* Voucher Info */}
                    <div className={cx('info-section')}>
                        <div className={cx('info-grid')}>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Tên voucher:</span>
                                <span className={cx('info-value')}>
                                    {voucher.name || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row', 'description-row')}>
                                <span className={cx('info-label')}>Mô tả chi tiết:</span>
                                <span className={cx('info-value', 'description')}>
                                    {voucher.description || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Mã voucher:</span>
                                <span className={cx('info-value')}>
                                    {voucher.code || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Giá trị voucher:</span>
                                <span className={cx('info-value')}>
                                    {getDiscountValueText()}
                                </span>
                            </div>

                            <div className={cx('info-row', 'conditions-row')}>
                                <span className={cx('info-label')}>Điều kiện áp dụng:</span>
                                <div className={cx('info-value', 'conditions')}>
                                    {conditions.length > 0 ? (
                                        conditions.map((condition, idx) => (
                                            <div key={idx} className={cx('condition-item')}>
                                                {condition}
                                            </div>
                                        ))
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            </div>

                            {voucher.maxDiscountValue && voucher.maxDiscountValue > 0 && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Hạn mức giảm giá:</span>
                                    <span className={cx('info-value')}>
                                        Tối đa {formatPrice(voucher.maxDiscountValue)} / đơn
                                    </span>
                                </div>
                            )}

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Thời gian áp dụng:</span>
                                <span className={cx('info-value')}>
                                    {formatDate(voucher.startDate)} - {formatDate(voucher.expiryDate)}
                                </span>
                            </div>

                            {voucher.usageLimit !== null && voucher.usageLimit !== undefined && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Giới hạn sử dụng:</span>
                                    <span className={cx('info-value')}>
                                        {voucher.usageCount || 0} / {voucher.usageLimit} lần
                                    </span>
                                </div>
                            )}

                            {imageUrl && (
                                <div className={cx('info-row', 'image-row')}>
                                    <span className={cx('info-label')}>Ảnh minh họa:</span>
                                    <div className={cx('info-value', 'image-container')}>
                                        <img
                                            src={imageUrl}
                                            alt="Voucher illustration"
                                            className={cx('voucher-image')}
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không có hình ảnh</text></svg>';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {voucher.rejectionReason && (
                                <div className={cx('rejection-box')}>
                                    <h3 className={cx('rejection-title')}>Lý do không duyệt</h3>
                                    <p className={cx('rejection-text')}>{voucher.rejectionReason}</p>
                                    {voucher.updatedAt && (
                                        <p className={cx('rejection-date')}>
                                            Ngày giờ kiểm duyệt: {formatDateTime(voucher.updatedAt)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VoucherDetailPage;
