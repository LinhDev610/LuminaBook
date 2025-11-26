import classNames from 'classnames/bind';
import styles from './AddProductPage.module.scss';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import backIcon from '../../../../../assets/icons/icon_back.png';
import { useNotification } from '../../../../../components/Common/Notification';
import {
    getStoredToken as getStoredTokenUtil,
    refreshToken as refreshTokenAPI,
    getActiveCategories,
    createProduct,
    uploadProductMedia,
    INITIAL_FORM_STATE_PRODUCT,
} from '../../../../../services';

const cx = classNames.bind(styles);

export default function AddProductPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const { success, error: notifyError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);

    // State form - sử dụng INITIAL_FORM_STATE từ constants
    const [productId, setProductId] = useState(INITIAL_FORM_STATE_PRODUCT.productId);
    const [name, setName] = useState(INITIAL_FORM_STATE_PRODUCT.name);
    const [description, setDescription] = useState(
        INITIAL_FORM_STATE_PRODUCT.description,
    );
    const [author, setAuthor] = useState(INITIAL_FORM_STATE_PRODUCT.author);
    const [publisher, setPublisher] = useState(INITIAL_FORM_STATE_PRODUCT.publisher);
    const [weight, setWeight] = useState(INITIAL_FORM_STATE_PRODUCT.weight);
    const [length, setLength] = useState(INITIAL_FORM_STATE_PRODUCT.length);
    const [width, setWidth] = useState(INITIAL_FORM_STATE_PRODUCT.width);
    const [height, setHeight] = useState(INITIAL_FORM_STATE_PRODUCT.height);
    const [price, setPrice] = useState(INITIAL_FORM_STATE_PRODUCT.price);
    const [taxPercent, setTaxPercent] = useState(INITIAL_FORM_STATE_PRODUCT.taxPercent);
    const [discountValue, setDiscountValue] = useState(
        INITIAL_FORM_STATE_PRODUCT.discountValue,
    );
    const [categoryId, setCategoryId] = useState(INITIAL_FORM_STATE_PRODUCT.categoryId);
    const [publicationDate, setPublicationDate] = useState(
        INITIAL_FORM_STATE_PRODUCT.publicationDate,
    );
    const [stockQuantity, setStockQuantity] = useState(
        INITIAL_FORM_STATE_PRODUCT.stockQuantity,
    );
    const [mediaFiles, setMediaFiles] = useState(INITIAL_FORM_STATE_PRODUCT.mediaFiles);
    const [errors, setErrors] = useState(INITIAL_FORM_STATE_PRODUCT.errors);
    const [categories, setCategories] = useState([]);

    // ========== Helper Functions ==========
    const getStoredToken = useCallback((key) => getStoredTokenUtil(key), []);

    // Hàm xử lý số thập phân (cho length, width, height, weight)
    const handleDecimalInput = useCallback((value, setter) => {
        const raw = (value || '').replace(',', '.');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        if (cleaned === '') {
            setter('');
            return;
        }
        const n = Number(cleaned);
        setter(Number.isNaN(n) ? 0 : n);
    }, []);

    const handleProductIdInput = useCallback((value) => {
        const cleaned = (value || '')
            .toString()
            .replace(/[^0-9a-zA-Z]/g, '')
            .toUpperCase();
        setProductId(cleaned);
    }, []);

    // Hàm xử lý nhập thuế (chỉ cho phép số nguyên từ 0-99)
    const handleTaxInput = useCallback((value) => {
        // Chỉ lấy số nguyên, loại bỏ tất cả ký tự không phải số
        const cleaned = (value || '').replace(/[^0-9]/g, '');

        if (cleaned === '') {
            setTaxPercent('');
            return;
        }

        // Chuyển thành số nguyên
        const num = parseInt(cleaned, 10);

        // Nếu không phải số hợp lệ, không cập nhật
        if (isNaN(num)) {
            return;
        }

        // Giới hạn trong khoảng 0-99
        if (num < 0) {
            setTaxPercent('0');
        } else if (num > 99) {
            setTaxPercent('99');
        } else {
            setTaxPercent(num.toString());
        }
    }, []);

    // Reset form về trạng thái ban đầu
    const resetForm = useCallback(() => {
        try {
            formRef.current?.reset();
        } catch (_) { }
        // Reset tất cả fields về giá trị ban đầu từ constants
        setProductId(INITIAL_FORM_STATE_PRODUCT.productId);
        setName(INITIAL_FORM_STATE_PRODUCT.name);
        setDescription(INITIAL_FORM_STATE_PRODUCT.description);
        setAuthor(INITIAL_FORM_STATE_PRODUCT.author);
        setPublisher(INITIAL_FORM_STATE_PRODUCT.publisher);
        setWeight(INITIAL_FORM_STATE_PRODUCT.weight);
        setLength(INITIAL_FORM_STATE_PRODUCT.length);
        setWidth(INITIAL_FORM_STATE_PRODUCT.width);
        setHeight(INITIAL_FORM_STATE_PRODUCT.height);
        setPrice(INITIAL_FORM_STATE_PRODUCT.price);
        setTaxPercent(INITIAL_FORM_STATE_PRODUCT.taxPercent);
        setDiscountValue(INITIAL_FORM_STATE_PRODUCT.discountValue);
        setCategoryId(INITIAL_FORM_STATE_PRODUCT.categoryId);
        setPublicationDate(INITIAL_FORM_STATE_PRODUCT.publicationDate);
        setStockQuantity(INITIAL_FORM_STATE_PRODUCT.stockQuantity);
        setMediaFiles(INITIAL_FORM_STATE_PRODUCT.mediaFiles);
        setErrors(INITIAL_FORM_STATE_PRODUCT.errors);
    }, []);

    // ========== Data Fetching ==========

    // Fetch danh sách danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const list = await getActiveCategories();
                setCategories(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // ========== Validation ==========
    const validate = () => {
        const newErrors = {};
        if (!productId.trim()) {
            newErrors.id = 'Vui lòng nhập mã sản phẩm.';
        } else if (!/^[A-Z0-9]+$/.test(productId.trim())) {
            newErrors.id = 'Mã sản phẩm chỉ chứa chữ và số (A-Z, 0-9).';
        }
        if (!name.trim()) newErrors.name = 'Vui lòng nhập tên sản phẩm.';
        if (!author.trim()) newErrors.author = 'Vui lòng nhập tên tác giả.';
        if (!publisher.trim()) newErrors.publisher = 'Vui lòng nhập nhà xuất bản.';
        if (!categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục.';
        if (!publicationDate) newErrors.publicationDate = 'Vui lòng chọn ngày xuất bản.';

        // Validate price - must be a valid number and >= 0
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0) {
            newErrors.price = 'Giá không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 0.';
        }

        // Validate dimensions - only if provided, must be >= 1
        if (length !== undefined && length !== null && length !== '') {
            const lengthNum = Number(length);
            if (isNaN(lengthNum) || lengthNum < 1) {
                newErrors.length = 'Chiều dài tối thiểu là 1.';
            }
        }
        if (width !== undefined && width !== null && width !== '') {
            const widthNum = Number(width);
            if (isNaN(widthNum) || widthNum < 1) {
                newErrors.width = 'Chiều rộng tối thiểu là 1.';
            }
        }
        if (height !== undefined && height !== null && height !== '') {
            const heightNum = Number(height);
            if (isNaN(heightNum) || heightNum < 1) {
                newErrors.height = 'Chiều cao tối thiểu là 1.';
            }
        }
        if (weight !== undefined && weight !== null && weight !== '') {
            const weightNum = Number(weight);
            if (isNaN(weightNum) || weightNum < 0) {
                newErrors.weight = 'Trọng lượng tối thiểu là 0.';
            }
        }
        if (
            stockQuantity === undefined ||
            stockQuantity === null ||
            stockQuantity === ''
        ) {
            newErrors.stockQuantity = 'Vui lòng nhập số lượng tồn kho.';
        } else {
            const stockNum = Number(stockQuantity);
            if (Number.isNaN(stockNum) || stockNum < 0) {
                newErrors.stockQuantity = 'Số lượng tồn kho tối thiểu là 0.';
            }
        }

        // Validate phần trăm thuế
        if (taxPercent === undefined || taxPercent === null || taxPercent === '') {
            newErrors.taxPercent = 'Vui lòng nhập thuế (từ 0 đến 99%).';
        } else {
            const taxNum = parseInt(taxPercent, 10);
            if (isNaN(taxNum) || taxNum < 0 || taxNum > 99) {
                newErrors.taxPercent = 'Thuế phải là số nguyên từ 0 đến 99.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ========== Computed Values ==========

    // Tính thuế dưới dạng decimal (0.05 = 5%)
    const taxDecimal = useMemo(() => {
        const n = Number.parseInt(
            (taxPercent || '0').toString().replace(/[^0-9]/g, ''),
            10,
        );
        if (Number.isNaN(n)) return 0;
        // Giới hạn trong khoảng 0-99
        const clamped = Math.max(0, Math.min(99, n));
        return clamped / 100;
    }, [taxPercent]);

    // Tính giá cuối cùng sau thuế
    const finalPrice = useMemo(() => {
        const p = Number(price) || 0;
        return Math.round(p * (1 + taxDecimal));
    }, [price, taxDecimal]);

    // ========== API Helpers ==========

    // Refresh token nếu cần (khi token hết hạn)
    const refreshTokenIfNeeded = useCallback(async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const { ok, data: responseData } = await refreshTokenAPI(refreshToken);
            if (ok && responseData?.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('refreshToken', responseData.token);
                return responseData.token;
            }
        } catch (_) { }
        return null;
    }, [getStoredToken]);

    // Upload media files
    const uploadMediaFiles = useCallback(async (files, token) => {
        if (!files || files.length === 0) {
            return { imageUrls: [], videoUrls: [], defaultUrl: '' };
        }

        try {
            const fileArray = files.map((m) => m.file);
            const { ok, urls, message } = await uploadProductMedia(fileArray, token);

            if (!ok || !urls || urls.length === 0) {
                throw new Error(message || 'Upload media thất bại');
            }

            // Validate số lượng URLs khớp với số lượng files
            if (urls.length !== files.length) {
                throw new Error(
                    `Số lượng URLs (${urls.length}) không khớp với số lượng files (${files.length})`,
                );
            }

            // Map uploaded URLs back to media files
            const mapped = files.map((m, index) => ({
                ...m,
                uploadedUrl: urls[index],
            }));

            const imageUrls = mapped
                .filter((m) => m.type === 'IMAGE')
                .map((m) => m.uploadedUrl)
                .filter(Boolean);
            const videoUrls = mapped
                .filter((m) => m.type === 'VIDEO')
                .map((m) => m.uploadedUrl)
                .filter(Boolean);

            const defaultItem = mapped.find((m) => m.isDefault) || mapped[0];
            const defaultUrl = defaultItem?.uploadedUrl || '';

            return { imageUrls, videoUrls, defaultUrl };
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    }, []);

    // Build product payload
    const buildProductPayload = useCallback(
        (imageUrls, videoUrls, defaultUrl) => ({
            id: (productId || '').trim(),
            name: (name || '').trim(),
            description: (description || '').trim() || null,
            author: (author || '').trim(),
            publisher: (publisher || '').trim(),
            weight: weight && Number(weight) > 0 ? Number(weight) : null,
            length: length && Number(length) >= 1 ? Number(length) : null,
            width: width && Number(width) >= 1 ? Number(width) : null,
            height: height && Number(height) >= 1 ? Number(height) : null,
            price: Number.isFinite(finalPrice) ? finalPrice : 0,
            unitPrice: Number(price) || 0,
            tax: taxDecimal || 0,
            discountValue:
                discountValue && Number(discountValue) > 0 ? Number(discountValue) : null,
            categoryId: (categoryId || '').trim(),
            publicationDate: publicationDate || new Date().toISOString().slice(0, 10),
            imageUrls: imageUrls.length ? imageUrls : undefined,
            videoUrls: videoUrls.length ? videoUrls : undefined,
            defaultMediaUrl: defaultUrl || undefined,
            stockQuantity: Number(stockQuantity),
        }),
        [
            productId,
            name,
            description,
            author,
            publisher,
            weight,
            length,
            width,
            height,
            price,
            taxDecimal,
            discountValue,
            categoryId,
            publicationDate,
            stockQuantity,
            finalPrice,
        ],
    );

    // ========== Event Handlers ==========
    const handleReset = resetForm;

    /**
     * Xử lý submit form
     * 1. Validate form
     * 2. Upload media files (nếu có)
     * 3. Tạo sản phẩm mới
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        if (!validate()) {
            setIsLoading(false);
            notifyError('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        try {
            let token = getStoredToken('token');
            if (!token) {
                setIsLoading(false);
                notifyError('Thiếu token xác thực. Vui lòng đăng nhập lại.');
                return;
            }

            // Upload media files first (if any)
            const { imageUrls, videoUrls, defaultUrl } = await uploadMediaFiles(
                mediaFiles,
                token,
            );

            // Build payload
            const payload = buildProductPayload(imageUrls, videoUrls, defaultUrl);

            // Create product
            let { ok, data } = await createProduct(payload, token);

            // Nếu hết hạn -> thử refresh và gọi lại 1 lần
            if (!ok) {
                const newToken = await refreshTokenIfNeeded();
                if (newToken) {
                    token = newToken;
                    const retryResult = await createProduct(payload, token);
                    ok = retryResult.ok;
                    data = retryResult.data;
                } else {
                    setIsLoading(false);
                    notifyError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }
            }

            if (ok) {
                success('Thêm sản phẩm thành công.');
                resetForm();
            } else {
                const errorMessage =
                    data?.message || 'Không thể thêm sản phẩm. Vui lòng thử lại.';
                notifyError(errorMessage);
            }
        } catch (err) {
            console.error('Lỗi thêm sản phẩm:', err);
            const errorMsg =
                err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            notifyError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('topbar')}>
                <button
                    className={cx('backBtn')}
                    onClick={() => navigate('/staff/products', { replace: true })}
                >
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <div className={cx('card-header')}>Thêm sản phẩm mới</div>
                <form ref={formRef} className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('row')}>
                        <label>Mã sản phẩm</label>
                        <input
                            placeholder="VD: BK001"
                            value={productId}
                            onChange={(e) => handleProductIdInput(e.target.value)}
                        />
                        {errors.id && <div className={cx('errorText')}>{errors.id}</div>}
                    </div>
                    <div className={cx('row')}>
                        <label>Tên sản phẩm</label>
                        <input
                            placeholder="VD: Sách lập trình C++"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && (
                            <div className={cx('errorText')}>{errors.name}</div>
                        )}
                    </div>
                    <div className={cx('row')}>
                        <label>Mô tả sản phẩm</label>
                        <textarea
                            rows={4}
                            placeholder="Mô tả ngắn về sản phẩm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Tác giả</label>
                            <input
                                placeholder="VD: Tô Năng"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                            {errors.author && (
                                <div className={cx('errorText')}>{errors.author}</div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Nhà xuất bản</label>
                            <input
                                placeholder="VD: Vẹn B"
                                value={publisher}
                                onChange={(e) => setPublisher(e.target.value)}
                            />
                            {errors.publisher && (
                                <div className={cx('errorText')}>{errors.publisher}</div>
                            )}
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Giá niêm yết (VND)</label>
                        <input
                            placeholder="VD: 150000"
                            inputMode="numeric"
                            value={price}
                            onChange={(e) =>
                                setPrice(
                                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                                )
                            }
                        />
                        {errors.price && (
                            <div className={cx('errorText')}>{errors.price}</div>
                        )}
                    </div>
                    <div className={cx('grid3')}>
                        <div className={cx('row')}>
                            <label>Danh mục sách</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">--Chọn danh mục--</option>
                                {categories.map((c) => (
                                    <option
                                        key={c.id || c.categoryId}
                                        value={c.id || c.categoryId}
                                    >
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && (
                                <div className={cx('errorText')}>{errors.categoryId}</div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Thuế (%)</label>
                            <div className={cx('inputSuffix')}>
                                <input
                                    placeholder="Ví dụ: 5 hoặc 10"
                                    inputMode="numeric"
                                    value={taxPercent}
                                    onChange={(e) => handleTaxInput(e.target.value)}
                                />
                                <span className={cx('suffix')}>%</span>
                            </div>
                            {errors.taxPercent && (
                                <div className={cx('errorText')}>{errors.taxPercent}</div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Ngày xuất bản</label>
                            <input
                                type="date"
                                value={publicationDate}
                                onChange={(e) => setPublicationDate(e.target.value)}
                            />
                            {errors.publicationDate && (
                                <div className={cx('errorText')}>
                                    {errors.publicationDate}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={cx('row')}>
                        <label>Giá cuối cùng (đã gồm thuế)</label>
                        <input placeholder="Tự động tính" value={finalPrice} readOnly />
                    </div>
                    <div className={cx('row', 'dimension')}>
                        <label>Kích thước (cm) & Trọng lượng</label>
                        <div className={cx('grid4')}>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Dài (cm)"
                                value={length}
                                onChange={(e) => handleDecimalInput(e.target.value, setLength)}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Rộng (cm)"
                                value={width}
                                onChange={(e) => handleDecimalInput(e.target.value, setWidth)}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Cao (cm)"
                                value={height}
                                onChange={(e) => handleDecimalInput(e.target.value, setHeight)}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Trọng lượng (g)"
                                value={weight}
                                onChange={(e) => handleDecimalInput(e.target.value, setWeight)}
                            />
                        </div>
                        <div className={cx('grid4')}>
                            <div>
                                {errors.length && (
                                    <div className={cx('errorText')}>{errors.length}</div>
                                )}
                            </div>
                            <div>
                                {errors.width && (
                                    <div className={cx('errorText')}>{errors.width}</div>
                                )}
                            </div>
                            <div>
                                {errors.height && (
                                    <div className={cx('errorText')}>{errors.height}</div>
                                )}
                            </div>
                            <div>
                                {errors.weight && (
                                    <div className={cx('errorText')}>{errors.weight}</div>
                                )}
                            </div>
                        </div>
                        <div className={cx('example')}>
                            Ví dụ kích thước: <strong>19.8 × 12.9 × 1.5 cm</strong>
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Chọn ảnh/video</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const mapped = files.map((f) => ({
                                    file: f,
                                    type: f.type.startsWith('image') ? 'IMAGE' : 'VIDEO',
                                    preview: URL.createObjectURL(f),
                                    isDefault: false,
                                }));
                                setMediaFiles((prev) => {
                                    const next = [...prev, ...mapped];
                                    if (
                                        next.length > 0 &&
                                        !next.some((m) => m.isDefault)
                                    ) {
                                        next[0].isDefault = true;
                                    }
                                    return next;
                                });
                            }}
                        />
                        {mediaFiles.length > 0 && (
                            <div className={cx('mediaList')}>
                                {mediaFiles.map((m, idx) => (
                                    <div key={idx} className={cx('mediaItem')}>
                                        {m.type === 'IMAGE' ? (
                                            <img
                                                src={m.preview}
                                                alt="preview"
                                                className={cx('mediaPreview')}
                                            />
                                        ) : (
                                            <video
                                                src={m.preview}
                                                className={cx('mediaPreview')}
                                                controls
                                            />
                                        )}
                                        <div className={cx('mediaActions')}>
                                            <label className={cx('defaultToggle')}>
                                                <input
                                                    type="radio"
                                                    name="defaultMedia"
                                                    checked={m.isDefault}
                                                    onChange={() => {
                                                        setMediaFiles((prev) =>
                                                            prev.map((x, i) => ({
                                                                ...x,
                                                                isDefault: i === idx,
                                                            })),
                                                        );
                                                    }}
                                                />
                                                Mặc định
                                            </label>
                                            <button
                                                type="button"
                                                className={cx('btn', 'muted')}
                                                onClick={() => {
                                                    setMediaFiles((prev) => {
                                                        const next = prev.filter(
                                                            (_, i) => i !== idx,
                                                        );
                                                        if (
                                                            next.length > 0 &&
                                                            !next.some((n) => n.isDefault)
                                                        ) {
                                                            next[0].isDefault = true;
                                                        }
                                                        return next;
                                                    });
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Số lượng tồn kho</label>
                            <input
                                inputMode="numeric"
                                value={stockQuantity}
                                onChange={(e) => {
                                    const cleaned = (e.target.value || '').replace(
                                        /[^0-9]/g,
                                        '',
                                    );
                                    setStockQuantity(cleaned);
                                }}
                            />
                            {errors.stockQuantity && (
                                <div className={cx('errorText')}>
                                    {errors.stockQuantity}
                                </div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Trạng thái</label>
                            <select>
                                <option>Còn hàng</option>
                                <option>Hết hàng</option>
                            </select>
                        </div>
                    </div>
                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'muted')}
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi duyệt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
