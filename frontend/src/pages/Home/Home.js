import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

import styles from './Home.module.scss';

// Import images
import heroImage from '../../assets/images/img_qc.png';
import promoImage1 from '../../assets/images/img_kinangsong.png';
import promoImage2 from '../../assets/images/img_taichinh.png';
import promoImage3 from '../../assets/images/img_sachgiadinh.png';
import bannerImage1 from '../../assets/images/img_qc.png';
import bannerImage2 from '../../assets/images/img_qc.png';
import bannerImage3 from '../../assets/images/img_qc.png';
import imgsach_test from '../../assets/images/img_sach.png';
import imgsach_tiente from '../../assets/images/img_chinhsachtiente.jpeg';

// Import navigation icons
import iconLeftArrow from '../../assets/icons/icon_leftarrow.png';
import iconRightArrow from '../../assets/icons/icon_rightarrow.png';

const cx = classNames.bind(styles);

function Home() {
    const productsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollPosition = () => {
        if (productsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = productsRef.current;
            
            // Kiểm tra nút trái: hiện khi scrollLeft > 0
            setCanScrollLeft(scrollLeft > 0);
            
            // Kiểm tra nút phải: ẩn khi đã scroll gần hết
            const maxScrollLeft = scrollWidth - clientWidth;
            const canScrollRightValue = scrollLeft < maxScrollLeft - 100;
            
            setCanScrollRight(canScrollRightValue);
        }
    };

    const scrollLeft = () => {
        if (productsRef.current) {
            productsRef.current.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (productsRef.current) {
            productsRef.current.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const container = productsRef.current;
        if (container) {
            // Kiểm tra vị trí ban đầu
            checkScrollPosition();
            
            // Lắng nghe sự kiện scroll
            container.addEventListener('scroll', checkScrollPosition);
            
            // Cleanup
            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
            };
        }
    }, []);
    return (
        <div className={cx('home-wrapper')}>
            <main className={cx('home-content')}>
                {/* Main Content Area - 2 columns layout */}
                <section className={cx('main-content')}>
                    {/* Left Column - Hero Banner (Khung 1) */}
                    <div className={cx('hero-banner')}>
                        <Link to="#" className={cx('hero-link')}>
                            <img src={heroImage} alt="Ảnh quảng cáo" className={cx('hero-image')} />
                        </Link>
                    </div>

                    {/* Right Column - 3 Promo Blocks */}
                    <div className={cx('promo-column')}>
                        {/* Khung 2 */}
                        <div className={cx('promo-block', 'promo-block-1')}>
                            <Link to="#" className={cx('promo-link')}>
                                <img src={promoImage1} alt="Sách kĩ năng sống" className={cx('promo-image')} />
                            </Link>
                        </div>

                        {/* Khung 3 */}
                        <div className={cx('promo-block', 'promo-block-2')}>
                            <Link to="#" className={cx('promo-link')}>
                                <img src={promoImage2} alt="Sách tài chính" className={cx('promo-image')} />
                            </Link>
                        </div>

                        {/* Khung 4 */}
                        <div className={cx('promo-block', 'promo-block-3')}>
                            <Link to="#" className={cx('promo-link')}>
                                <img src={promoImage3} alt="Sách gia đình" className={cx('promo-image')} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Bottom Promotional Banners */}
                <section className={cx('bottom-banners')}>
                    {/* Khung 5 */}
                    <div className={cx('banner-card', 'banner-1')}>
                        <Link to="#" className={cx('banner-link')}>
                            <img src={bannerImage1} alt="Banner image 1" className={cx('banner-image')} />
                        </Link>
                    </div>

                    {/* Khung 6 */}
                    <div className={cx('banner-card', 'banner-2')}>
                        <Link to="#" className={cx('banner-link')}>
                            <img src={bannerImage2} alt="Banner image 2" className={cx('banner-image')} />
                        </Link>
                    </div>

                    {/* Khung 7 */}
                    <div className={cx('banner-card', 'banner-3')}>
                        <Link to="#" className={cx('banner-link')}>
                            <img src={bannerImage3} alt="Banner image 3" className={cx('banner-image')} />
                        </Link>
                    </div>
                </section>

                {/* Hot Promotions Section */}
                <section className={cx('hot-promotions')}>
                    <div className={cx('hot-header')}>
                        <h2 className={cx('hot-title')}>KHUYẾN MÃI HOT</h2>
                    </div>
                    <div className={cx('hot-products-container')}>
                        {canScrollLeft && (
                            <button className={cx('nav-button', 'nav-left')} onClick={scrollLeft}>
                                <img src={iconLeftArrow} alt="Previous" className={cx('nav-icon')} />
                            </button>
                        )}
                        <div className={cx('hot-products')} ref={productsRef}>
                            <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Dầu và Máu - Mohammed Bin Salman Và Tham Vọng Tái Thiết Kinh Tế Ả-Rập" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Dầu và Máu - Mohammed Bin Salman Và Tham Vọng Tái Thiết Kinh Tế Ả-Rập</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_tiente} alt="Chính Sách Tiền Tệ Thế Kỷ 21" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Sao Chúng Ta Lại Ngủ - Why We Sleep</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Người Thầy (Tái Bản)" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Người Thầy (Tái Bản)</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Dế Mèn Phiêu Lưu Ký (Tái Bản 2020)" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Dế Mèn Phiêu Lưu Ký (Tái Bản 2020)</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>


                        <div className={cx('hot-product')}>
                            <Link to="#" className={cx('product-link')}>
                                <img src={imgsach_test} alt="Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi" className={cx('product-image')} />
                                <div className={cx('product-info')}>
                                    <h3 className={cx('product-title')}>Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi</h3>
                                    <div className={cx('product-price')}>
                                        <span className={cx('current-price')}>200.000 ₫</span>
                                        <span className={cx('original-price')}>285.000 ₫</span>
                                        <span className={cx('discount')}>-29%</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        </div>
                        {canScrollRight && (
                            <button className={cx('nav-button', 'nav-right')} onClick={scrollRight}>
                                <img src={iconRightArrow} alt="Next" className={cx('nav-icon')} />
                            </button>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;
