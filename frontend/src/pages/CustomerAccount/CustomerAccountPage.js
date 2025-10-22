import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import guestImgIcon from '../../assets/icons/icon_img_guest.png';
import userIcon from '../../assets/icons/icon_user.png';
import clockIcon from '../../assets/icons/icon_clock.png';
import giftIcon from '../../assets/icons/icon_gift.png';
import complaintIcon from '../../assets/icons/icon_hotro247.png';
import logoutIcon from '../../assets/icons/icon_logout.png';
import lockIcon from '../../assets/icons/icon_lock.png';
import voucherIcon from '../../assets/icons/icon_voucher.png';

import styles from './CustomerAccountPage.module.scss';
import classNames from 'classnames/bind';

// Thông tin tài khoản, lịch sử đơn hàng, đổi mật khẩu

const cx = classNames.bind(styles);

function CustomerAccountPage() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [email, setEmail, removeEmail] = useLocalStorage('email', 'user123@gmail.com');
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    
    // Check if user is logged in
    const isLoggedIn = !!token;
    const [userAvatar, setUserAvatar] = useLocalStorage('userAvatar', null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

    // Debug logging
    console.log('CustomerAccountPage - isLoggedIn:', isLoggedIn);
    console.log('CustomerAccountPage - token:', token);
    console.log('CustomerAccountPage - displayName:', displayName);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        // Close modal first so it disappears immediately
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        removeEmail();
        // Clear sessionStorage token to ensure Navbar reflects logged-out state
        sessionStorage.removeItem('token');
        // Always redirect to home and hard reload to ensure header/navbar state sync
        window.location.href = '/';
    };

    // Change password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changePwdMsg, setChangePwdMsg] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setChangePwdMsg('');
        if (!newPassword || !currentPassword) {
            return setChangePwdMsg('Vui lòng nhập đầy đủ thông tin');
        }
        if (newPassword !== confirmPassword) {
            return setChangePwdMsg('Mật khẩu xác nhận không khớp');
        }
        try {
            const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await resp.json();
            if (resp.ok && data?.code === 200) {
                setChangePwdMsg('Đổi mật khẩu thành công');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setChangePwdMsg(data?.message || 'Đổi mật khẩu thất bại');
            }
        } catch (err) {
            setChangePwdMsg('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div className={cx('account-wrapper')}>
            <div className={cx('account-content')}>
                <aside className={cx('account-side')}>
                    <div className={cx('side-profile')}>
                        <div className={cx('side-avatar')}>
                            {!isLoggedIn || !userAvatar ? (
                                <img 
                                    src={guestImgIcon} 
                                    alt="Guest Avatar" 
                                    className={cx('avatar-image')}
                                />
                            ) : (
                                <img 
                                    src={userAvatar} 
                                    alt="User Avatar" 
                                    className={cx('avatar-image')}
                                />
                            )}
                        </div>
                        <div className={cx('side-name')}>
                            {displayName || 'Khách'}
                        </div>
                    </div>
                    <ul className={cx('side-menu')}>
                        <li className={cx('menu-item', { active: activeTab === 'profile' })} onClick={() => setActiveTab('profile')}>
                            <img
                                className={cx('mi')}
                                src={userIcon}
                                alt="user"
                            />
                            <span>Thông tin cá nhân</span>
                        </li>
                        <li className={cx('menu-item')}>
                            <img
                                className={cx('mi')}
                                src={clockIcon}
                                alt="history"
                            />
                            <span>Lịch sử mua hàng</span>
                        </li>
                        <li className={cx('menu-item')}>
                            <img
                                className={cx('mi')}
                                src={voucherIcon}
                                alt="voucher"
                            />
                            <span>Voucher và khuyến mãi</span>
                        </li>
                        <li className={cx('menu-item', { active: activeTab === 'password' })} onClick={() => setActiveTab('password')}>
                            <img
                                className={cx('mi')}
                                src={lockIcon}
                                alt="lock"
                            />
                            <span>Đổi mật khẩu</span>
                        </li>
                        <li className={cx('menu-item')} onClick={() => setShowLogoutConfirm(true)}>
                            <img
                                className={cx('mi')}
                                src={logoutIcon}
                                alt="logout"
                            />
                            <span>Đăng xuất</span>
                        </li>
                    </ul>
                </aside>
                <main className={cx('account-main')}>
                    {activeTab === 'profile' && (
                    <section className={cx('panel')}>
                        <h3 className={cx('menu-item')}>
                            <img
                                className={cx('mi-large')}
                                src={require('../../assets/icons/icon_user.png')}
                                alt="user"
                            />
                            <span className={cx('menu-item')} /> Thông tin cá nhân
                        </h3>
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Username</label>
                                <input defaultValue={displayName || 'Khách'} />
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
                            <button className={cx('primary')}>Lưu thay đổi</button>
                        </div>
                    </section>
                    )}

                    {/* Đổi mật khẩu */}
                    {activeTab === 'password' && (
                    <section className={cx('panel')} style={{ marginTop: 20 }}>
                        <h3 className={cx('menu-item')}>
                            <img
                                className={cx('mi-large')}
                                src={require('../../assets/icons/icon_lock.png')}
                                alt="lock"
                            />
                            <span className={cx('menu-item')} /> Đổi mật khẩu
                        </h3>
                        <form onSubmit={handleChangePassword}>
                            <div className={cx('form-group')}>
                                <label>Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label>Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </div>
                            {changePwdMsg && (
                                <div className={cx('form-hint')} style={{ color: '#1a3c5a', marginBottom: 8 }}>
                                    {changePwdMsg}
                                </div>
                            )}
                            <div className={cx('form-actions')}>
                                <button className={cx('primary')} disabled={!isLoggedIn}>Cập nhật mật khẩu</button>
                            </div>
                        </form>
                    </section>
                    )}
                </main>
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
        </div>
    );
}

export default CustomerAccountPage;
