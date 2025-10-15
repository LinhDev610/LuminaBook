import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

import styles from './Home.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';

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


const cx = classNames.bind(styles);

// Dữ liệu sản phẩm mẫu - sau này sẽ thay thế bằng API call
const mockProducts = [
    {
        id: 1,
        title: "Dầu và Máu - Mohammed Bin Salman Và Tham Vọng Tái Thiết Kinh Tế Ả-Rập",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 2,
        title: "Sao Chúng Ta Lại Ngủ - Why We Sleep",
        image: imgsach_tiente,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 3,
        title: "Người Thầy (Tái Bản)",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 4,
        title: "Dế Mèn Phiêu Lưu Ký (Tái Bản 2020)",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 5,
        title: "Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 6,
        title: "Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 7,
        title: "Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    },
    {
        id: 8,
        title: "Tủ Sách Thanh Niên - Mãi Mãi Tuổi Hai Mươi",
        image: imgsach_test,
        currentPrice: 200000,
        originalPrice: 285000,
        discount: 29
    }
];

function Home() {
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
                <ProductList 
                    products={mockProducts} 
                    title="KHUYẾN MÃI HOT" 
                    showNavigation={true}
                />
            </main>
        </div>
    );
}

export default Home;
