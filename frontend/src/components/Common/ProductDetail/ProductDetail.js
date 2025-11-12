import React, { useState, useEffect, useMemo } from 'react';
import styles from './ProductDetail.module.scss';
import { getApiBaseUrl, formatDateTime } from '../../../services/utils';
import { normalizeMediaUrl } from '../../../services/productUtils';

const ProductDetail = ({ productId }) => {
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch product data from API
    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Không thể tải thông tin sản phẩm');
                }

                const data = await response.json();
                const productData = data?.result || data;
                setProduct(productData);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err.message || 'Không thể tải thông tin sản phẩm');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId, API_BASE_URL]);

    // Fallback to mock data if API fails or no productId
    const mockProduct = {
        id: 1,
        name: "Tủ Sách Giáo Dục Shichida - Siêu Não Phải - Nuôi Dạy Con Trở Thành Thiên Tài Theo Phương Pháp Giáo Dục Shichida",
        subtitle: "Nuôi dạy con trở thành thiên tài theo phương pháp giáo dục Shichida",
        author: "Makoto Shichida",
        publisher: "Dân Trí",
        coverType: "Bìa Mềm",
        price: 132000,
        originalPrice: 165000,
        discount: 20,
        rating: 5,
        reviewCount: 10,
        soldCount: 16,
        productCode: "9786044027456",
        translator: "Yuka Tú Phạm, Brainworks Studio",
        publishYear: 2024,
        weight: 250,
        dimensions: "20.5 x 14 x 1.2 cm",
        pages: 232,
        format: "Bìa Mềm",
        bestSeller: "Top 100 sản phẩm Kỹ năng sống bán chạy của tháng",
        description: "Siêu Não Phải là cuốn sách minh chứng tính hiệu quả của phương pháp giáo dục siêu não phải mà các lớp học theo phương pháp Shichida áp dụng đang được triển khai tại 18 quốc gia và khu vực trên toàn thế giới. Cuốn sách sẽ cho thấy tầm quan trọng của việc áp dụng phương pháp giáo dục não phải để phát huy khả năng ghi nhớ, khả năng tính toán, khả năng đọc nhanh, học ngôn ngữ....",
        longDescription: "Nếu phát huy được những khả năng còn tiềm ẩn ở bán cầu não phải bấy lâu, thì con sẽ trở thành những đứa trẻ sở hữu tư duy sáng tạo và nguồn cảm hứng dồi dào. Và chính cha mẹ sẽ là người khai phá tài năng của trẻ.",
        images: [
            "/assets/images/img_kinangsong.png",
            "/assets/images/img_kinangsong.png", 
            "/assets/images/img_kinangsong.png",
            "/assets/images/img_kinangsong.png",
            "/assets/images/img_kinangsong.png"
        ],
        category: "Sách Giáo Dục",
        stock: 50,
        shippingAddress: "Phường Bến Nghé, Quận 1, Hồ Chí Minh",
        deliveryMethod: "Giao hàng tiêu chuẩn",
        estimatedDelivery: "Thứ ba - 14/10"
    };

    const [quantity, setQuantity] = useState(1);

    // Use product from API or fallback to mock data
    const displayProduct = product || mockProduct;

    // Check if product is rejected
    const isRejected = product && product.status === 'REJECTED';

    if (loading) {
        return (
            <div className={styles.productDetail}>
                <div className={styles.container}>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
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
                    <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    const handleAddToCart = () => {
        // TODO: Implement add to cart functionality
        console.log(`Added ${quantity} of ${displayProduct.name} to cart`);
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        // TODO: Implement buy now functionality
        console.log(`Buy now: ${quantity} of ${displayProduct.name}`);
        alert('Chuyển đến trang thanh toán!');
    };

    const formatPrice = (price) => {
        if (!price) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const renderStars = (rating) => {
        if (!rating) return null;
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className={styles.star}>★</span>);
        }
        
        if (hasHalfStar) {
            stars.push(<span key="half" className={styles.star}>☆</span>);
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className={styles.starEmpty}>☆</span>);
        }

        return stars;
    };

    // Get product images
    const productImages = product?.mediaUrls || displayProduct.images || [];
    const defaultImage = product?.defaultMediaUrl 
        ? normalizeMediaUrl(product.defaultMediaUrl, API_BASE_URL)
        : productImages[0] || require('../../../assets/images/img_sach.png');

    return (
        <div className={styles.productDetail}>
            <div className={styles.container}>
                {/* Header Breadcrumb */}
                <div className={styles.headerBreadcrumb}>
                    <span className={styles.categoryHeader}>{displayProduct.categoryName || displayProduct.category || 'Sản phẩm'}</span>
                </div>

                {/* Lý do không duyệt sản phẩm */}
                {isRejected && product.rejectionReason && (
                    <div className={styles.rejectionBox}>
                        <h3 className={styles.rejectionTitle}>Lý do không duyệt sản phẩm</h3>
                        <p className={styles.rejectionText}>{product.rejectionReason}</p>
                        {product.updatedAt && (
                            <p className={styles.rejectionDate}>
                                Ngày giờ kiểm duyệt: {formatDateTime(product.updatedAt)}
                            </p>
                        )}
                    </div>
                )}

                <div className={styles.productContent}>
                    {/* Product Images */}
                    <div className={styles.productImages}>
                        <div className={styles.mainImage}>
                            <img 
                                src={defaultImage}
                                alt={displayProduct.name}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                        </div>
                        {productImages.length > 1 && (
                            <div className={styles.thumbnailImages}>
                                {productImages.slice(0, 3).map((img, idx) => {
                                    const imgUrl = typeof img === 'string' 
                                        ? normalizeMediaUrl(img, API_BASE_URL)
                                        : img;
                                    return (
                                        <img
                                            key={idx}
                                            src={imgUrl}
                                            alt={`${displayProduct.name} ${idx + 1}`}
                                            className={idx === 0 ? styles.active : ''}
                                            onError={(e) => {
                                                e.target.src = require('../../../assets/images/img_sach.png');
                                            }}
                                        />
                                    );
                                })}
                                {productImages.length > 3 && (
                                    <div className={styles.moreImages}>
                                        +{productImages.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                        <h1 className={styles.productName}>{displayProduct.name}</h1>
                        
                        <div className={styles.productMeta}>
                            <div className={styles.metaRow}>
                                <span><strong>Nhà xuất bản:</strong> {displayProduct.publisher || '-'}</span>
                                <span><strong>Hình thức bìa:</strong> {displayProduct.coverType || '-'}</span>
                            </div>
                            <div className={styles.authorRow}>
                                <span><strong>Tác giả:</strong> {displayProduct.author || '-'}</span>
                            </div>
                        </div>

                        {/* Rating and Sales */}
                        <div className={styles.ratingSection}>
                            <div className={styles.stars}>
                                {renderStars(displayProduct.averageRating || displayProduct.rating)}
                            </div>
                            <span className={styles.ratingText}>
                                ({displayProduct.reviewCount || 0} đánh giá) . Đã bán {displayProduct.quantitySold || displayProduct.soldCount || 0}
                            </span>
                        </div>

                        {/* Price */}
                        <div className={styles.priceSection}>
                            <div className={styles.currentPrice}>
                                {formatPrice(displayProduct.price)}
                            </div>
                            {displayProduct.originalPrice && displayProduct.originalPrice > displayProduct.price && (
                                <>
                                    <div className={styles.originalPrice}>
                                        {formatPrice(displayProduct.originalPrice)}
                                    </div>
                                    {displayProduct.discount && (
                                        <div className={styles.discount}>
                                            -{displayProduct.discount}%
                                        </div>
                                    )}
                                </>
                            )}
                            <div className={styles.taxNote}>
                                (Giá đã gồm thuế)
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div className={styles.shippingInfo}>
                            <h3>Thông tin vận chuyển</h3>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📍</span>
                                <span>Giao hàng đến: {displayProduct.shippingAddress || 'Toàn quốc'}</span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>🚚</span>
                                <span>{displayProduct.deliveryMethod || 'Giao hàng tiêu chuẩn'}</span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📅</span>
                                <span>Dự kiến giao: {displayProduct.estimatedDelivery || '3-5 ngày làm việc'}</span>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className={styles.quantitySection}>
                            <label>Số lượng:</label>
                            <div className={styles.quantityControls}>
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input 
                                    type="number" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    max={product.stock}
                                />
                                <button 
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    disabled={quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.actionButtons}>
                            <button 
                                className={styles.addToCartBtn}
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                🛒 Thêm vào giỏ hàng
                            </button>
                            <button 
                                className={styles.buyNowBtn}
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                            >
                                Mua ngay
                            </button>
                        </div>

                        {/* Promotional Policies */}
                        <div className={styles.promotionalPolicies}>
                            <h3>Chính sách ưu đãi</h3>
                            <div className={styles.policyItem}>
                                <span className={styles.policyIcon}>🕒</span>
                                <span>Thời gian giao hàng: Giao hàng nhanh và uy tín</span>
                            </div>
                            <div className={styles.policyItem}>
                                <span className={styles.policyIcon}>🔄</span>
                                <span>Đổi trả miễn phí: Đổi trả miễn phí toàn quốc</span>
                            </div>
                            <div className={styles.policyItem}>
                                <span className={styles.policyIcon}>💳</span>
                                <span>Thanh toán tiện lợi: Hỗ trợ nhiều phương thức thanh toán</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Sections */}
                <div className={styles.productDetails}>
                    {/* Detailed Information */}
                    <div className={styles.detailedInfo}>
                        <h3>Thông tin chi tiết</h3>
                        <div className={styles.infoTable}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Mã hàng</span>
                                <span className={styles.infoValue}>{displayProduct.id || displayProduct.productCode || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Tên Nhà Cung Cấp</span>
                                <span className={styles.infoValue}>-</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Tác giả</span>
                                <span className={styles.infoValue}>{displayProduct.author || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Người Dịch</span>
                                <span className={styles.infoValue}>{displayProduct.translator || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>NXB</span>
                                <span className={styles.infoValue}>{displayProduct.publisher || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Năm XB</span>
                                <span className={styles.infoValue}>
                                    {displayProduct.publicationDate 
                                        ? new Date(displayProduct.publicationDate).getFullYear()
                                        : displayProduct.publishYear || '-'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Trọng lượng (gr)</span>
                                <span className={styles.infoValue}>{displayProduct.weight || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Kích Thước Bao Bì</span>
                                <span className={styles.infoValue}>
                                    {displayProduct.length && displayProduct.width && displayProduct.height
                                        ? `${displayProduct.length} × ${displayProduct.width} × ${displayProduct.height} cm`
                                        : displayProduct.dimensions || '-'}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Số trang</span>
                                <span className={styles.infoValue}>{displayProduct.pages || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Hình thức</span>
                                <span className={styles.infoValue}>{displayProduct.format || displayProduct.coverType || '-'}</span>
                            </div>
                            {displayProduct.bestSeller && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Sản phẩm bán chạy nhất</span>
                                    <span className={styles.infoValue}>
                                        <a href="#" className={styles.bestSellerLink}>{displayProduct.bestSeller}</a>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Description */}
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
