import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AddBannerPage.module.scss';
import { getApiBaseUrl, getStoredToken, getUserRole } from '../../../../../services/utils';
import { useNotification } from '../../../../../components/Common/Notification';

const cx = classNames.bind(styles);

export default function AddBannerPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const fileInputRef = useRef(null);
    const { success: notifySuccess, error: notifyError } = useNotification();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: false, // false = Chờ duyệt, true = Đã duyệt
        imageFile: null,
        imageUrl: '',
        productIds: [],
        createdDate: new Date().toISOString().split('T')[0], // Ngày tạo (mặc định là hôm nay)
        startDate: '', // Ngày bắt đầu
        endDate: '', // Ngày kết thúc
    });
    const [selectedProducts, setSelectedProducts] = useState([]); // Array of {id, name}
    const [availableProducts, setAvailableProducts] = useState([]); // All products for selection
    const [showProductModal, setShowProductModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fetch user role to check if admin
    useEffect(() => {
        const checkUserRole = async () => {
            try {
                // Lấy token từ sessionStorage hoặc localStorage
                let token = sessionStorage.getItem('token');
                if (!token) {
                    token = getStoredToken();
                }
                
                if (!token) {
                    setIsAdmin(false);
                    return;
                }

                // Đảm bảo token là string
                let tokenToUse = token;
                if (typeof tokenToUse !== 'string') {
                    tokenToUse = String(tokenToUse);
                }

                // Gọi API trực tiếp để có error handling tốt hơn
                const resp = await fetch(`${API_BASE_URL}/users/my-info`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });

                if (!resp.ok) {
                    // Nếu không phải lỗi 401/403, có thể là lỗi khác
                    const errorData = await resp.json().catch(() => ({}));
                    console.warn('Error fetching user info:', errorData?.message || resp.status);
                    setIsAdmin(false);
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const role = 
                    data?.result?.role?.name ||
                    data?.role?.name ||
                    data?.result?.role ||
                    data?.role ||
                    null;

                setIsAdmin(role === 'ADMIN');
            } catch (err) {
                console.error('Error fetching user role:', err);
                setIsAdmin(false);
            }
        };

        checkUserRole();
    }, [API_BASE_URL]);

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
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            status: value === 'true',
        }));
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

        // Validation
        if (!formData.title || !formData.title.trim()) {
            notifyError('Vui lòng nhập tiêu đề banner');
            return;
        }
        if (!formData.imageFile) {
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

            // Step 1: Upload image
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
            const imageUrl = uploadData?.result?.[0] || '';

            if (!imageUrl) {
                throw new Error('Không thể lấy URL ảnh');
            }

            // Step 2: Create banner
            const bannerPayload = {
                title: formData.title.trim(),
                description: formData.description.trim() || '',
                imageUrl: imageUrl,
                linkUrl: '',
                status: formData.status,
                productIds: formData.productIds,
                createdDate: formData.createdDate || new Date().toISOString().split('T')[0],
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
            };

            const createResponse = await fetch(`${API_BASE_URL}/banners`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bannerPayload),
            });

            const createData = await createResponse.json();

            if (!createResponse.ok) {
                throw new Error(createData?.message || 'Không thể tạo banner');
            }

            notifySuccess('Banner đã được gửi duyệt thành công!');
            setTimeout(() => {
                navigate('/staff/content');
            }, 2000);
        } catch (err) {
            console.error('Error creating banner:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi tạo banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/staff/content');
    };

    return (
        <div className={cx('add-banner-page')}>
            <div className={cx('page-header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-btn')} onClick={() => navigate('/staff/content')}>
                        ←
                    </button>
                    <h1 className={cx('page-title')}>Quản lý nội dung</h1>
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

            <div className={cx('form-container')}>
                <h2 className={cx('form-title')}>Thêm banner/slider mới</h2>

                <form onSubmit={handleSubmit}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Ảnh banner</label>
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
                                {formData.imageFile ? formData.imageFile.name : 'Chưa có tệp nào được chọn'}
                            </span>
                        </div>
                        {formData.imageFile && (
                            <div className={cx('image-preview-wrapper')}>
                                <div className={cx('image-preview')}>
                                    <img
                                        src={URL.createObjectURL(formData.imageFile)}
                                        alt="Preview"
                                    />
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

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Tiêu đề</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Nhập tiêu đề banner..."
                            className={cx('form-input')}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Mô tả</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Nhập mô tả ngắn..."
                            className={cx('form-textarea')}
                            rows={4}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Trạng thái</label>
                        <select
                            name="status"
                            value={formData.status.toString()}
                            onChange={handleStatusChange}
                            disabled={!isAdmin}
                            className={cx('form-select', { disabled: !isAdmin })}
                        >
                            <option value="false">Chờ duyệt</option>
                            <option value="true">Đã duyệt</option>
                        </select>
                        {!isAdmin && (
                            <p className={cx('hint-text')}>
                                Chỉ Admin mới có thể thay đổi trạng thái
                            </p>
                        )}
                    </div>

                    <div className={cx('form-group', 'date-group')}>
                        <label className={cx('form-label')}>Ngày tạo</label>
                        <input
                            type="date"
                            name="createdDate"
                            value={formData.createdDate}
                            readOnly
                            className={cx('form-input', 'readonly-input')}
                        />
                    </div>

                    <div className={cx('form-group', 'date-group')}>
                        <label className={cx('form-label')}>Ngày bắt đầu</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className={cx('form-input')}
                        />
                    </div>

                    <div className={cx('form-group', 'date-group')}>
                        <label className={cx('form-label')}>Ngày kết thúc</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className={cx('form-input')}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Danh sách sách trong banner</label>
                        {selectedProducts.length > 0 && (
                            <div className={cx('product-list')}>
                                {selectedProducts.map((product) => (
                                    <div key={product.id} className={cx('product-item')}>
                                        <span className={cx('product-name')}>{product.name}</span>
                                        <button
                                            type="button"
                                            className={cx('btn', 'muted')}
                                            onClick={() => handleRemoveProduct(product.id)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            className={cx('add-product-btn')}
                            onClick={handleAddProduct}
                        >
                            <span className={cx('plus-icon')}>+</span>
                            Thêm sách
                        </button>
                    </div>

                    <div className={cx('form-actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'btn-cancel')}
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'btn-submit')}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi duyệt'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Product Selection Modal */}
            {showProductModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowProductModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3 className={cx('modal-title')}>Chọn sách</h3>
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
                                (p) => !selectedProducts.find((sp) => sp.id === p.id),
                            ).length === 0 && (
                                <p className={cx('no-products')}>Không còn sách nào để thêm</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

