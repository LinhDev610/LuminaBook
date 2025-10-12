import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import logoIcon from '../../../../assets/icons/logo_luminabook.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { useAuth } from '../../../../contexts/AuthContext';

import styles from './DefaultHeader.module.scss';

const cx = classNames.bind(styles);

function DefaultHeader() {
    const navigate = useNavigate();
    const { openLoginModal, openRegisterModal, openForgotPasswordModal } = useAuth();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage('refreshToken', null);
    const [savedEmail, setSavedEmail, removeSavedEmail] = useLocalStorage('savedEmail', null);
    
    // Check for token in both localStorage and sessionStorage
    const currentToken = token || sessionStorage.getItem('token');
    const isLoggedIn = !!currentToken;
    const [menuOpen, setMenuOpen] = useState(false);
    
    const toggleMenu = () => setMenuOpen((v) => !v);
    const handleLogout = () => {
        removeToken();
        removeRefreshToken();
        removeDisplayName();
        // Clear sessionStorage
        sessionStorage.removeItem('token');
        // Don't remove savedEmail - keep it for next login
        setMenuOpen(false);
        navigate(0);
    };

    return (
        <div>
            <header className={cx('header')}>
                <div className={cx('logo')}>
                    <Link to="/">
                        <img
                            src={logoIcon}
                            alt="LuminaBook"
                            className={cx('logo-image')}
                        />
                    </Link>
                </div>
                <div className={cx('search')}>
                    <input type="text" placeholder="Tìm kiếm theo tên tác phẩm,…" />
                    <button>Tim</button>
                </div>
                <div className={cx('actions')}>
                    {isLoggedIn && displayName ? (
                        <div className={cx('user-menu')}>
                            <button
                                className={cx('user-menu__trigger')}
                                onClick={toggleMenu}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                <span className={cx('user-menu__name')}>
                                    {displayName}
                                </span>
                                <span className={cx('user-menu__avatar')}></span>
                            </button>
                            {menuOpen && (
                                <div className={cx('user-menu__dropdown')} role="menu">
                                    <Link
                                        to="/account"
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Trang cá nhân
                                    </Link>
                                    <button
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={handleLogout}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cx('auth-buttons')} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button 
                                onClick={openLoginModal} 
                                className={cx('login-link')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                            >
                                <i className={cx('fi fi-ss-user')}></i> Đăng nhập
                            </button>

                        </div>
                    )}
                    <span className={cx('cart')}>
                        <img
                            src="https://cdn0.iconfinder.com/data/icons/mobile-basic-vol-1/32/Tote_Bag-1024.png"
                            alt="Cart"
                        />
                    </span>
                </div>
            </header>
        </div>
    );
}

export default DefaultHeader;
