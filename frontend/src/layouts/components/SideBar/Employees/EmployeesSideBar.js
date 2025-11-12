import classNames from 'classnames/bind';
import styles from './EmployeesSideBar.module.scss';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import avatarFallback from '../../../../assets/icons/icon_defaultAva.png';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getApiBaseUrl, getUserRole } from '../../../../services/utils';

const cx = classNames.bind(styles);

const API_BASE_URL = getApiBaseUrl();

export default function EmployeesSideBar({ 
    title, 
    homePath, 
    menuItems, 
    roleDisplay 
}) {
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
                const role = roleDisplay ? roleDisplay(rawRole) : '';
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
    }, [token, displayName, roleDisplay]);

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className={cx('side')}>
            <div className={cx('panel-title')}>{title}</div>
            <div className={cx('profile')} onClick={() => navigate(homePath)}>
                <img src={avatarFallback} alt="avatar" className={cx('avatar')} />
                <div className={cx('info')}>
                    <div className={cx('name')} title={profile.name}>{profile.name}</div>
                    <div className={cx('role')}>{profile.role}</div>
                </div>
            </div>
            <ul className={cx('menu')}>
                {menuItems.map((item, index) => (
                    <li key={index}>
                        <NavLink 
                            to={item.path} 
                            className={cx('link', { active: isActive(item.path) })}
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}

