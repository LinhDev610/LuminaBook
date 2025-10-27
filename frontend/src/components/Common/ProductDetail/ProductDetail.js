import React, { useState } from 'react';
import styles from './ProductDetail.module.scss';

const ProductDetail = ({ productId }) => {
    // Dữ liệu mẫu sản phẩm theo thiết kế trong hình
    const [product] = useState({
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
    });

    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        // TODO: Implement add to cart functionality
        console.log(`Added ${quantity} of ${product.name} to cart`);
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        // TODO: Implement buy now functionality
        console.log(`Buy now: ${quantity} of ${product.name}`);
        alert('Chuyển đến trang thanh toán!');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const renderStars = (rating) => {
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

    return (
        <div className={styles.productDetail}>
            <div className={styles.container}>
                {/* Header Breadcrumb */}
                <div className={styles.headerBreadcrumb}>
                    <span className={styles.categoryHeader}>{product.category}</span>
                </div>

                <div className={styles.productContent}>
                    {/* Product Images */}
                    <div className={styles.productImages}>
                        <div className={styles.mainImage}>
                            <img 
                                src={require('../../../assets/images/img_kinangsong.png')}
                                alt={product.name}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                        </div>
                        <div className={styles.thumbnailImages}>
                            <img
                                src={require('../../../assets/images/img_kinangsong.png')}
                                alt={`${product.name} 1`}
                                className={styles.active}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                            <img
                                src={require('../../../assets/images/img_kinangsong.png')}
                                alt={`${product.name} 2`}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                            <img
                                src={require('../../../assets/images/img_kinangsong.png')}
                                alt={`${product.name} 3`}
                                onError={(e) => {
                                    e.target.src = require('../../../assets/images/img_sach.png');
                                }}
                            />
                            <div className={styles.moreImages}>
                                +2
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className={styles.productInfo}>
                        <h1 className={styles.productName}>{product.name}</h1>
                        
                        <div className={styles.productMeta}>
                            <div className={styles.metaRow}>
                                <span><strong>Nhà xuất bản:</strong> {product.publisher}</span>
                                <span><strong>Hình thức bìa:</strong> {product.coverType}</span>
                            </div>
                            <div className={styles.authorRow}>
                                <span><strong>Tác giả:</strong> {product.author}</span>
                            </div>
                        </div>

                        {/* Rating and Sales */}
                        <div className={styles.ratingSection}>
                            <div className={styles.stars}>
                                {renderStars(product.rating)}
                            </div>
                            <span className={styles.ratingText}>
                                ({product.reviewCount} đánh giá) . Đã bán {product.soldCount}
                            </span>
                        </div>

                        {/* Price */}
                        <div className={styles.priceSection}>
                            <div className={styles.currentPrice}>
                                {formatPrice(product.price)}
                            </div>
                            <div className={styles.originalPrice}>
                                {formatPrice(product.originalPrice)}
                            </div>
                            <div className={styles.discount}>
                                -{product.discount}%
                            </div>
                            <div className={styles.taxNote}>
                                (Giá đã gồm thuế)
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div className={styles.shippingInfo}>
                            <h3>Thông tin vận chuyển</h3>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📍</span>
                                <span>Giao hàng đến: {product.shippingAddress}</span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>🚚</span>
                                <span>{product.deliveryMethod}</span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span className={styles.shippingIcon}>📅</span>
                                <span>Dự kiến giao: {product.estimatedDelivery}</span>
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
                                <span className={styles.infoValue}>{product.productCode}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Tên Nhà Cung Cấp</span>
                                <span className={styles.infoValue}></span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Tác giả</span>
                                <span className={styles.infoValue}>{product.author}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Người Dịch</span>
                                <span className={styles.infoValue}>{product.translator}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>NXB</span>
                                <span className={styles.infoValue}>{product.publisher}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Năm XB</span>
                                <span className={styles.infoValue}>{product.publishYear}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Trọng lượng (gr)</span>
                                <span className={styles.infoValue}>{product.weight}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Kích Thước Bao Bì</span>
                                <span className={styles.infoValue}>{product.dimensions}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Số trang</span>
                                <span className={styles.infoValue}>{product.pages}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Hình thức</span>
                                <span className={styles.infoValue}>{product.format}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Sản phẩm bán chạy nhất</span>
                                <span className={styles.infoValue}>
                                    <a href="#" className={styles.bestSellerLink}>{product.bestSeller}</a>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className={styles.productDescription}>
                        <h3>Mô tả sản phẩm</h3>
                        <h4>{product.name}</h4>
                        <p className={styles.subtitle}>{product.subtitle}</p>
                        <p>{product.description}</p>
                        <p>{product.longDescription}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
