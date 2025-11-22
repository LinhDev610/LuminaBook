import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerProfilePage.module.scss';
import useLocalStorage from '../../../hooks/useLocalStorage';
import Notification from '../../../components/Common/Notification/Notification';
import { getMyInfo, updateUser, getMyAddresses, updateAddress, getStoredToken } from '../../../services';
import AddressListModal from '../../../components/Common/AddressModal/AddressListModal';
import NewAddressModal from '../../../components/Common/AddressModal/NewAddressModal';
import AddressDetailModal from '../../../components/Common/AddressModal/AddressDetailModal';
import { formatFullAddress, normalizeAddressPayload } from '../../../components/Common/AddressModal/useGhnLocations';

const cx = classNames.bind(styles);

function CustomerProfilePage() {
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    const [email, setEmail, removeEmail] = useLocalStorage('email', '');
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const isLoggedIn = !!(token || getStoredToken());

    const [user, setUser] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [notif, setNotif] = useState({ open: false, type: 'success', title: '', message: '', duration: 3000 });

    const [showAddressList, setShowAddressList] = useState(false);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [showAddressDetailModal, setShowAddressDetailModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressRefreshKey, setAddressRefreshKey] = useState(0);

    const isValidPhone = (phone) => {
        return /^0\d{9}$/.test((phone || '').trim());
    };

    const persistDefaultAddress = async (address) => {
        if (!address || !isLoggedIn) return;
        const targetId = address.id || address.addressId;
        if (!targetId) return;

        const tk = getStoredToken();
        if (!tk) return;

        if (address.defaultAddress) return;

        try {
            const payload = normalizeAddressPayload({
                ...address,
                defaultAddress: true,
            });
            const { ok } = await updateAddress(targetId, payload, tk);
            if (ok) {
                setAddressRefreshKey((prev) => prev + 1);
            }
        } catch (err) {
            console.error('Không thể cập nhật địa chỉ mặc định', err);
        }
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
                    // Fetch addresses to find default address
                    try {
                        const addresses = await getMyAddresses(tk);
                        if (Array.isArray(addresses) && addresses.length > 0) {
                            const defaultAddress = addresses.find((addr) => addr?.defaultAddress === true);
                            if (defaultAddress) {
                                u.address = formatFullAddress(defaultAddress);
                                setSelectedAddress(defaultAddress);
                            } else {
                                u.address = '';
                            }
                        } else {
                            u.address = '';
                        }
                    } catch (_addrErr) {
                        u.address = u.address || '';
                    }

                    setUser(u);
                    // Deep clone to ensure cancel restores immutable snapshot
                    try {
                        setOriginalUser(JSON.parse(JSON.stringify(u)));
                    } catch (_e) {
                        setOriginalUser(u);
                    }
                    setDisplayName(u.fullName || displayName || '');
                    setEmail(u.email || '');
                }
            } catch (_e) {
                // ignore for now
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    // Auto-update default address when address list changes
    useEffect(() => {
        const updateDefaultAddress = async () => {
            if (!isLoggedIn || addressRefreshKey === 0) return;
            try {
                const tk = getStoredToken();
                if (!tk) return;
                const addresses = await getMyAddresses(tk);
                if (Array.isArray(addresses) && addresses.length > 0) {
                    const defaultAddress = addresses.find((addr) => addr?.defaultAddress === true);

                    if (defaultAddress) {
                        const formatted = formatFullAddress(defaultAddress);
                        setUser((prev) => ({ ...(prev || {}), address: formatted }));
                        setSelectedAddress(defaultAddress);
                    } else {
                        // No default address, clear if no address selected
                        setUser((prev) => {
                            const currentSelectedId = selectedAddress?.id;
                            const stillExists = addresses.some((addr) => addr?.id === currentSelectedId);
                            if (!stillExists) {
                                return { ...(prev || {}), address: '' };
                            }
                            return prev;
                        });
                    }
                } else {
                    // No addresses at all, clear
                    setUser((prev) => ({ ...(prev || {}), address: '' }));
                    setSelectedAddress(null);
                }
            } catch (_e) {
                // Ignore errors
            }
        };
        updateDefaultAddress();
    }, [addressRefreshKey, isLoggedIn]);

    return (
        <div className={cx('account-wrapper')}>
            <div className={cx('account-content')}>
                <main className={cx('account-main')}>
                    <section className={cx('panel')}>
                        <h3 className={cx('menu-item')}>
                            <img
                                className={cx('mi-large')}
                                src={require('../../../assets/icons/icon_user.png')}
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
                </main>
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
                    persistDefaultAddress(address);
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
                        persistDefaultAddress(newAddress);
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
                    persistDefaultAddress(updated);
                }}
                onDeleted={(deletedId) => {
                    setShowAddressDetailModal(false);
                    setAddressRefreshKey((prev) => prev + 1);
                    if (selectedAddress?.id === deletedId) {
                        setSelectedAddress(null);
                        setUser((prev) => ({
                            ...(prev || {}),
                            address: '',
                        }));
                    }
                }}
            />
        </div>
    );
}

export default CustomerProfilePage;
