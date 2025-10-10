import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import './Auth.css';
import visibleIcon from '../../assets/styles/Icon/icons8-visible.png';
import invisibleIcon from '../../assets/styles/Icon/icons8-invisible.png';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function LoginModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const [token, setToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                setToken(data.result.token);
                try {
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: {
                            Authorization: `Bearer ${data.result.token}`,
                        },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const displayNameValue =
                        meData?.result?.firstName ||
                        meData?.result?.username ||
                        payload.username;
                    setDisplayName(displayNameValue);
                } catch (_) {
                    setDisplayName(payload.username);
                }
                onClose?.();
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
        <div className="auth-modal" role="dialog" aria-modal="true">
            <div className="auth-card">
                <div className="auth-header">
                    <button
                        className="auth-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                    <h3 className="auth-title">Đăng nhập</h3>
                </div>
                <p className="auth-subtext">
                    Bạn chưa có tài khoản?{' '}
                    <Link to="/register" onClick={onClose}>
                        Đăng ký
                    </Link>
                </p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@domain.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="pw-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="********"
                                required
                            />
                            <button
                                type="button"
                                className="pw-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={
                                    showPassword
                                        ? 'Ẩn mật khẩu'
                                        : 'Hiện mật khẩu'
                                }
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                }}
                            >
                                <img
                                    src={
                                        showPassword
                                            ? invisibleIcon
                                            : visibleIcon
                                    }
                                    alt={showPassword ? 'Ẩn' : 'Hiện'}
                                    style={{ width: 20, height: 20 }}
                                />
                            </button>
                        </div>
                    </div>
                    {error && <div className="error-text">{error}</div>}
                    <div className="auth-row">
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <Link
                            className="auth-link"
                            to="/forgot-password"
                            onClick={onClose}
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
