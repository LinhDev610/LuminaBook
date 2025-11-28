import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import newBookStyles from './NewBook.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import Banner1 from '../../components/Common/Banner/Banner1';

// Tái sử dụng mock dữ liệu nhanh từ Home nếu cần, nhưng ở trang thật sẽ lấy API
import imgsach_test from '../../assets/images/img_sach.png';
import heroImage from '../../assets/images/img_qc.png';
import promoImage2 from '../../assets/images/img_taichinh.png';
import promoImage3 from '../../assets/images/img_sachgiadinh.png';
import iconFire from '../../assets/icons/icon_fire.png';
import iconGift from '../../assets/icons/icon_gift.png';
import iconBook from '../../assets/icons/icon_book.png';

const cxHome = classNames.bind(homeStyles);
const cxNewBook = classNames.bind(newBookStyles);

const mockNewBooks = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    title: `Sách mới phát hành #${idx + 1}`,
    image: imgsach_test,
    currentPrice: 200000,
    originalPrice: 285000,
    discount: 29,
}));

const mockUpcomingBooks = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    title: `Sách sắp phát hành #${idx + 1}`,
    image: imgsach_test,
    currentPrice: 200000,
    originalPrice: 285000,
    discount: 20,
}));

export default function NewBookPage() {
    return (
        <div className={cxHome('home-wrapper')}> {/* dùng chung wrapper của Home */}
            <main className={cxHome('home-content')}>
                <Banner1
                    heroImage={heroImage}
                    promos={[
                        { image: imgsach_test, alt: 'Sách kĩ năng sống' },
                        { image: promoImage2, alt: 'Sách tài chính' },
                        { image: promoImage3, alt: 'Sách gia đình' },
                    ]}
                />

                
                <section className={cxHome('trending-section', cxNewBook('newbook-container'))}>
                    <div className={cxNewBook('newbook-header')}>
                        <img src={iconFire} alt="Sách mới" className={cxNewBook('newbook-icon')} />
                        <h3 className={cxNewBook('newbook-title')}>SÁCH MỚI PHÁT HÀNH</h3>
                    </div>
                    <ProductList
                        products={mockNewBooks}
                        title="SÁCH MỚI PHÁT HÀNH"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>
                
                {/* Sách sắp phát hành */}
                <section className={cxHome('trending-section', cxNewBook('newbook-container'))}>
                    <div className={cxNewBook('newbook-header', 'header-orange')}>
                        <img src={iconGift} alt="Sách sắp phát hành" className={cxNewBook('newbook-icon')} />
                        <h3 className={cxNewBook('newbook-title')}>SÁCH SẮP PHÁT HÀNH</h3>
                    </div>
                    <ProductList
                        products={mockUpcomingBooks}
                        title="SÁCH SẮP PHÁT HÀNH"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>

                {/* Sách bán chạy */}
                <section className={cxHome('trending-section', cxNewBook('newbook-container'))}>
                    <div className={cxNewBook('newbook-header', 'header-blue')}>
                        <img src={iconBook} alt="Sách bán chạy" className={cxNewBook('newbook-icon')} />
                        <h3 className={cxNewBook('newbook-title')}>SÁCH BÁN CHẠY</h3>
                    </div>
                    <ProductList
                        products={mockNewBooks}
                        title="SÁCH BÁN CHẠY"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>

                {/* Sách nổi bật */}
                <section className={cxHome('trending-section', cxNewBook('newbook-container'))}>
                    <div className={cxNewBook('newbook-header', 'header-green')}>
                        <img src={iconFire} alt="Sách nổi bật" className={cxNewBook('newbook-icon')} />
                        <h3 className={cxNewBook('newbook-title')}>SÁCH NỔI BẬT</h3>
                    </div>
                    <ProductList
                        products={mockNewBooks}
                        title="SÁCH NỔI BẬT"
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </section>
            </main>
        </div>
    );
}