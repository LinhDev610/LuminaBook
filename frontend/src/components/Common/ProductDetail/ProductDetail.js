import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ProductDetail.module.scss';
import { getApiBaseUrl, formatDateTime } from '../../../services/utils';
import { normalizeMediaUrl } from '../../../services/productUtils';
import { getMyInfo, getStoredToken, getReviewsByProduct, createReview, addCartItem, getCart, refreshToken } from '../../../services';
import iconShip from '../../../assets/icons/icon_ship.png';
import iconPay from '../../../assets/icons/icon_pay.png';
import iconRefund from '../../../assets/icons/icon_refund.png';
import iconShoppingCart from '../../../assets/icons/icon_shopping_cart.png';
import imgSach from '../../../assets/images/img_sach.png';
import imgTaiChinh from '../../../assets/images/img_taichinh.png';
import imgSachGiaDinh from '../../../assets/images/img_sachgiadinh.png';
import imgQc from '../../../assets/images/img_qc.png';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../Notification';
import Lightbox from '../Lightbox';

const ProductDetail = ({ productId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [userAddress, setUserAddress] = useState('');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [newNameDisplay, setNewNameDisplay] = useState('');
    const [newComment, setNewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [activeReviewTab, setActiveReviewTab] = useState('latest'); // 'latest' | 'top'
    const [expandedReviews, setExpandedReviews] = useState({});
    const descriptionRef = useRef(null);
    const { openLoginModal, openRegisterModal } = useAuth();
    const { success, error: showError } = useNotification();
    const isLoggedIn = !!getStoredToken('token');
    const redirectPath = `${location.pathname}${location.search || ''}`;
    const openLoginWithRedirect = () => openLoginModal(redirectPath);

    // Khi vào trang chi tiết sản phẩm, luôn đưa viewport về đầu trang
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
    }, [productId]);

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

    useEffect(() => {
        const fetchUserAddress = async () => {
            try {
                const token = getStoredToken('token');
                if (token) {
                    const userInfo = await getMyInfo(token);
                    if (userInfo?.address) {
                        setUserAddress(userInfo.address);
                    }
                }
            } catch (err) {
                console.error('Error fetching user address:', err);
            }
        };
        fetchUserAddress();
    }, []);

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
            imgSach,
            imgTaiChinh,
            imgSachGiaDinh,
            imgQc,
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

    // Tạo danh sách URL media gốc cho Lightbox
    const originalMediaUrls = product?.mediaUrls?.length
        ? product.mediaUrls
        : displayProduct.images || [];

    // Chuẩn hóa URL media thành URL đầy đủ
    const productImages = originalMediaUrls.map((img) =>
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
        product?.stockQuantity ??
        product?.inventory?.quantity ??
        displayProduct.stockQuantity ??
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

    // Rating data dùng chung cho phần đầu và khối đánh giá toàn trang
    const reviewCount =
        reviews.length > 0
            ? reviews.length
            : typeof displayProduct.reviewCount === 'number'
                ? displayProduct.reviewCount
                : 0;

    const averageRating =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
            : typeof displayProduct.averageRating === 'number'
                ? displayProduct.averageRating
                : typeof displayProduct.rating === 'number'
                    ? displayProduct.rating
                    : 0;

    const policyHighlights = [
        {
            icon: iconShip,
            label: 'Thời gian giao hàng:',
            text: 'Giao hàng nhanh và uy tín',
        },
        {
            icon: iconRefund,
            label: 'Đổi trả miễn phí:',
            text: 'Đổi trả miễn phí toàn quốc',
        },
        {
            icon: iconPay,
            label: 'Thanh toán tiện lợi:',
            text: 'Hỗ trợ nhiều phương thức thanh toán',
        },
    ];

    const infoRows = [
        {
            label: 'Mã hàng',
            value: displayProduct.id || displayProduct.productCode || '-',
        },
        { label: 'Tác giả', value: displayProduct.author || '-' },
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
    ];

    // Đã loại bỏ localStorage - chỉ sử dụng dữ liệu từ server

    const formatReviewDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString('vi-VN');
    };

    const sortedReviews = useMemo(() => {
        if (!Array.isArray(reviews)) return [];
        const copy = [...reviews];
        if (activeReviewTab === 'latest') {
            return copy.sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
        }
        // "Đánh giá cao nhất" – chỉ hiển thị các đánh giá 5 sao, ưu tiên mới nhất
        return copy
            .filter((review) => Number(review?.rating) === 5)
            .sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
    }, [reviews, activeReviewTab]);

    // Đồng bộ số lượng với tồn kho
    useEffect(() => {
        if (availableStock && quantity > availableStock) {
            setQuantity(availableStock);
        }
    }, [availableStock]);

    // Lấy danh sách review cho sản phẩm từ server
    useEffect(() => {
        if (!productId) return;

        const fetchReviews = async () => {
            try {
                setLoadingReviews(true);
                const data = await getReviewsByProduct(productId);
                const serverReviews = Array.isArray(data) ? data : [];
                console.log(`Fetched ${serverReviews.length} reviews for product ${productId}`);
                setReviews(serverReviews);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setReviews([]); // Set empty array on error
            } finally {
                setLoadingReviews(false);
            }
        };

        fetchReviews();
    }, [productId]);

    const handleAddToCart = async () => {
        // Kiểm tra đăng nhập
        if (!isLoggedIn) {
            showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
            openLoginWithRedirect();
            return;
        }

        // Kiểm tra productId
        if (!productId) {
            showError('Không tìm thấy thông tin sản phẩm');
            return;
        }

        // Kiểm tra số lượng
        if (quantity <= 0) {
            showError('Số lượng sản phẩm không hợp lệ');
            return;
        }

        // Giới hạn theo tồn kho
        if (availableStock && quantity > availableStock) {
            showError('Số lượng vượt quá tồn kho hiện có');
            setQuantity(availableStock);
            return;
        }

        try {
            const token = getStoredToken('token');

            if (!token) {
                showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
                openLoginWithRedirect();
                return;
            }

            console.log('Adding to cart:', { productId, quantity, hasToken: !!token });
            const { ok, status, data } = await addCartItem(productId, quantity, token);
            console.log('Add to cart API response:', { ok, status, data });

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginWithRedirect();
                } else if (status === 403) {
                    showError('Bạn không có quyền thêm sản phẩm vào giỏ hàng. Vui lòng đăng nhập với tài khoản khách hàng.');
                    openLoginWithRedirect();
                } else if (status === 400 || status === 404) {
                    const errorMessage = data?.message || data?.error || 'Không thể thêm sản phẩm vào giỏ hàng';
                    if (errorMessage.includes('Hết hàng')) {
                        showError('Số lượng vượt quá tồn kho hiện có');
                    } else {
                        showError(errorMessage);
                    }
                } else {
                    const errorMessage = data?.message || data?.error || `Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng (Lỗi: ${status})`;
                    console.error('Add to cart error:', { status, data });
                    showError(errorMessage);
                }
                return;
            }

            // Hiển thị thông báo thành công
            const productName = product?.name || displayProduct?.name || 'sản phẩm';
            success(`Đã thêm ${quantity} "${productName}" vào giỏ hàng thành công!`);

            // Đồng bộ lại số lượng hiển thị trên icon giỏ hàng
            try {
                const { ok: cartOk, data: cartData } = await getCart(token);
                if (cartOk) {
                    const items = cartData?.items || cartData?.cartItems;
                    const count = Array.isArray(items)
                        ? items.length
                        : typeof cartData?.itemCount === 'number'
                            ? cartData.itemCount
                            : 0;
                    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count } }));
                }
            } catch (syncErr) {
                console.warn('Không thể đồng bộ số lượng giỏ hàng sau khi thêm sản phẩm:', syncErr);
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            showError('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
        }
    };

    const handleBuyNow = async () => {
        // Kiểm tra đăng nhập
        if (!isLoggedIn) {
            showError('Vui lòng đăng nhập để mua sản phẩm');
            openLoginWithRedirect();
            return;
        }

        // Kiểm tra productId
        if (!productId) {
            showError('Không tìm thấy thông tin sản phẩm');
            return;
        }

        // Giới hạn theo tồn kho
        if (availableStock && quantity > availableStock) {
            showError('Số lượng vượt quá tồn kho hiện có');
            setQuantity(availableStock);
            return;
        }

        // Chuyển đến trang checkout với thông tin sản phẩm để checkout trực tiếp
        // Không thêm vào giỏ hàng
        navigate('/checkout', {
            state: {
                directCheckout: true,
                productId: productId,
                quantity: quantity,
            },
        });
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!productId || !isLoggedIn || submittingReview) return;

        try {
            setSubmittingReview(true);
            const trimmedName = newNameDisplay.trim();
            const trimmedComment = newComment.trim();
            const payload = {
                nameDisplay: trimmedName || undefined,
                rating: newRating,
                comment: trimmedComment || undefined,
                product: {
                    id: productId,
                },
            };

            const { ok, status, data } = await createReview(payload);
            if (status === 401) {
                showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại để viết đánh giá.');
                setIsReviewModalOpen(false);
                openLoginWithRedirect();
                return;
            }

            // Kiểm tra kết quả từ server
            if (!ok && status >= 400) {
                const errorMessage = data?.message || data?.error || 'Không thể gửi đánh giá';
                showError(`${errorMessage} (Lỗi: ${status})`);
                return;
            }

            // Đóng modal và reset form
            setIsReviewModalOpen(false);
            setNewRating(5);
            setHoverRating(0);
            setNewNameDisplay('');
            setNewComment('');

            // Reload reviews từ server ngay lập tức và retry nếu cần
            const reloadReviews = async (retryCount = 0) => {
                try {
                    setLoadingReviews(true);
                    const refreshedData = await getReviewsByProduct(productId);
                    const refreshedReviews = Array.isArray(refreshedData) ? refreshedData : [];
                    console.log('Reloaded reviews:', refreshedReviews.length, 'reviews');
                    setReviews(refreshedReviews);
                } catch (refreshErr) {
                    console.error('Error refreshing reviews:', refreshErr);
                    // Retry nếu chưa quá 2 lần
                    if (retryCount < 2) {
                        console.log(`Retrying reload reviews (attempt ${retryCount + 1})...`);
                        setTimeout(() => reloadReviews(retryCount + 1), 1000);
                        return;
                    }
                } finally {
                    setLoadingReviews(false);
                }
            };

            // Đợi một chút để đảm bảo database đã commit, sau đó reload
            setTimeout(() => reloadReviews(), 500);

            success('Gửi đánh giá thành công');
        } catch (err) {
            console.error('Error submitting review:', err);
            showError('Có lỗi xảy ra khi gửi đánh giá.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Phân bố đánh giá dùng cho biểu đồ 5 sao → 1 sao
    const ratingDistribution = useMemo(() => {
        const base = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        // Nếu đã có danh sách reviews chi tiết, ưu tiên tính trực tiếp từ đó
        if (Array.isArray(reviews) && reviews.length > 0) {
            reviews.forEach((r) => {
                const star = Math.round(r.rating || 0);
                if (base[star] !== undefined) {
                    base[star] += 1;
                }
            });
            return base;
        }

        // Nếu backend trả về thống kê chi tiết thì ưu tiên dùng
        const raw =
            displayProduct.ratingDistribution ||
            displayProduct.ratingCounts ||
            displayProduct.ratingStats ||
            null;

        if (raw && typeof raw === 'object') {
            [5, 4, 3, 2, 1].forEach((star) => {
                const keyNumber = raw[star];
                const keyString = raw[String(star)];
                base[star] =
                    typeof keyNumber === 'number'
                        ? keyNumber
                        : typeof keyString === 'number'
                            ? keyString
                            : 0;
            });
            return base;
        }

        // Nếu chỉ có averageRating + reviewCount, giả định toàn bộ vote ở mức sao gần nhất
        if (reviewCount > 0 && averageRating > 0) {
            const rounded = Math.round(averageRating);
            if (base[rounded] !== undefined) {
                base[rounded] = reviewCount;
            }
        }

        return base;
    }, [displayProduct, reviewCount, averageRating, reviews]);

    const totalRatingCount = useMemo(
        () => Object.values(ratingDistribution).reduce((sum, v) => sum + v, 0),
        [ratingDistribution],
    );

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
                        <div
                            className={styles.mainImage}
                            onClick={() => {
                                if (originalMediaUrls.length === 0) return;

                                // Tìm index của ảnh hiện tại trong originalMediaUrls
                                const currentImage = selectedImage || heroFallback;
                                let currentIndex = originalMediaUrls.findIndex(
                                    (url) => normalizeMediaUrl(url, API_BASE_URL) === currentImage
                                );

                                // Nếu không tìm thấy, thử tìm trong productImages
                                if (currentIndex < 0) {
                                    const imgIndex = productImages.findIndex(img => img === currentImage);
                                    currentIndex = imgIndex >= 0 ? imgIndex : 0;
                                }

                                setLightboxIndex(currentIndex >= 0 ? currentIndex : 0);
                                setLightboxOpen(true);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
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
                                {productImages.slice(0, 4).map((img, idx) => {
                                    // Find the original index in originalMediaUrls
                                    const originalIndex = originalMediaUrls.findIndex(
                                        (url) => normalizeMediaUrl(url, API_BASE_URL) === img
                                    );
                                    return (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`${displayProduct.name} ${idx + 1}`}
                                            className={
                                                selectedImage === img ? styles.active : ''
                                            }
                                            onClick={() => {
                                                setSelectedImage(img);
                                                setLightboxIndex(originalIndex >= 0 ? originalIndex : idx);
                                                setLightboxOpen(true);
                                            }}
                                            onError={(e) => {
                                                e.target.src = require('../../../assets/images/img_sach.png');
                                            }}
                                        />
                                    );
                                })}
                                {productImages.length > 4 && (
                                    <div
                                        className={styles.moreImages}
                                        onClick={() => {
                                            // Mở lightbox với ảnh đầu tiên chưa hiển thị (index 4)
                                            setLightboxIndex(4);
                                            setLightboxOpen(true);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        +{productImages.length - 4}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Buttons hành động bên trái */}
                        <div className={styles.ctaRow}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={handleAddToCart}
                            >
                                <img
                                    src={iconShoppingCart}
                                    alt="Thêm vào giỏ hàng"
                                    className={styles.cartIcon}
                                />
                                <span>Thêm vào giỏ hàng</span>
                            </button>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={handleBuyNow}
                            >
                                Mua ngay
                            </button>
                        </div>

                        {/* Chính sách ưu đãi bên trái */}
                        <div className={styles.infoCard}>
                            <h3 className={styles.cardTitle}>Chính sách ưu đãi</h3>
                            {policyHighlights.map((item, index) => (
                                <div key={index} className={styles.policyItem}>
                                    <img
                                        src={item.icon}
                                        alt=""
                                        className={styles.policyIcon}
                                    />
                                    <span className={styles.policyLabel}>{item.label}</span>
                                    <span className={styles.policyText}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.productInfo}>
                        <div className={styles.infoCard}>
                            <h1 className={styles.productName}>{displayProduct.name}</h1>

                            <div className={styles.productMeta}>
                                <div>
                                    <strong>Tác giả:</strong> {displayProduct.author || '-'}
                                </div>
                                <div>
                                    <strong>Nhà xuất bản:</strong>{' '}
                                    {displayProduct.publisher || '-'}
                                </div>
                                <div>
                                    <strong>Tồn kho:</strong>{' '}
                                    {availableStock > 0
                                        ? `${availableStock}`
                                        : availableStock === 0
                                            ? 'Hết hàng'
                                            : '-'}
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
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.cardTitle}>Thông tin vận chuyển</h3>
                            <div className={styles.shippingItem}>
                                <span>
                                    Giao hàng đến :{' '}
                                    {userAddress || displayProduct.shippingAddress || 'Toàn quốc'}
                                </span>
                            </div>
                            <div className={styles.shippingItem}>
                                <img src={iconShip} alt="ship" className={styles.shipIcon} />
                                <span className={styles.deliveryMethodBold}>
                                    {displayProduct.deliveryMethod ||
                                        'Giao hàng tiêu chuẩn'}
                                </span>
                            </div>
                            <div className={styles.shippingItem}>
                                <span>
                                    Dự kiến giao :{' '}
                                    {displayProduct.estimatedDelivery ||
                                        '3-5 ngày làm việc'}
                                </span>
                            </div>

                            <div className={styles.quantityDivider}></div>

                            <div className={styles.quantitySection}>
                                <span className={styles.quantityLabel}>Số lượng</span>
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
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.cardTitle}>Thông tin chi tiết</h3>
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

                        <div className={styles.infoCard}>
                            <h3 className={styles.cardTitle}>Mô tả sản phẩm</h3>
                            <h4>{displayProduct.name}</h4>
                            {displayProduct.subtitle && (
                                <p className={styles.subtitle}>{displayProduct.subtitle}</p>
                            )}

                            <div
                                ref={descriptionRef}
                                className={
                                    isDescriptionExpanded
                                        ? `${styles.description} ${styles.descriptionExpanded}`
                                        : styles.description
                                }
                            >
                                <p>{displayProduct.description || '-'}</p>
                                {displayProduct.longDescription && (
                                    <p>{displayProduct.longDescription}</p>
                                )}
                            </div>

                            {(displayProduct.description || displayProduct.longDescription) && (
                                <button
                                    type="button"
                                    className={styles.viewMoreButton}
                                    onClick={() => {
                                        setIsDescriptionExpanded((prev) => !prev);
                                        if (descriptionRef.current) {
                                            descriptionRef.current.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                        }
                                    }}
                                >
                                    {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Khối đánh giá sản phẩm toàn trang */}
                <div className={styles.reviewCard}>
                    <h3 className={styles.cardTitle}>Đánh giá sản phẩm</h3>
                    <div className={styles.reviewContent}>
                        <div className={styles.reviewSummary}>
                            <div className={styles.reviewScore}>
                                <div className={styles.scoreValueRow}>
                                    <div className={styles.scoreValue}>
                                        {reviewCount > 0
                                            ? averageRating.toFixed(1)
                                            : '0'}
                                    </div>
                                    <div className={styles.scoreMax}>/5</div>
                                </div>
                                <div className={styles.scoreStars}>
                                    {renderStars(averageRating)}
                                </div>
                                <div className={styles.scoreCount}>
                                    ({reviewCount} đánh giá)
                                </div>
                            </div>
                            <div className={styles.ratingBars}>
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = ratingDistribution[star] || 0;
                                    const percent =
                                        totalRatingCount > 0
                                            ? Math.round((count / totalRatingCount) * 100)
                                            : 0;

                                    return (
                                        <div key={star} className={styles.ratingBarRow}>
                                            <span>{star} sao</span>
                                            <div className={styles.ratingBarTrack}>
                                                <div
                                                    className={styles.ratingBarFill}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <span className={styles.ratingPercent}>
                                                {percent}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className={styles.reviewAction}>
                            {!isLoggedIn ? (
                                <p className={styles.loginPrompt}>
                                    Vui lòng{' '}
                                    <button
                                        type="button"
                                        className={styles.inlineLink}
                                        onClick={openLoginWithRedirect}
                                    >
                                        đăng nhập
                                    </button>
                                    {' '}
                                    để viết đánh giá.
                                </p>
                            ) : (
                                <div className={styles.writeReviewContainer}>
                                    <button
                                        type="button"
                                        className={styles.writeReviewButton}
                                        onClick={() => setIsReviewModalOpen(true)}
                                    >
                                        Viết đánh giá
                                    </button>
                                    {isReviewModalOpen && (
                                        <div className={styles.reviewModalOverlay}>
                                            <div className={styles.reviewModal}>
                                                <h4>Viết đánh giá sản phẩm</h4>
                                                <form onSubmit={handleSubmitReview}>
                                                    <div className={styles.reviewStarsInput}>
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                className={
                                                                    star <= (hoverRating || newRating)
                                                                        ? styles.starInputActive
                                                                        : styles.starInput
                                                                }
                                                                onClick={() => setNewRating(star)}
                                                                onMouseEnter={() => setHoverRating(star)}
                                                                onMouseLeave={() => setHoverRating(0)}
                                                            >
                                                                ★
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className={styles.reviewNameInput}
                                                        placeholder="Nhập tên hiển thị khi đánh giá"
                                                        value={newNameDisplay}
                                                        onChange={(e) =>
                                                            setNewNameDisplay(e.target.value)
                                                        }
                                                    />
                                                    <textarea
                                                        className={styles.reviewTextarea}
                                                        rows={4}
                                                        placeholder="Nhập nhận xét của bạn về sản phẩm"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                    />
                                                    <div className={styles.reviewModalActions}>
                                                        <button
                                                            type="button"
                                                            className={styles.reviewCancelBtn}
                                                            onClick={() => {
                                                                setIsReviewModalOpen(false);
                                                                setHoverRating(0);
                                                            }}
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className={styles.reviewSubmitBtn}
                                                            disabled={submittingReview}
                                                        >
                                                            {submittingReview ? 'Đang gửi...' : 'Gửi nhận xét'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách đánh giá chi tiết */}
                    <div className={styles.reviewListWrapper}>
                        <div className={styles.reviewTabs}>
                            <button
                                type="button"
                                className={
                                    activeReviewTab === 'latest'
                                        ? `${styles.reviewTab} ${styles.reviewTabActive}`
                                        : styles.reviewTab
                                }
                                onClick={() => setActiveReviewTab('latest')}
                            >
                                Mới nhất
                            </button>
                            <button
                                type="button"
                                className={
                                    activeReviewTab === 'top'
                                        ? `${styles.reviewTab} ${styles.reviewTabActive}`
                                        : styles.reviewTab
                                }
                                onClick={() => setActiveReviewTab('top')}
                            >
                                Đánh giá cao nhất
                            </button>
                        </div>

                        {loadingReviews ? (
                            <div className={styles.loadingReviews}>Đang tải đánh giá...</div>
                        ) : sortedReviews.length === 0 ? (
                            <p className={styles.noReviewText}>
                                Chưa có đánh giá cho sản phẩm này.
                            </p>
                        ) : (
                            sortedReviews.map((review) => {
                                const id = review.id || `${review.userId}-${review.createdAt}`;
                                const fullComment = review.comment || '';
                                const maxLength = 260;
                                const isLong = fullComment.length > maxLength;
                                const isExpanded = !!expandedReviews[id];
                                const displayComment =
                                    !isLong || isExpanded
                                        ? fullComment
                                        : `${fullComment.slice(0, maxLength)}...`;

                                // Xử lý tên hiển thị: ưu tiên nameDisplay, sau đó userName, cuối cùng là "Người dùng ẩn danh"
                                const displayName = (() => {
                                    const nameDisplay = review.nameDisplay?.trim();
                                    if (nameDisplay) return nameDisplay;
                                    const userName = review.userName?.trim();
                                    if (userName) return userName;
                                    return 'Người dùng ẩn danh';
                                })();

                                // Đảm bảo rating luôn có giá trị hợp lệ
                                const reviewRating = review.rating !== undefined && review.rating !== null
                                    ? Number(review.rating)
                                    : 0;

                                return (
                                    <div key={id} className={styles.reviewItem}>
                                        <div className={styles.reviewItemHeader}>
                                            <div className={styles.reviewerName}>
                                                {displayName}
                                            </div>
                                            <div className={styles.reviewDate}>
                                                {formatReviewDate(review.createdAt)}
                                            </div>
                                        </div>
                                        <div className={styles.reviewStarsRow}>
                                            {renderStars(reviewRating)}
                                        </div>
                                        {fullComment && fullComment.trim() && (
                                            <div className={styles.reviewComment}>
                                                <p>{displayComment}</p>
                                                {isLong && (
                                                    <button
                                                        type="button"
                                                        className={styles.moreLink}
                                                        onClick={() =>
                                                            setExpandedReviews((prev) => ({
                                                                ...prev,
                                                                [id]: !isExpanded,
                                                            }))
                                                        }
                                                    >
                                                        {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {review.reply && review.reply.trim() && (
                                            <div className={styles.reviewReply}>
                                                <div className={styles.replyHeader}>
                                                    <span className={styles.replyLabel}>Phản hồi từ cửa hàng:</span>
                                                    {review.replyAt && (
                                                        <span className={styles.replyDate}>
                                                            {formatReviewDate(review.replyAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={styles.replyText}>{review.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <Lightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                mediaUrls={originalMediaUrls}
                currentIndex={lightboxIndex}
                onIndexChange={setLightboxIndex}
                title={displayProduct.name}
                normalizeUrl={(url) => normalizeMediaUrl(url, API_BASE_URL)}
            />
        </div>
    );
};

export default ProductDetail;
