import classNames from 'classnames/bind';

import styles from './Home.module.scss';

const cx = classNames.bind(styles);

function Home() {
    return (
        <div className={cx('home-wrapper')}>
            <main className={cx('home-content')}>
                <section className={cx('banner')}>
                    <div className={cx('banner-text')}>
                        <h1>Sài Gòn bao thương</h1>
                        <p>Một góc ký ức về tình người trong đại dịch COVID-19</p>
                        <button>Mua ngay</button>
                    </div>
                    <div className={cx('banner-img')}>
                        <img
                            src="https://via.placeholder.com/250x350"
                            alt="Sách nổi bật"
                        />
                    </div>
                </section>
                <section className={cx('promos')}>
                    <div className={cx('promo-card')}>World Book Day SALE</div>
                    <div className={cx('promo-card')}>Big SALE</div>
                    <div className={cx('promo-card')}>Up to 70% OFF</div>
                </section>
                <section className={cx('hot')}>
                    <h2>Khuyến mãi hot</h2>
                    <div className={cx('hot-list')}>
                        <div className={cx('hot-item')}>Sách A</div>
                        <div className={cx('hot-item')}>Sách B</div>
                        <div className={cx('hot-item')}>Sách C</div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;
