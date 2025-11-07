import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CustomerDetailPage.module.scss';
import guestAvatar from '../../../../assets/icons/icon_img_guest.png';
import Notification from '../../../../components/Common/Notification/Notification';

const cx = classNames.bind(styles);
const API_BASE_URL = 'http://localhost:8080/lumina_book';


function CustomerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', phoneNumber: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [notif, setNotif] = useState({ open: false, type: 'success', title: '', message: '', duration: 3000 });

    const getStoredToken = useMemo(() => () => {
        try {
            const raw = localStorage.getItem('token');
            if (!raw) return sessionStorage.getItem('token');
            if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
                return JSON.parse(raw);
            }
            return raw;
        } catch (_) {
            return sessionStorage.getItem('token');
        }
    }, []);

    const fetchCustomer = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getStoredToken();
            if (!token) {
                setError('Vui lòng đăng nhập để tiếp tục');
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!res.ok) {
                let msg = `HTTP error! status: ${res.status}`;
                try {
                    const j = await res.json();
                    msg = j?.message || msg;
                } catch (_) {}
                throw new Error(msg);
            }
            const data = await res.json();
            const result = data?.result || null;
            setCustomer(result);
            if (result) {
                setFormData({
                    fullName: result.fullName || '',
                    phoneNumber: result.phoneNumber || '',
                    address: result.address || '',
                });
            }
        } catch (e) {
            setError(e.message || 'Không thể tải thông tin khách hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomer();
        // Order history endpoint is not available yet; keep placeholder for future wiring
        setOrders([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleBack = () => {
        navigate(-1);
    };

    const resolveActive = (c) => {
        if (!c) return false;
        if (typeof c.isActive === 'boolean') return c.isActive;
        if (typeof c.active === 'boolean') return c.active;
        if (typeof c.isActive === 'number') return c.isActive === 1;
        if (typeof c.active === 'number') return c.active === 1;
        if (typeof c.isActive === 'string') return c.isActive.toLowerCase() === 'true' || c.isActive === '1';
        if (typeof c.active === 'string') return c.active.toLowerCase() === 'true' || c.active === '1';
        return false;
    };

    const handleToggleLock = async () => {
        if (!customer) return;
        const isCurrentlyActive = resolveActive(customer);
        const newIsActive = !isCurrentlyActive;
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) return;
        try {
            const token = getStoredToken();
            const res = await fetch(`${API_BASE_URL}/users/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: newIsActive }),
            });
            if (!res.ok) {
                let msg = `HTTP error! status: ${res.status}`;
                try { const j = await res.json(); msg = j?.message || msg; } catch(_){}
                throw new Error(msg);
            }
            const updated = await res.json();
            const next = updated?.result || { ...customer, isActive: newIsActive };
            // Normalize both fields for UI consistency
            if (next.isActive === undefined) next.isActive = newIsActive;
            if (next.active === undefined) next.active = newIsActive;
            setCustomer(next);
            alert(`Đã ${action} tài khoản thành công`);
        } catch (e) {
            alert(`Không thể ${action} tài khoản: ${e.message || 'Vui lòng thử lại sau.'}`);
        }
    };

    const handleDelete = async () => {
        if (!customer) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.')) return;
        try {
            const token = getStoredToken();
            const res = await fetch(`${API_BASE_URL}/users/${customer.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                let msg = `HTTP error! status: ${res.status}`;
                try { const j = await res.json(); msg = j?.message || msg; } catch(_){}
                throw new Error(msg);
            }
            alert('Đã xóa tài khoản thành công');
            navigate('/admin/customer-accounts');
        } catch (e) {
            alert('Không thể xóa tài khoản. Vui lòng thử lại sau.');
        }
    };

    const handleStartEdit = () => {
        if (!customer) return;
        setFormData({
            fullName: customer.fullName || '',
            phoneNumber: customer.phoneNumber || '',
            address: customer.address || '',
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        if (!customer) {
            setIsEditing(false);
            return;
        }
        setFormData({
            fullName: customer.fullName || '',
            phoneNumber: customer.phoneNumber || '',
            address: customer.address || '',
        });
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        if (!customer) return;
        setSaving(true);
        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Vui lòng đăng nhập để tiếp tục', duration: 3500 });
                setSaving(false);
                return;
            }

            const payload = {
                fullName: formData.fullName || '',
                phoneNumber: formData.phoneNumber || '',
                address: formData.address || '',
            };

            const res = await fetch(`${API_BASE_URL}/users/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data?.message || `Không thể cập nhật thông tin (mã ${res.status})`;
                throw new Error(msg);
            }

            const updated = data?.result || { ...customer, ...payload };
            setCustomer(updated);
            setFormData({
                fullName: updated.fullName || '',
                phoneNumber: updated.phoneNumber || '',
                address: updated.address || '',
            });
            setIsEditing(false);
            setNotif({ open: true, type: 'success', title: 'Thành công', message: 'Đã cập nhật thông tin khách hàng', duration: 2500 });
        } catch (e) {
            setNotif({ open: true, type: 'error', title: 'Lỗi', message: e.message || 'Không thể lưu thay đổi', duration: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const getStatusText = (active) => (active ? 'Hoạt động' : 'Đã khóa');

    if (loading) {
        return (
            <div className={cx('page')}>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('page')}>
                <button className={cx('back-btn')} onClick={handleBack}>←</button>
                <p className={cx('error')}>{error}</p>
            </div>
        );
    }

    if (!customer) return null;

    const avatarSrc = customer?.avatarUrl || guestAvatar;
    const isActiveResolved = resolveActive(customer);

    return (
        <div className={cx('page')}>
            <button className={cx('back-btn')} onClick={handleBack}>←</button>
            <h1 className={cx('title')}>Chi tiết thông tin khách hàng</h1>

            <div className={cx('card')}>
                <div className={cx('avatar-col')}>
                    <img className={cx('avatar')} src={avatarSrc} alt="avatar" />
                </div>

                <div className={cx('info-col')}>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Mã khách hàng:</span>
                        <span className={cx('value')}>{customer.id}</span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Tên đăng nhập:</span>
                        {isEditing ? (
                            <input
                                className={cx('input')}
                                value={formData.fullName}
                                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Nhập họ và tên"
                            />
                        ) : (
                            <span className={cx('value')}>{customer.fullName || ''}</span>
                        )}
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Email:</span>
                        <span className={cx('value')}>{customer.email || ''}</span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Số điện thoại:</span>
                        {isEditing ? (
                            <input
                                className={cx('input')}
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                placeholder="Nhập số điện thoại"
                            />
                        ) : (
                            <span className={cx('value')}>{customer.phoneNumber || ''}</span>
                        )}
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Địa chỉ:</span>
                        {isEditing ? (
                            <textarea
                                className={cx('textarea')}
                                value={formData.address}
                                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                placeholder="Nhập địa chỉ"
                                rows={2}
                            />
                        ) : (
                            <span className={cx('value')}>{customer.address || ''}</span>
                        )}
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Trạng thái:</span>
                        <span className={cx('badge', isActiveResolved ? 'active' : 'locked')}>{getStatusText(isActiveResolved)}</span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Ngày tạo tài khoản:</span>
                        <span className={cx('value')}>{customer.createAt || ''}</span>
                    </div>

                    <div className={cx('actions')}>
                        {isEditing ? (
                            <>
                                <button className={cx('btn', 'cancel')} onClick={handleCancelEdit} disabled={saving}>Hủy</button>
                                <button className={cx('btn', 'save')} onClick={handleSaveChanges} disabled={saving}>
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className={cx('btn', 'edit')} onClick={handleStartEdit}>Chỉnh sửa</button>
                                <button className={cx('btn', 'toggle')} onClick={handleToggleLock}>{isActiveResolved ? 'Khóa tài khoản' : 'Mở khóa'}</button>
                                <button className={cx('btn', 'delete')} onClick={handleDelete}>Xóa</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={cx('orders')}>
                <h2 className={cx('orders-title')}>Lịch sử đơn hàng</h2>
                <table className={cx('orders-table')}>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>Chưa có đơn hàng</td>
                            </tr>
                        ) : (
                            orders.map((o) => (
                                <tr key={o.id}>
                                    <td>{o.code}</td>
                                    <td>{o.date}</td>
                                    <td>{o.total}</td>
                                    <td><span className={cx('order-badge', o.statusClass)}>{o.statusText}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Notification
                open={notif.open}
                type={notif.type}
                title={notif.title}
                message={notif.message}
                duration={notif.duration}
                onClose={() => setNotif((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}

export default CustomerDetailPage;


