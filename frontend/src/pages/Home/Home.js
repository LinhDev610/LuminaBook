import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

import styles from './Home.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';

// Import images
import heroImage from '../../assets/images/img_qc.png';
import Banner1 from '../../components/Common/Banner/Banner1';
import promoImage1 from '../../assets/images/img_kinangsong.png';
import promoImage2 from '../../assets/images/img_taichinh.png';
import promoImage3 from '../../assets/images/img_sachgiadinh.png';
import bannerImage1 from '../../assets/images/img_qc.png';
import bannerImage2 from '../../assets/images/img_qc.png';
import bannerImage3 from '../../assets/images/img_qc.png';
import Banner2 from '../../components/Common/Banner/Banner2';
import imgsach_test from '../../assets/images/img_sach.png';
import imgsach_tiente from '../../assets/images/img_chinhsachtiente.jpeg';
import bgTetOngTrang from '../../assets/images/img_tetongtrang.png';
// service icons
import iconGiaoHang from '../../assets/icons/icon_giaohangtannoi.png';
import iconDoiTra from '../../assets/icons/icon_doitrahang.png';
import iconThanhToan from '../../assets/icons/icon_thanhtoanantoan.png';
import iconHoTro from '../../assets/icons/icon_hotro247.png';
import iconKhuyenMai from '../../assets/icons/icon_khuyenmaihapdan.png';


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
                <Banner1
                    heroImage={heroImage}
                    promos={[
                        { image: promoImage1, alt: 'Sách kĩ năng sống' },
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

                {/* Hot Promotions Section */}
                <ProductList 
                    products={mockProducts} 
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
                            products={mockProducts.slice(0, 5)}
                            title="Tết ông trăng"
                            showNavigation={false}
                            showHeader={false}
                            minimal={true}
                            isGrid={true}
                            gridColumns={5}
                        />
                    </div>
                </section>

                {/* Trending Section */}
                <section className={cx('trending-section')}>
                    <div className={cx('trending-header')}>
                        <h3 className={cx('trending-title')}>SÁCH THỊNH HÀNH</h3>
                    </div>
                    <ProductList
                        products={mockProducts}
                        title="SÁCH THỊNH HÀNH"
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
                        products={mockProducts}
                        title="SÁCH BÁN CHẠY"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>


                <section className={cx('trending-section')}>
                    <div className={cx('trending-header')}>
                        <h3 className={cx('trending-title')}>COMBO SÁCH HOT</h3>
                    </div>
                    <ProductList
                        products={mockProducts}
                        title="SÁCH BÁN CHẠY"
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
        </div>
    );
}

export default Home;
