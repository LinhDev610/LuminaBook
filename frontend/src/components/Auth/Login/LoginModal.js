import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail } from '../../../services/utils';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';
import styles from './LoginModal.module.scss';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

export default function LoginModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToRegister, switchToForgotPassword } = useAuth();
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
    const [isLoading, setIsLoading] = useState(false);

    // Function to refresh token using backend endpoint
    const refreshTokenIfNeeded = async () => {
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken }),
            });

            const data = await response.json();
            if (response.ok && data?.result?.token) {
                setToken(data.result.token);
                setRefreshToken(data.result.token);
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

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || email.trim() === '') {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Email sai định dạng');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const payload = { username: email.trim(), password };
            const resp = await fetch(`${API_BASE_URL}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data?.result?.token) {
                // Handle Remember Me
                if (rememberMe) {
                    // Lưu token và refresh token vào localStorage (persistent)
                    setToken(data.result.token);
                    setRefreshToken(data.result.token);
                    setSavedEmail(email.trim());
                } else {
                    // Chỉ lưu token vào sessionStorage (temporary)
                    sessionStorage.setItem('token', data.result.token);
                    removeSavedEmail();
                    removeRefreshToken();
                }

                try {
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: {
                            Authorization: `Bearer ${data.result.token}`,
                        },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const displayNameValue =
                        meData?.result?.fullName ||
                        meData?.result?.username ||
                        payload.username;
                    setDisplayName(displayNameValue);
                } catch (_) {
                    setDisplayName(payload.username);
                }

                onClose?.();
                // Force refresh to update Header
                navigate(0);
            } else {
                setError('Tài khoản hoặc mật khẩu không đúng');
            }
        } catch (err) {
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
            <form onSubmit={handleSubmit} className={cx('auth-form')}>
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Email</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className={cx('form-input')}
                        required
                    />
                </div>
                <div className={cx('form-group')}>
                    <label className={cx('form-label')}>Mật khẩu</label>
                    <div className={cx('pw-wrap')}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className={cx('form-input', 'pw-input')}
                            required
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
        </div>
    );
}
