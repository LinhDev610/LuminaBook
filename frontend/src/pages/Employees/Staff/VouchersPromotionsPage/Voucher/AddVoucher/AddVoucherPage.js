import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './AddVoucherPage.module.scss';
import { useNotification } from '../../../../../../components/Common/Notification';
import {
    createVoucher,
    getActiveCategories,
    getActiveProducts,
    getStoredToken,
    uploadVoucherMedia,
    DISCOUNT_VALUE_TYPES,
    APPLY_SCOPE_OPTIONS,
    INITIAL_FORM_STATE_VOUCHER,
} from '../../../../../../services';
import useDebounce from '../../../../../../hooks/useDebounce';

const cx = classNames.bind(styles);

export default function AddVoucherPage() {
    const navigate = useNavigate();
    const { success, error: notifyError } = useNotification();

    const [formState, setFormState] = useState({ ...INITIAL_FORM_STATE_VOUCHER });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const debouncedProductSearchQuery = useDebounce(productSearchQuery, 300);
    const [isOrderByMinValue, setIsOrderByMinValue] = useState(false);

    const resetForm = useCallback(() => {
        setFormState({ ...INITIAL_FORM_STATE_VOUCHER });
        setErrors({});
        setImageFile(null);
        setImagePreview(null);
        setProductSearchQuery('');
        setIsOrderByMinValue(false);
    }, []);

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

    const productOptions = useMemo(
        () =>
            products.map((product) => ({
                value: product.id,
                label: product.name,
                code: product.code || '',
            })),
        [products],
    );

    const filteredProductOptions = useMemo(() => {
        if (!debouncedProductSearchQuery?.trim()) {
            return productOptions;
        }
        const query = debouncedProductSearchQuery.toLowerCase().trim();
        return productOptions.filter((option) => {
            const nameMatch = option.label?.toLowerCase().includes(query);
            const codeMatch = option.code?.toLowerCase().includes(query);
            return Boolean(nameMatch || codeMatch);
        });
    }, [productOptions, debouncedProductSearchQuery]);

    const productMap = useMemo(() => {
        const entries = new Map();
        productOptions.forEach((option) => entries.set(option.value, option));
        return entries;
    }, [productOptions]);

    const selectedProducts = useMemo(
        () =>
            formState.productIds
                .map((id) => productMap.get(id))
                .filter(Boolean),
        [formState.productIds, productMap],
    );

    const availableProductOptions = useMemo(
        () => filteredProductOptions.filter((option) => !formState.productIds.includes(option.value)),
        [filteredProductOptions, formState.productIds],
    );

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
        // Clear related errors when scope changes
        if (field === 'applyScope') {
            setErrors((prev) => ({
                ...prev,
                categoryIds: undefined,
                productIds: undefined,
            }));
        }
    };

    const handleSelectProduct = useCallback((productId) => {
        setFormState((prev) => {
            if (prev.productIds.includes(productId)) {
                return prev;
            }
            return {
                ...prev,
                productIds: [...prev.productIds, productId],
            };
        });
        setProductSearchQuery('');
    }, []);

    const handleRemoveProduct = useCallback((productId) => {
        setFormState((prev) => ({
            ...prev,
            productIds: prev.productIds.filter((id) => id !== productId),
        }));
    }, []);


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
        setImagePreview(null);
        setFormState((prev) => ({ ...prev, imageUrl: '' }));
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
        if (formState.applyScope === 'PRODUCT' && (!formState.productIds || formState.productIds.length === 0)) {
            validationErrors.productIds = 'Vui lòng chọn ít nhất một sản phẩm.';
        }
        if (isOrderByMinValue && (!formState.minOrderValue || Number(formState.minOrderValue) <= 0)) {
            validationErrors.minOrderValue = 'Vui lòng nhập giá trị tối thiểu đơn hàng lớn hơn 0';
        }
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [formState, isOrderByMinValue]);

    const preparePayload = async () => {
        let imageUrl = null;

        // Nếu có file ảnh được chọn, upload ảnh lên server
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
            // Nếu không có file mới nhưng đã có URL từ trước, sử dụng URL đó
            imageUrl = formState.imageUrl.trim();
        }

        // Chuyển đổi giá trị giảm giá từ chuỗi thành số
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
            productIds: formState.applyScope === 'PRODUCT'
                ? formState.productIds
                : null,
        };
        return payload;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        // Prevent double submit
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
            const { ok, data } = await createVoucher(payload, token);
            if (!ok) {
                const message = data?.message || 'Không thể tạo voucher. Vui lòng thử lại.';
                notifyError(message);
                setIsSubmitting(false);
                return;
            }
            success('Đã gửi duyệt voucher thành công!');
            resetForm();
            navigate('/staff/vouchers-promotions');
        } catch (err) {
            const message =
                err?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi duyệt voucher.';
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
                <div className={cx('product-selector')}>
                    <div className={cx('search-box')}>
                        <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className={cx('search-input')}
                            placeholder="Nhập tên hoặc mã sách để tìm kiếm..."
                        />
                        {productSearchQuery && (
                            <button
                                type="button"
                                className={cx('clear-search-btn')}
                                onClick={() => setProductSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                        {productSearchQuery.trim() && (
                            <div className={cx('suggestion-dropdown')}>
                                {availableProductOptions.length === 0 ? (
                                    <div className={cx('empty-text')}>
                                        Không tìm thấy sản phẩm phù hợp.
                                    </div>
                                ) : (
                                    availableProductOptions.slice(0, 20).map((option) => (
                                        <button
                                            type="button"
                                            key={option.value}
                                            className={cx('suggestion-item')}
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                handleSelectProduct(option.value);
                                            }}
                                        >
                                            <span className={cx('suggestion-name')}>{option.label}</span>
                                            {option.code && (
                                                <span className={cx('suggestion-code')}>{option.code}</span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    {selectedProducts.length > 0 ? (
                        <div className={cx('selected-products-list')}>
                            {selectedProducts.map((product) => (
                                <span key={product.value} className={cx('product-chip')}>
                                    <span className={cx('product-chip-label')}>{product.label}</span>
                                    <button
                                        type="button"
                                        className={cx('chip-remove-btn')}
                                        onClick={() => handleRemoveProduct(product.value)}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className={cx('helper-text')}>Chưa có sản phẩm nào được chọn.</p>
                    )}
                    {formState.productIds.length > 0 && (
                        <span className={cx('selected-count')}>
                            Đã chọn: {formState.productIds.length} sản phẩm
                        </span>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            {/* Header tách riêng như trang danh sách */}
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

            {/* Nội dung chính */}
            <div className={cx('wrap')}>
                <button className={cx('back-arrow-btn')} onClick={() => navigate('/staff/vouchers-promotions')}>
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

                <h1 className={cx('title')}>Thêm Voucher</h1>

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

                        {/* 9. Nút Reset và Gửi duyệt */}
                        <div className={cx('form-actions')}>
                            <button type="button" className={cx('btn', 'btn-reset')} onClick={resetForm} disabled={isSubmitting}>
                                Reset
                            </button>
                            <button type="submit" className={cx('btn', 'btn-submit')} disabled={isSubmitting}>
                                {isSubmitting ? 'Đang gửi...' : 'Gửi duyệt'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}