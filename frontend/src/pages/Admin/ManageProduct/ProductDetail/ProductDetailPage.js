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
} from '../../../../services/productUtils';

const cx = classNames.bind(styles);

function ProductDetailPage() {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
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

    // Handle approve product
    const handleApprove = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const resp = await fetch(`${API_BASE_URL}/products/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    productId: id,
                    action: 'APPROVE',
                }),
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                throw new Error(text || `HTTP ${resp.status}`);
            }

            const data = await resp.json().catch(() => ({}));
            setProduct(data?.result || data);
            setShowApproveModal(false);
            alert('Sản phẩm đã được duyệt thành công!');
        } catch (e) {
            alert('Lỗi: ' + (e?.message || 'Không thể duyệt sản phẩm'));
        } finally {
            setProcessing(false);
        }
    };

    // Handle reject product
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const resp = await fetch(`${API_BASE_URL}/products/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    productId: id,
                    action: 'REJECT',
                    reason: rejectReason,
                }),
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                throw new Error(text || `HTTP ${resp.status}`);
            }

            const data = await resp.json().catch(() => ({}));
            setProduct(data?.result || data);
            setShowRejectModal(false);
            setRejectReason('');
            alert('Sản phẩm đã bị từ chối!');
        } catch (e) {
            alert('Lỗi: ' + (e?.message || 'Không thể từ chối sản phẩm'));
        } finally {
            setProcessing(false);
        }
    };

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
            navigate('/admin/products');
        } catch (e) {
            alert('Lỗi: ' + (e?.message || 'Không thể xóa sản phẩm'));
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/products');
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
                                <span className={cx('info-label')}>Tác giả:</span>
                                <span className={cx('info-value')}>
                                    {product.author || '-'}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Nhà xuất bản:</span>
                                <span className={cx('info-value')}>
                                    {product.publisher || '-'}
                                </span>
                            </div>
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Giá niêm yết:</span>
                                <span className={cx('info-value')}>
                                    {formatPrice(product.price || 0)}
                                </span>
                            </div>
                            {product.tax !== undefined && product.tax !== null && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Thuế:</span>
                                    <span className={cx('info-value')}>
                                        {Math.round(product.tax * 100)}%
                                    </span>
                                </div>
                            )}
                            {product.discountValue !== undefined && product.discountValue !== null && product.discountValue > 0 && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Giảm giá:</span>
                                    <span className={cx('info-value')}>
                                        {formatPrice(product.discountValue)}
                                    </span>
                                </div>
                            )}
                            {product.publicationDate && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Ngày xuất bản:</span>
                                    <span className={cx('info-value')}>
                                        {new Date(product.publicationDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            )}
                            {(product.length || product.width || product.height) && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Kích thước (cm):</span>
                                    <span className={cx('info-value')}>
                                        {[product.length, product.width, product.height]
                                            .filter(Boolean)
                                            .join(' × ') || '-'}
                                    </span>
                                </div>
                            )}
                            {product.weight !== undefined && product.weight !== null && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Trọng lượng:</span>
                                    <span className={cx('info-value')}>
                                        {product.weight} g
                                    </span>
                                </div>
                            )}
                            {product.availableQuantity !== undefined && product.availableQuantity !== null && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Số lượng tồn kho:</span>
                                    <span className={cx('info-value')}>
                                        {product.availableQuantity}
                                    </span>
                                </div>
                            )}
                            {product.quantitySold !== undefined && product.quantitySold !== null && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Số lượng đã bán:</span>
                                    <span className={cx('info-value')}>
                                        {product.quantitySold}
                                    </span>
                                </div>
                            )}
                            {product.submittedByName && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Người gửi:</span>
                                    <span className={cx('info-value')}>
                                        {product.submittedByName}
                                    </span>
                                </div>
                            )}
                            {product.approvedByName && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Người duyệt:</span>
                                    <span className={cx('info-value')}>
                                        {product.approvedByName}
                                    </span>
                                </div>
                            )}
                            {product.status === 'Đã duyệt' && product.approvedAt && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Ngày duyệt:</span>
                                    <span className={cx('info-value')}>
                                        {formatDateTime(product.approvedAt)}
                                    </span>
                                </div>
                            )}
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Ngày tạo:</span>
                                <span className={cx('info-value')}>
                                    {formatDateTime(product.createdAt)}
                                </span>
                            </div>
                            {product.updatedAt && product.updatedAt !== product.createdAt && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Ngày cập nhật:</span>
                                    <span className={cx('info-value')}>
                                        {formatDateTime(product.updatedAt)}
                                    </span>
                                </div>
                            )}
                            <div className={cx('info-row')}>
                                <span className={cx('info-label')}>Trạng thái:</span>
                                <span className={cx('status-badge', statusClass)}>
                                    {product.status || 'Chờ duyệt'}
                                </span>
                            </div>
                            {product.rejectionReason && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Lý do từ chối:</span>
                                    <span className={cx('info-value', 'rejection-reason')}>
                                        {product.rejectionReason}
                                    </span>
                                </div>
                            )}
                            {((product.averageRating !== undefined && product.averageRating !== null) || (product.reviewCount !== undefined && product.reviewCount !== null && product.reviewCount > 0)) && (
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Đánh giá:</span>
                                    <span className={cx('info-value')}>
                                        {product.averageRating !== undefined && product.averageRating !== null
                                            ? `${product.averageRating.toFixed(1)}/5.0`
                                            : '-'}
                                        {product.reviewCount !== undefined && product.reviewCount !== null && product.reviewCount > 0
                                            ? ` (${product.reviewCount} đánh giá)`
                                            : ''}
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
                            {product.status === 'Chờ duyệt' && (
                                <>
                                    <button
                                        className={cx('btn', 'btn-approve')}
                                        onClick={() => setShowApproveModal(true)}
                                        disabled={processing}
                                    >
                                        Duyệt
                                    </button>
                                    <button
                                        className={cx('btn', 'btn-reject')}
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={processing}
                                    >
                                        Không duyệt
                                    </button>
                                </>
                            )}
                            <button
                                className={cx('btn', 'btn-delete')}
                                onClick={() => setShowDeleteModal(true)}
                                disabled={processing}
                            >
                                Xóa sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowApproveModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận duyệt</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn duyệt sản phẩm này không?
                        </p>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => setShowApproveModal(false)}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-approve')}
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Duyệt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowRejectModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <h2 className={cx('modal-title')}>Xác nhận từ chối</h2>
                        <p className={cx('modal-message')}>
                            Bạn có chắc chắn muốn từ chối sản phẩm này không?
                        </p>
                        <div className={cx('modal-input-section')}>
                            <label className={cx('modal-label')}>Lý do từ chối:</label>
                            <textarea
                                className={cx('modal-textarea')}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                rows={4}
                            />
                        </div>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                disabled={processing}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-reject')}
                                onClick={handleReject}
                                disabled={processing}
                            >
                                {processing ? 'Đang xử lý...' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
