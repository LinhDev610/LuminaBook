import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './UpdateProduct.module.scss';
import { getApiBaseUrl, getStoredToken, getUserRole, uploadProductMedia } from '../../../../services';
import { normalizeMediaUrl } from '../../../../services/productUtils';
import { useNotification } from '../../../../components/Common/Notification';
import backIcon from '../../../../assets/icons/icon_back.png';

const cx = classNames.bind(styles);
const API_BASE_URL = getApiBaseUrl();

function UpdateProduct() {
    const navigate = useNavigate();
    const { id } = useParams();
    const formRef = useRef(null);
    const { success, error: notifyError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form fields state - chỉ các trường được phép chỉnh sửa
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [weight, setWeight] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [publicationDate, setPublicationDate] = useState('');
    const [errors, setErrors] = useState({});

    // Media state
    const [mediaFiles, setMediaFiles] = useState([]); // [{file, type, preview, isDefault, uploadedUrl?}]
    const [defaultMediaUrl, setDefaultMediaUrl] = useState('');
    const [existingMediaUrls, setExistingMediaUrls] = useState([]);
    const [removedExistingMediaUrls, setRemovedExistingMediaUrls] = useState([]); // URLs đã bị xóa bởi user

    // Check admin role
    useEffect(() => {
        const checkAdminRole = async () => {
            try {
                const token = getStoredToken('token');
                if (!token) {
                    setIsAdmin(false);
                    return;
                }
                const role = await getUserRole(API_BASE_URL, token);
                setIsAdmin(role === 'ADMIN');
                if (role !== 'ADMIN') {
                    notifyError('Bạn không có quyền truy cập trang này.');
                    navigate('/admin/products');
                }
            } catch (err) {
                console.error('Error checking admin role:', err);
                setIsAdmin(false);
                navigate('/admin/products');
            }
        };
        checkAdminRole();
    }, [navigate, notifyError]);

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || !isAdmin) return;
            try {
                setLoadingProduct(true);
                const token = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
                setWeight(product.weight || '');
                setLength(product.length || '');
                setWidth(product.width || '');
                setHeight(product.height || '');
                setPublicationDate(
                    product.publicationDate ? product.publicationDate.split('T')[0] : '',
                );

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
                notifyError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
            } finally {
                setLoadingProduct(false);
            }
        };

        if (isAdmin) {
            fetchProduct();
        }
    }, [id, isAdmin, notifyError]);

    // Validation
    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Vui lòng nhập tên sản phẩm.';
        if (!author.trim()) newErrors.author = 'Vui lòng nhập tên tác giả.';
        if (!publisher.trim()) newErrors.publisher = 'Vui lòng nhập nhà xuất bản.';
        if (!publicationDate) newErrors.publicationDate = 'Vui lòng chọn ngày xuất bản.';

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

    // Refresh token if needed
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

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            notifyError('Bạn không có quyền thực hiện hành động này.');
            return;
        }

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

            // Upload new media files if any
            let imageUrls = [];
            let videoUrls = [];
            let finalDefaultMediaUrl = defaultMediaUrl;

            if (mediaFiles.length > 0) {
                const filesToUpload = mediaFiles.filter((m) => m.file && !m.uploadedUrl);
                if (filesToUpload.length > 0) {
                    const fileArray = filesToUpload.map((m) => m.file);
                    let uploadResult = await uploadProductMedia(fileArray, token);

                    // Retry with refreshed token if 401
                    if (!uploadResult.ok && uploadResult.status === 401) {
                        const newToken = await refreshTokenIfNeeded();
                        if (newToken) {
                            token = newToken;
                            uploadResult = await uploadProductMedia(fileArray, token);
                        }
                    }

                    if (!uploadResult.ok || !uploadResult.urls || uploadResult.urls.length === 0) {
                        throw new Error(uploadResult.message || 'Upload media thất bại');
                    }

                    // Map uploaded URLs and add to arrays immediately
                    let urlIndex = 0;
                    const updatedMediaFiles = mediaFiles.map((m) => {
                        if (m.file && !m.uploadedUrl) {
                            const uploadedUrl = uploadResult.urls[urlIndex++];
                            if (m.type === 'IMAGE') {
                                imageUrls.push(uploadedUrl);
                            } else {
                                videoUrls.push(uploadedUrl);
                            }
                            return { ...m, uploadedUrl };
                        }
                        // If already has uploadedUrl, add to arrays
                        if (m.uploadedUrl) {
                            if (m.type === 'IMAGE') {
                                imageUrls.push(m.uploadedUrl);
                            } else {
                                videoUrls.push(m.uploadedUrl);
                            }
                        }
                        return m;
                    });
                    setMediaFiles(updatedMediaFiles);
                } else {
                    // No new files to upload, but add existing uploaded URLs from mediaFiles
                    mediaFiles.forEach((m) => {
                        if (m.uploadedUrl) {
                            if (m.type === 'IMAGE') {
                                imageUrls.push(m.uploadedUrl);
                            } else {
                                videoUrls.push(m.uploadedUrl);
                            }
                        }
                    });
                }

                // Add existing media URLs from product (chỉ những URL chưa bị xóa)
                existingMediaUrls
                    .filter((url) => !removedExistingMediaUrls.includes(url))
                    .forEach((url) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        if (isImage) {
                            imageUrls.push(url);
                        } else {
                            videoUrls.push(url);
                        }
                    });

                // Set default media URL - prioritize new default, then existing default, then first available
                const defaultMedia = mediaFiles.find((m) => m.isDefault);
                const remainingExistingUrls = existingMediaUrls.filter(
                    (url) => !removedExistingMediaUrls.includes(url)
                );
                if (defaultMedia && defaultMedia.uploadedUrl) {
                    // New media file marked as default and already uploaded
                    finalDefaultMediaUrl = defaultMedia.uploadedUrl;
                } else if (defaultMediaUrl && remainingExistingUrls.includes(defaultMediaUrl)) {
                    // Keep existing default if it's still in the list and not removed
                    finalDefaultMediaUrl = defaultMediaUrl;
                } else if (imageUrls.length > 0) {
                    // Use first image as default
                    finalDefaultMediaUrl = imageUrls[0];
                } else if (videoUrls.length > 0) {
                    // Use first video as default
                    finalDefaultMediaUrl = videoUrls[0];
                }
            } else {
                // Keep existing media (chỉ những URL chưa bị xóa)
                existingMediaUrls
                    .filter((url) => !removedExistingMediaUrls.includes(url))
                    .forEach((url) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        if (isImage) {
                            imageUrls.push(url);
                        } else {
                            videoUrls.push(url);
                        }
                    });
                // Keep existing default if no new media
                const remainingExistingUrls = existingMediaUrls.filter(
                    (url) => !removedExistingMediaUrls.includes(url)
                );
                if (defaultMediaUrl && remainingExistingUrls.includes(defaultMediaUrl)) {
                    finalDefaultMediaUrl = defaultMediaUrl;
                } else if (imageUrls.length > 0) {
                    finalDefaultMediaUrl = imageUrls[0];
                } else if (videoUrls.length > 0) {
                    finalDefaultMediaUrl = videoUrls[0];
                }
            }

            // Build payload - chỉ các trường được phép chỉnh sửa
            // Loại bỏ các field undefined/null không cần thiết
            const payload = {};

            if (name && name.trim()) payload.name = name.trim();
            if (description !== undefined) payload.description = description?.trim() || null;
            if (author && author.trim()) payload.author = author.trim();
            if (publisher && publisher.trim()) payload.publisher = publisher.trim();

            if (weight !== undefined && weight !== null && weight !== '') {
                const weightNum = Number(weight);
                if (!isNaN(weightNum) && weightNum >= 0) {
                    payload.weight = weightNum;
                }
            }

            if (length !== undefined && length !== null && length !== '') {
                const lengthNum = Number(length);
                if (!isNaN(lengthNum) && lengthNum >= 1) {
                    payload.length = lengthNum;
                }
            }

            if (width !== undefined && width !== null && width !== '') {
                const widthNum = Number(width);
                if (!isNaN(widthNum) && widthNum >= 1) {
                    payload.width = widthNum;
                }
            }

            if (height !== undefined && height !== null && height !== '') {
                const heightNum = Number(height);
                if (!isNaN(heightNum) && heightNum >= 1) {
                    payload.height = heightNum;
                }
            }

            if (publicationDate) payload.publicationDate = publicationDate;

            // Only include media if we have URLs
            if (imageUrls.length > 0) payload.imageUrls = imageUrls;
            if (videoUrls.length > 0) payload.videoUrls = videoUrls;
            if (finalDefaultMediaUrl) payload.defaultMediaUrl = finalDefaultMediaUrl;

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
            } catch (err) {
                console.error('Error parsing response:', err);
            }

            // Retry with refreshed token if 401
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
                    } catch (err) {
                        console.error('Error parsing retry response:', err);
                    }
                } else {
                    setIsLoading(false);
                    notifyError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }
            }

            if (response.ok) {
                success('Cập nhật sản phẩm thành công.');
                setTimeout(() => {
                    navigate(`/admin/products/${id}`, { replace: true });
                }, 1500);
            } else {
                // Extract error message from response
                const serverMsg = data?.message || data?.error || data?.result || '';
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

                notifyError(errorMessage);
            }
        } catch (err) {
            console.error('Error updating product:', err);
            notifyError(err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (loadingProduct || !isAdmin) {
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
                    onClick={() => navigate(`/admin/products/${id}`, { replace: true })}
                >
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <h3>Chỉnh sửa sản phẩm</h3>
                <form ref={formRef} className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('row')}>
                        <label>Tên sản phẩm *</label>
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
                            <label>Tác giả *</label>
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
                            <label>Nhà xuất bản *</label>
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
                        <label>Ngày xuất bản *</label>
                        <input
                            type="date"
                            value={publicationDate}
                            onChange={(e) => setPublicationDate(e.target.value)}
                        />
                        {errors.publicationDate && (
                            <div className={cx('errorText')}>{errors.publicationDate}</div>
                        )}
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
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    setLength(cleaned === '' ? '' : cleaned);
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
                                    setWidth(cleaned === '' ? '' : cleaned);
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
                                    setHeight(cleaned === '' ? '' : cleaned);
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
                                    setWeight(cleaned === '' ? '' : cleaned);
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
                        <label>Mô tả</label>
                        <textarea
                            placeholder="Nhập mô tả sản phẩm..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                        />
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
                        {/* Show existing media */}
                        {existingMediaUrls.filter((url) => !removedExistingMediaUrls.includes(url)).length > 0 && (
                            <div className={cx('existingMedia')}>
                                <div className={cx('existingMediaLabel')}>
                                    Ảnh/video hiện tại:
                                </div>
                                <div className={cx('mediaList')}>
                                    {existingMediaUrls
                                        .filter((url) => !removedExistingMediaUrls.includes(url))
                                        .map((url, idx) => {
                                            const normalizedUrl = normalizeMediaUrl(
                                                url,
                                                API_BASE_URL,
                                            );
                                            const isImage =
                                                /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                            return (
                                                <div key={idx} className={cx('mediaItem')}>
                                                    {isImage ? (
                                                        <img
                                                            src={normalizedUrl}
                                                            alt="existing"
                                                            className={cx('mediaPreview')}
                                                        />
                                                    ) : (
                                                        <video
                                                            src={normalizedUrl}
                                                            className={cx('mediaPreview')}
                                                            controls
                                                        />
                                                    )}
                                                    <div className={cx('mediaActions')}>
                                                        <label className={cx('defaultToggle')}>
                                                            <input
                                                                type="radio"
                                                                name="defaultMedia"
                                                                checked={defaultMediaUrl === url}
                                                                onChange={() => setDefaultMediaUrl(url)}
                                                            />
                                                            Mặc định
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className={cx('removeBtn')}
                                                            onClick={() => {
                                                                // Thêm vào danh sách đã xóa
                                                                setRemovedExistingMediaUrls((prev) => [...prev, url]);
                                                                // Nếu đây là default media, set default về media đầu tiên còn lại
                                                                if (defaultMediaUrl === url) {
                                                                    const remaining = existingMediaUrls.filter(
                                                                        (u) => u !== url && !removedExistingMediaUrls.includes(u)
                                                                    );
                                                                    if (remaining.length > 0) {
                                                                        setDefaultMediaUrl(remaining[0]);
                                                                    } else if (mediaFiles.length > 0) {
                                                                        // Nếu không còn existing media, dùng media file đầu tiên
                                                                        const firstMedia = mediaFiles.find((m) => m.isDefault) || mediaFiles[0];
                                                                        if (firstMedia) {
                                                                            setDefaultMediaUrl(firstMedia.uploadedUrl || firstMedia.preview || '');
                                                                        }
                                                                    } else {
                                                                        setDefaultMediaUrl('');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                        {/* Show new media files */}
                        {mediaFiles.length > 0 && (
                            <div className={cx('existingMedia')}>
                                <div className={cx('existingMediaLabel')}>
                                    Ảnh/video mới:
                                </div>
                                <div className={cx('mediaList')}>
                                    {mediaFiles.map((m, idx) => (
                                        <div key={idx} className={cx('mediaItem')}>
                                            {m.type === 'IMAGE' ? (
                                                <img
                                                    src={m.preview}
                                                    alt="new"
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
                                                                prev.map((item, i) => ({
                                                                    ...item,
                                                                    isDefault: i === idx,
                                                                })),
                                                            );
                                                        }}
                                                    />
                                                    Mặc định
                                                </label>
                                                <button
                                                    type="button"
                                                    className={cx('removeBtn')}
                                                    onClick={() => {
                                                        setMediaFiles((prev) => {
                                                            const next = prev.filter(
                                                                (_, i) => i !== idx,
                                                            );
                                                            // Nếu xóa default media, set default cho media đầu tiên còn lại
                                                            if (m.isDefault && next.length > 0) {
                                                                next[0].isDefault = true;
                                                                // Cập nhật defaultMediaUrl nếu cần
                                                                const firstRemaining = next[0];
                                                                if (firstRemaining.uploadedUrl) {
                                                                    setDefaultMediaUrl(firstRemaining.uploadedUrl);
                                                                }
                                                            } else if (m.isDefault && next.length === 0) {
                                                                // Nếu không còn new media, dùng existing media đầu tiên
                                                                const remaining = existingMediaUrls.filter(
                                                                    (u) => !removedExistingMediaUrls.includes(u)
                                                                );
                                                                if (remaining.length > 0) {
                                                                    setDefaultMediaUrl(remaining[0]);
                                                                } else {
                                                                    setDefaultMediaUrl('');
                                                                }
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
                            </div>
                        )}
                    </div>

                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'ghost')}
                            onClick={() => navigate(`/admin/products/${id}`, { replace: true })}
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateProduct;
