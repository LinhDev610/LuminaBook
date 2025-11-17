import classNames from 'classnames/bind';
import styles from './EmployeesSideBar.module.scss';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import avatarFallback from '../../../../assets/icons/icon_defaultAva.png';
import { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getStoredToken, getMyInfo } from '../../../../services';

const cx = classNames.bind(styles);

export default function EmployeesSideBar({ title, homePath, menuItems, roleDisplay }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [displayName] = useLocalStorage('displayName', null);
    const [profile, setProfile] = useState({
        name: displayName || 'Người dùng',
        role: '',
    });

    // Extract role từ user data
    const extractRole = useCallback((userData) => {
        if (!userData) return null;
        return (
            userData?.role?.name ||
            userData?.role ||
            userData?.authorities?.[0]?.authority ||
            null
        );
    }, []);

    // Extract name từ user data
    const extractName = useCallback((userData, fallbackName) => {
        if (!userData) return fallbackName || 'Người dùng';
        return userData?.fullName || userData?.username || fallbackName || 'Người dùng';
    }, []);

    useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();

        const fetchProfile = async () => {
            const currentToken = getStoredToken();
            if (!currentToken) return;

            try {
                const userData = await getMyInfo(currentToken);
                if (!isMounted || abortController.signal.aborted) return;

                const rawRole = extractRole(userData);
                const role = roleDisplay ? roleDisplay(rawRole) : '';
                const name = extractName(userData, displayName);

                setProfile({ name, role });
            } catch (error) {
                // Giữ fallback state nếu có lỗi
                if (!isMounted || abortController.signal.aborted) return;
                console.error('Failed to fetch user profile:', error);
            }
        };

        fetchProfile();

        const syncDisplayName = () => {
            if (!isMounted) return;
            const updatedName = localStorage.getItem('displayName');
            if (updatedName) {
                setProfile((prev) => ({ ...prev, name: updatedName }));
            }
            // Re-fetch để đảm bảo đồng bộ
            fetchProfile();
        };

        window.addEventListener('displayNameUpdated', syncDisplayName);

        return () => {
            isMounted = false;
            abortController.abort();
            window.removeEventListener('displayNameUpdated', syncDisplayName);
        };
    }, [displayName, roleDisplay, extractRole, extractName]);

    const isActive = useCallback(
        (path) => {
            return location.pathname === path || location.pathname.startsWith(`${path}/`);
        },
        [location.pathname],
    );

    const handleProfileClick = useCallback(() => {
        navigate(homePath);
    }, [navigate, homePath]);

    return (
        <div className={cx('side')}>
            <div className={cx('panel-title')}>{title}</div>
            <div className={cx('profile')} onClick={handleProfileClick}>
                <img src={avatarFallback} alt="avatar" className={cx('avatar')} />
                <div className={cx('info')}>
                    <div className={cx('name')} title={profile.name}>
                        {profile.name}
                    </div>
                    <div className={cx('role')}>{profile.role}</div>
                </div>
            </div>
            <ul className={cx('menu')}>
                {menuItems.map((item) => (
                    <li key={item.path}>
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
