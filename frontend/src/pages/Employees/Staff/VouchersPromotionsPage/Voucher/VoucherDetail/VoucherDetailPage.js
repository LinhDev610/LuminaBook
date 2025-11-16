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
    DISCOUNT_VALUE_TYPES,
    getVoucherImageUrl,
    normalizeVoucherImageUrl,
    getProductsByIds,
    getActiveCategories
} from '../../../../../../services';

const cx = classNames.bind(styles);

function VoucherDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [voucher, setVoucher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [productNames, setProductNames] = useState([]);
    const [categories, setCategories] = useState([]);

    // Fetch voucher detail and categories
    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken();
                const [voucherData, categoryData] = await Promise.all([
                    getVoucherById(id, token),
                    getActiveCategories(token).catch(() => [])
                ]);
                setVoucher(voucherData);
                setCategories(Array.isArray(categoryData) ? categoryData : []);
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
        if (!voucher) return '';
        const { discountValue, discountValueType } = voucher;

        if (discountValueType === 'PERCENTAGE') {
            return `${discountValue}%`;
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

        if (voucher.applyScope === 'CATEGORY' && voucher.categoryNames && voucher.categoryNames.length > 0) {
            conditions.push(`Áp dụng theo loại sách: ${voucher.categoryNames.join(', ')}`);
        } else if (voucher.applyScope === 'PRODUCT' && productNames.length > 0) {
            conditions.push(`Áp dụng theo sách: ${productNames.join(', ')}`);
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

    // Xác định xem có phải "Tổng giá trị đơn hàng" không
    // Khi applyScope === 'ORDER' và có minOrderValue thì đó là "Tổng giá trị đơn hàng"
    const isOrderByMinValue = voucher?.applyScope === 'ORDER' && voucher?.minOrderValue && voucher.minOrderValue > 0;

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

            {/* Voucher Detail Card */}
            <div className={cx('detail-card')}>
                {/* Header with title and status badge */}
                <div className={cx('card-header')}>
                    <h1 className={cx('title')}>Chi tiết voucher</h1>
                    {statusInfo && (
                        <span className={cx('status-badge', statusClass)}>
                            {statusInfo.label}
                        </span>
                    )}
                </div>

                {/* Lý do từ chối */}
                {voucher.rejectionReason && (
                    <div className={cx('rejection-box', 'rejection-box-top')}>
                        <h3 className={cx('rejection-title')}>Lý do không duyệt</h3>
                        <p className={cx('rejection-text')}>{voucher.rejectionReason}</p>
                        {voucher.updatedAt && (
                            <p className={cx('rejection-date')}>
                                Ngày giờ kiểm duyệt: {formatDateTime(voucher.updatedAt)}
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
                            value={voucher.name || ''}
                            readOnly
                        />
                    </div>

                    {/* 2. Mã voucher, Loại giảm giá, Giá trị (3 cột) */}
                    <div className={cx('form-row', 'form-row-four')}>
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Mã voucher</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={voucher.code || ''}
                                readOnly
                            />
                        </div>
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Loại giảm giá</label>
                            <select className={cx('form-select')} value={voucher.discountValueType || ''} readOnly>
                                {DISCOUNT_VALUE_TYPES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Giá trị</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={getDiscountValueText()}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 3. Điều kiện áp dụng - Giá trị đơn từ (chỉ hiển thị khi không chọn "Tổng giá trị đơn hàng") */}
                    {!isOrderByMinValue && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Điều kiện áp dụng</label>
                            <div className={cx('condition-row')}>
                                <label className={cx('condition-label')}>Giá trị đơn từ (VNĐ):</label>
                                <input
                                    type="text"
                                    className={cx('form-input', 'condition-input')}
                                    value={voucher.minOrderValue ? formatPrice(voucher.minOrderValue) : ''}
                                    readOnly
                                />
                            </div>
                        </div>
                    )}

                    {/* 4. Radio buttons: Theo loại sách / Theo sách cụ thể / Toàn sàn / Tổng giá trị đơn hàng */}
                    <div className={cx('form-group')}>
                        <div className={cx('radio-group')}>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'CATEGORY' && !isOrderByMinValue}
                                    readOnly
                                />
                                <span>Theo loại sách</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'PRODUCT' && !isOrderByMinValue}
                                    readOnly
                                />
                                <span>Theo sách cụ thể</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={voucher.applyScope === 'ORDER' && !isOrderByMinValue}
                                    readOnly
                                />
                                <span>Toàn sàn</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyScope"
                                    checked={isOrderByMinValue}
                                    readOnly
                                />
                                <span>Tổng giá trị đơn hàng</span>
                            </label>
                        </div>
                    </div>

                    {/* 5. Loại sách áp dụng - chỉ hiện khi chọn "Theo loại sách" */}
                    {voucher.applyScope === 'CATEGORY' && !isOrderByMinValue && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Loại sách áp dụng</label>
                            <select className={cx('form-select')} value={voucher.categoryIds?.[0] || ''} readOnly>
                                <option value="">-- Chọn loại sách --</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tên sách cụ thể - chỉ hiện khi chọn "Theo sách cụ thể" */}
                    {voucher.applyScope === 'PRODUCT' && !isOrderByMinValue && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Tên sách cụ thể</label>
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
                    )}

                    {/* Giá trị tối thiểu đơn hàng - chỉ hiện khi chọn "Tổng giá trị đơn hàng" */}
                    {isOrderByMinValue && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Giá trị tối thiểu đơn hàng</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={voucher.minOrderValue ? formatPrice(voucher.minOrderValue) : ''}
                                readOnly
                            />
                        </div>
                    )}

                    {/* 6. Hạn mức, Số lượng voucher, Ngày bắt đầu, Ngày kết thúc (4 cột) */}
                    <div className={cx('form-row', 'form-row-four')}>
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Hạn mức</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={voucher.maxDiscountValue && voucher.maxDiscountValue > 0
                                    ? formatPrice(voucher.maxDiscountValue)
                                    : ''}
                                readOnly
                            />
                        </div>
                        <div className={cx('form-group', 'form-group-fourth')}>
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
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Ngày bắt đầu</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={formatDate(voucher.startDate)}
                                readOnly
                            />
                        </div>
                        <div className={cx('form-group', 'form-group-fourth')}>
                            <label className={cx('form-label')}>Ngày kết thúc</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={formatDate(voucher.expiryDate)}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 7. Ảnh voucher */}
                    <div className={cx('form-group')}>
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

                    {/* 8. Ghi chú / Lý do đề xuất */}
                    <div className={cx('form-group', 'form-group-notes')}>
                        <label className={cx('form-label')}>Ghi chú / Lý do đề xuất</label>
                        <textarea
                            className={cx('form-textarea')}
                            value={voucher.description || ''}
                            readOnly
                            rows={4}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    {voucher.status === 'REJECTED' && (
                        <button
                            className={cx('btn', 'btn-edit')}
                            onClick={() => navigate(`/staff/vouchers/${id}/update`)}
                        >
                            Sửa lại
                        </button>
                    )}
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VoucherDetailPage;
