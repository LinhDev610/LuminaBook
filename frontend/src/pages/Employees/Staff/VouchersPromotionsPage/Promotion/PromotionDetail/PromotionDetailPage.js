import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './PromotionDetailPage.module.scss';
import {
    getPromotionById,
    getStoredToken,
    mapPromotionStatus,
    formatDateTime,
    getApiBaseUrl,
    APPLY_SCOPE_OPTIONS,
    getPromotionImageUrl,
    normalizePromotionImageUrl,
    getProductsByIds
} from '../../../../../../services';

const cx = classNames.bind(styles);

function PromotionDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [promotion, setPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [productNames, setProductNames] = useState([]);

    // Fetch promotion detail
    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken();
                const promotionData = await getPromotionById(id, token);
                // console.log('Promotion data from API:', promotionData);
                // console.log('ImageUrl from API:', promotionData?.imageUrl);
                setPromotion(promotionData);

                if (promotionData?.productNames && Array.isArray(promotionData.productNames)) {
                    setProductNames(promotionData.productNames);
                } else if (promotionData?.applyScope === 'PRODUCT' && promotionData?.productIds && promotionData.productIds.length > 0) {
                    // Fallback: Fetch product names if not in response
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
        return mapPromotionStatus(status);
    };

    const getStatusClass = (status) => {
        const statusInfo = getStatusInfo(status);
        return statusInfo?.filterKey || 'pending';
    };

    const getDiscountValueText = () => {
        if (!promotion) return '-';
        const { discountValue, discountValueType, maxDiscountValue } = promotion;

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
        if (!promotion) return '-';
        const scopeOption = APPLY_SCOPE_OPTIONS.find(opt => opt.value === promotion.applyScope);
        return scopeOption?.label || promotion.applyScope || '-';
    };

    const getApplyConditions = () => {
        if (!promotion) return [];
        const conditions = [];

        if (promotion.minOrderValue && promotion.minOrderValue > 0) {
            conditions.push(`Giá trị đơn tối thiểu: ${formatPrice(promotion.minOrderValue)}`);
        }

        if (promotion.applyScope === 'CATEGORY' && promotion.categoryNames && promotion.categoryNames.length > 0) {
            conditions.push(`Áp dụng theo loại sách: ${promotion.categoryNames.join(', ')}`);
        } else if (promotion.applyScope === 'PRODUCT' && productNames.length > 0) {
            conditions.push(`Áp dụng theo sách: ${productNames.join(', ')}`);
        } else if (promotion.applyScope === 'ORDER') {
            conditions.push('Áp dụng cho toàn bộ đơn hàng');
        }

        return conditions;
    };

    // Calculate image URL (before early returns)
    const promotionImageUrl = promotion ? getPromotionImageUrl(promotion) : '';
    const imageUrl = promotion ? normalizePromotionImageUrl(promotionImageUrl, API_BASE_URL) : '';

    // Debug: Log URL để kiểm tra (must be before early returns)
    // useEffect(() => {
    //     if (promotion) {
    //         console.log('Promotion data:', promotion);
    //         console.log('Raw imageUrl from API:', promotionImageUrl);
    //         console.log('Normalized imageUrl:', imageUrl);
    //         console.log('API_BASE_URL:', API_BASE_URL);
    //     }
    // }, [promotion, promotionImageUrl, imageUrl, API_BASE_URL]);

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
    const conditions = getApplyConditions();

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
                <h1 className={cx('title')}>Chi tiết chương trình khuyến mãi</h1>
            </div>

            {/* Status Badge */}
            {statusInfo && (
                <div className={cx('status-badge', statusClass)}>
                    {statusInfo.label}
                </div>
            )}

            {/* Promotion Detail Card */}
            <div className={cx('detail-card')}>
                <div className={cx('detail-content')}>
                    {/* Promotion Info */}
                    <div className={cx('info-section')}>
                        <div className={cx('info-grid')}>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Tên chương trình:</span>
                                <span className={cx('info-value')}>
                                    {promotion.name || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Mã khuyến mãi:</span>
                                <span className={cx('info-value')}>
                                    {promotion.code || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row', 'description-row')}>
                                <span className={cx('info-label')}>Mô tả chi tiết:</span>
                                <span className={cx('info-value', 'description')}>
                                    {promotion.description || '-'}
                                </span>
                            </div>

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Giá trị khuyến mãi:</span>
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


                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Hạn mức khuyến mãi:</span>
                                <span className={cx('info-value')}>
                                    {promotion.maxDiscountValue && promotion.maxDiscountValue > 0
                                        ? `Tối đa ${formatPrice(promotion.maxDiscountValue)} / đơn`
                                        : '-'}
                                </span>
                            </div>

                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Thời gian áp dụng:</span>
                                <span className={cx('info-value')}>
                                    {formatDate(promotion.startDate)} - {formatDate(promotion.expiryDate)}
                                </span>
                            </div>

                            {imageUrl && (
                                <div className={cx('info-row', 'image-row')}>
                                    <span className={cx('info-label')}>Ảnh minh họa:</span>
                                    <div className={cx('info-value', 'image-container')}>
                                        <img
                                            src={imageUrl}
                                            alt="Promotion illustration"
                                            className={cx('promotion-image')}
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không có hình ảnh</text></svg>';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {promotion.rejectionReason && (
                                <div className={cx('rejection-box')}>
                                    <h3 className={cx('rejection-title')}>Lý do không duyệt</h3>
                                    <p className={cx('rejection-text')}>{promotion.rejectionReason}</p>
                                    {promotion.updatedAt && (
                                        <p className={cx('rejection-date')}>
                                            Ngày giờ kiểm duyệt: {formatDateTime(promotion.updatedAt)}
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

export default PromotionDetailPage;
