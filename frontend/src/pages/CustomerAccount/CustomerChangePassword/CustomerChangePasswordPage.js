import { useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerChangePasswordPage.module.scss';
import useLocalStorage from '../../../hooks/useLocalStorage';
import lockIcon from '../../../assets/icons/icon_lock.png';
import Notification from '../../../components/Common/Notification/Notification';
import iconVisible from '../../../assets/icons/icon-visible.png';
import iconInvisible from '../../../assets/icons/icon-invisible.png';
import { changePassword } from '../../../services';

const cx = classNames.bind(styles);

export default function CustomerChangePasswordPage() {
    const [token] = useLocalStorage('token', null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState({ open: false, type: 'success', title: '', message: '', duration: 2500 });

    const getStoredToken = useMemo(() => () => {
        try {
            const prefer = localStorage.getItem('token') ?? sessionStorage.getItem('token');
            if (!prefer) return null;
            let parsed = prefer;
            if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('[') || (parsed.startsWith('"') && parsed.endsWith('"')))) {
                try { parsed = JSON.parse(parsed); } catch (_) { }
            }
            if (parsed && typeof parsed === 'object') {
                // common shapes: { token: '...' } or { result: { token: '...' } }
                const obj = parsed;
                const candidate = obj.token || obj.accessToken || obj.result?.token || obj.result?.accessToken;
                return typeof candidate === 'string' ? candidate : null;
            }
            return typeof parsed === 'string' ? parsed : null;
        } catch (_e) {
            return sessionStorage.getItem('token');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!currentPassword || !newPassword) {
            setNotif({ open: true, type: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập đủ các trường', duration: 3000 });
            return;
        }
        if (newPassword !== confirmPassword) {
            setNotif({ open: true, type: 'error', title: 'Không khớp', message: 'Mật khẩu xác nhận không khớp', duration: 3000 });
            return;
        }
        try {
            setLoading(true);
            const tk = (typeof token === 'string' ? token : null) || getStoredToken();
            if (!tk) {
                setNotif({ open: true, type: 'error', title: 'Chưa đăng nhập', message: 'Vui lòng đăng nhập trước khi đổi mật khẩu', duration: 3000 });
                setLoading(false);
                return;
            }
            const { ok, data } = await changePassword({ currentPassword, newPassword }, tk);
            if (ok && (data?.code === 200 || data?.code === 1000)) {
                setNotif({ open: true, type: 'success', title: 'Thành công', message: 'Đổi mật khẩu thành công', duration: 2500 });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setNotif({ open: true, type: 'error', title: 'Thất bại', message: data?.message || 'Đổi mật khẩu thất bại', duration: 3000 });
            }
        } catch (err) {
            setNotif({ open: true, type: 'error', title: 'Lỗi', message: 'Có lỗi xảy ra, vui lòng thử lại', duration: 3000 });
        }
        finally { setLoading(false); }
    };

    return (
        <section className={cx('panel')}>
            <div className={cx('title-row')}>
                <img src={lockIcon} alt="lock" className={cx('title-icon')} />
                <h3 className={cx('panel-title')}>Đổi mật khẩu</h3>
            </div>
            <form onSubmit={handleSubmit} className={cx('form')}>
                <div className={cx('form-group')}>
                    <label>Mật khẩu hiện tại</label>
                    <div className={cx('input-wrap')}>
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            className={cx('input')}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="****************"
                        />
                        <button type="button" className={cx('eye')} onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                            <img src={showCurrent ? iconInvisible : iconVisible} alt={showCurrent ? 'Ẩn' : 'Hiện'} />
                        </button>
                    </div>
                </div>
                <div className={cx('form-group')}>
                    <label>Mật khẩu mới</label>
                    <div className={cx('input-wrap')}>
                        <input
                            type={showNew ? 'text' : 'password'}
                            className={cx('input')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="****************"
                        />
                        <button type="button" className={cx('eye')} onClick={() => setShowNew((v) => !v)} aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                            <img src={showNew ? iconInvisible : iconVisible} alt={showNew ? 'Ẩn' : 'Hiện'} />
                        </button>
                    </div>
                </div>
                <div className={cx('form-group')}>
                    <label>Xác nhận mật khẩu mới</label>
                    <div className={cx('input-wrap')}>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            className={cx('input')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="****************"
                        />
                        <button type="button" className={cx('eye')} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                            <img src={showConfirm ? iconInvisible : iconVisible} alt={showConfirm ? 'Ẩn' : 'Hiện'} />
                        </button>
                    </div>
                </div>
                {message && <div className={cx('hint')}>{message}</div>}
                <div className={cx('form-actions')}>
                    <button
                        type="button"
                        className={cx('secondary')}
                        onClick={() => {
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setShowCurrent(false);
                            setShowNew(false);
                            setShowConfirm(false);
                            setMessage('');
                            setNotif({ open: false, type: 'success', title: '', message: '', duration: 2500 });
                        }}
                    >
                        Hủy
                    </button>
                    <button className={cx('primary')} disabled={loading}>Cập nhật mật khẩu</button>
                </div>
            </form>
            <Notification open={notif.open} type={notif.type} title={notif.title} message={notif.message} duration={notif.duration} onClose={() => setNotif((n) => ({ ...n, open: false }))} />
        </section>
    );
}
