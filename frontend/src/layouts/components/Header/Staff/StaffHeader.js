import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import styles from './StaffHeader.module.scss';
import adminHeaderStyles from '../Admin/AdminHeader.module.scss';
import { getStoredToken, getMyNotifications } from '../../../../services';

const cx = classNames.bind(styles);
const cxModal = classNames.bind(adminHeaderStyles);

function StaffHeader() {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('displayName');
        sessionStorage.removeItem('token');
        navigate('/', { replace: true });
    };

    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const token = getStoredToken('token');
                if (!token) {
                    setUnreadCount(0);
                    return;
                }
                const result = await getMyNotifications(token);
                if (!isMounted) return;
                if (result.ok && Array.isArray(result.data)) {
                    const unread = result.data.filter((n) => !n.isRead && !n.readAt).length;
                    setUnreadCount(unread);
                } else {
                    setUnreadCount(0);
                }
            } catch (error) {
                if (isMounted) {
                    setUnreadCount(0);
                }
            } finally {
                if (isMounted) {
                    setLoadingNotifications(false);
                }
            }
        };

        fetchNotifications();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            <header className={cx('header')}>
                <h2 className={cx('title')}>Bảng điều khiển</h2>
                <div className={cx('actions')}>
                    <button 
                        className={cx('btn', 'btn-secondary')} 
                        onClick={() => navigate('/staff/notifications')}
                    >
                        Thông báo
                        {loadingNotifications ? null : unreadCount > 0 && (
                            <span className={cx('badge')}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
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

export default StaffHeader;


