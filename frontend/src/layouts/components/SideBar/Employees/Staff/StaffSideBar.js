import classNames from 'classnames/bind';
import styles from './StaffSideBar.module.scss';
import useLocalStorage from '../../../../../hooks/useLocalStorage';
import avatarFallback from '../../../../../assets/icons/icon_img_guest.png';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getApiBaseUrl, getUserRole } from '../../../../../services/utils';

const cx = classNames.bind(styles);

const API_BASE_URL = getApiBaseUrl();

export default function StaffSideBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [displayName] = useLocalStorage('displayName', null);
    const [tokenLS] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');
    const token = useMemo(() => {
        // Ưu tiên sessionToken (không bị stringify)
        if (sessionToken) return sessionToken;
        // Nếu dùng localStorage, parse nếu bị stringify
        if (tokenLS) {
            try {
                const raw = localStorage.getItem('token');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return typeof parsed === 'string' ? parsed : tokenLS;
                }
            } catch (_) { }
            return tokenLS;
        }
        return null;
    }, [tokenLS, sessionToken]);
    const [profile, setProfile] = useState({ name: displayName || 'Người dùng', role: '' });

    useEffect(() => {
        let isMounted = true;
        const fetchMe = async () => {
            if (!token) return;
            try {
                // Đảm bảo token là string
                let tokenToUse = token;
                if (typeof tokenToUse !== 'string') {
                    tokenToUse = String(tokenToUse);
                }

                const resp = await fetch(`${API_BASE_URL}/users/my-info`, {
                    headers: {
                        Authorization: `Bearer ${tokenToUse}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await resp.json().catch(() => ({}));
                if (!isMounted) return;
                const name =
                    data?.result?.fullName ||
                    data?.fullName ||
                    displayName ||
                    data?.result?.username ||
                    data?.username ||
                    'Người dùng';
                const rawRole = await getUserRole(API_BASE_URL, tokenToUse);
                const role = rawRole === 'CUSTOMER_SUPPORT' ? 'Chăm sóc khách hàng' : 'Nhân viên';
                setProfile({ name, role });
            } catch (_e) {
                // keep fallback state
            }
        };
        fetchMe();
        const syncDisplayName = () => {
            setProfile((prev) => ({
                ...prev,
                name: localStorage.getItem('displayName') || prev.name,
            }));
            fetchMe();
        };
        window.addEventListener('displayNameUpdated', syncDisplayName);
        return () => {
            isMounted = false;
            window.removeEventListener('displayNameUpdated', syncDisplayName);
        };
    }, [token, displayName]);

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className={cx('side')}>
            <div className={cx('panel-title')}>Hệ thống - Nhân viên</div>
            <div className={cx('profile')} onClick={() => navigate('/staff')}>
                <img src={avatarFallback} alt="avatar" className={cx('avatar')} />
                <div className={cx('info')}>
                    <div className={cx('name')} title={profile.name}>{profile.name}</div>
                    <div className={cx('role')}>{profile.role}</div>
                </div>
            </div>
            <ul className={cx('menu')}>
                <li>
                    <NavLink to="/staff/products" className={cx('link', { active: isActive('/staff/products') })}>
                        Quản lý sản phẩm
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/staff/content" className={cx('link', { active: isActive('/staff/content') })}>
                        Quản lý nội dung
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/staff/vouchers" className={cx('link', { active: isActive('/staff/vouchers-promotions') })}>
                        Voucher & Khuyến mãi
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/staff/orders" className={cx('link', { active: isActive('/staff/orders') })}>
                        Đơn hàng
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/staff/profile" className={cx('link', { active: isActive('/staff/profile') })}>
                        Hồ sơ cá nhân
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}


