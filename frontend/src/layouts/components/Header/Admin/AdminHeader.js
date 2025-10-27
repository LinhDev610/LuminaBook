import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import logoIcon from '../../../../assets/icons/logo_luminabook.png';
import guestIcon from '../../../../assets/icons/icon_guest.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';

import styles from './AdminHeader.module.scss';

const cx = classNames.bind(styles);

function AdminHeader() {
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );

    const toggleMenu = () => setMenuOpen((v) => !v);
    const handleLogout = () => {
        // Close confirm modal immediately so it disappears before navigation
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        setMenuOpen(false);
        // Always go back to home after logout
        navigate('/', { replace: true });
    };

    return (
        <>
            <header className={cx('header')}>
                <div className={cx('logo')}>
                    <Link to="/">
                        <img src={logoIcon} alt="LuminaBook" className={cx('logo-image')} />
                    </Link>
                </div>
                <div className={cx('admin-info')}>
                    <span className={cx('admin-text')}>ADMIN</span>
                    <div className={cx('user-menu')}>
                        <button
                            className={cx('user-menu__trigger')}
                            onClick={toggleMenu}
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                        >
                            <img src={guestIcon} alt="Admin" className={cx('user-icon')} />
                        </button>
                        {menuOpen && (
                            <div className={cx('user-menu__dropdown')} role="menu">
                                <Link
                                    to="/admin/profile"
                                    className={cx('user-menu__item')}
                                    role="menuitem"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Hồ sơ cá nhân
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
        </>
    );
}

export default AdminHeader;
