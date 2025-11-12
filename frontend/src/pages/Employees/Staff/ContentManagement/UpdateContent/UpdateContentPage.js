import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './UpdateContentPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../../services/utils';
import { normalizeMediaUrl } from '../../../../../services/productUtils';
import { useNotification } from '../../../../../components/Common/Notification';

const cx = classNames.bind(styles);

export default function UpdateContentPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const fileInputRef = useRef(null);
    const { success: notifySuccess, error: notifyError } = useNotification();
    
    const [banner, setBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: false,
        imageFile: null,
        imageUrl: '',
        productIds: [],
        startDate: '',
        endDate: '',
    });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Format LocalDate helper
    const formatLocalDate = (value) => {
        if (!value) return '';
        if (Array.isArray(value) && value.length >= 3) {
            const y = String(value[0]).padStart(4, '0');
            const m = String(value[1]).padStart(2, '0');
            const d = String(value[2]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        if (typeof value === 'string') {
            const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
            if (isoMatch) return isoMatch[1];
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        }
        try {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        } catch (e) {
            // ignore
        }
        return '';
    };

    // Fetch available products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    const products = data.result.map((p) => ({
                        id: p.id,
                        name: p.name,
                    }));
                    setAvailableProducts(products);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };

        fetchProducts();
    }, [API_BASE_URL]);

    // Fetch banner data
    useEffect(() => {
        if (!id) return;

        const fetchBanner = async () => {
            setLoading(true);
            try {
                const token = getStoredToken();
                if (!token) {
                    notifyError('Vui lòng đăng nhập');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải thông tin banner');
                }

                const bannerData = data?.result;
                if (bannerData) {
                    setBanner(bannerData);
                    setFormData({
                        title: bannerData.title || '',
                        description: bannerData.description || '',
                        status: false, // Always set to false (chờ duyệt) when editing
                        imageFile: null,
                        imageUrl: bannerData.imageUrl || '',
                        productIds: bannerData.productIds || [],
                        startDate: formatLocalDate(bannerData.startDate),
                        endDate: formatLocalDate(bannerData.endDate),
                    });
                    
                    // Set selected products
                    if (availableProducts.length > 0) {
                        const selected = (bannerData.productIds || [])
                            .map((pid) => {
                                const product = availableProducts.find((p) => p.id === pid);
                                return product ? { id: product.id, name: product.name } : null;
                            })
                            .filter(Boolean);
                        setSelectedProducts(selected);
                    } else {
                        const selected = (bannerData.productIds || []).map((pid) => ({
                            id: pid,
                            name: 'Đang tải...',
                        }));
                        setSelectedProducts(selected);
                    }
                }
            } catch (err) {
                console.error('Error fetching banner:', err);
                notifyError(err.message || 'Không thể tải thông tin banner');
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [id, API_BASE_URL, notifyError, availableProducts]);

    // Update selected products names when availableProducts are loaded
    useEffect(() => {
        if (availableProducts.length === 0 || selectedProducts.length === 0) return;
        
        const needsUpdate = selectedProducts.some((p) => p.name === 'Đang tải...');
        if (needsUpdate) {
            const updated = selectedProducts.map((sp) => {
                const product = availableProducts.find((p) => p.id === sp.id);
                return product ? { id: product.id, name: product.name } : sp;
            });
            setSelectedProducts(updated);
        }
    }, [availableProducts]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                imageFile: file,
            }));
        }
    };

    const handleRemoveImage = () => {
        setFormData((prev) => ({
            ...prev,
            imageFile: null,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddProduct = () => {
        setShowProductModal(true);
    };

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts((prev) => [...prev, product]);
            setFormData((prev) => ({
                ...prev,
                productIds: [...prev.productIds, product.id],
            }));
        }
        setShowProductModal(false);
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
        setFormData((prev) => ({
            ...prev,
            productIds: prev.productIds.filter((id) => id !== productId),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.title.trim()) {
            notifyError('Vui lòng nhập tiêu đề banner');
            return;
        }
        if (!formData.imageFile && !formData.imageUrl) {
            notifyError('Vui lòng chọn ảnh banner');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsSubmitting(false);
                return;
            }

            let imageUrl = formData.imageUrl;

            // Upload image if new file is selected
            if (formData.imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('files', formData.imageFile);

                const uploadResponse = await fetch(`${API_BASE_URL}/media/upload-product`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataUpload,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Không thể upload ảnh');
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData?.result?.[0] || '';

                if (!imageUrl) {
                    throw new Error('Không thể lấy URL ảnh');
                }
            }

            // Update banner
            const bannerPayload = {
                title: formData.title.trim(),
                description: formData.description.trim() || '',
                imageUrl: imageUrl,
                linkUrl: '',
                status: false, // Always set to false (chờ duyệt) when staff submits
                productIds: formData.productIds,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
            };

            // Don't send rejectionReason - keep the old one

            let updateResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bannerPayload),
            });

            let updateData = {};
            try {
                updateData = await updateResponse.json();
            } catch (err) {
                console.error('Error parsing response:', err);
                const text = await updateResponse.text();
                console.log('Response text:', text);
            }

            // Nếu hết hạn -> thử refresh và gọi lại 1 lần
            if (updateResponse.status === 401) {
                const refreshToken = getStoredToken('refreshToken');
                if (refreshToken) {
                    try {
                        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: refreshToken })
                        });
                        const refreshData = await refreshResponse.json();
                        if (refreshResponse.ok && refreshData?.result?.token) {
                            localStorage.setItem('token', refreshData.result.token);
                            localStorage.setItem('refreshToken', refreshData.result.token);
                            token = refreshData.result.token;
                            
                            // Retry với token mới
                            updateResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify(bannerPayload),
                            });
                            try {
                                updateData = await updateResponse.json();
                            } catch (err) {
                                console.error('Error parsing retry response:', err);
                            }
                        }
                    } catch (refreshErr) {
                        console.error('Error refreshing token:', refreshErr);
                    }
                }
            }

            // Kiểm tra response sau khi retry
            if (updateResponse.ok) {
                notifySuccess('Banner đã được cập nhật và gửi lại để duyệt!');
                setTimeout(() => {
                    navigate(`/staff/content/${id}`);
                }, 1500);
            } else {
                // Extract error message from response
                const serverMsg = updateData?.message || updateData?.error || updateData?.result || '';

                let errorMessage = serverMsg || 'Cập nhật banner thất bại. Vui lòng thử lại.';

                if (updateResponse.status === 403) {
                    errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                } else if (updateResponse.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (updateResponse.status === 400) {
                    if (serverMsg) {
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMsg}`;
                    } else {
                        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
                    }
                } else if (updateResponse.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }

                notifyError(errorMessage);
            }
        } catch (err) {
            console.error('Error updating banner:', err);
            const msg = err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            notifyError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải thông tin banner...</div>
            </div>
        );
    }

    if (!banner) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error')}>
                    <p>Không tìm thấy thông tin banner</p>
                    <button className={cx('btn', 'btn-back')} onClick={() => navigate('/staff/content')}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const displayImageUrl = formData.imageFile
        ? URL.createObjectURL(formData.imageFile)
        : formData.imageUrl
        ? normalizeMediaUrl(formData.imageUrl, API_BASE_URL)
        : '';

    return (
        <div className={cx('wrap')}>
            <div className={cx('topbar')}>
                <button
                    className={cx('backBtn')}
                    onClick={() => navigate(`/staff/content/${id}`)}
                >
                    ←
                </button>
            </div>
            <div className={cx('card')}>
                <h3>Chỉnh sửa banner/slider</h3>
                
                {/* Lý do không duyệt banner */}
                {banner.rejectionReason && (
                    <div className={cx('rejection-box')}>
                        <h3 className={cx('rejection-title')}>Lý do không duyệt banner</h3>
                        <p className={cx('rejection-text')}>{banner.rejectionReason}</p>
                        {banner.updatedAt && (
                            <p className={cx('rejection-date')}>
                                Ngày giờ kiểm duyệt: {formatDateTime(banner.updatedAt)}
                            </p>
                        )}
                    </div>
                )}

                <form className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('row')}>
                        <label>Tiêu đề banner</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Nhập tiêu đề banner..."
                        />
                    </div>

                    <div className={cx('row')}>
                        <label>Ảnh banner</label>
                        <div className={cx('file-upload-section')}>
                            <label className={cx('file-upload-btn')}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={cx('file-input')}
                                />
                                Chọn tệp
                            </label>
                            <span className={cx('file-name')}>
                                {formData.imageFile
                                    ? formData.imageFile.name
                                    : formData.imageUrl
                                    ? 'Ảnh hiện tại (có thể thay đổi)'
                                    : 'Chưa có tệp nào được chọn'}
                            </span>
                        </div>
                        {displayImageUrl && (
                            <div className={cx('image-preview-wrapper')}>
                                <div className={cx('image-preview')}>
                                    <img src={displayImageUrl} alt="Preview" />
                                    <div className={cx('image-actions')}>
                                        <button
                                            type="button"
                                            className={cx('btn', 'muted')}
                                            onClick={handleRemoveImage}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={cx('row')}>
                        <label>Mô tả</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Nhập mô tả ngắn..."
                            rows={4}
                        />
                    </div>

                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Ngày bắt đầu</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={cx('row')}>
                            <label>Ngày kết thúc</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className={cx('row')}>
                        <label>Liên kết đến sản phẩm</label>
                        <div className={cx('product-section')}>
                            {selectedProducts.length > 0 && (
                                <div className={cx('selected-products')}>
                                    {selectedProducts.map((product) => (
                                        <div key={product.id} className={cx('product-tag')}>
                                            <span>{product.name}</span>
                                            <button
                                                type="button"
                                                className={cx('remove-btn')}
                                                onClick={() => handleRemoveProduct(product.id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                className={cx('btn', 'add-product-btn')}
                                onClick={handleAddProduct}
                            >
                                + Thêm sản phẩm
                            </button>
                        </div>
                    </div>

                    {showProductModal && (
                        <div className={cx('modal-overlay')} onClick={() => setShowProductModal(false)}>
                            <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                                <div className={cx('modal-header')}>
                                    <h2>Chọn sản phẩm</h2>
                                    <button
                                        className={cx('modal-close')}
                                        onClick={() => setShowProductModal(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className={cx('modal-content')}>
                                    {availableProducts
                                        .filter((p) => !selectedProducts.find((sp) => sp.id === p.id))
                                        .map((product) => (
                                            <div
                                                key={product.id}
                                                className={cx('product-option')}
                                                onClick={() => handleSelectProduct(product)}
                                            >
                                                {product.name}
                                            </div>
                                        ))}
                                    {availableProducts.filter(
                                        (p) => !selectedProducts.find((sp) => sp.id === p.id)
                                    ).length === 0 && (
                                        <div className={cx('no-products')}>
                                            Không còn sản phẩm nào để thêm
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'muted')}
                            onClick={() => navigate(`/staff/content/${id}`)}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi lại để duyệt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

