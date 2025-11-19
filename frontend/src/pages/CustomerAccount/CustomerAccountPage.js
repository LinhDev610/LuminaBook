import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage';
import Notification from '../../components/Common/Notification/Notification';
import guestImgIcon from '../../assets/icons/icon_img_guest.png';
import { getMyInfo, updateUser } from '../../services';
import styles from './CustomerAccountPage.module.scss';
import CustomerChangePasswordPage from './CustomerChangePassword/CustomerChangePasswordPage';
import classNames from 'classnames/bind';
import AddressListModal from '../../components/Common/AddressModal/AddressListModal';
import NewAddressModal from '../../components/Common/AddressModal/NewAddressModal';
import AddressDetailModal from '../../components/Common/AddressModal/AddressDetailModal';
import { formatFullAddress } from '../../components/Common/AddressModal/useGhnLocations';

// Thông tin tài khoản, lịch sử đơn hàng, đổi mật khẩu

const cx = classNames.bind(styles);

function CustomerAccountPage() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [email, setEmail, removeEmail] = useLocalStorage('email', '');
    const [token, setToken, removeToken] = useLocalStorage('token', null);

    // Helper to read token from both storages
    const getStoredToken = useMemo(() => () => {
        try {
            const raw = localStorage.getItem('token');
            if (!raw) return sessionStorage.getItem('token');
            if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
                return JSON.parse(raw);
            }
            return raw;
        } catch (_e) {
            return sessionStorage.getItem('token');
        }
    }, []);

    // Check if user is logged in
    const isLoggedIn = !!(token || getStoredToken());
    const [userAvatar, setUserAvatar, removeUserAvatar] = useLocalStorage('userAvatar', null);
    const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

    const [user, setUser] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [notif, setNotif] = useState({ open: false, type: 'success', title: '', message: '', duration: 3000 });

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAddressList, setShowAddressList] = useState(false);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [showAddressDetailModal, setShowAddressDetailModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressRefreshKey, setAddressRefreshKey] = useState(0);

    const handleLogout = () => {
        // Close modal first so it disappears immediately
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        removeEmail();
        // Clear sessionStorage token to ensure Navbar reflects logged-out state
        sessionStorage.removeItem('token');
        // Clear any cached avatar preview
        removeUserAvatar();
        // Always redirect to home and hard reload to ensure header/navbar state sync
        window.location.href = '/';
    };

    // Fetch current user info
    useEffect(() => {
        const fetchMe = async () => {
            if (!isLoggedIn) return;
            setLoading(true);
            setProfileMsg('');
            try {
                const tk = getStoredToken();
                if (!tk) return;
                const u = await getMyInfo(tk);
                if (u) {
                    setUser(u);
                    // Deep clone to ensure cancel restores immutable snapshot
                    try {
                        setOriginalUser(JSON.parse(JSON.stringify(u)));
                    } catch (_e) {
                        setOriginalUser(u);
                    }
                    setDisplayName(u.fullName || displayName || '');
                    setEmail(u.email || '');
                    setUserAvatar(u.avatarUrl || null);
                }
            } catch (_e) {
                // ignore for now
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    // Change password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changePwdMsg, setChangePwdMsg] = useState('');

    const isValidPhone = (phone) => {
        return /^0\d{9}$/.test((phone || '').trim());
    };

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
            const resp = await fetch(
                `http://localhost:8080/lumina_book/auth/change-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                    body: JSON.stringify({ currentPassword, newPassword }),
                },
            );
            const data = await resp.json();
            if (resp.ok && data?.code === 1000) {
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
                        <div className={cx('side-avatar')} onClick={() => document.getElementById('avatar-file-input')?.click()} role="button" aria-label="Chọn ảnh đại diện">
                            <img
                                src={(user && user.avatarUrl) || userAvatar || guestImgIcon}
                                onError={(e) => { e.currentTarget.src = guestImgIcon; }}
                                alt="User Avatar"
                                className={cx('avatar-image')}
                            />
                            <input id="avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    // Local instant preview
                                    const previewUrl = URL.createObjectURL(file);
                                    setUserAvatar(previewUrl);
                                    setPendingAvatarDataUrl(previewUrl);

                                    // Upload to server to obtain persistent URL
                                    setUploadingAvatar(true);
                                    const form = new FormData();
                                    form.append('files', file);
                                    const tk = getStoredToken();
                                    const resp = await fetch('http://localhost:8080/lumina_book/media/upload', {
                                        method: 'POST',
                                        headers: tk ? { Authorization: `Bearer ${tk}` } : undefined,
                                        body: form,
                                    });
                                    const data = await resp.json().catch(() => ({}));
                                    if (resp.ok && Array.isArray(data?.result) && data.result[0]) {
                                        const url = data.result[0];
                                        setUser((prev) => ({ ...(prev || {}), avatarUrl: url }));
                                        setUserAvatar(url);
                                        setPendingAvatarDataUrl(null);
                                        // Auto-save avatar to user profile
                                        try {
                                            if (user?.id) {
                                                const tk2 = getStoredToken();
                                                const updateData = await updateUser(user.id, { avatarUrl: url }, tk2);
                                                if (updateData) {
                                                    // Refresh original snapshot and notify
                                                    try {
                                                        setOriginalUser(JSON.parse(JSON.stringify(updateData)));
                                                    } catch (_e) {
                                                        setOriginalUser(updateData);
                                                    }
                                                    setNotif({ open: true, type: 'success', title: 'Đã lưu ảnh đại diện', message: 'Ảnh đại diện đã được cập nhật', duration: 2500 });
                                                } else {
                                                    setNotif({ open: true, type: 'warning', title: 'Không lưu được ảnh', message: 'Không thể lưu avatar, thử lại sau', duration: 3500 });
                                                }
                                            }
                                        } catch (_e) {
                                            setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Không thể lưu avatar, vui lòng thử lại', duration: 3000 });
                                        }
                                    } else {
                                        setNotif({ open: true, type: 'error', title: 'Upload thất bại', message: 'Không thể tải ảnh lên máy chủ', duration: 3000 });
                                    }
                                } catch (_) { }
                                finally { setUploadingAvatar(false); }
                            }} />
                        </div>
                        <div className={cx('side-name')}>{displayName || 'Khách'}</div>
                    </div>
                    <ul className={cx('side-menu')}>
                        <li
                            className={cx('menu-item', {
                                active: activeTab === 'profile',
                            })}
                            onClick={() => setActiveTab('profile')}
                        >
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
                        <li
                            className={cx('menu-item', {
                                active: activeTab === 'password',
                            })}
                            onClick={() => setActiveTab('password')}
                        >
                            <img
                                className={cx('mi')}
                                src={require('../../assets/icons/icon_lock.png')}
                                alt="lock"
                            />
                            <span>Đổi mật khẩu</span>
                        </li>
                        <li
                            className={cx('menu-item')}
                            onClick={() => setShowLogoutConfirm(true)}
                        >
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
                                    <label>Họ và tên</label>
                                    <input
                                        value={user?.fullName ?? ''}
                                        onChange={(e) => setUser((prev) => ({ ...(prev || {}), fullName: e.target.value }))}
                                        disabled={!isLoggedIn}
                                    />
                                </div>
                                <div className={cx('form-group')}>
                                    <label>Email</label>
                                    <input value={user?.email ?? ''} readOnly disabled />
                                </div>
                            </div>
                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label>Số điện thoại</label>
                                    <input
                                        value={user?.phoneNumber ?? ''}
                                        onChange={(e) => setUser((prev) => ({ ...(prev || {}), phoneNumber: e.target.value }))}
                                        disabled={!isLoggedIn}
                                    />
                                    {!isValidPhone(user?.phoneNumber ?? '') && (user?.phoneNumber ?? '').trim() !== '' && (
                                        <span className={cx('error-msg')}>Số điện thoại phải gồm 10 số và bắt đầu bằng 0</span>
                                    )}
                                </div>
                                <div className={cx('form-group')}>
                                    <label>Địa chỉ</label>
                                    <input
                                        value={user?.address ?? ''}
                                        readOnly
                                        onClick={() => isLoggedIn && setShowAddressList(true)}
                                        onFocus={() => isLoggedIn && setShowAddressList(true)}
                                        placeholder="Chọn từ danh sách địa chỉ của bạn"
                                        disabled={!isLoggedIn}
                                    />
                                </div>
                            </div>
                            <div className={cx('form-actions')}>
                                <button
                                    className={cx('secondary')}
                                    disabled={!isLoggedIn || loading}
                                    onClick={() => {
                                        if (originalUser) {
                                            try {
                                                setUser(JSON.parse(JSON.stringify(originalUser)));
                                            } catch (_e) {
                                                setUser(originalUser);
                                            }
                                            setPendingAvatarDataUrl(null);
                                            if (originalUser.avatarUrl) {
                                                setUserAvatar(originalUser.avatarUrl);
                                            } else {
                                                setUserAvatar(null);
                                            }
                                        }
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={cx('primary')}
                                    disabled={!isLoggedIn || loading}
                                    onClick={async () => {
                                        if (!user?.id) return;
                                        setProfileMsg('');
                                        if (!isValidPhone(user.phoneNumber ?? '')) {
                                            setProfileMsg('Số điện thoại phải gồm 10 số và bắt đầu bằng 0');
                                            return;
                                        }
                                        try {
                                            const tk = getStoredToken();
                                            const body = {
                                                fullName: user.fullName ?? '',
                                                phoneNumber: user.phoneNumber ?? '',
                                                address: user.address ?? '',
                                                avatarUrl: (user?.avatarUrl ?? '').trim(),
                                            };
                                            const updatedData = await updateUser(user.id, body, tk);
                                            if (updatedData) {
                                                // Refetch user to ensure data persisted and sync local state
                                                try {
                                                    const confirmedUser = await getMyInfo(tk);
                                                    if (confirmedUser) {
                                                        setUser(confirmedUser);
                                                        // Refresh original snapshot after successful save
                                                        try {
                                                            setOriginalUser(JSON.parse(JSON.stringify(confirmedUser)));
                                                        } catch (_e) {
                                                            setOriginalUser(confirmedUser);
                                                        }
                                                        setPendingAvatarDataUrl(null);
                                                        if (confirmedUser?.avatarUrl) {
                                                            setUserAvatar(confirmedUser.avatarUrl);
                                                        } else {
                                                            setUserAvatar(null);
                                                        }
                                                    } else {
                                                        setOriginalUser({ ...(originalUser || {}), ...body });
                                                    }
                                                } catch (_) {
                                                    setOriginalUser({ ...(originalUser || {}), ...body });
                                                }
                                                setNotif({ open: true, type: 'success', title: 'Thành công', message: 'Cập nhật thông tin thành công', duration: 2500 });
                                                setDisplayName(body.fullName || displayName);
                                                window.dispatchEvent(new CustomEvent('displayNameUpdated'));
                                            } else {
                                                setNotif({ open: true, type: 'error', title: 'Thất bại', message: 'Cập nhật thông tin thất bại', duration: 3000 });
                                            }
                                        } catch (_e) {
                                            setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Có lỗi xảy ra, vui lòng thử lại', duration: 3000 });
                                        }
                                    }}
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Đổi mật khẩu */}
                    {activeTab === 'password' && (
                        <CustomerChangePasswordPage />
                    )}
                </main>
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
            </div>
            <Notification
                open={notif.open}
                type={notif.type}
                title={notif.title}
                message={notif.message}
                duration={notif.duration}
                onClose={() => setNotif((n) => ({ ...n, open: false }))}
            />
            <AddressListModal
                open={showAddressList}
                onClose={() => setShowAddressList(false)}
                onSelectAddress={(address) => {
                    if (!address) return;
                    setUser((prev) => ({ ...(prev || {}), address: formatFullAddress(address) }));
                    setSelectedAddress(address);
                }}
                onViewDetail={(address) => {
                    setSelectedAddress(address);
                    setShowAddressDetailModal(true);
                }}
                onAddNewAddress={() => {
                    setShowNewAddressModal(true);
                }}
                refreshKey={addressRefreshKey}
                highlightAddressId={selectedAddress?.id || null}
            />
            <NewAddressModal
                open={showNewAddressModal}
                onClose={() => setShowNewAddressModal(false)}
                onCreated={(newAddress) => {
                    if (newAddress) {
                        setSelectedAddress(newAddress);
                        setUser((prev) => ({
                            ...(prev || {}),
                            address: formatFullAddress(newAddress),
                        }));
                    }
                    setAddressRefreshKey((prev) => prev + 1);
                    setShowNewAddressModal(false);
                    setShowAddressList(false);
                }}
            />
            <AddressDetailModal
                open={showAddressDetailModal}
                address={selectedAddress}
                onClose={() => setShowAddressDetailModal(false)}
                onUpdated={(updated) => {
                    if (!updated) return;
                    setSelectedAddress(updated);
                    setAddressRefreshKey((prev) => prev + 1);
                    setUser((prev) => ({
                        ...(prev || {}),
                        address: formatFullAddress(updated),
                    }));
                }}
            />
        </div>
    );
}

export default CustomerAccountPage;
