import { useMemo, useRef, useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './UpdateProductPage.module.scss';
import { useNavigate, useParams } from 'react-router-dom';
import backIcon from '../../../../../assets/icons/icon_back.png';
import Notification from '../../../../../components/Common/Notification';
import { getApiBaseUrl, getStoredToken as getStoredTokenUtil, normalizeMediaUrl } from '../../../../../services/productUtils';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();

export default function UpdateProductPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { id } = useParams();
    const formRef = useRef(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true);

    // Notification state
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyType, setNotifyType] = useState('info');
    const [notifyMsg, setNotifyMsg] = useState('');

    // Form fields state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [weight, setWeight] = useState(0.0);
    const [length, setLength] = useState(1);
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [price, setPrice] = useState(0.0);
    const [taxPercent, setTaxPercent] = useState('0');
    const [discountValue, setDiscountValue] = useState(0.0);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [publicationDate, setPublicationDate] = useState('');
    const [errors, setErrors] = useState({});

    // Media state (local files + existing media)
    const [mediaFiles, setMediaFiles] = useState([]); // [{file, type, preview, isDefault, uploadedUrl?}]
    const [defaultMediaUrl, setDefaultMediaUrl] = useState('');
    const [existingMediaUrls, setExistingMediaUrls] = useState([]); // Existing media URLs from product

    // ========== Helper Functions ==========
    const getStoredToken = (key) => getStoredTokenUtil(key);

    // ========== Data Fetching ==========

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoadingProduct(true);
                const tokenToUse = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });

                if (!resp.ok) {
                    throw new Error('Không thể tải thông tin sản phẩm');
                }

                const data = await resp.json().catch(() => ({}));
                const product = data?.result || data;

                // Fill form with product data
                setName(product.name || '');
                setDescription(product.description || '');
                setAuthor(product.author || '');
                setPublisher(product.publisher || '');
                setWeight(product.weight || 0.0);
                setLength(product.length || 1);
                setWidth(product.width || 1);
                setHeight(product.height || 1);
                setPrice(product.price || 0.0);
                setTaxPercent(product.tax ? String(Math.round(product.tax * 100)) : '0');
                setDiscountValue(product.discountValue || 0.0);
                setCategoryId(product.categoryId || '');
                setPublicationDate(product.publicationDate ? product.publicationDate.split('T')[0] : '');

                // Set existing media
                if (product.mediaUrls && Array.isArray(product.mediaUrls)) {
                    setExistingMediaUrls(product.mediaUrls);
                    if (product.defaultMediaUrl) {
                        setDefaultMediaUrl(product.defaultMediaUrl);
                    } else if (product.mediaUrls.length > 0) {
                        setDefaultMediaUrl(product.mediaUrls[0]);
                    }
                }

            } catch (err) {
                console.error('Error fetching product:', err);
                setNotifyType('error');
                setNotifyMsg('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
                setNotifyOpen(true);
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Fetch danh sách danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const tokenToUse = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/categories/active`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });
                const data = await resp.json().catch(() => ({}));
                const list = data?.result || data || [];
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
        const clamped = Math.max(0, Math.min(100, n));
        return clamped / 100;
    }, [taxPercent]);

    // Tính giá cuối cùng sau thuế
    const finalPrice = useMemo(() => {
        const p = Number(price) || 0;
        return Math.round(p * (1 + taxDecimal));
    }, [price, taxDecimal]);

    // ========== API Helpers ==========

    // Refresh token nếu cần (khi token hết hạn)
    const refreshTokenIfNeeded = async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken })
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data?.result?.token) {
                localStorage.setItem('token', data.result.token);
                localStorage.setItem('refreshToken', data.result.token);
                return data.result.token;
            }
        } catch (_) { }
        return null;
    };

    // ========== Event Handlers ==========

    /**
     * Xử lý submit form
     * 1. Validate form
     * 2. Upload media files (nếu có file mới)
     * 3. Update sản phẩm và đặt status về PENDING (Chờ duyệt)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError('');
        if (!validate()) {
            setIsLoading(false);
            setNotifyType('error');
            setNotifyMsg('Vui lòng điền đầy đủ thông tin bắt buộc.');
            setNotifyOpen(true);
            return;
        }
        try {
            let token = getStoredToken('token');
            if (!token) {
                setIsLoading(false);
                setNotifyType('error');
                setNotifyMsg('Thiếu token xác thực. Vui lòng đăng nhập lại.');
                setNotifyOpen(true);
                return;
            }

            // Note: ProductUpdateRequest doesn't support media URLs, so we only update product fields
            // Media will remain as-is. If new media needs to be added, it would require backend changes.

            const payload = {
                name: (name || '').trim(),
                description: (description || '').trim() || null,
                author: (author || '').trim(),
                publisher: (publisher || '').trim(),
                weight: (weight && Number(weight) > 0) ? Number(weight) : null,
                length: (length && Number(length) >= 1) ? Number(length) : null,
                width: (width && Number(width) >= 1) ? Number(width) : null,
                height: (height && Number(height) >= 1) ? Number(height) : null,
                price: Number(price) || 0,
                tax: taxDecimal || 0,
                discountValue: (discountValue && Number(discountValue) > 0) ? Number(discountValue) : null,
                categoryId: (categoryId || '').trim(),
                publicationDate: publicationDate || new Date().toISOString().slice(0, 10),
                status: 'PENDING', // Set status back to PENDING (Chờ duyệt)
            };

            console.log('Update request data:', JSON.stringify(payload, null, 2));

            let response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            let data = {};
            try {
                data = await response.json();
                console.log('Response data:', JSON.stringify(data, null, 2));
            } catch (err) {
                console.error('Error parsing response:', err);
                const text = await response.text();
                console.log('Response text:', text);
            }

            // Nếu hết hạn -> thử refresh và gọi lại 1 lần
            if (response.status === 401) {
                const newToken = await refreshTokenIfNeeded();
                if (newToken) {
                    token = newToken;
                    response = await fetch(`${API_BASE_URL}/products/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                    });
                    try {
                        data = await response.json();
                    } catch (_) { }
                } else {
                    setIsLoading(false);
                    setNotifyType('error');
                    setNotifyMsg('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setNotifyOpen(true);
                    return;
                }
            }

            if (response.ok) {
                setNotifyType('success');
                setNotifyMsg('Cập nhật sản phẩm thành công. Sản phẩm đã được gửi lại để duyệt.');
                setNotifyOpen(true);
                // Navigate back to product detail or list after 1.5 seconds
                setTimeout(() => {
                    navigate(`/staff/products/${id}`);
                }, 1500);
            } else {
                // Extract error message from response
                const serverMsg = data?.message || data?.error || data?.result || '';
                const errorCode = data?.code;

                let errorMessage = serverMsg || 'Cập nhật sản phẩm thất bại. Vui lòng thử lại.';

                if (response.status === 403) {
                    errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                } else if (response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (response.status === 400) {
                    if (serverMsg) {
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMsg}`;
                    } else {
                        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
                    }
                } else if (response.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }

                setError(errorMessage);
                setNotifyType('error');
                setNotifyMsg(errorMessage);
                setNotifyOpen(true);
            }
        } catch (err) {
            console.error('Error updating product:', err);
            const msg = 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            setError(msg);
            setNotifyType('error');
            setNotifyMsg(msg);
            setNotifyOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (loadingProduct) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải thông tin sản phẩm...</div>
            </div>
        );
    }

    return (
        <div className={cx('wrap')}>
            <div className={cx('topbar')}>
                <button
                    className={cx('backBtn')}
                    onClick={() => navigate(`/staff/products/${id}`, { replace: true })}
                >
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <div className={cx('card-header')}>Cập nhật sản phẩm</div>
                <form ref={formRef} className={cx('form')} onSubmit={handleSubmit}>
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
                    <div className={cx('grid2')}>
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
                                    onChange={(e) => setTaxPercent(e.target.value)}
                                />
                                <span className={cx('suffix')}>%</span>
                            </div>
                        </div>
                    </div>
                    <div className={cx('grid2')}>
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
                        <div className={cx('row')}></div>
                    </div>
                    <div className={cx('row')}>
                        <label>Giá cuối cùng (đã gồm thuế)</label>
                        <input placeholder="Tự động tính" value={finalPrice} readOnly />
                    </div>
                    <div className={cx('row', 'dimension')}>
                        <label>Kích thước (cm) & Trọng lượng</label>
                        <div className={cx('grid4')}>
                            <input
                                placeholder="Dài (cm)"
                                value={length}
                                onChange={(e) =>
                                    setLength(
                                        Number(e.target.value.replace(/[^0-9.]/g, '')) ||
                                        0,
                                    )
                                }
                            />
                            <input
                                placeholder="Rộng (cm)"
                                value={width}
                                onChange={(e) =>
                                    setWidth(
                                        Number(e.target.value.replace(/[^0-9.]/g, '')) ||
                                        0,
                                    )
                                }
                            />
                            <input
                                placeholder="Cao (cm)"
                                value={height}
                                onChange={(e) =>
                                    setHeight(
                                        Number(e.target.value.replace(/[^0-9.]/g, '')) ||
                                        0,
                                    )
                                }
                            />
                            <input
                                placeholder="Trọng lượng (g)"
                                value={weight}
                                onChange={(e) =>
                                    setWeight(
                                        Number(e.target.value.replace(/[^0-9.]/g, '')) ||
                                        0,
                                    )
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
                    <div className={cx('row')}>
                        <label>Chọn ảnh/video (thêm mới)</label>
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
                                    if (next.length > 0 && !next.some(m => m.isDefault)) {
                                        next[0].isDefault = true;
                                    }
                                    return next;
                                });
                            }}
                        />
                        {/* Show existing media */}
                        {existingMediaUrls.length > 0 && (
                            <div className={cx('existingMedia')}>
                                <div className={cx('existingMediaLabel')}>Ảnh/video hiện tại:</div>
                                <div className={cx('mediaList')}>
                                    {existingMediaUrls.map((url, idx) => {
                                        const normalizedUrl = normalizeMediaUrl(url, API_BASE_URL);
                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                        return (
                                            <div key={idx} className={cx('mediaItem')}>
                                                {isImage ? (
                                                    <img src={normalizedUrl} alt="existing" className={cx('mediaPreview')} />
                                                ) : (
                                                    <video src={normalizedUrl} className={cx('mediaPreview')} controls />
                                                )}
                                                <div className={cx('mediaActions')}>
                                                    <label className={cx('defaultToggle')}>
                                                        <input
                                                            type="radio"
                                                            name="defaultMedia"
                                                            checked={defaultMediaUrl === url}
                                                            onChange={() => {
                                                                setDefaultMediaUrl(url);
                                                            }}
                                                        />
                                                        Mặc định
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Show new media files */}
                        {mediaFiles.length > 0 && (
                            <div className={cx('mediaList')}>
                                {mediaFiles.map((m, idx) => (
                                    <div key={idx} className={cx('mediaItem')}>
                                        {m.type === 'IMAGE' ? (
                                            <img src={m.preview} alt="preview" className={cx('mediaPreview')} />
                                        ) : (
                                            <video src={m.preview} className={cx('mediaPreview')} controls />
                                        )}
                                        <div className={cx('mediaActions')}>
                                            <label className={cx('defaultToggle')}>
                                                <input
                                                    type="radio"
                                                    name="defaultMedia"
                                                    checked={m.isDefault}
                                                    onChange={() => {
                                                        setMediaFiles((prev) => prev.map((x, i) => ({ ...x, isDefault: i === idx })));
                                                    }}
                                                />
                                                Mặc định
                                            </label>
                                            <button
                                                type="button"
                                                className={cx('btn', 'muted')}
                                                onClick={() => {
                                                    setMediaFiles((prev) => {
                                                        const next = prev.filter((_, i) => i !== idx);
                                                        if (next.length > 0 && !next.some(n => n.isDefault)) {
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

                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'muted')}
                            onClick={() => navigate(`/staff/products/${id}`)}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi lại để duyệt'}
                        </button>
                    </div>
                </form>
            </div>
            <Notification
                open={notifyOpen}
                type={notifyType}
                title={
                    notifyType === 'success'
                        ? 'Thành công'
                        : notifyType === 'error'
                            ? 'Lỗi'
                            : 'Thông báo'
                }
                message={notifyMsg}
                onClose={() => setNotifyOpen(false)}
            />
        </div>
    );
}
