import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerChangePasswordPage.module.scss';
import useLocalStorage from '../../../hooks/useLocalStorage';

const cx = classNames.bind(styles);

export default function CustomerChangePasswordPage() {
    const [token] = useLocalStorage('token', null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword !== confirmPassword) return setMessage('Mật khẩu xác nhận không khớp');
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
                setMessage('Đổi mật khẩu thành công');
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                setMessage(data?.message || 'Đổi mật khẩu thất bại');
            }
        } catch (err) {
            setMessage('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <section className={cx('panel')}>
            <h3 className={cx('panel-title')}>Đổi mật khẩu</h3>
            <form onSubmit={handleSubmit}>
                <div className={cx('form-group')}>
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className={cx('form-group')}>
                    <label>Mật khẩu mới</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className={cx('form-group')}>
                    <label>Xác nhận mật khẩu mới</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {message && <div className={cx('hint')}>{message}</div>}
                <div className={cx('form-actions')}>
                    <button className={cx('primary')}>Cập nhật mật khẩu</button>
                </div>
            </form>
        </section>
    );
}


