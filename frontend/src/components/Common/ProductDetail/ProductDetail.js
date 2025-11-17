import React, { useState, useEffect, useMemo } from 'react';
import styles from './ProductDetail.module.scss';
import { getApiBaseUrl, formatDateTime } from '../../../services/utils';
import { normalizeMediaUrl } from '../../../services/productUtils';

const ProductDetail = ({ productId }) => {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Không thể tải thông tin sản phẩm');

                const data = await response.json();
                setProduct(data?.result || data);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err.message || 'Không thể tải thông tin sản phẩm');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId, API_BASE_URL]);

    const mockProduct = {
        id: '9786044027456',
        name: 'Tủ Sách Giáo Dục Shichida - Siêu Não Phải - Nuôi Dạy Con Trở Thành Thiên Tài Theo Phương Pháp Giáo Dục Shichida',
        subtitle: 'Nuôi dạy con trở thành thiên tài theo phương pháp giáo dục Shichida',
        author: 'Makoto Shichida',
        publisher: 'Dân Trí',
        coverType: 'Bìa Mềm',
        price: 132000,
        originalPrice: 165000,
        discount: 20,
        averageRating: 5,
        reviewCount: 10,
        quantitySold: 16,
        translator: 'Yuka Tú Phạm, Brainworks Studio',
        publishYear: 2024,
        weight: 250,
        dimensions: '20.5 x 14 x 1.2 cm',
        pages: 232,
        format: 'Bìa Mềm',
        bestSeller: 'Top 100 sản phẩm Kỹ năng sống bán chạy của tháng',
        description:
            'Siêu Não Phải là cuốn sách minh chứng tính hiệu quả của phương pháp giáo dục siêu não phải mà các lớp học theo phương pháp Shichida áp dụng đang được triển khai tại 18 quốc gia và khu vực trên toàn thế giới.',
        longDescription:
            'Nếu phát huy được những khả năng còn tiềm ẩn ở bán cầu não phải bấy lâu, thì con sẽ trở thành những đứa trẻ sở hữu tư duy sáng tạo và nguồn cảm hứng dồi dào. Và chính cha mẹ sẽ là người khai phá tài năng của trẻ.',
        images: [
            '/assets/images/img_kinangsong.png',
            '/assets/images/img_sach.png',
            '/assets/images/img_taichinh.png',
            '/assets/images/img_sachgiadinh.png',
            '/assets/images/img_qc.png',
        ],
        category: 'Sách Giáo Dục',
        stock: 50,
        shippingAddress: 'Phường Bến Nghé, Quận 1, Hồ Chí Minh',
        deliveryMethod: 'Giao hàng tiêu chuẩn',
        estimatedDelivery: 'Thứ ba - 14/10',
    };

    const displayProduct = product || mockProduct;
    const isRejected = product && product.status === 'REJECTED';

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
            price || 0,
        );

    const renderStars = (rating = 0) => {
        const resolved = Math.max(0, Math.min(5, rating || 0));
        return Array.from({ length: 5 }, (_, idx) => {
            const filled = idx < Math.round(resolved);
            return (
                <span key={idx} className={filled ? styles.star : styles.starEmpty}>
                    ★
                </span>
            );
        });
    };

    const productImages = product?.mediaUrls?.length
        ? product.mediaUrls.map((img) => normalizeMediaUrl(img, API_BASE_URL))
        : (displayProduct.images || []).map((img) =>
              normalizeMediaUrl(img, API_BASE_URL),
          );
    const heroFallback = product?.defaultMediaUrl
        ? normalizeMediaUrl(product.defaultMediaUrl, API_BASE_URL)
        : productImages[0] || require('../../../assets/images/img_sach.png');

    useEffect(() => {
        setSelectedImage(heroFallback);
    }, [heroFallback]);

    const availableStock =
        product?.availableQuantity ??
        product?.stock ??
        displayProduct.availableQuantity ??
        displayProduct.stock ??
        0;

    const currentPrice = displayProduct.price ?? displayProduct.unitPrice ?? 0;
    const originalPrice =
        displayProduct.originalPrice ?? displayProduct.unitPrice ?? currentPrice;
    const discountPercent =
        displayProduct.discount ??
        (originalPrice > 0
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0);

    const policyHighlights = [
        { icon: '🚚', text: 'Thời gian giao hàng: Giao hàng nhanh và uy tín' },
        { icon: '🔄', text: 'Đổi trả miễn phí: Đổi trả miễn phí toàn quốc' },
        { icon: '💳', text: 'Thanh toán tiện lợi: Hỗ trợ nhiều phương thức thanh toán' },
    ];

    const infoRows = [
        {
            label: 'Mã hàng',
            value: displayProduct.id || displayProduct.productCode || '-',
        },
        { label: 'Tên Nhà Cung Cấp', value: displayProduct.supplierName || '-' },
        { label: 'Tác giả', value: displayProduct.author || '-' },
        { label: 'Người Dịch', value: displayProduct.translator || '-' },
        { label: 'NXB', value: displayProduct.publisher || '-' },
        {
            label: 'Năm XB',
            value: displayProduct.publicationDate
                ? new Date(displayProduct.publicationDate).getFullYear()
                : displayProduct.publishYear || '-',
        },
        { label: 'Trọng lượng (gr)', value: displayProduct.weight || '-' },
        {
            label: 'Kích Thước Bao Bì',
            value:
                displayProduct.length && displayProduct.width && displayProduct.height
                    ? `${displayProduct.length} × ${displayProduct.width} × ${displayProduct.height} cm`
                    : displayProduct.dimensions || '-',
        },
        { label: 'Số trang', value: displayProduct.pages || '-' },
        {
            label: 'Hình thức',
            value: displayProduct.format || displayProduct.coverType || '-',
        },
    ];

    useEffect(() => {
        if (availableStock && quantity > availableStock) {
            setQuantity(availableStock);
        }
    }, [availableStock]);

    const handleAddToCart = () => {
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        alert('Chuyển đến trang thanh toán!');
    };

    if (loading) {
        return (
            <div className={styles.productDetail}>
                <div className={styles.container}>
                    <div className={styles.loadingState}>
                        Đang tải thông tin sản phẩm...
                    </div>
                </div>
            </div>
        );
    }

    if (error && !product) {
        return (
            <div className={styles.productDetail}>
                <div className={styles.container}>
                    <div className={styles.errorState}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.productDetail}>
            <div className={styles.container}>
                <div className={styles.headerBreadcrumb}>
                    <span className={styles.categoryHeader}>
                        {displayProduct.categoryName ||
                            displayProduct.category ||
                            'Sản phẩm'}
                    </span>
                </div>

                {isRejected && product.rejectionReason && (
                    <div className={styles.rejectionBox}>
                        <h3 className={styles.rejectionTitle}>
                            Lý do không duyệt sản phẩm
                        </h3>
                        <p className={styles.rejectionText}>{product.rejectionReason}</p>
                        {product.updatedAt && (
                            <p className={styles.rejectionDate}>
                                Ngày giờ kiểm duyệt: {formatDateTime(product.updatedAt)}
                            </p>
                        )}
                    </div>
                )}

                <div className={styles.productContent}>
                    <div className={styles.productImages}>
                        <div className={styles.mainImage}>
                            <img
                                src={selectedImage || heroFallback}
                                alt={displayProduct.name}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                        </div>
                        {productImages.length > 0 && (
                            <div className={styles.thumbnailImages}>
                                {productImages.slice(0, 4).map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${displayProduct.name} ${idx + 1}`}
                                        className={
                                            selectedImage === img ? styles.active : ''
                                        }
                                        onClick={() => setSelectedImage(img)}
                                        onError={(e) => {
                                            e.target.src = require('../../../assets/images/img_sach.png');
                                        }}
                                    />
                                ))}
                                {productImages.length > 4 && (
                                    <div className={styles.moreImages}>
                                        +{productImages.length - 4}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.ctaRow}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={handleAddToCart}
                            >
                                Thêm vào giỏ hàng
                            </button>
                            <button className={styles.primaryBtn} onClick={handleBuyNow}>
                                Mua ngay
                            </button>
                        </div>
                    </div>

                    <div className={styles.productInfo}>
                        <h1 className={styles.productName}>{displayProduct.name}</h1>

                        <div className={styles.productMeta}>
                            <div>
                                <strong>Tác giả:</strong> {displayProduct.author || '-'}
                            </div>
                            <div>
                                <strong>Nhà xuất bản:</strong>{' '}
                                {displayProduct.publisher || '-'}
                            </div>
                        </div>

                        <div className={styles.ratingSection}>
                            <div className={styles.stars}>
                                {renderStars(
                                    displayProduct.averageRating || displayProduct.rating,
                                )}
                            </div>
                            <div className={styles.ratingText}>
                                <span className={styles.reviewCount}>
                                    ({displayProduct.reviewCount || 0} đánh giá)
                                </span>
                                <span className={styles.dot}>·</span>
                                <span className={styles.soldCount}>
                                    Đã bán{' '}
                                    {displayProduct.quantitySold ||
                                        displayProduct.soldCount ||
                                        0}
                                </span>
                            </div>
                        </div>

                        <div className={styles.priceSection}>
                            <div className={styles.currentPrice}>
                                {formatPrice(currentPrice)}
                            </div>
                            {originalPrice > currentPrice && (
                                <div className={styles.priceMeta}>
                                    <span className={styles.originalPrice}>
                                        {formatPrice(originalPrice)}
                                    </span>
                                    <span className={styles.discount}>
                                        -{discountPercent}%
                                    </span>
                                </div>
                            )}
                            <div className={styles.taxNote}>(Giá đã gồm thuế)</div>
                        </div>

                        <div className={styles.shippingInfo}>
                            <h3>Thông tin vận chuyển</h3>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📍</span>
                                <span>
                                    Giao hàng đến:{' '}
                                    {displayProduct.shippingAddress || 'Toàn quốc'}
                                </span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>🚚</span>
                                <span>
                                    {displayProduct.deliveryMethod ||
                                        'Giao hàng tiêu chuẩn'}
                                </span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📅</span>
                                <span>
                                    Dự kiến giao:{' '}
                                    {displayProduct.estimatedDelivery ||
                                        '3-5 ngày làm việc'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.quantitySection}>
                            <label>Số lượng:</label>
                            <div className={styles.quantityControls}>
                                <button
                                    onClick={() =>
                                        setQuantity((prev) => Math.max(1, prev - 1))
                                    }
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableStock || undefined}
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    parseInt(e.target.value) || 1,
                                                    availableStock || 999,
                                                ),
                                            ),
                                        )
                                    }
                                />
                                <button
                                    onClick={() => {
                                        const limit = availableStock || 999;
                                        setQuantity((prev) => Math.min(prev + 1, limit));
                                    }}
                                    disabled={
                                        availableStock
                                            ? quantity >= availableStock
                                            : false
                                    }
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className={styles.promotionalPolicies}>
                            <h3>Chính sách ưu đãi</h3>
                            {policyHighlights.map((item, index) => (
                                <div key={index} className={styles.policyItem}>
                                    <span className={styles.policyIcon}>{item.icon}</span>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.productDetails}>
                    <div className={styles.detailedInfo}>
                        <h3>Thông tin chi tiết</h3>
                        <div className={styles.infoTable}>
                            {infoRows.map((row) => (
                                <div className={styles.infoRow} key={row.label}>
                                    <span className={styles.infoLabel}>{row.label}</span>
                                    <span className={styles.infoValue}>{row.value}</span>
                                </div>
                            ))}
                            {displayProduct.bestSeller && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>
                                        Sản phẩm bán chạy nhất
                                    </span>
                                    <span className={styles.infoValue}>
                                        <a href="#!" className={styles.bestSellerLink}>
                                            {displayProduct.bestSeller}
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.productDescription}>
                        <h3>Mô tả sản phẩm</h3>
                        <h4>{displayProduct.name}</h4>
                        {displayProduct.subtitle && (
                            <p className={styles.subtitle}>{displayProduct.subtitle}</p>
                        )}
                        <p>{displayProduct.description || '-'}</p>
                        {displayProduct.longDescription && (
                            <p>{displayProduct.longDescription}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
