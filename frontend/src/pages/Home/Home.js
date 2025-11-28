import classNames from 'classnames/bind';
import { useState, useEffect, useLayoutEffect } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import AdminRedirectHandler from '../../components/AdminRedirectHandler';


import styles from './Home.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import { getApiBaseUrl } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';

// Import images
import heroImage from '../../assets/images/img_qc.png';
import Banner1 from '../../components/Common/Banner/Banner1';
import promoImage2 from '../../assets/images/img_taichinh.png';
import promoImage3 from '../../assets/images/img_sachgiadinh.png';
import bannerImage1 from '../../assets/images/img_qc.png';
import bannerImage2 from '../../assets/images/img_qc.png';
import bannerImage3 from '../../assets/images/img_qc.png';
import Banner2 from '../../components/Common/Banner/Banner2';
import imgsach_test from '../../assets/images/img_sach.png';
import bgTetOngTrang from '../../assets/images/img_tetongtrang.png';
// service icons
import iconGiaoHang from '../../assets/icons/icon_giaohangtannoi.png';
import iconDoiTra from '../../assets/icons/icon_doitrahang.png';
import iconThanhToan from '../../assets/icons/icon_thanhtoanantoan.png';
import iconHoTro from '../../assets/icons/icon_hotro247.png';
import iconKhuyenMai from '../../assets/icons/icon_khuyenmaihapdan.png';


const cx = classNames.bind(styles);

const PRODUCT_IMAGE_FALLBACK = imgsach_test;

const mapProductToCard = (product, apiBaseUrl) => {
    if (!product) return null;
    const rawMedia =
        product.defaultMediaUrl ||
        (Array.isArray(product.mediaUrls) && product.mediaUrls.length > 0
            ? product.mediaUrls[0]
            : '');
    const imageUrl = normalizeMediaUrl(rawMedia, apiBaseUrl) || PRODUCT_IMAGE_FALLBACK;
    const price = typeof product.price === 'number' ? product.price : null;
    const unitPrice = typeof product.unitPrice === 'number' ? product.unitPrice : null;
    const originalPriceField =
        typeof product.originalPrice === 'number' ? product.originalPrice : null;
    const discountValue = typeof product.discountValue === 'number' ? product.discountValue : 0;
    const discountPercent = typeof product.discount === 'number' ? product.discount : null;

    const currentPrice = price ?? unitPrice ?? 0;
    const originalPrice = originalPriceField ?? unitPrice ?? currentPrice;

    const percentToApply =
        discountPercent != null && Number.isFinite(discountPercent)
            ? Math.min(99, Math.max(0, discountPercent))
            : null;

    const amountToApply =
        percentToApply != null && originalPrice > 0
            ? Math.round((percentToApply / 100) * originalPrice)
            : originalPrice > currentPrice && originalPrice > 0
                ? originalPrice - currentPrice
                : discountValue;

    const discountedPrice =
        percentToApply != null
            ? Math.max(originalPrice - amountToApply, 0)
            : originalPrice > currentPrice && currentPrice > 0
                ? currentPrice
                : originalPrice > 0 && discountValue > 0
                    ? Math.max(originalPrice - discountValue, 0)
                    : currentPrice;

    const computedDiscount =
        percentToApply != null
            ? percentToApply
            : originalPrice > 0 && (originalPrice - discountedPrice) > 0
                ? Math.min(
                    99,
                    Math.max(
                        0,
                        Math.round(((originalPrice - discountedPrice) / originalPrice) * 100),
                    ),
                )
                : 0;

    return {
        id: product.id,
        title: product.name || 'Sản phẩm',
        image: imageUrl,
        currentPrice: discountedPrice ?? originalPrice ?? 0,
        originalPrice: originalPrice || discountedPrice || 0,
        discount: computedDiscount,
        averageRating: typeof product.averageRating === 'number' ? product.averageRating : 0,
        quantitySold: typeof product.quantitySold === 'number' ? product.quantitySold : 0,
        updatedAt: product.updatedAt || product.createdAt || null,
    };
};

function Home() {
    const [token] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');
    const hasToken = token || sessionToken;
    
    // Luôn bắt đầu với checking nếu có token để tránh flash
    const [isChecking, setIsChecking] = useState(() => {
        const tokenCheck = token || sessionStorage.getItem('token');
        return !!tokenCheck;
    });
    const [homeProducts, setHomeProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState('');

    useLayoutEffect(() => {
        // Sync check ngay trước khi paint
        if (!hasToken) {
            // Không có token, đảm bảo xóa flag và không check
            sessionStorage.removeItem('_checking_role');
            setIsChecking(false);
            return;
        }

        // Đợi AdminRedirectHandler set flag (có thể mất vài ms)
        const initialCheck = sessionStorage.getItem('_checking_role') === '1';
        if (initialCheck) {
            setIsChecking(true);
        }
    }, [hasToken, token, sessionToken]);

    useEffect(() => {
        if (!hasToken) {
            // Không có token, reset checking ngay
            setIsChecking(false);
            sessionStorage.removeItem('_checking_role');
            return;
        }

        // Monitor flag cho đến khi check xong
        let mounted = true;
        const checkInterval = setInterval(() => {
            if (!mounted) return;
            
            // Kiểm tra lại token mỗi lần (để phát hiện logout)
            const currentToken = token || sessionStorage.getItem('token');
            if (!currentToken) {
                // Token đã bị xóa (logout), reset ngay
                sessionStorage.removeItem('_checking_role');
                setIsChecking(false);
                clearInterval(checkInterval);
                return;
            }
            
            const checking = sessionStorage.getItem('_checking_role') === '1';
            if (checking) {
                setIsChecking(true);
            } else {
                // Flag đã xóa, check xong - đợi một chút để đảm bảo redirect đã xảy ra
                setTimeout(() => {
                    if (mounted) {
                        setIsChecking(false);
                        clearInterval(checkInterval);
                    }
                }, 150);
            }
        }, 20); // Check rất nhanh

        // Safety timeout
        const timeout = setTimeout(() => {
            if (mounted) {
                setIsChecking(false);
                clearInterval(checkInterval);
            }
        }, 800);

        return () => {
            mounted = false;
            clearInterval(checkInterval);
            clearTimeout(timeout);
        };
    }, [hasToken, token]);

    const API_BASE_URL = getApiBaseUrl();
    const [activeBannerImages, setActiveBannerImages] = useState([]);

    useEffect(() => {
        let canceled = false;
        const fetchActiveBanners = async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/banners/active`);
                const data = await resp.json();
                if (!resp.ok) return;
                const images = (data?.result || [])
                    .filter((b) => b?.imageUrl)
                    .map((b) => normalizeMediaUrl(b.imageUrl, API_BASE_URL));
                if (!canceled) setActiveBannerImages(images);
            } catch (e) {
                // silent fail for public home
            }
        };
        fetchActiveBanners();
        return () => {
            canceled = true;
        };
    }, [API_BASE_URL]);

    useEffect(() => {
        let canceled = false;
        const fetchActiveProducts = async () => {
            setProductLoading(true);
            setProductError('');
            try {
                const resp = await fetch(`${API_BASE_URL}/products/active`);
                const data = await resp.json().catch(() => ({}));
                if (canceled) return;

                if (!resp.ok) {
                    throw new Error(data?.message || 'Không thể tải sản phẩm thực tế');
                }

                const rawProducts = Array.isArray(data?.result)
                    ? data.result
                    : Array.isArray(data)
                        ? data
                        : [];

                const normalizedProducts = rawProducts
                    .map((product) => mapProductToCard(product, API_BASE_URL))
                    .filter(Boolean);

                setHomeProducts(normalizedProducts);
            } catch (error) {
                if (!canceled) {
                    setHomeProducts([]);
                    setProductError(error?.message || 'Không thể tải sản phẩm thực tế');
                }
            } finally {
                if (!canceled) {
                    setProductLoading(false);
                }
            }
        };

        fetchActiveProducts();

        return () => {
            canceled = true;
        };
    }, [API_BASE_URL]);

    const allProducts = homeProducts;

    const sortAndSlice = (products, accessor, limit = 10) => {
        if (!products.length) return [];
        return [...products]
            .sort((a, b) => {
                const aVal = accessor(a) ?? 0;
                const bVal = accessor(b) ?? 0;
                return bVal - aVal;
            })
            .slice(0, Math.min(limit, products.length));
    };

    // Sách yêu thích: chỉ lấy những sách có đánh giá trung bình ~ 5*
    const favoriteProducts = sortAndSlice(
        allProducts.filter((p) => (p.averageRating ?? 0) >= 4.9),
        (p) => p.quantitySold || 0,
    );
    const bestSellerProducts = sortAndSlice(allProducts, (p) => p.quantitySold || 0);
    // Sách mới: 10 cuốn mới nhất dựa trên updatedAt / createdAt
    const newestProducts = sortAndSlice(
        allProducts,
        (p) => (p.updatedAt ? new Date(p.updatedAt).getTime() : 0),
        10,
    );

    return (
        <div className={cx('home-wrapper')}>
            <AdminRedirectHandler />
            {!isChecking && (
                <main className={cx('home-content')}>
                {/* Main Content Area - 2 columns layout */}
                <Banner1
                    heroImages={activeBannerImages.length ? activeBannerImages : [heroImage]}
                    promos={[
                        { image: imgsach_test, alt: 'Sách kĩ năng sống' },
                        { image: promoImage2, alt: 'Sách tài chính' },
                        { image: promoImage3, alt: 'Sách gia đình' },
                    ]}
                />

                
                {/* Bottom Promotional Banners */}
                <Banner2
                    items={[
                        { image: bannerImage1, alt: 'Banner image 1', variant: 1 },
                        { image: bannerImage2, alt: 'Banner image 2', variant: 2 },
                        { image: bannerImage3, alt: 'Banner image 3', variant: 3 },
                    ]}
                />

                {productLoading && (
                    <div className={cx('api-notice')}>Đang tải sản phẩm thực tế...</div>
                )}
                {!productLoading && productError && (
                    <div className={cx('api-notice', 'error')}>{productError}</div>
                )}

                {/* Hot Promotions Section */}
                <ProductList 
                    products={allProducts} 
                    title="KHUYẾN MÃI HOT" 
                    showNavigation={true}
                />

                {/* Mid-Autumn Promo Section (new) */}
                <section
                    className={cx('mid-autumn-section')}
                    style={{ backgroundImage: `url(${bgTetOngTrang})` }}
                >
                    <div className={cx('mid-autumn-overlay')} />
                    <div className={cx('mid-autumn-products')}>
                        <div className={cx('mid-autumn-header')}>
                            
                        </div>
                        <ProductList 
                            products={allProducts}
                            title="Tết ông trăng"
                            showNavigation={true}
                            showHeader={false}
                            minimal={true}
                        />
                    </div>
                </section>

                {/* Trending Section */}
                <section className={cx('trending-section')}>
                    <div className={cx('trending-header')}>
                        <h3 className={cx('trending-title')}>SÁCH YÊU THÍCH</h3>
                    </div>
                    <ProductList
                        products={favoriteProducts}
                        title="SÁCH YÊU THÍCH"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>

                

                {/* Trending Section */}
                <section className={cx('trending-section')}>
                    <div className={cx('trending-header')}>
                        <h3 className={cx('trending-title')}>SÁCH BÁN CHẠY</h3>
                    </div>
                    <ProductList
                        products={bestSellerProducts}
                        title="SÁCH BÁN CHẠY"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>


                <section className={cx('trending-section')}>
                    <div className={cx('trending-header')}>
                        <h3 className={cx('trending-title')}>SÁCH MỚI</h3>
                    </div>
                    <ProductList
                        products={newestProducts}
                        title="SÁCH MỚI"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>



                {/* Service Highlights Row */}
                <section className={cx('service-row')}>
                    <div className={cx('service-grid')}>
                        <div className={cx('service-item')}>
                            <img className={cx('service-icon')} src={iconGiaoHang} alt="Giao hàng tận nơi" />
                            <div className={cx('service-text')}>
                                <div className={cx('service-title')}>Giao hàng tận nơi</div>
                                <div className={cx('service-desc')}>Dành cho tất cả đơn hàng</div>
                            </div>
                        </div>
                        <div className={cx('service-item')}>
                            <img className={cx('service-icon')} src={iconDoiTra} alt="Đổi trả hàng 90 ngày trở lại" />
                            <div className={cx('service-text')}>
                                <div className={cx('service-title')}>Đổi trả hàng 90 ngày trở lại</div>
                                <div className={cx('service-desc')}>Nếu hàng hóa có vấn đề</div>
                            </div>
                        </div>
                        <div className={cx('service-item')}>
                            <img className={cx('service-icon')} src={iconThanhToan} alt="Thanh toán an toàn" />
                            <div className={cx('service-text')}>
                                <div className={cx('service-title')}>Thanh toán an toàn</div>
                                <div className={cx('service-desc')}>100% thanh toán an toàn</div>
                            </div>
                        </div>
                        <div className={cx('service-item')}>
                            <img className={cx('service-icon')} src={iconHoTro} alt="Hỗ trợ 24/7" />
                            <div className={cx('service-text')}>
                                <div className={cx('service-title')}>Hỗ trợ 24/7</div>
                                <div className={cx('service-desc')}>Hỗ trợ khách hàng 24/7</div>
                            </div>
                        </div>
                        <div className={cx('service-item')}>
                            <img className={cx('service-icon')} src={iconKhuyenMai} alt="Khuyến mãi hấp dẫn" />
                            <div className={cx('service-text')}>
                                <div className={cx('service-title')}>Khuyến mãi hấp dẫn</div>
                                <div className={cx('service-desc')}>Chương trình khuyến mãi hấp dẫn</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Solid blue bar like header (no content) */}
                <div className={cx('home-bottom-bar')}></div>
                </main>
            )}
        </div>
    );
}

export default Home;
