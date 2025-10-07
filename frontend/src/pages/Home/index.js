import { Link, useNavigate } from "react-router-dom";
import React from "react";
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const displayName = typeof window !== 'undefined' ? localStorage.getItem('displayName') : null;
    const [menuOpen, setMenuOpen] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('displayName');
        setMenuOpen(false);
        navigate(0);
    };
    const toggleMenu = () => setMenuOpen((v) => !v);
    return (
        <div>
            <header className="header">
                <div className="logo">LuminaBook</div>
                <div className="search">
                    <input type="text" placeholder="Tìm kiếm theo tên tác phẩm..." />
                    <button>Tìm</button>
                </div>
                <div className="actions">
                    {displayName ? (
                        <div className="user-menu">
                            <button className="user-menu__trigger" onClick={toggleMenu} aria-haspopup="menu" aria-expanded={menuOpen}>
                                <span className="user-menu__name">{displayName}</span>
                                <span className="user-menu__avatar"></span>
                            </button>
                            {menuOpen && (
                                <div className="user-menu__dropdown" role="menu">
                                    <Link to="/account" className="user-menu__item" role="menuitem" onClick={() => setMenuOpen(false)}>Trang cá nhân</Link>
                                    <button className="user-menu__item" role="menuitem" onClick={handleLogout}>Đăng xuất</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="login-link">
                            <i className="fi fi-ss-user"></i> Đăng nhập
                        </Link>
                    )}
                    <span className="cart">
                        <img 
                            src="https://cdn0.iconfinder.com/data/icons/mobile-basic-vol-1/32/Tote_Bag-1024.png" 
                            alt="Cart" />
                    </span>
                </div>
            </header>
            <nav className="navbar">
                <a href="#">TẤT CẢ DANH MỤC</a>
                <a href="#">Khuyến mãi</a>
                <a href="#">Sách mới</a>
                <a href="#">Hỗ trợ khách hàng</a>
                <a href="#">Liên hệ</a>
            </nav>
            <section className="banner">
                <div className="banner-text">
                    <h1>Sài Gòn bao thương</h1>
                    <p>Một góc ký ức về tình người trong đại dịch COVID-19</p>
                    <button>Mua ngay</button>
                </div>
                <div className="banner-img">
                    <img src="https://via.placeholder.com/250x350" alt="Sách nổi bật" />
                </div>
            </section>
            <section className="promos">
                <div className="promo-card">World Book Day SALE</div>
                <div className="promo-card">Big SALE</div>
                <div className="promo-card">Up to 70% OFF</div>
            </section>
            <section className="hot">
                <h2>Khuyến mãi hot</h2>
                <div className="hot-list">
                    <div className="hot-item">Sách A</div>
                    <div className="hot-item">Sách B</div>
                    <div className="hot-item">Sách C</div>
                </div>
            </section>
        </div>
    );
}

export default Home;
