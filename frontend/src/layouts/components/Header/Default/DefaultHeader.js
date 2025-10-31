import config from '../../../../config/';
import routes from '../../../../config/routes';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import logoIcon from '../../../../assets/icons/logo_luminabook.png';
import guestIcon from '../../../../assets/icons/icon_guest.png';
import ringIcon from '../../../../assets/icons/icon_ring.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { useAuth } from '../../../../contexts/AuthContext';

import styles from './DefaultHeader.module.scss';

const cx = classNames.bind(styles);

function DefaultHeader() {
    const customerAccount = routes?.customerAccount || '/customer-account';

    const navigate = useNavigate();
    const { openLoginModal, openRegisterModal, openForgotPasswordModal } = useAuth();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage(
        'refreshToken',
        null,
    );
    const [savedEmail, setSavedEmail, removeSavedEmail] = useLocalStorage(
        'savedEmail',
        null,
    );

    // Check for token in both localStorage and sessionStorage
    const currentToken = token || sessionStorage.getItem('token');
    const isLoggedIn = !!currentToken;
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // Keep a local mirror of displayName to avoid force-update loops
    const initialDisplayName = (() => {
        try {
            const val = localStorage.getItem('displayName');
            return val ? JSON.parse(val) : displayName;
        } catch (_e) {
            return displayName;
        }
    })();
    const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName);

    // Sync displayName from localStorage on custom event or cross-tab storage changes
    useEffect(() => {
        const syncDisplayName = () => {
            try {
                const val = localStorage.getItem('displayName');
                setDisplayNameValue(val ? JSON.parse(val) : null);
            } catch (_e) {
                setDisplayNameValue(null);
            }
        };

        window.addEventListener('displayNameUpdated', syncDisplayName);
        window.addEventListener('storage', (e) => {
            if (e.key === 'displayName') syncDisplayName();
        });

        // Also run once on mount in case hook value differs
        syncDisplayName();

        return () => {
            window.removeEventListener('displayNameUpdated', syncDisplayName);
            // 'storage' listener with inline fn cannot be removed; acceptable as it's window-scoped
        };
    }, []);

    const toggleMenu = () => setMenuOpen((v) => !v);
    const handleLogout = () => {
        // Close confirm modal immediately so it disappears before navigation
        setShowLogoutConfirm(false);
        removeToken();
        removeRefreshToken();
        removeDisplayName();
        // Clear sessionStorage
        sessionStorage.removeItem('token');
        // Don't remove savedEmail - keep it for next login
        setMenuOpen(false);
        // Always go back to home after logout
        navigate('/');
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
                    <button>Tìm</button>
                </div>
                <div className={cx('actions')}>
                    {isLoggedIn && displayNameValue ? (
                        <div className={cx('user-menu')}>
                            <button
                                className={cx('user-menu__trigger')}
                                onClick={toggleMenu}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                <span className={cx('user-menu__name')}>
                                    {displayNameValue}
                                </span>
                                <span className={cx('user-menu__avatar')}></span>
                            </button>
                            {menuOpen && (
                                <div className={cx('user-menu__dropdown')} role="menu">
                                    <Link
                                        to={customerAccount}
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Trang cá nhân
                                    </Link>
                                    <button
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={() => setShowLogoutConfirm(true)}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cx('auth-buttons')}>
                            <button 
                                onClick={openLoginModal} 
                                className={cx('login-link')}
                            >
                                <span className={cx('login-text')}>Đăng nhập</span>
                                <img
                                    src={guestIcon}
                                    alt="Guest"
                                    className={cx('guest-icon')}
                                />
                            </button>
                        </div>
                    )}
                    <span className={cx('notifications')}>
                        <img
                            src={ringIcon}
                            alt="Notifications"
                            className={cx('ring-icon')}
                        />
                    </span>
                    <span className={cx('cart')}>
                        <img
                            src="https://cdn0.iconfinder.com/data/icons/mobile-basic-vol-1/32/Tote_Bag-1024.png"
                            alt="Cart"
                        />
                    </span>
                </div>
            </header>
            {showLogoutConfirm && (
                <div className={cx('modal-overlay')} role="dialog" aria-modal="true">
                    <div className={cx('modal')}>
                        <h3 className={cx('modal-title')}>Đăng xuất tài khoản?</h3>
                        <p className={cx('modal-desc')}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className={cx('modal-actions')}>
                            <button className={cx('btn', 'btn-muted')} onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                            <button className={cx('btn', 'btn-primary')} onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DefaultHeader;
