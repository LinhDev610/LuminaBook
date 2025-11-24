import { useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import styles from './CustomerSupportHeader.module.scss';
import adminHeaderStyles from '../Admin/AdminHeader.module.scss';

const cx = classNames.bind(styles);
const cxModal = classNames.bind(adminHeaderStyles);

function CustomerSupportHeader() {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('displayName');
        sessionStorage.removeItem('token');
        navigate('/', { replace: true });
    };

    return (
        <>
            <header className={cx('header')}>
                <h2 className={cx('title')}>Bảng điều khiển</h2>
                <div className={cx('actions')}>
                    <button 
                        className={cx('btn', 'btn-secondary')} 
                        onClick={() => navigate('/customer-support/notifications')}
                    >
                        Thông báo
                    </button>
                    <button className={cx('btn', 'btn-danger')} onClick={() => setShowLogoutConfirm(true)}>
                        Đăng xuất
                    </button>
                </div>
            </header>
            {showLogoutConfirm && (
                <div className={cxModal('modal-overlay')} role="dialog" aria-modal="true">
                    <div className={cxModal('modal')}>
                        <h3 className={cxModal('modal-title')}>Đăng xuất tài khoản?</h3>
                        <p className={cxModal('modal-desc')}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className={cxModal('modal-actions')}>
                            <button className={cxModal('btn', 'btn-muted')} onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                            <button className={cxModal('btn', 'btn-primary')} onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CustomerSupportHeader;

