import classNames from 'classnames/bind';
import styles from './CustomerSideBar.module.scss';
import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import guestImgIcon from '../../../../assets/icons/icon_img_guest.png';
import { getStoredToken, getMyInfo, updateUser, API_BASE_URL_FALLBACK } from '../../../../services';
import SetAvatarDialog from '../../../../components/Common/ConfirmDialog/SetAvatarDialog';

const cx = classNames.bind(styles);

export default function CustomerSideBar() {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [email, setEmail, removeEmail] = useLocalStorage('email', '');
    const [userAvatar, setUserAvatar, removeUserAvatar] = useLocalStorage(
        'userAvatar',
        null,
    );
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
                    if (u.avatarUrl) {
                        setUserAvatar(u.avatarUrl);
                    }
                }
            } catch (_e) {
                // ignore
            }
        };
        fetchUser();
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setSelectedFile(file);
        setShowAvatarDialog(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancelAvatar = () => {
        setShowAvatarDialog(false);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
        setSelectedFile(null);
    };

    const handleConfirmAvatar = async () => {
        if (!selectedFile || !user?.id) return;

        setUploadingAvatar(true);
        try {
            const tk = getStoredToken();
            if (!tk) {
                handleCancelAvatar();
                return;
            }

            // Upload file - backend expects 'files' parameter
            const form = new FormData();
            form.append('files', selectedFile);
            const resp = await fetch(`${API_BASE_URL_FALLBACK}/media/upload`, {
                method: 'POST',
                headers: tk ? { Authorization: `Bearer ${tk}` } : undefined,
                body: form,
            });
            const data = await resp.json().catch(() => ({}));

            if (!resp.ok || !Array.isArray(data?.result) || !data.result[0]) {
                alert('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
                handleCancelAvatar();
                return;
            }

            const avatarUrl = data.result[0];

            // Update user profile
            const updateData = await updateUser(user.id, { avatarUrl }, tk);

            if (updateData) {
                // Update local state
                setUser((prev) => ({ ...prev, avatarUrl }));
                setUserAvatar(avatarUrl);

                // Refresh user info
                const refreshedUser = await getMyInfo(tk);
                if (refreshedUser) {
                    setUser(refreshedUser);
                }

                // Clean up
                if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                }
                setShowAvatarDialog(false);
                setAvatarPreview(null);
                setSelectedFile(null);
            } else {
                alert('Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setUploadingAvatar(false);
        }
    };

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
                    <div
                        className={cx('side-avatar')}
                        onClick={handleAvatarClick}
                        role="button"
                        aria-label="Chọn ảnh đại diện"
                        style={{ cursor: 'pointer' }}
                    >
                        <img
                            src={(user && user.avatarUrl) || userAvatar || guestImgIcon}
                            onError={(e) => {
                                e.currentTarget.src = guestImgIcon;
                            }}
                            alt="User Avatar"
                            className={cx('avatar-image')}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className={cx('side-name')}>
                        {displayName || user?.fullName || 'Khách'}
                    </div>
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
            <SetAvatarDialog
                open={showAvatarDialog}
                previewUrl={avatarPreview}
                loading={uploadingAvatar}
                onConfirm={handleConfirmAvatar}
                onCancel={handleCancelAvatar}
            />
        </>
    );
}
