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
    getMyProducts,
    INITIAL_FORM_STATE_PRODUCT,
} from '../../../../../services';

const cx = classNames.bind(styles);
const MAX_TOTAL_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB tổng dung lượng ảnh/video

export default function AddProductPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const { success, error: notifyError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);

    // State form
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
    const [purchasePrice, setPurchasePrice] = useState(
        INITIAL_FORM_STATE_PRODUCT.purchasePrice,
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
    const [existingProductsMap, setExistingProductsMap] = useState({});

    const normalizedProductId = useMemo(
        () => (productId || '').trim().toUpperCase(),
        [productId],
    );

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

    // Kiểm tra xem mã sản phẩm đã tồn tại chưa
    const hasDuplicateProductId = useCallback(
        (id) => Boolean(id && existingProductsMap[id]),
        [existingProductsMap],
    );

    // Thông báo lỗi khi mã sản phẩm đã tồn tại
    const notifyDuplicateProductId = useCallback(
        (id) => {
            if (!id) return;
            const message = `Mã sản phẩm ${id} đã tồn tại. Vui lòng chọn mã khác.`;
            notifyError(message);
            setErrors((prev) => ({
                ...prev,
                id: 'Mã sản phẩm đã tồn tại. Vui lòng chọn mã khác.',
            }));
        },
        [notifyError],
    );

    // Lưu mã sản phẩm đã tồn tại vào state
    const rememberProductId = useCallback((id, productName) => {
        if (!id) return;
        setExistingProductsMap((prev) => {
            if (prev[id]) return prev;
            return {
                ...prev,
                [id]: productName || id,
            };
        });
    }, []);

    // Kiểm tra xem token có hợp lệ không
    const ensureAuthToken = useCallback(() => {
        const tokenValue = getStoredToken('token');
        if (!tokenValue) {
            notifyError('Thiếu token xác thực. Vui lòng đăng nhập lại.');
        }
        return tokenValue;
    }, [getStoredToken, notifyError]);

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

    // Gửi sản phẩm với retry nếu token hết hạn
    const submitProductWithRetry = useCallback(
        async (payload, token) => {
            let currentToken = token;
            let response = await createProduct(payload, currentToken);

            if (!response.ok && response.status === 401) {
                const refreshed = await refreshTokenIfNeeded();
                if (!refreshed) {
                    return response;
                }
                currentToken = refreshed;
                response = await createProduct(payload, currentToken);
            }

            return { ...response, token: currentToken };
        },
        [refreshTokenIfNeeded],
    );

    const handleProductIdInput = useCallback((value) => {
        const cleaned = (value || '')
            .toString()
            .replace(/[^0-9a-zA-Z]/g, '')
            .toUpperCase();
        setProductId(cleaned);
        setErrors((prev) => {
            if (!prev?.id) return prev;
            const next = { ...prev };
            delete next.id;
            return next;
        });
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
        setPurchasePrice(INITIAL_FORM_STATE_PRODUCT.purchasePrice);
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

    useEffect(() => {
        const fetchExistingProducts = async () => {
            try {
                const token = getStoredToken('token');
                if (!token) {
                    setExistingProductsMap({});
                    return;
                }
                const products = await getMyProducts(token);
                const normalized = {};
                if (Array.isArray(products)) {
                    products.forEach((product) => {
                        const id = (product?.id || '').trim().toUpperCase();
                        if (!id) return;
                        normalized[id] = product?.name || '';
                    });
                }
                setExistingProductsMap(normalized);
            } catch (err) {
                console.error('Error fetching existing products:', err);
            }
        };

        fetchExistingProducts();
    }, [getStoredToken]);

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

        // Validate purchasePrice - must be < unitPrice (giá niêm yết)
        if (
            purchasePrice !== undefined &&
            purchasePrice !== null &&
            purchasePrice !== ''
        ) {
            const purchaseNum = Number(purchasePrice);
            if (Number.isNaN(purchaseNum) || purchaseNum < 0) {
                newErrors.purchasePrice = 'Giá nhập phải lớn hơn hoặc bằng 0.';
            } else if (priceNum > 0 && purchaseNum >= priceNum) {
                newErrors.purchasePrice = 'Giá nhập phải nhỏ hơn giá niêm yết.';
            }
        }

        // Validate mediaFiles - must have at least 1 image/video
        if (!mediaFiles || mediaFiles.length === 0) {
            newErrors.mediaFiles = 'Vui lòng chọn ít nhất một ảnh hoặc video cho sản phẩm.';
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
            purchasePrice:
                purchasePrice !== undefined &&
                    purchasePrice !== null &&
                    purchasePrice !== ''
                    ? Number(purchasePrice)
                    : null,
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
            purchasePrice,
            categoryId,
            publicationDate,
            stockQuantity,
            finalPrice,
        ],
    );

    // ========== Event Handlers ==========
    const handleReset = resetForm;

    const handleMediaSelection = useCallback(
        (event) => {
            const selectedFiles = Array.from(event.target.files || []);
            if (selectedFiles.length === 0) {
                return;
            }

            const currentTotalSize = mediaFiles.reduce(
                (sum, item) => sum + (item?.file?.size || 0),
                0,
            );
            const selectedSize = selectedFiles.reduce(
                (sum, file) => sum + (file?.size || 0),
                0,
            );

            if (currentTotalSize + selectedSize > MAX_TOTAL_MEDIA_SIZE) {
                notifyError('Tổng dung lượng ảnh/video không được vượt quá 50MB.');
                event.target.value = '';
                return;
            }

            const mapped = selectedFiles.map((f) => ({
                file: f,
                type: f.type.startsWith('image') ? 'IMAGE' : 'VIDEO',
                preview: URL.createObjectURL(f),
                isDefault: false,
            }));

            setMediaFiles((prev) => {
                const next = [...prev, ...mapped];
                if (next.length > 0 && !next.some((m) => m.isDefault)) {
                    next[0].isDefault = true;
                }
                return next;
            });

            // Xóa lỗi mediaFiles khi đã chọn file
            setErrors((prev) => {
                if (!prev?.mediaFiles) return prev;
                const next = { ...prev };
                delete next.mediaFiles;
                return next;
            });
        },
        [mediaFiles, notifyError],
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        if (!validate()) {
            setIsLoading(false);
            notifyError('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        if (hasDuplicateProductId(normalizedProductId)) {
            setIsLoading(false);
            notifyDuplicateProductId(normalizedProductId);
            return;
        }

        try {
            const token = ensureAuthToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            // Upload ảnh/video mặc định
            const { imageUrls, videoUrls, defaultUrl } = await uploadMediaFiles(
                mediaFiles,
                token,
            );

            // Build payload
            const payload = buildProductPayload(imageUrls, videoUrls, defaultUrl);

            // Create product (tự retry nếu token hết hạn)
            const { ok, data, status } = await submitProductWithRetry(payload, token);

            if (ok) {
                success('Thêm sản phẩm thành công.');
                rememberProductId(normalizedProductId, payload.name);
                resetForm();
            } else {
                if (status === 401) {
                    notifyError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }

                if (status === 400 && normalizedProductId) {
                    notifyDuplicateProductId(normalizedProductId);
                    return;
                }

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
                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Thông tin sản phẩm</div>
                            <div className={cx('sectionHint')}>
                                Các trường hiển thị chính cho khách hàng
                            </div>
                        </div>
                        <div className={cx('grid2')}>
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
                        <div className={cx('row')}>
                            <label>Mô tả sản phẩm</label>
                            <textarea
                                rows={4}
                                placeholder="Mô tả ngắn về sản phẩm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Giá & Thuế</div>
                            <div className={cx('sectionHint')}>
                                Các trường liên quan đến giá bán và thuế
                            </div>
                        </div>
                        <div className={cx('grid2')}>
                            <div className={cx('row')}>
                                <label>Giá niêm yết (VND)</label>
                                <input
                                    placeholder="VD: 150000"
                                    inputMode="numeric"
                                    value={price}
                                    onChange={(e) => {
                                        setPrice(
                                            Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                                        );
                                        // Xóa lỗi purchasePrice khi thay đổi giá niêm yết
                                        setErrors((prev) => {
                                            if (!prev?.purchasePrice) return prev;
                                            const next = { ...prev };
                                            delete next.purchasePrice;
                                            return next;
                                        });
                                    }}
                                />
                                {errors.price && (
                                    <div className={cx('errorText')}>{errors.price}</div>
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
                        </div>
                        <div className={cx('grid2')}>
                            <div className={cx('row')}>
                                <label>Giá nhập (VND)</label>
                                <input
                                    placeholder="VD: 90000"
                                    inputMode="numeric"
                                    value={purchasePrice}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        setPurchasePrice(raw === '' ? '' : Number(raw));
                                        // Xóa lỗi purchasePrice khi thay đổi giá nhập
                                        setErrors((prev) => {
                                            if (!prev?.purchasePrice) return prev;
                                            const next = { ...prev };
                                            delete next.purchasePrice;
                                            return next;
                                        });
                                    }}
                                />
                                {errors.purchasePrice && (
                                    <div className={cx('errorText')}>{errors.purchasePrice}</div>
                                )}
                            </div>
                            <div className={cx('row')}>
                                <label>Giá cuối cùng (đã gồm thuế)</label>
                                <input placeholder="Tự động tính" value={finalPrice} readOnly />
                            </div>
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Tồn kho & trạng thái</div>
                            <div className={cx('sectionHint')}>
                                Theo dõi số lượng và tình trạng sản phẩm
                            </div>
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
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Kích thước & trọng lượng</div>
                            <div className={cx('sectionHint')}>
                                Giúp hệ thống tự tính phí vận chuyển
                            </div>
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
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setLength)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Rộng (cm)"
                                    value={width}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setWidth)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Cao (cm)"
                                    value={height}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setHeight)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Trọng lượng (g)"
                                    value={weight}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setWeight)
                                    }
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
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Hình ảnh & video</div>
                            <div className={cx('sectionHint')}>
                                Tối đa 50MB cho toàn bộ tư liệu
                            </div>
                        </div>
                        <div className={cx('row')}>
                            <label>Chọn ảnh/video (tổng tối đa 50MB)</label>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleMediaSelection}
                            />
                            {errors.mediaFiles && (
                                <div className={cx('errorText')}>{errors.mediaFiles}</div>
                            )}
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
                                                        // Xóa lỗi mediaFiles khi đã có file
                                                        setErrors((prev) => {
                                                            if (!prev?.mediaFiles) return prev;
                                                            const next = { ...prev };
                                                            delete next.mediaFiles;
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
