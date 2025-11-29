import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ProfileAdminPage.module.scss';
import guestAvatar from '../../../assets/icons/icon_img_guest.png';
import Notification from '../../../components/Common/Notification/Notification';
import {
    getMyInfo,
    updateUser,
    changePassword,
    uploadMediaProfile,
} from '../../../services';

const cx = classNames.bind(styles);

function ProfileAdminPage() {
    const [user, setUser] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notif, setNotif] = useState({
        open: false,
        type: 'success',
        title: '',
        message: '',
        duration: 3000,
    });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changePasswordData, setChangePasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [userAvatar, setUserAvatar] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const getStoredToken = useMemo(
        () => () => {
            try {
                const raw = localStorage.getItem('token');
                if (!raw) return sessionStorage.getItem('token');
                if (
                    (raw.startsWith('"') && raw.endsWith('"')) ||
                    raw.startsWith('{') ||
                    raw.startsWith('[')
                ) {
                    return JSON.parse(raw);
                }
                return raw;
            } catch (_) {
                return sessionStorage.getItem('token');
            }
        },
        [],
    );

    const fetchUserInfo = async () => {
        setLoading(true);
        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Vui lòng đăng nhập để tiếp tục',
                    duration: 3000,
                });
                setLoading(false);
                return;
            }

            const userData = (await getMyInfo(token)) || null;
            setUser(userData);
            setUserAvatar(userData?.avatarUrl || null);
            try {
                setOriginalUser(JSON.parse(JSON.stringify(userData)));
            } catch (_) {
                setOriginalUser(userData);
            }
        } catch (e) {
            setNotif({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: e.message || 'Không thể tải thông tin',
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const getRoleDisplayName = (roleName) => {
        if (!roleName) return 'Quản trị hệ thống';
        if (roleName === 'ADMIN') return 'Quản trị hệ thống';
        if (roleName === 'STAFF') return 'Nhân viên';
        if (roleName === 'CUSTOMER_SUPPORT') return 'Chăm sóc khách hàng';
        return roleName;
    };

    const resolveActive = (u) => {
        if (!u) return true;
        if (typeof u.isActive === 'boolean') return u.isActive;
        if (typeof u.active === 'boolean') return u.active;
        if (typeof u.isActive === 'number') return u.isActive === 1;
        if (typeof u.active === 'number') return u.active === 1;
        if (typeof u.isActive === 'string')
            return u.isActive.toLowerCase() === 'true' || u.isActive === '1';
        if (typeof u.active === 'string')
            return u.active.toLowerCase() === 'true' || u.active === '1';
        return true;
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Vui lòng đăng nhập để tiếp tục',
                    duration: 3000,
                });
                setSaving(false);
                return;
            }

            const requestBody = {
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
            };

            const updatedUser = (await updateUser(user.id, requestBody, token)) || user;
            setUser(updatedUser);
            try {
                setOriginalUser(JSON.parse(JSON.stringify(updatedUser)));
            } catch (_) {
                setOriginalUser(updatedUser);
            }

            setNotif({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Đã lưu thay đổi thành công',
                duration: 3000,
            });
        } catch (e) {
            setNotif({
                open: true,
                type: 'error',
                title: 'Thất bại',
                message: `Không thể lưu thay đổi: ${e.message || 'Vui lòng thử lại sau.'
                    }`,
                duration: 4000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (originalUser) {
            try {
                setUser(JSON.parse(JSON.stringify(originalUser)));
            } catch (_) {
                setUser(originalUser);
            }
        }
    };

    const handleChangePassword = async () => {
        if (!changePasswordData.currentPassword || !changePasswordData.newPassword) {
            setNotif({
                open: true,
                type: 'error',
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập đầy đủ thông tin',
                duration: 3000,
            });
            return;
        }

        if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
            setNotif({
                open: true,
                type: 'error',
                title: 'Không khớp',
                message: 'Mật khẩu xác nhận không khớp',
                duration: 3000,
            });
            return;
        }

        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Vui lòng đăng nhập để tiếp tục',
                    duration: 3000,
                });
                return;
            }

            const { ok, data } = await changePassword(
                {
                    currentPassword: changePasswordData.currentPassword,
                    newPassword: changePasswordData.newPassword,
                },
                token,
            );

            if (ok && (data?.code === 200 || data?.code === 1000)) {
                setNotif({
                    open: true,
                    type: 'success',
                    title: 'Thành công',
                    message: 'Đổi mật khẩu thành công',
                    duration: 3000,
                });
                setChangePasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setShowChangePassword(false);
            } else {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Thất bại',
                    message: data?.message || 'Đổi mật khẩu thất bại',
                    duration: 3000,
                });
            }
        } catch (e) {
            setNotif({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: 'Có lỗi xảy ra, vui lòng thử lại',
                duration: 3000,
            });
        }
    };

    if (loading) {
        return (
            <div className={cx('page')}>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={cx('page')}>
                <p className={cx('error')}>Không thể tải thông tin người dùng</p>
            </div>
        );
    }

    const avatarSrc = user?.avatarUrl || guestAvatar;
    const isActive = resolveActive(user);
    const roleDisplay = getRoleDisplayName(user?.role?.name);

    return (
        <div className={cx('page')}>
            <h1 className={cx('title')}>Hồ sơ cá nhân</h1>

            <div className={cx('card')}>
                <div className={cx('profile-header')}>
                    <div className={cx('profile-left')}>
                        <div className={cx('avatar-wrapper')}>
                            <img
                                className={cx('avatar')}
                                src={userAvatar || avatarSrc}
                                alt="avatar"
                                onError={(e) => {
                                    e.currentTarget.src = guestAvatar;
                                }}
                                onClick={() =>
                                    document.getElementById('avatar-file-input')?.click()
                                }
                            />
                            <input
                                id="avatar-file-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                        // Local instant preview
                                        const previewUrl = URL.createObjectURL(file);
                                        setUserAvatar(previewUrl);

                                        // Upload to server to obtain persistent URL
                                        setUploadingAvatar(true);
                                        const token = getStoredToken();
                                        const { ok: uploadOk, data: uploadData } =
                                            await uploadMediaProfile(file, token);
                                        if (
                                            uploadOk &&
                                            Array.isArray(uploadData?.result) &&
                                            uploadData.result.length > 0
                                        ) {
                                            const uploadedUrl = uploadData.result[0];
                                            // Update user avatar URL
                                            const updatedUserData = await updateUser(
                                                user.id,
                                                {
                                                    fullName: user.fullName,
                                                    phoneNumber: user.phoneNumber,
                                                    avatarUrl: uploadedUrl,
                                                },
                                                token,
                                            );
                                            if (updatedUserData) {
                                                setUser({
                                                    ...user,
                                                    avatarUrl: uploadedUrl,
                                                });
                                                setUserAvatar(uploadedUrl);
                                                try {
                                                    setOriginalUser(
                                                        JSON.parse(
                                                            JSON.stringify(
                                                                updatedUserData,
                                                            ),
                                                        ),
                                                    );
                                                } catch (_) {
                                                    setOriginalUser(updatedUserData);
                                                }
                                                setNotif({
                                                    open: true,
                                                    type: 'success',
                                                    title: 'Đã lưu ảnh đại diện',
                                                    message:
                                                        'Ảnh đại diện đã được cập nhật',
                                                    duration: 2500,
                                                });
                                            } else {
                                                setNotif({
                                                    open: true,
                                                    type: 'warning',
                                                    title: 'Không lưu được ảnh',
                                                    message:
                                                        'Không thể lưu avatar, thử lại sau',
                                                    duration: 3500,
                                                });
                                            }
                                        } else {
                                            setNotif({
                                                open: true,
                                                type: 'error',
                                                title: 'Upload thất bại',
                                                message: 'Không thể tải ảnh lên máy chủ',
                                                duration: 3000,
                                            });
                                        }
                                    } catch (_) {
                                        setNotif({
                                            open: true,
                                            type: 'error',
                                            title: 'Lỗi',
                                            message:
                                                'Không thể lưu avatar, vui lòng thử lại',
                                            duration: 3000,
                                        });
                                    } finally {
                                        setUploadingAvatar(false);
                                        // Reset input
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        <div className={cx('profile-info')}>
                            <h2 className={cx('name')}>
                                {user.fullName || user.email || 'N/A'}
                            </h2>
                            <p className={cx('role')}>Quản trị hệ thống</p>
                        </div>
                    </div>
                    <button
                        className={cx('change-password-btn')}
                        onClick={() => setShowChangePassword(true)}
                    >
                        Đổi mật khẩu
                    </button>
                </div>

                <div className={cx('form-container')}>
                    <div className={cx('form-column')}>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Họ và tên:</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={user.fullName || ''}
                                onChange={(e) =>
                                    setUser({ ...user, fullName: e.target.value })
                                }
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Số điện thoại:</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={user.phoneNumber || ''}
                                onChange={(e) =>
                                    setUser({ ...user, phoneNumber: e.target.value })
                                }
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Trạng thái:</label>
                            <div
                                className={cx(
                                    'status-badge',
                                    isActive ? 'active' : 'locked',
                                )}
                            >
                                {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                            </div>
                        </div>
                    </div>

                    <div className={cx('form-column')}>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Email:</label>
                            <input
                                type="email"
                                className={cx('form-input')}
                                value={user.email || ''}
                                readOnly
                                disabled
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Ngày tạo tài khoản:
                            </label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={user.createAt || ''}
                                readOnly
                                disabled
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Vai trò:</label>
                            <input
                                type="text"
                                className={cx('form-input')}
                                value={roleDisplay}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>
                </div>

                <div className={cx('form-actions')}>
                    <button className={cx('btn', 'cancel-btn')} onClick={handleCancel}>
                        Hủy
                    </button>
                    <button
                        className={cx('btn', 'save-btn')}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>

            {showChangePassword && (
                <div
                    className={cx('modal-overlay')}
                    onClick={() => setShowChangePassword(false)}
                >
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3 className={cx('modal-title')}>Đổi mật khẩu</h3>
                            <button
                                className={cx('modal-close')}
                                onClick={() => setShowChangePassword(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={cx('modal-body')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>
                                    Mật khẩu hiện tại:
                                </label>
                                <input
                                    type="password"
                                    className={cx('form-input')}
                                    value={changePasswordData.currentPassword}
                                    onChange={(e) =>
                                        setChangePasswordData({
                                            ...changePasswordData,
                                            currentPassword: e.target.value,
                                        })
                                    }
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Mật khẩu mới:</label>
                                <input
                                    type="password"
                                    className={cx('form-input')}
                                    value={changePasswordData.newPassword}
                                    onChange={(e) =>
                                        setChangePasswordData({
                                            ...changePasswordData,
                                            newPassword: e.target.value,
                                        })
                                    }
                                    placeholder="Nhập mật khẩu mới"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>
                                    Xác nhận mật khẩu mới:
                                </label>
                                <input
                                    type="password"
                                    className={cx('form-input')}
                                    value={changePasswordData.confirmPassword}
                                    onChange={(e) =>
                                        setChangePasswordData({
                                            ...changePasswordData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                        </div>
                        <div className={cx('modal-footer')}>
                            <button
                                className={cx('btn', 'cancel-btn')}
                                onClick={() => setShowChangePassword(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'save-btn')}
                                onClick={handleChangePassword}
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Notification
                open={notif.open}
                type={notif.type}
                title={notif.title}
                message={notif.message}
                duration={notif.duration}
                onClose={() => setNotif((n) => ({ ...n, open: false }))}
            />
        </div>
    );
}

export default ProfileAdminPage;
