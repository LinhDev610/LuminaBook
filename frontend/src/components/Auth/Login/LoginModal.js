import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail, getUserRole, getApiBaseUrl } from '../../../services/utils';
import { login, refreshToken as refreshTokenAPI, getMyInfo } from '../../../services';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import Button from '../../Common/Button';
import Notification from '../../Common/Notification/Notification';
import classNames from 'classnames/bind';
import styles from './LoginModal.module.scss';

const cx = classNames.bind(styles);

export default function LoginModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToRegister, switchToForgotPassword, authRedirectPath, setAuthRedirectPath } = useAuth();
    const [token, setToken] = useLocalStorage('token', null);
    const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage(
        'refreshToken',
        null,
    );
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);
    const [savedEmail, setSavedEmail, removeSavedEmail] = useLocalStorage(
        'savedEmail',
        null,
    );
    const [email, setEmail] = useState(savedEmail || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(!!savedEmail);
    const [error, setError] = useState('');
    const [notif, setNotif] = useState({ open: false, type: 'error', title: '', message: '', duration: 3000 });
    const [isLoading, setIsLoading] = useState(false);

    // Function to refresh token using backend endpoint
    const refreshTokenIfNeeded = async () => {
        if (!refreshToken) return false;
        try {
            const { ok, data: responseData } = await refreshTokenAPI(refreshToken);
            if (ok && responseData?.token) {
                setToken(responseData.token);
                setRefreshToken(responseData.token);
                return true;
            }
        } catch (err) {
            console.log('Token refresh failed:', err);
        }
        return false;
    };

    // Auto-refresh token when component mounts (for Remember Me)
    useEffect(() => {
        if (refreshToken && !token) {
            refreshTokenIfNeeded();
        }
    }, []);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter' && open) {
                handleSubmit(event);
            }
        };

        if (open) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [open, email, password]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailEmpty = !email || email.trim() === '';
        const passwordEmpty = !password || password.trim() === '';

        // Kiểm tra cả 2 trường cùng lúc
        if (emailEmpty && passwordEmpty) {
            setError('Vui lòng nhập địa chỉ email và mật khẩu');
            return;
        }

        // Validation bình thường cho tất cả tài khoản
        if (emailEmpty) {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }

        // console.log('Email validation check:', { email: email.trim(), isValid: isValidEmail(email) });

        if (!isValidEmail(email)) {
            setError('Email sai định dạng');
            return;
        }

        if (passwordEmpty) {
            setError('Vui lòng nhập mật khẩu');
            return;
        }

        setError('');
        setIsLoading(true);

        let roleRedirectPath = null;
        try {
            const payload = { email: email.trim(), password };
            // console.log('Login attempt with:', { email: email.trim(), password: password ? '***' : 'empty' });

            const { ok, data: loginData, status } = await login(payload);
            // console.log('Login response:', { ok, hasToken: !!loginData?.token });

            if (ok && loginData?.token) {
                // Handle Remember Me
                if (rememberMe) {
                    setToken(loginData.token);
                    setRefreshToken(loginData.token);
                    setSavedEmail(email.trim());
                } else {
                    sessionStorage.setItem('token', loginData.token);
                    removeSavedEmail();
                    removeRefreshToken();
                }

                try {
                    // console.log('Calling /users/my-info with token:', loginData.token);
                    const meData = await getMyInfo(loginData.token);
                    // console.log('API call result:', meData);

                    // Debug: Log API response để kiểm tra cấu trúc
                    // console.log('API Response:', meData);

                    // Check account active status (default true nếu backend không trả field)
                    const rawActive = meData?.isActive ?? meData?.active;
                    let isActive = true;
                    if (rawActive !== undefined && rawActive !== null) {
                        if (typeof rawActive === 'boolean') isActive = rawActive;
                        else if (typeof rawActive === 'number') isActive = rawActive === 1;
                        else if (typeof rawActive === 'string')
                            isActive = ['true', '1', 'active'].includes(rawActive.toLowerCase());
                    }

                    if (!isActive) {
                        // Locked account: do not persist token, show popup, keep modal open
                        localStorage.removeItem('token');
                        sessionStorage.removeItem('token');
                        removeRefreshToken();
                        setNotif({
                            open: true,
                            type: 'error',
                            title: 'Tài khoản bị khóa',
                            message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
                            duration: 4000,
                        });
                        setIsLoading(false);
                        return;
                    }

                    // Persist token only after confirming the account is active
                    if (rememberMe) {
                        setToken(loginData.token);
                        setRefreshToken(loginData.token);
                        setSavedEmail(email.trim());
                    } else {
                        sessionStorage.setItem('token', loginData.token);
                        removeSavedEmail();
                        removeRefreshToken();
                    }
                    // Notify app about token change so headers can re-render immediately
                    window.dispatchEvent(new Event('tokenUpdated'));

                    // Thử nhiều cách để lấy displayName
                    const displayNameValue =
                        meData?.fullName ||
                        meData?.username ||
                        meData?.displayName ||
                        email.trim();

                    // console.log('Display Name Value:', displayNameValue);
                    // console.log('Setting displayName to localStorage...');
                    setDisplayName(displayNameValue);
                    // console.log('DisplayName set successfully');

                    // Dispatch custom event to notify header
                    window.dispatchEvent(new CustomEvent('displayNameUpdated'));

                    // Kiểm tra nếu là admin thì chuyển hướng đến trang admin
                    const userRole = await getUserRole(getApiBaseUrl(), loginData.token);

                    // console.log('User Role:', userRole);
                    // console.log('Full meData structure:', JSON.stringify(meData, null, 2));

                    if (userRole === 'ADMIN') {
                        roleRedirectPath = '/admin';
                    } else if (userRole === 'CUSTOMER_SUPPORT') {
                        roleRedirectPath = '/customer-support';
                    } else if (userRole === 'STAFF') {
                        roleRedirectPath = '/staff';
                    }

                    // console.log('Role not matched for admin/staff, redirecting to home page');
                } catch (error) {
                    // console.log('Error fetching user info:', error);
                    // console.log('Setting fallback displayName to email:', email.trim());
                    setDisplayName(email.trim());

                    // Dispatch custom event to notify header
                    window.dispatchEvent(new CustomEvent('displayNameUpdated'));
                }

                const fallbackRedirect = authRedirectPath || '/';
                const finalRedirect = roleRedirectPath || fallbackRedirect;
                onClose?.();
                navigate(finalRedirect, { replace: true });
                setAuthRedirectPath(null);
            } else {
                // Xử lý các trường hợp lỗi đăng nhập
                const code = loginData?.code;
                const message = loginData?.message || '';

                // Tài khoản bị khóa (backend trả ACCOUNT_LOCKED)
                if (code === 1006 || message.toLowerCase().includes('tài khoản của bạn đã bị khóa')) {
                    setError('');
                    setNotif({
                        open: true,
                        type: 'error',
                        title: 'Tài khoản bị khóa',
                        message: message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.',
                        duration: 4000,
                    });
                } else if (status === 401 || code === 1005) {
                    // Sai tài khoản / mật khẩu
                    setError('Tài khoản hoặc mật khẩu không đúng');
                } else {
                    // Các lỗi khác (ví dụ server trả 400 với message riêng)
                    setError(message || 'Không thể đăng nhập. Vui lòng thử lại.');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className={cx('auth-header')}>
                <h3 className={cx('auth-title')}>Đăng nhập</h3>
                <Button
                    onClick={onClose}
                    aria-label="Đóng"
                    type="button"
                    className={cx('auth-close')}
                >
                    ×
                </Button>
            </div>
            <p className={cx('auth-subtext')}>
                Bạn chưa có tài khoản?{' '}
                <button onClick={switchToRegister} className={cx('auth-link')}>
                    Đăng ký
                </button>
            </p>
            <form onSubmit={handleSubmit} className={cx('auth-form')} noValidate>
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Email</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error && e.target.value.trim() !== '') {
                                setError('');
                            }
                        }}
                        placeholder="email@domain.com"
                        className={cx('form-input')}
                    />
                </div>
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Mật khẩu</label>
                    <div className={cx('pw-wrap')}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error && e.target.value.trim() !== '') {
                                    setError('');
                                }
                            }}
                            placeholder="********"
                            className={cx('form-input', 'pw-input')}
                        />
                        <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            className={cx('pw-toggle')}
                        >
                            <img
                                src={showPassword ? invisibleIcon : visibleIcon}
                                alt={showPassword ? 'Ẩn' : 'Hiện'}
                                className={cx('pw-icon')}
                            />
                        </Button>
                    </div>
                </div>
                {error && <div className={cx('error-text')}>{error}</div>}
                <div className={cx('auth-row')}>
                    <label className={cx('remember-me')}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Ghi nhớ đăng nhập
                    </label>
                    <button onClick={switchToForgotPassword} className={cx('auth-link')}>
                        Quên mật khẩu?
                    </button>
                </div>
                <Button type="submit" className={cx('auth-submit')} disabled={isLoading}>
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
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
