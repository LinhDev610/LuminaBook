import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './UpdateVoucherPage.module.scss';
import { useNotification } from '../../../../../../components/Common/Notification';
import {
    updateVoucher,
    getVoucherById,
    getActiveCategories,
    getActiveProducts,
    getStoredToken,
    uploadVoucherMedia,
    DISCOUNT_VALUE_TYPES,
    APPLY_SCOPE_OPTIONS,
    normalizeVoucherImageUrl,
    getApiBaseUrl,
    getProductsByIds,
} from '../../../../../../services';

const cx = classNames.bind(styles);

export default function UpdateVoucherPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { success, error: notifyError } = useNotification();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    const [formState, setFormState] = useState({
        name: '',
        code: '',
        imageUrl: '',
        description: '',
        discountValue: '',
        discountValueType: 'PERCENTAGE',
        minOrderValue: '',
        maxDiscountValue: '',
        startDate: '',
        expiryDate: '',
        usageLimit: '',
        applyScope: 'ORDER',
        categoryIds: [],
        productIds: [],
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingVoucher, setLoadingVoucher] = useState(true);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [specificProductName, setSpecificProductName] = useState('');
    const [isOrderByMinValue, setIsOrderByMinValue] = useState(false);

    // Fetch voucher data
    useEffect(() => {
        const fetchVoucher = async () => {
            if (!id) return;
            try {
                setLoadingVoucher(true);
                const token = getStoredToken();
                const voucher = await getVoucherById(id, token);

                if (voucher) {
                    // Fill form with voucher data
                    setFormState({
                        name: voucher.name || '',
                        code: voucher.code || '',
                        imageUrl: voucher.imageUrl || '',
                        description: voucher.description || '',
                        discountValue: voucher.discountValue ? String(voucher.discountValue) : '',
                        discountValueType: voucher.discountValueType || 'PERCENTAGE',
                        minOrderValue: voucher.minOrderValue ? String(voucher.minOrderValue) : '',
                        maxDiscountValue:
                            voucher.discountValueType === 'PERCENTAGE' && voucher.maxDiscountValue
                                ? String(voucher.maxDiscountValue)
                                : '',
                        startDate: voucher.startDate ? voucher.startDate.split('T')[0] : '',
                        expiryDate: voucher.expiryDate ? voucher.expiryDate.split('T')[0] : '',
                        usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : '',
                        applyScope: voucher.applyScope || 'ORDER',
                        categoryIds: voucher.categoryIds && Array.isArray(voucher.categoryIds) ? voucher.categoryIds : [],
                        productIds: voucher.productIds && Array.isArray(voucher.productIds) ? voucher.productIds : [],
                    });

                    // Set existing image
                    if (voucher.imageUrl) {
                        const normalizedUrl = normalizeVoucherImageUrl(voucher.imageUrl, API_BASE_URL);
                        setExistingImageUrl(normalizedUrl);
                        setImagePreview(normalizedUrl);
                    }

                    // Set specific product name if applyScope is PRODUCT
                    if (voucher.applyScope === 'PRODUCT' && voucher.productIds && voucher.productIds.length > 0) {
                        try {
                            const productList = await getProductsByIds(Array.from(voucher.productIds), token);
                            if (productList && productList.length > 0) {
                                setSpecificProductName(productList[0].name || '');
                            }
                        } catch (e) {
                            console.error('Error fetching product name:', e);
                        }
                    }

                    // Check if it's ORDER_MIN scope (Tổng giá trị đơn hàng)
                    if (voucher.applyScope === 'ORDER' && voucher.minOrderValue) {
                        setIsOrderByMinValue(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching voucher:', err);
                notifyError('Không thể tải thông tin voucher. Vui lòng thử lại.');
            } finally {
                setLoadingVoucher(false);
            }
        };

        fetchVoucher();
    }, [id, API_BASE_URL, notifyError]);

    // Fetch categories and products
    useEffect(() => {
        let isMounted = true;
        async function fetchOptions() {
            try {
                setIsLoading(true);
                const token = getStoredToken();
                const [categoryData, productData] = await Promise.all([
                    getActiveCategories(token),
                    getActiveProducts(token),
                ]);

                if (!isMounted) return;

                setCategories(Array.isArray(categoryData) ? categoryData : []);
                setProducts(Array.isArray(productData) ? productData : []);
            } catch (err) {
                if (isMounted) {
                    notifyError('Không thể tải danh sách danh mục / sản phẩm. Vui lòng thử lại sau.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        fetchOptions();
        return () => {
            isMounted = false;
        };
    }, [notifyError]);

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                value: category.id,
                label: category.name,
            })),
        [categories],
    );

    // Helper function để tìm sản phẩm theo tên
    const findProductByName = useCallback((productName) => {
        if (!productName || !productName.trim()) {
            return null;
        }
        const searchQuery = productName.trim().toLowerCase();
        const matchedProducts = products.filter(
            (product) => product.name?.toLowerCase().includes(searchQuery)
        );
        if (matchedProducts.length === 0) {
            return { error: 'Không tìm thấy sản phẩm với tên này' };
        }
        if (matchedProducts.length > 1) {
            return { error: `Tìm thấy ${matchedProducts.length} sản phẩm. Vui lòng nhập tên chính xác hơn.` };
        }
        return { product: matchedProducts[0] };
    }, [products]);

    const handleChange = (field, value) => {
        setFormState((prev) => {
            if (field === 'discountValueType') {
                return {
                    ...prev,
                    discountValueType: value,
                    maxDiscountValue: value === 'PERCENTAGE' ? prev.maxDiscountValue : '',
                };
            }
            if (field === 'applyScope') {
                return {
                    ...prev,
                    applyScope: value,
                    categoryIds: value === 'CATEGORY' ? prev.categoryIds : [],
                    productIds: value === 'PRODUCT' ? prev.productIds : [],
                };
            }
            if (field === 'isOrderByMinValue') {
                setIsOrderByMinValue(value);
                return prev;
            }
            return {
                ...prev,
                [field]: value,
            };
        });
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
        if (field === 'applyScope') {
            setErrors((prev) => ({
                ...prev,
                categoryIds: undefined,
                productIds: undefined,
            }));
        }
    };

    const handleImageFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            notifyError('Vui lòng chọn file ảnh hợp lệ');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            notifyError('Kích thước ảnh không được vượt quá 5MB');
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(existingImageUrl);
        setFormState((prev) => ({ ...prev, imageUrl: prev.imageUrl }));
    };

    const validate = useCallback(() => {
        const validationErrors = {};
        if (!formState.name.trim()) {
            validationErrors.name = 'Vui lòng nhập tên voucher';
        }
        if (!formState.code.trim()) {
            validationErrors.code = 'Vui lòng nhập mã voucher';
        }
        const discountValueNum = parseFloat(String(formState.discountValue).replace(/[^\d.]/g, ''));
        if (!formState.discountValue || isNaN(discountValueNum) || discountValueNum <= 0) {
            validationErrors.discountValue = 'Giá trị giảm phải lớn hơn 0';
        }
        if (!formState.startDate) {
            validationErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        }
        if (!formState.expiryDate) {
            validationErrors.expiryDate = 'Vui lòng chọn ngày kết thúc';
        }
        if (formState.startDate && formState.expiryDate && formState.startDate > formState.expiryDate) {
            validationErrors.expiryDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }
        if (!formState.usageLimit || Number(formState.usageLimit) <= 0) {
            validationErrors.usageLimit = 'Giới hạn sử dụng phải lớn hơn 0';
        }
        if (formState.applyScope === 'CATEGORY' && (!formState.categoryIds || formState.categoryIds.length === 0)) {
            validationErrors.categoryIds = 'Vui lòng chọn loại sách';
        }
        if (formState.applyScope === 'PRODUCT') {
            const productMatch = findProductByName(specificProductName);
            if (!productMatch) {
                validationErrors.productIds = 'Vui lòng nhập tên sách cụ thể';
            } else if (productMatch.error) {
                validationErrors.productIds = productMatch.error;
            }
        }
        if (isOrderByMinValue && (!formState.minOrderValue || Number(formState.minOrderValue) <= 0)) {
            validationErrors.minOrderValue = 'Vui lòng nhập giá trị tối thiểu đơn hàng lớn hơn 0';
        }
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [formState, specificProductName, isOrderByMinValue, findProductByName]);

    const preparePayload = async () => {
        let imageUrl = null;

        if (imageFile) {
            try {
                const token = getStoredToken();
                const { ok, url, message } = await uploadVoucherMedia(imageFile, token);
                if (ok && url) {
                    imageUrl = url;
                } else {
                    throw new Error(message || 'Không thể upload ảnh');
                }
            } catch (err) {
                throw new Error('Không thể upload ảnh. Vui lòng thử lại.');
            }
        } else if (formState.imageUrl && formState.imageUrl.trim()) {
            imageUrl = formState.imageUrl.trim();
        }

        const discountValueText = String(formState.discountValue).replace(/[^\d.]/g, '');
        const discountValueNum = parseFloat(discountValueText) || 0;

        const payload = {
            name: formState.name.trim(),
            code: formState.code.trim().toUpperCase(),
            imageUrl: imageUrl,
            description: formState.description.trim() || null,
            discountValue: discountValueNum,
            discountValueType: formState.discountValueType,
            minOrderValue: formState.minOrderValue ? Number(formState.minOrderValue) : null,
            maxDiscountValue:
                formState.discountValueType === 'PERCENTAGE' && formState.maxDiscountValue
                    ? Number(formState.maxDiscountValue)
                    : null,
            startDate: formState.startDate,
            expiryDate: formState.expiryDate,
            usageLimit: Number(formState.usageLimit),
            applyScope: formState.applyScope,
            categoryIds: formState.applyScope === 'CATEGORY'
                ? (Array.isArray(formState.categoryIds) ? formState.categoryIds : [formState.categoryIds].filter(Boolean))
                : null,
            productIds: formState.applyScope === 'PRODUCT' ? (() => {
                const productMatch = findProductByName(specificProductName);
                return productMatch?.product ? [productMatch.product.id] : null;
            })() : null,
            status: 'PENDING', // Always set to PENDING when resubmitting
        };
        return payload;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (isSubmitting) {
            return;
        }

        if (!validate()) {
            return;
        }

        try {
            setIsSubmitting(true);
            const token = getStoredToken();
            const payload = await preparePayload();
            const { ok, data } = await updateVoucher(id, payload, token);
            if (!ok) {
                const message = data?.message || 'Không thể cập nhật voucher. Vui lòng thử lại.';
                notifyError(message);
                setIsSubmitting(false);
                return;
            }
            success('Cập nhật voucher thành công. Voucher đã được gửi lại để duyệt.');
            setTimeout(() => {
                navigate(`/staff/vouchers/${id}`, { replace: true });
            }, 1500);
        } catch (err) {
            const message =
                err?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật voucher.';
            notifyError(message);
            setIsSubmitting(false);
        }
    };

    const renderScopeFields = () => {
        if (formState.applyScope === 'CATEGORY') {
            return (
                <select
                    className={cx('form-select')}
                    value={formState.categoryIds.length > 0 ? formState.categoryIds[0] : ''}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId) {
                            handleChange('categoryIds', [selectedId]);
                        } else {
                            handleChange('categoryIds', []);
                        }
                    }}
                >
                    <option value="">-- Chọn loại sách --</option>
                    {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }
        if (formState.applyScope === 'PRODUCT') {
            return (
                <input
                    type="text"
                    className={cx('form-input')}
                    placeholder="Nhập tên sách cụ thể"
                    value={specificProductName}
                    onChange={(e) => setSpecificProductName(e.target.value)}
                />
            );
        }
        return null;
    };

    if (loadingVoucher) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải thông tin voucher...</div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className={cx('header')}>
                <div className={cx('header-left')}>
                    <span className={cx('header-text')}>Voucher &amp; Khuyến mãi</span>
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

            {/* Main content */}
            <div className={cx('wrap')}>
                <button className={cx('back-arrow-btn')} onClick={() => navigate(`/staff/vouchers/${id}`)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M15 18L9 12L15 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <h1 className={cx('title')}>Chỉnh sửa Voucher</h1>

                <form className={cx('form-container')} onSubmit={handleSubmit}>
                    <div className={cx('form-card')}>
                        {/* 1. Tên chương trình */}
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Tên chương trình *</label>
                            <input
                                type="text"
                                value={formState.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={cx('form-input', { error: errors.name })}
                                placeholder="VD: Giảm tối đa 50k cho đơn từ 400k"
                            />
                            {errors.name && <span className={cx('error-text')}>{errors.name}</span>}
                        </div>

                        {/* 2. Mã voucher và Giá trị (2 cột) */}
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Mã voucher *</label>
                                <input
                                    type="text"
                                    value={formState.code}
                                    onChange={(e) => handleChange('code', e.target.value)}
                                    className={cx('form-input', { error: errors.code })}
                                    placeholder="VD: VC_MAX50"
                                />
                                {errors.code && <span className={cx('error-text')}>{errors.code}</span>}
                            </div>

                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Loại giảm giá *</label>
                                <select
                                    className={cx('form-select')}
                                    value={formState.discountValueType}
                                    onChange={(e) => handleChange('discountValueType', e.target.value)}
                                >
                                    {DISCOUNT_VALUE_TYPES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Giá trị *</label>
                                <input
                                    type="text"
                                    value={formState.discountValue}
                                    onChange={(e) => handleChange('discountValue', e.target.value)}
                                    className={cx('form-input', { error: errors.discountValue })}
                                    placeholder={
                                        formState.discountValueType === 'PERCENTAGE'
                                            ? 'VD: 10 (tức 10%)'
                                            : 'VD: 50000 (giảm 50.000₫)'
                                    }
                                />
                                {errors.discountValue && (
                                    <span className={cx('error-text')}>{errors.discountValue}</span>
                                )}
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
                                        placeholder="VD: 400000"
                                        value={formState.minOrderValue}
                                        onChange={(e) => handleChange('minOrderValue', e.target.value)}
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
                                        name="applyType"
                                        value="CATEGORY"
                                        checked={formState.applyScope === 'CATEGORY' && !isOrderByMinValue}
                                        onChange={() => {
                                            handleChange('applyScope', 'CATEGORY');
                                            setIsOrderByMinValue(false);
                                        }}
                                        className={cx('radio-input')}
                                    />
                                    <span className={cx('radio-text')}>Theo loại sách</span>
                                </label>
                                <label className={cx('radio-label')}>
                                    <input
                                        type="radio"
                                        name="applyType"
                                        value="PRODUCT"
                                        checked={formState.applyScope === 'PRODUCT' && !isOrderByMinValue}
                                        onChange={() => {
                                            handleChange('applyScope', 'PRODUCT');
                                            setIsOrderByMinValue(false);
                                        }}
                                        className={cx('radio-input')}
                                    />
                                    <span className={cx('radio-text')}>Theo sách cụ thể</span>
                                </label>
                                <label className={cx('radio-label')}>
                                    <input
                                        type="radio"
                                        name="applyType"
                                        value="ORDER"
                                        checked={formState.applyScope === 'ORDER' && !isOrderByMinValue}
                                        onChange={() => {
                                            handleChange('applyScope', 'ORDER');
                                            setIsOrderByMinValue(false);
                                        }}
                                        className={cx('radio-input')}
                                    />
                                    <span className={cx('radio-text')}>Toàn sàn</span>
                                </label>
                                <label className={cx('radio-label')}>
                                    <input
                                        type="radio"
                                        name="applyType"
                                        value="ORDER_MIN"
                                        checked={isOrderByMinValue}
                                        onChange={() => {
                                            handleChange('applyScope', 'ORDER');
                                            setIsOrderByMinValue(true);
                                        }}
                                        className={cx('radio-input')}
                                    />
                                    <span className={cx('radio-text')}>Tổng giá trị đơn hàng</span>
                                </label>
                            </div>
                        </div>

                        {/* 5. Loại sách áp dụng - chỉ hiện khi chọn "Theo loại sách" */}
                        {formState.applyScope === 'CATEGORY' && !isOrderByMinValue && (
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Loại sách áp dụng</label>
                                {isLoading ? (
                                    <p className={cx('loading-text')}>Đang tải...</p>
                                ) : (
                                    <>
                                        {renderScopeFields()}
                                        {errors.categoryIds && (
                                            <span className={cx('error-text')}>{errors.categoryIds}</span>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tên sách cụ thể - chỉ hiện khi chọn "Theo sách cụ thể" */}
                        {formState.applyScope === 'PRODUCT' && !isOrderByMinValue && (
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Tên sách cụ thể</label>
                                {renderScopeFields()}
                                {errors.productIds && (
                                    <span className={cx('error-text')}>{errors.productIds}</span>
                                )}
                            </div>
                        )}

                        {/* Giá trị tối thiểu đơn hàng - chỉ hiện khi chọn "Tổng giá trị đơn hàng" */}
                        {isOrderByMinValue && (
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Giá trị tối thiểu đơn hàng</label>
                                <input
                                    type="text"
                                    className={cx('form-input', { error: errors.minOrderValue })}
                                    placeholder="VD: 400000"
                                    value={formState.minOrderValue}
                                    onChange={(e) => handleChange('minOrderValue', e.target.value)}
                                />
                                {errors.minOrderValue && (
                                    <span className={cx('error-text')}>{errors.minOrderValue}</span>
                                )}
                            </div>
                        )}

                        {/* 6. Hạn mức, Số lượng voucher, Ngày bắt đầu, Ngày kết thúc */}
                        <div
                            className={cx(
                                'form-row',
                                formState.discountValueType === 'PERCENTAGE'
                                    ? 'form-row-four'
                                    : 'form-row-three',
                            )}
                        >
                            {formState.discountValueType === 'PERCENTAGE' && (
                                <div className={cx('form-group', 'form-group-fourth')}>
                                    <label className={cx('form-label')}>Hạn mức</label>
                                    <input
                                        type="text"
                                        className={cx('form-input')}
                                        placeholder="VD: 70.000₫ (giới hạn tổng giảm giá đơn hàng)"
                                        value={formState.maxDiscountValue}
                                        onChange={(e) => handleChange('maxDiscountValue', e.target.value)}
                                    />
                                </div>
                            )}
                            <div className={cx('form-group', 'form-group-fourth')}>
                                <label className={cx('form-label')}>Số lượng voucher *</label>
                                <input
                                    type="text"
                                    value={formState.usageLimit}
                                    onChange={(e) => handleChange('usageLimit', e.target.value)}
                                    className={cx('form-input', { error: errors.usageLimit })}
                                    placeholder="VD: 200"
                                />
                                {errors.usageLimit && <span className={cx('error-text')}>{errors.usageLimit}</span>}
                            </div>
                            <div className={cx('form-group', 'form-group-fourth')}>
                                <label className={cx('form-label')}>Ngày bắt đầu *</label>
                                <div className={cx('date-input-wrapper')}>
                                    <input
                                        type="date"
                                        value={formState.startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        className={cx('form-input', 'date-input', { error: errors.startDate })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                {errors.startDate && <span className={cx('error-text')}>{errors.startDate}</span>}
                            </div>
                            <div className={cx('form-group', 'form-group-fourth')}>
                                <label className={cx('form-label')}>Ngày kết thúc *</label>
                                <div className={cx('date-input-wrapper')}>
                                    <input
                                        type="date"
                                        value={formState.expiryDate}
                                        onChange={(e) => handleChange('expiryDate', e.target.value)}
                                        className={cx('form-input', 'date-input', { error: errors.expiryDate })}
                                        min={formState.startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                {errors.expiryDate && <span className={cx('error-text')}>{errors.expiryDate}</span>}
                            </div>
                        </div>

                        {/* 7. Ảnh voucher */}
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Ảnh voucher</label>
                            <div
                                className={cx('image-upload-area', { dragging: isDragging, hasImage: imagePreview })}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {imagePreview ? (
                                    <div className={cx('image-preview-container')}>
                                        <img src={imagePreview} alt="Preview" className={cx('preview-image')} />
                                        <button
                                            type="button"
                                            className={cx('remove-image-btn')}
                                            onClick={handleRemoveImage}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            className={cx('file-input')}
                                            id="voucher-image-upload"
                                        />
                                        <label htmlFor="voucher-image-upload" className={cx('upload-label')}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                <path
                                                    d="M12 15V3M12 3L8 7M12 3L16 7"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <span className={cx('upload-text')}>
                                                Kéo thả ảnh vào đây hoặc <span className={cx('upload-link')}>chọn file</span>
                                            </span>
                                            <span className={cx('upload-hint')}>JPG, PNG (tối đa 5MB)</span>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 8. Ghi chú / Lý do đề xuất */}
                        <div className={cx('form-group', 'form-group-notes')}>
                            <label className={cx('form-label')}>Ghi chú / Lý do đề xuất</label>
                            <textarea
                                value={formState.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className={cx('form-textarea')}
                                rows={4}
                                placeholder="VD: Đề xuất cho chiến dịch cuối năm, ưu tiên khách hàng mới."
                            />
                        </div>

                        {/* 9. Nút Hủy và Gửi lại để duyệt */}
                        <div className={cx('form-actions')}>
                            <button
                                type="button"
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => navigate(`/staff/vouchers/${id}`)}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </button>
                            <button type="submit" className={cx('btn', 'btn-submit')} disabled={isSubmitting}>
                                {isSubmitting ? 'Đang gửi...' : 'Gửi lại để duyệt'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

