import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/components/Header/Header';
import Footer from '../../layouts/components/Footer/Footer';
import useLocalStorage from '../../hooks/useLocalStorage';

import styles from './AccountPage.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Account() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [email, setEmail, removeEmail] = useLocalStorage(
        'email',
        'user123@gmail.com',
    );
    const [token, setToken, removeToken] = useLocalStorage('token', null);

    const handleLogout = () => {
        removeToken();
        removeDisplayName();
        removeEmail();
        navigate('/');
    };

    return (
        <div className={cx('account-wrapper')}>
            <Header />
            <nav className={cx('account-nav')}>
                <button className="nav-trigger" />
                <Link className={cx('active')} to="#">
                    TẤT CẢ DANH MỤC
                </Link>
                <Link to="#">KHUYẾN MÃI</Link>
                <Link to="#">SÁCH MỚI</Link>
                <Link to="#">HỖ TRỢ KHÁCH HÀNG</Link>
                <Link to="#">LIÊN HỆ</Link>
            </nav>
            <div className={cx('account-content')}>
                <aside className={cx('account-side')}>
                    <div className={cx('side-profile')}>
                        <div className={cx('side-avatar')} />
                        <div className={cx('side-name')}>
                            {displayName || 'User………12'}
                        </div>
                    </div>
                    <ul className={cx('side-menu')}>
                        <li className={cx('menu-item active')}>
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_user.png')}
                                alt="user"
                            />
                            <span>Thông tin cá nhân</span>
                        </li>
                        <li className={cx('menu-item')}>
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_clock.png')}
                                alt="history"
                            />
                            <span>Lịch sử mua hàng</span>
                        </li>
                        <li className={cx('menu-item')}>
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_voucher.png')}
                                alt="voucher"
                            />
                            <span>Voucher và khuyến mãi</span>
                        </li>
                        <li className={cx('menu-item')}>
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_lock.png')}
                                alt="lock"
                            />
                            <span>Đổi mật khẩu</span>
                        </li>
                        <li className={cx('menu-item')} onClick={handleLogout}>
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_logout.png')}
                                alt="logout"
                            />
                            <span>Đăng xuất</span>
                        </li>
                    </ul>
                </aside>
                <main className={cx('account-main')}>
                    <section className={cx('panel')}>
                        <h3>
                            <span className={cx('icon-user')} /> Thông tin cá
                            nhân
                        </h3>
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Username</label>
                                <input
                                    defaultValue={displayName || 'User………12'}
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Gmail</label>
                                <input defaultValue={email} />
                            </div>
                        </div>
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Số điện thoại</label>
                                <input defaultValue="0123456789" />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Địa chỉ</label>
                                <input defaultValue="123 Đường ABC, phường Thanh Xuân, Hà Nội" />
                            </div>
                        </div>
                        <div className={cx('form-actions')}>
                            <button className={cx('primary')}>
                                Lưu thay đổi
                            </button>
                        </div>
                    </section>
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default Account;
