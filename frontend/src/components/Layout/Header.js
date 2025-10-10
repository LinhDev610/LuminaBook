import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import logoIcon from '../../assets/icons/logo_luminabook.png';
import useLocalStorage from '../../hooks/useLocalStorage';
import styles from './Header.module.scss';

export default function Header() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const toggleMenu = () => setMenuOpen(v => !v);
    const handleLogout = () => { 
        removeToken(); 
        removeDisplayName(); 
        setMenuOpen(false); 
        navigate(0); 
    };

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link to="/">
                    <img src={logoIcon} alt="LuminaBook" className={styles['logo-image']} />
                </Link>
            </div>
            <div className={styles.search}>
                <input type="text" placeholder="Tìm kiếm theo tên tác phẩm,…" />
                <button>Tim</button>
            </div>
            <div className={styles.actions}>
                {displayName ? (
                    <div className={styles['user-menu']}>
                        <button className={styles['user-menu__trigger']} onClick={toggleMenu} aria-haspopup="menu" aria-expanded={menuOpen}>
                            <span className={styles['user-menu__name']}>{displayName}</span>
                            <span className={styles['user-menu__avatar']}></span>
                        </button>
                        {menuOpen && (
                            <div className={styles['user-menu__dropdown']} role="menu">
                                <Link to="/account" className={styles['user-menu__item']} role="menuitem" onClick={() => setMenuOpen(false)}>Trang cá nhân</Link>
                                <button className={styles['user-menu__item']} role="menuitem" onClick={handleLogout}>Đăng xuất</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className={styles['login-link']}>
                        <i className="fi fi-ss-user"></i> Đăng nhập
                    </Link>
                )}
                <span className={styles.cart}>
                    <img src="https://cdn0.iconfinder.com/data/icons/mobile-basic-vol-1/32/Tote_Bag-1024.png" alt="Cart" />
                </span>
            </div>
        </header>
    );
}
