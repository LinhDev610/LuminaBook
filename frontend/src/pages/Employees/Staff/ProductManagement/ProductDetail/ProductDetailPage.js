import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductDetailPage.module.scss';
import {
    getProductImageUrl,
    normalizeMediaUrl,
} from '../../../../../services/productUtils';
import { formatDateTime, getApiBaseUrl } from '../../../../../services/utils';
import { getProductById } from '../../../../../services';

const cx = classNames.bind(styles);

function ProductDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [product, setProduct] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch product detail
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const productData = await getProductById(id);
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
        <div>
            {/* Header */}
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý sản phẩm</h1>
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
            <div className={cx('wrap')}>
                {/* Back Button */}
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

                {/* Product Detail Card */}
                <div className={cx('detail-card')}>
                    {/* Header Chi tiết sản phẩm */}
                    <div className={cx('detail-header')}>
                        <h2 className={cx('detail-title')}>Chi tiết sản phẩm</h2>
                    </div>

                    {/* Lý do không duyệt sản phẩm */}
                    {product.rejectionReason && (
                        <div className={cx('rejection-box')}>
                            <h3 className={cx('rejection-title')}>Lý do không duyệt sản phẩm</h3>
                            <p className={cx('rejection-text')}>{product.rejectionReason}</p>
                            {product.updatedAt && (
                                <p className={cx('rejection-date')}>
                                    Ngày giờ kiểm duyệt: {formatDateTime(product.updatedAt)}
                                </p>
                            )}
                        </div>
                    )}

                    <div className={cx('product-content')}>
                        {/* Product Image */}
                        <div className={cx('product-image-section')}>
                            {productImage ? (
                                <img
                                    src={productImage}
                                    alt={product.name}
                                    className={cx('product-image')}
                                    onError={(e) => {
                                        e.target.src =
                                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không có hình ảnh</text></svg>';
                                    }}
                                />
                            ) : (
                                <div className={cx('product-image-placeholder')}>
                                    <span>Không có hình ảnh</span>
                                </div>
                            )}

                            {Array.isArray(product.mediaUrls) &&
                                product.mediaUrls.length > 0 && (
                                    <div className={cx('media-thumbs')}>
                                        {product.mediaUrls.map((mUrl, idx) => {
                                            const nUrl = normalizeMediaUrl(
                                                mUrl,
                                                API_BASE_URL,
                                            );
                                            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                mUrl,
                                            );
                                            const isActive = product.defaultMediaUrl === mUrl;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cx('thumb', {
                                                        'thumb-active': isActive,
                                                    })}
                                                    onClick={() => {
                                                        setLightboxIndex(idx);
                                                        setLightboxOpen(true);
                                                    }}
                                                >
                                                    {isImg ? (
                                                        <img
                                                            src={nUrl}
                                                            alt={`thumb-${idx}`}
                                                        />
                                                    ) : (
                                                        <video src={nUrl} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>

                        {/* Product Info */}
                        <div className={cx('product-info-section')}>
                            <div className={cx('info-grid')}>
                                <div className={cx('info-row')}>
                                    <span className={cx('info-label')}>Mã sản phẩm:</span>
                                    <span className={cx('info-value')}>
                                        {product.id || '-'}
                                    </span>
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
                                {product.discountValue !== undefined &&
                                    product.discountValue !== null &&
                                    product.discountValue > 0 && (
                                        <div className={cx('info-row')}>
                                            <span className={cx('info-label')}>
                                                Giảm giá:
                                            </span>
                                            <span className={cx('info-value')}>
                                                {formatPrice(product.discountValue)}
                                            </span>
                                        </div>
                                    )}
                                {product.publicationDate && (
                                    <div className={cx('info-row')}>
                                        <span className={cx('info-label')}>
                                            Ngày xuất bản:
                                        </span>
                                        <span className={cx('info-value')}>
                                            {new Date(
                                                product.publicationDate,
                                            ).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                                {(product.length || product.width || product.height) && (
                                    <div className={cx('info-row')}>
                                        <span className={cx('info-label')}>
                                            Kích thước (cm):
                                        </span>
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
                                {product.availableQuantity !== undefined &&
                                    product.availableQuantity !== null && (
                                        <div className={cx('info-row')}>
                                            <span className={cx('info-label')}>
                                                Số lượng tồn kho:
                                            </span>
                                            <span className={cx('info-value')}>
                                                {product.availableQuantity}
                                            </span>
                                        </div>
                                    )}
                                {product.quantitySold !== undefined &&
                                    product.quantitySold !== null && (
                                        <div className={cx('info-row')}>
                                            <span className={cx('info-label')}>
                                                Số lượng đã bán:
                                            </span>
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
                                {product.updatedAt &&
                                    product.updatedAt !== product.createdAt && (
                                        <div className={cx('info-row')}>
                                            <span className={cx('info-label')}>
                                                Ngày cập nhật:
                                            </span>
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
                                {((product.averageRating !== undefined &&
                                    product.averageRating !== null) ||
                                    (product.reviewCount !== undefined &&
                                        product.reviewCount !== null &&
                                        product.reviewCount > 0)) && (
                                        <div className={cx('info-row')}>
                                            <span className={cx('info-label')}>Đánh giá:</span>
                                            <span className={cx('info-value')}>
                                                {product.averageRating !== undefined &&
                                                    product.averageRating !== null
                                                    ? `${product.averageRating.toFixed(1)}/5.0`
                                                    : '-'}
                                                {product.reviewCount !== undefined &&
                                                    product.reviewCount !== null &&
                                                    product.reviewCount > 0
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
                                {/* Staff: Chỉ hiển thị nút "Sửa lại" khi sản phẩm bị từ chối */}
                                {product.status === 'Từ chối' && (
                                    <button
                                        className={cx('btn', 'btn-edit')}
                                        onClick={() => {
                                            navigate(`/staff/products/${id}/update`);
                                        }}
                                    >
                                        Sửa lại
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {lightboxOpen && (
                    <div
                        className={cx('modal-overlay')}
                        onClick={() => setLightboxOpen(false)}
                    >
                        <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12,
                                }}
                            >
                                <h2 className={cx('modal-title')}>{product.name}</h2>
                                <button
                                    className={cx('btn', 'btn-cancel')}
                                    onClick={() => setLightboxOpen(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                {(() => {
                                    const mUrl = product.mediaUrls[lightboxIndex];
                                    const nUrl = normalizeMediaUrl(mUrl, API_BASE_URL);
                                    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(mUrl);
                                    return isImg ? (
                                        <img
                                            src={nUrl}
                                            alt="preview-large"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '70vh',
                                                borderRadius: 8,
                                            }}
                                        />
                                    ) : (
                                        <video
                                            src={nUrl}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '70vh',
                                                borderRadius: 8,
                                            }}
                                            controls
                                            autoPlay
                                        />
                                    );
                                })()}
                            </div>
                            <div className={cx('media-thumbs')} style={{ marginTop: 12 }}>
                                {product.mediaUrls.map((mUrl, idx) => {
                                    const nUrl = normalizeMediaUrl(mUrl, API_BASE_URL);
                                    const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(mUrl);
                                    const active = idx === lightboxIndex;
                                    return (
                                        <div
                                            key={idx}
                                            className={cx('thumb', {
                                                'thumb-active': active,
                                            })}
                                            onClick={() => setLightboxIndex(idx)}
                                        >
                                            {isImg ? (
                                                <img src={nUrl} alt={`lb-${idx}`} />
                                            ) : (
                                                <video src={nUrl} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductDetailPage;
