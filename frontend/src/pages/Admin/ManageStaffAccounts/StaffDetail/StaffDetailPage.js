import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './StaffDetailPage.module.scss';
import guestAvatar from '../../../../assets/icons/icon_img_guest.png';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog/DeleteAccountDialog';
import Notification from '../../../../components/Common/Notification/Notification';
import { getUserById, updateUser, deleteUser } from '../../../../services';

const cx = classNames.bind(styles);

function StaffDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [staff, setStaff] = useState(null);
    const [originalStaff, setOriginalStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
    });
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

    const fetchStaff = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getStoredToken();
            if (!token) {
                setError('Vui lòng đăng nhập để tiếp tục');
                setLoading(false);
                return;
            }

            const staffData = await getUserById(id, token) || null;
            setStaff(staffData);
            // Deep clone for reset functionality
            try {
                setOriginalStaff(JSON.parse(JSON.stringify(staffData)));
            } catch (_) {
                setOriginalStaff(staffData);
            }
        } catch (e) {
            setError(e.message || 'Không thể tải thông tin nhân viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleBack = () => {
        navigate(-1);
    };

    const resolveActive = (s) => {
        if (!s) return false;
        if (typeof s.isActive === 'boolean') return s.isActive;
        if (typeof s.active === 'boolean') return s.active;
        if (typeof s.isActive === 'number') return s.isActive === 1;
        if (typeof s.active === 'number') return s.active === 1;
        if (typeof s.isActive === 'string') return s.isActive.toLowerCase() === 'true' || s.isActive === '1';
        if (typeof s.active === 'string') return s.active.toLowerCase() === 'true' || s.active === '1';
        return false;
    };

    const getRoleDisplayName = (roleName) => {
        if (!roleName) return 'Nhân viên';
        if (roleName === 'STAFF') return 'Nhân viên';
        if (roleName === 'CUSTOMER_SUPPORT') return 'Chăm sóc khách hàng';
        return roleName;
    };

    const getRoleValue = (displayName) => {
        if (displayName === 'Nhân viên') return 'STAFF';
        if (displayName === 'Chăm sóc khách hàng') return 'CUSTOMER_SUPPORT';
        return displayName;
    };

    const handleSave = async () => {
        if (!staff) return;
        setSaving(true);
        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Vui lòng đăng nhập để tiếp tục', duration: 3000 });
                setSaving(false);
                return;
            }

            const roleValue = getRoleValue(staff.roleDisplay || staff.role?.name || 'STAFF');
            const isActiveValue = resolveActive(staff);

            const requestBody = {
                fullName: staff.fullName || '',
                phoneNumber: staff.phoneNumber || '',
                role: roleValue,
                isActive: isActiveValue,
            };

            const updatedStaff = await updateUser(staff.id, requestBody, token) || staff;
            setStaff(updatedStaff);
            try {
                setOriginalStaff(JSON.parse(JSON.stringify(updatedStaff)));
            } catch (_) {
                setOriginalStaff(updatedStaff);
            }

            setNotif({ open: true, type: 'success', title: 'Thành công', message: 'Đã lưu thay đổi thành công', duration: 3000 });
        } catch (e) {
            setNotif({ open: true, type: 'error', title: 'Thất bại', message: `Không thể lưu thay đổi: ${e.message || 'Vui lòng thử lại sau.'}`, duration: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = () => {
        if (!staff) return;
        const isCurrentlyActive = resolveActive(staff);
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
        const staffName = staff.fullName || staff.email || `#${staff.id}`;

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hành động',
            message: `Bạn có chắc chắn muốn ${action} tài khoản ${staffName}?`,
            onConfirm: () => performToggleLock(),
        });
    };

    const performToggleLock = async () => {
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        if (!staff) return;

        const isCurrentlyActive = resolveActive(staff);
        const newIsActive = !isCurrentlyActive;
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';

        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Vui lòng đăng nhập để tiếp tục', duration: 3000 });
                return;
            }

            const next = await updateUser(staff.id, { isActive: newIsActive }, token) || { ...staff, isActive: newIsActive };
            if (next.isActive === undefined) next.isActive = newIsActive;
            if (next.active === undefined) next.active = newIsActive;
            setStaff(next);
            try {
                setOriginalStaff(JSON.parse(JSON.stringify(next)));
            } catch (_) {
                setOriginalStaff(next);
            }

            setNotif({ open: true, type: 'success', title: 'Thành công', message: `Đã ${action} tài khoản thành công`, duration: 3000 });
        } catch (e) {
            setNotif({ open: true, type: 'error', title: 'Thất bại', message: `Không thể ${action} tài khoản: ${e.message || 'Vui lòng thử lại sau.'}`, duration: 4000 });
        }
    };

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

    if (!staff) return null;

    const avatarSrc = staff?.avatarUrl || guestAvatar;
    const isActiveResolved = resolveActive(staff);
    const roleDisplayName = getRoleDisplayName(staff.role?.name || staff.roleDisplay);

    return (
        <div className={cx('page')}>
            <button className={cx('back-btn')} onClick={handleBack}>←</button>
            <h1 className={cx('title')}>Chi tiết tài khoản nhân viên</h1>

            <div className={cx('card')}>
                <div className={cx('profile-section')}>
                    <div className={cx('avatar-wrapper')}>
                        <img className={cx('avatar')} src={avatarSrc} alt="avatar" />
                    </div>
                    <div className={cx('profile-info')}>
                        <h2 className={cx('staff-name')}>{staff.fullName || staff.email || 'N/A'}</h2>
                        <p className={cx('staff-id')}>Mã nhân viên: {staff.id}</p>
                        <p className={cx('staff-status', isActiveResolved ? 'active' : 'locked')}>
                            Trạng thái: {isActiveResolved ? 'Hoạt động' : 'Đã khóa'}
                        </p>
                    </div>
                </div>

                <div className={cx('form-section')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Họ và tên:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={staff.fullName || ''}
                            onChange={(e) => setStaff({ ...staff, fullName: e.target.value })}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Email:</label>
                        <input
                            type="email"
                            className={cx('form-input')}
                            value={staff.email || ''}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Số điện thoại:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={staff.phoneNumber || ''}
                            onChange={(e) => setStaff({ ...staff, phoneNumber: e.target.value })}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Chức vụ:</label>
                        <select
                            className={cx('form-select')}
                            value={roleDisplayName}
                            onChange={(e) => {
                                const newRole = getRoleValue(e.target.value);
                                setStaff({ ...staff, roleDisplay: e.target.value, role: { ...staff.role, name: newRole } });
                            }}
                        >
                            <option value="Nhân viên">Nhân viên</option>
                            <option value="Chăm sóc khách hàng">Chăm sóc khách hàng</option>
                        </select>
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Ngày tạo tài khoản:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={staff.createAt || ''}
                            readOnly
                            disabled
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Trạng thái tài khoản:</label>
                        <select
                            className={cx('form-select')}
                            value={isActiveResolved ? 'Hoạt động' : 'Đã khóa'}
                            onChange={(e) => {
                                const newIsActive = e.target.value === 'Hoạt động';
                                setStaff({ ...staff, isActive: newIsActive, active: newIsActive });
                            }}
                        >
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Đã khóa">Đã khóa</option>
                        </select>
                    </div>

                    <div className={cx('actions')}>
                        <button
                            className={cx('btn', 'save-btn')}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                            className={cx('btn', 'lock-btn')}
                            onClick={handleToggleLock}
                        >
                            {isActiveResolved ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm || (() => { })}
                onCancel={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
            />
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

export default StaffDetailPage;

