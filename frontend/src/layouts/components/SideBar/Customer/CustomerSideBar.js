import classNames from 'classnames/bind';
import styles from './CustomerSideBar.module.scss';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import guestImgIcon from '../../../../assets/icons/icon_img_guest.png';
import { getStoredToken, getMyInfo } from '../../../../services';

const cx = classNames.bind(styles);

export default function CustomerSideBar() {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    const [email, setEmail, removeEmail] = useLocalStorage('email', '');
    const [userAvatar, setUserAvatar, removeUserAvatar] = useLocalStorage('userAvatar', null);
    const [user, setUser] = useState(null);

    // Fetch user info for sidebar display
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const tk = getStoredToken();
                if (!tk) return;
                const u = await getMyInfo(tk);
                if (u) {
                    setUser(u);
                }
            } catch (_e) {
                // ignore
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        removeEmail();
        sessionStorage.removeItem('token');
        removeUserAvatar();
        window.location.href = '/';
    };

    return (
        <>
            <div className={cx('side')}>
                <div className={cx('side-profile')}>
                    <div className={cx('side-avatar')}>
                        <img
                            src={(user && user.avatarUrl) || userAvatar || guestImgIcon}
                            onError={(e) => { e.currentTarget.src = guestImgIcon; }}
                            alt="User Avatar"
                            className={cx('avatar-image')}
                        />
                    </div>
                    <div className={cx('side-name')}>{displayName || user?.fullName || 'Khách'}</div>
                </div>
                <ul className={cx('menu')}>
                    <li>
                        <NavLink
                            to="/customer-account"
                            end
                            className={({ isActive }) => cx('link', { active: isActive })}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../../../assets/icons/icon_user.png')}
                                alt="user"
                            />
                            <span>Thông tin cá nhân</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/customer-account/orders"
                            className={({ isActive }) => cx('link', { active: isActive })}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../../../assets/icons/icon_clock.png')}
                                alt="history"
                            />
                            <span>Lịch sử mua hàng</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/customer-account/vouchers"
                            className={({ isActive }) => cx('link', { active: isActive })}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../../../assets/icons/icon_voucher.png')}
                                alt="voucher"
                            />
                            <span>Voucher và khuyến mãi</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/customer-account/password"
                            className={({ isActive }) => cx('link', { active: isActive })}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../../../assets/icons/icon_lock.png')}
                                alt="lock"
                            />
                            <span>Đổi mật khẩu</span>
                        </NavLink>
                    </li>
                    <li>
                        <button
                            className={cx('link', 'logout')}
                            onClick={(e) => {
                                e.preventDefault();
                                setShowLogoutConfirm(true);
                            }}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../../../assets/icons/icon_logout.png')}
                                alt="logout"
                            />
                            <span>Đăng xuất</span>
                        </button>
                    </li>
                </ul>
            </div>
            {showLogoutConfirm && (
                <div className={cx('modal-overlay')} role="dialog" aria-modal="true">
                    <div className={cx('modal')}>
                        <h3 className={cx('modal-title')}>Đăng xuất tài khoản?</h3>
                        <p className={cx('modal-desc')}>
                            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                        </p>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-muted')}
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-primary')}
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
