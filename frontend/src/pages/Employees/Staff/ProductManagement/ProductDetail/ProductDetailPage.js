import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductDetailPage.module.scss';
import {
    getApiBaseUrl,
    getStoredToken,
    formatDateTime,
    getProductImageUrl,
    normalizeMediaUrl,
} from '../../../../../services/productUtils';

const cx = classNames.bind(styles);

function ProductDetailPage() {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Fetch product detail
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    const text = await resp.text().catch(() => '');
                    throw new Error(text || `HTTP ${resp.status}`);
                }

                const data = await resp.json().catch(() => ({}));
                const productData = data?.result || data;
                setProduct(productData);
            } catch (e) {
                setError(e?.message || 'Không thể tải thông tin sản phẩm');
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, API_BASE_URL]);

    // Handle delete product
    const handleDelete = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const resp = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                throw new Error(text || `HTTP ${resp.status}`);
            }

            setShowDeleteModal(false);
            alert('Sản phẩm đã được xóa thành công!');
            navigate('/staff/products');
        } catch (e) {
            alert('Lỗi: ' + (e?.message || 'Không thể xóa sản phẩm'));
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        navigate('/staff/products');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Chờ duyệt':
                return 'pending';
            case 'Đã duyệt':
                return 'approved';
            case 'Từ chối':
                return 'rejected';
            case 'Vô hiệu hóa':
                return 'disabled';
            default:
                return '';
        }
    };

    const getProductImage = () => {
        if (!product) return null;
        const imageUrl = getProductImageUrl(product);
        return normalizeMediaUrl(imageUrl, API_BASE_URL);
    };

    // Loading state
    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error')}>
                    <p>{error || 'Không tìm thấy sản phẩm'}</p>
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const productImage = getProductImage();
    const statusClass = getStatusClass(product.status);

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
                <h1 className={cx('title')}>Chi tiết sản phẩm</h1>
            </div>

            {/* Product Detail Card */}
            <div className={cx('detail-card')}>
                <div className={cx('product-content')}>
                    {/* Product Image */}
                    <div className={cx('product-image-section')}>
                        {productImage ? (
                            <img
                                src={productImage}
                                alt={product.name}
                                className={cx('product-image')}
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không có hình ảnh</text></svg>';
                                }}
                            />
                        ) : (
                            <div className={cx('product-image-placeholder')}>
                                <span>Không có hình ảnh</span>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className={cx('product-info-section')}>
                        <div className={cx('info-grid')}>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Mã sản phẩm:</span>
                                <span className={cx('info-value')}>{product.id || '-'}</span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Tên sản phẩm:</span>
                                <span className={cx('info-value', 'product-name')}>
                                    {product.name || '-'}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Danh mục:</span>
                                <span className={cx('info-value')}>
                                    {product.categoryName || '-'}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Giá:</span>
                                <span className={cx('info-value')}>
                                    {formatPrice(product.price || 0)}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Ngày tạo:</span>
                                <span className={cx('info-value')}>
                                    {formatDateTime(product.createdAt)}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Trạng thái:</span>
                                <span className={cx('status-badge', statusClass)}>
                                    {product.status || 'Chờ duyệt'}
                                </span>
                            </div>
                            {product.rejectionReason && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Lý do admin gửi lại:</span>
                                    <span className={cx('info-value', 'rejection-reason')}>
                                        {product.rejectionReason}
                                    </span>
                                </div>
                            )}
                            <div className={cx('info-row', 'description-row')}>
                                <span className={cx('info-label')}>Mô tả:</span>
                                <span className={cx('info-value', 'description')}>
                                    {product.description || '-'}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={cx('action-buttons')}>
                            {/* Staff: Chờ duyệt -> Xóa bài gửi */}
                            {product.status === 'Chờ duyệt' && (
                                <button
                                    className={cx('btn', 'btn-delete')}
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={processing}
                                >
                                    Xóa bài gửi
                                </button>
                            )}

                            {/* Staff: Từ chối -> Sửa lại */}
                            {product.status === 'Từ chối' && (
                                <button
                                    className={cx('btn', 'btn-edit')}
                                    onClick={() => {
                                        // Navigate đến trang update product
                                        navigate(`/staff/products/${id}/update`);
                                    }}
                                    disabled={processing}
                                >
                                    Sửa lại
                                </button>
                            )}

                            {/* Staff: Đã duyệt -> Nothing (không hiển thị nút) */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowDeleteModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận xóa sản phẩm</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn xóa sản phẩm này không?
                        </p>
                        <p className={cx('modal-warning')}>Hành động này không thể hoàn tác.</p>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-delete')}
                                onClick={handleDelete}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetailPage;
