import { Link, useNavigate } from "react-router-dom";
import React from "react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import useLocalStorage from "../../hooks/useLocalStorage";
import styles from './Home.module.scss';

function Home() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [menuOpen, setMenuOpen] = React.useState(false);

    const handleLogout = () => {
        removeToken();
        removeDisplayName();
        setMenuOpen(false);
        navigate(0);
    };
    const toggleMenu = () => setMenuOpen((v) => !v);
    return (
        <div className={styles['home-wrapper']}>
            <Header />
            <nav className={styles.navbar}>
                <Link to="#">TẤT CẢ DANH MỤC</Link>
                <Link to="#">Khuyến mãi</Link>
                <Link to="#">Sách mới</Link>
                <Link to="#">Hỗ trợ khách hàng</Link>
                <Link to="#">Liên hệ</Link>
            </nav>
            <main className={styles['home-content']}>
                <section className={styles.banner}>
                    <div className={styles['banner-text']}>
                        <h1>Sài Gòn bao thương</h1>
                        <p>Một góc ký ức về tình người trong đại dịch COVID-19</p>
                        <button>Mua ngay</button>
                    </div>
                    <div className={styles['banner-img']}>
                        <img src="https://via.placeholder.com/250x350" alt="Sách nổi bật" />
                    </div>
                </section>
                <section className={styles.promos}>
                    <div className={styles['promo-card']}>World Book Day SALE</div>
                    <div className={styles['promo-card']}>Big SALE</div>
                    <div className={styles['promo-card']}>Up to 70% OFF</div>
                </section>
                <section className={styles.hot}>
                    <h2>Khuyến mãi hot</h2>
                    <div className={styles['hot-list']}>
                        <div className={styles['hot-item']}>Sách A</div>
                        <div className={styles['hot-item']}>Sách B</div>
                        <div className={styles['hot-item']}>Sách C</div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Home;
