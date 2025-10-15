import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import homeStyles from '../Home/Home.module.scss';
import promoStyles from './Promotion.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';

// Tái sử dụng mock dữ liệu nhanh từ Home nếu cần, nhưng ở trang thật sẽ lấy API
import imgsach_test from '../../assets/images/img_sach.png';
import heroImage from '../../assets/images/img_qc.png';
import promoImage1 from '../../assets/images/img_kinangsong.png';
import promoImage2 from '../../assets/images/img_taichinh.png';
import promoImage3 from '../../assets/images/img_sachgiadinh.png';
import iconFire from '../../assets/icons/icon_fire.png';
import iconGift from '../../assets/icons/icon_gift.png';
import iconBook from '../../assets/icons/icon_book.png';

const cxHome = classNames.bind(homeStyles);
const cxPromo = classNames.bind(promoStyles);

const mockProducts = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    title: `Sản phẩm khuyến mãi #${idx + 1}`,
    image: imgsach_test,
    currentPrice: 200000,
    originalPrice: 285000,
    discount: 29,
}));

export default function PromotionPage() {
    return (
        <div className={cxHome('home-wrapper')}> {/* dùng chung wrapper của Home */}
            <main className={cxHome('home-content')}>
                {/* Main Content Area - 2 columns layout (reuse from Home) */}
                <section className={cxHome('main-content')}>
                    {/* Left Column - Hero Banner (Khung 1) */}
                    <div className={cxHome('hero-banner')}>
                        <Link to="#" className={cxHome('hero-link')}>
                            <img src={heroImage} alt="Ảnh quảng cáo" className={cxHome('hero-image')} />
                        </Link>
                    </div>

                    {/* Right Column - 3 Promo Blocks */}
                    <div className={cxHome('promo-column')}>
                        {/* Khung 2 */}
                        <div className={cxHome('promo-block', 'promo-block-1')}>
                            <Link to="#" className={cxHome('promo-link')}>
                                <img src={promoImage1} alt="Sách kĩ năng sống" className={cxHome('promo-image')} />
                            </Link>
                        </div>

                        {/* Khung 3 */}
                        <div className={cxHome('promo-block', 'promo-block-2')}>
                            <Link to="#" className={cxHome('promo-link')}>
                                <img src={promoImage2} alt="Sách tài chính" className={cxHome('promo-image')} />
                            </Link>
                        </div>

                        {/* Khung 4 */}
                        <div className={cxHome('promo-block', 'promo-block-3')}>
                            <Link to="#" className={cxHome('promo-link')}>
                                <img src={promoImage3} alt="Sách gia đình" className={cxHome('promo-image')} />
                            </Link>
                        </div>
                    </div>
                </section>

                
                <section className={cxHome('trending-section', cxPromo('promo-container'))}>
                    <div className={cxPromo('promo-header')}>
                        <img src={iconFire} alt="Khuyến mãi" className={cxPromo('promo-icon')} />
                        <h3 className={cxPromo('promo-title')}>KHUYẾN MÃI</h3>
                    </div>
                    <ProductList
                        products={mockProducts}
                        title="KHUYẾN MÃI"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>
                
                {/* Combo ưu đãi - mua nhiều giảm nhiều */}
                <section className={cxHome('trending-section', cxPromo('promo-container'))}>
                    <div className={cxPromo('promo-header', 'header-green')}>
                        <img src={iconGift} alt="Combo ưu đãi" className={cxPromo('promo-icon')} />
                        <h3 className={cxPromo('promo-title')}>COMBO ƯU ĐÃI - MUA NHIỀU GIẢM NHIỀU</h3>
                    </div>
                    <ProductList
                        products={mockProducts}
                        title="COMBO ƯU ĐÃI"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>

                {/* Combo sách giáo khoa */}
                <section className={cxHome('trending-section', cxPromo('promo-container'))}>
                    <div className={cxPromo('promo-header', 'header-blue')}>
                        <img src={iconBook} alt="Sách giáo khoa" className={cxPromo('promo-icon')} />
                        <h3 className={cxPromo('promo-title')}>COMBO SÁCH GIÁO KHOA</h3>
                    </div>
                    <ProductList
                        products={mockProducts}
                        title="COMBO SÁCH GIÁO KHOA"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>
            </main>
        </div>
    );
}

