import { useMemo, useRef, useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './AddProductPage.module.scss';
import { useNavigate } from 'react-router-dom';
import backIcon from '../../../../../assets/icons/icon_back.png';
import Notification from '../../../../../components/Common/Notification';
import {
    getApiBaseUrl,
    getStoredToken as getStoredTokenUtil,
} from '../../../../../services/productUtils';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();

export default function AddProductPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Notification state
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyType, setNotifyType] = useState('info');
    const [notifyMsg, setNotifyMsg] = useState('');

    // Form fields state
    const [productId, setProductId] = useState('');
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

    // Media state (local files)
    const [mediaFiles, setMediaFiles] = useState([]); // [{file, type, preview, isDefault}]
    const [defaultMediaUrl, setDefaultMediaUrl] = useState('');

    // ========== Helper Functions ==========
    const getStoredToken = (key) => getStoredTokenUtil(key);

    // ========== Data Fetching ==========

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
        if (!productId.trim()) newErrors.id = 'Vui lòng nhập mã sản phẩm.';
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
                body: JSON.stringify({ token: refreshToken }),
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
     * 2. Upload media files (nếu có)
     * 3. Tạo sản phẩm mới
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

            // Upload media files first (if any)
            let imageUrls = [];
            let videoUrls = [];
            let defaultUrlForPayload = (defaultMediaUrl || '').trim();
            if (mediaFiles.length > 0) {
                const formData = new FormData();
                mediaFiles.forEach((m) => formData.append('files', m.file));
                const uploadResp = await fetch(`${API_BASE_URL}/media/upload`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
                const uploadData = await uploadResp.json().catch(() => ({}));
                const urls = Array.isArray(uploadData?.result) ? uploadData.result : [];
                // Map back uploaded urls to type order
                let idx = 0;
                const mapped = mediaFiles.map((m) => ({
                    ...m,
                    uploadedUrl: urls[idx++],
                }));
                imageUrls = mapped
                    .filter((m) => m.type === 'IMAGE')
                    .map((m) => m.uploadedUrl)
                    .filter(Boolean);
                videoUrls = mapped
                    .filter((m) => m.type === 'VIDEO')
                    .map((m) => m.uploadedUrl)
                    .filter(Boolean);
                const defaultItem = mapped.find((m) => m.isDefault) || mapped[0];
                if (defaultItem && defaultItem.uploadedUrl) {
                    defaultUrlForPayload = defaultItem.uploadedUrl;
                }
            }
            const payload = {
                id: (productId || '').trim(),
                name: (name || '').trim(),
                description: (description || '').trim() || null,
                author: (author || '').trim(),
                publisher: (publisher || '').trim(),
                weight: weight && Number(weight) > 0 ? Number(weight) : null,
                length: length && Number(length) >= 1 ? Number(length) : null,
                width: width && Number(width) >= 1 ? Number(width) : null,
                height: height && Number(height) >= 1 ? Number(height) : null,
                price: Number(price) || 0, // required field, must have value
                tax: taxDecimal || 0, // decimal form e.g. 0.05
                discountValue:
                    discountValue && Number(discountValue) > 0
                        ? Number(discountValue)
                        : null,
                categoryId: (categoryId || '').trim(),
                publicationDate: publicationDate || new Date().toISOString().slice(0, 10),
                imageUrls: imageUrls.length ? imageUrls : undefined,
                videoUrls: videoUrls.length ? videoUrls : undefined,
                defaultMediaUrl: defaultUrlForPayload || undefined,
            };

            console.log('Request data:', JSON.stringify(payload, null, 2));

            let response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
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
                console.log('Response status:', response.status);
                console.log('Error code:', data?.code);
                console.log('Error message:', data?.message);
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
                    response = await fetch(`${API_BASE_URL}/products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                    });
                    try {
                        data = await response.json();
                        console.log('Retry response:', JSON.stringify(data, null, 2));
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
                setNotifyMsg('Thêm sản phẩm thành công.');
                setNotifyOpen(true);
                formRef.current?.reset();
                // reset controlled values
                setName('');
                setDescription('');
                setAuthor('');
                setPublisher('');
                setWeight(0.0);
                setLength(1);
                setWidth(1);
                setHeight(1);
                setPrice(0.0);
                setTaxPercent('0');
                setDiscountValue(0.0);
                setCategoryId('');
                setPublicationDate('');
                setProductId('');
                setMediaFiles([]);
                setDefaultMediaUrl('');
                setErrors({});
            } else {
                // Extract error message from response
                const serverMsg = data?.message || data?.error || data?.result || '';
                const errorCode = data?.code;

                console.log('Error details:', {
                    status: response.status,
                    code: errorCode,
                    message: serverMsg,
                    fullData: data,
                });

                let errorMessage =
                    serverMsg || 'Thêm sản phẩm thất bại. Vui lòng thử lại.';

                if (response.status === 403) {
                    errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                } else if (response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (response.status === 400) {
                    if (serverMsg) {
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMsg}`;
                    } else {
                        errorMessage =
                            'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
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
            console.error('Error creating product:', err);
            const msg = 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            setError(msg);
            setNotifyType('error');
            setNotifyMsg(msg);
            setNotifyOpen(true);
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
                            onChange={(e) => setProductId(e.target.value)}
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
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Dài (cm)"
                                value={length}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    // loại bỏ ký tự không hợp lệ (khoảng trắng, chữ cái, ký hiệu) trước khi chuyển sang số thập phân.
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setLength('');
                                        return;
                                    }
                                    const n = Number(cleaned); // Chuỗi số -> số thực
                                    setLength(Number.isNaN(n) ? 0 : n); // Đổi thất bại gán 0
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Rộng (cm)"
                                value={width}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setWidth('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setWidth(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Cao (cm)"
                                value={height}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setHeight('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setHeight(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Trọng lượng (g)"
                                value={weight}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    // Cho phép chuỗi rỗng để người dùng tiếp tục nhập
                                    if (cleaned === '') {
                                        setWeight('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setWeight(Number.isNaN(n) ? 0 : n);
                                }}
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
                            <input />
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
                            onClick={() => formRef.current?.reset()}
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
