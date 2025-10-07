import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function LoginModal({ open = false, onClose }) {
    const navigate = useNavigate();
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
                localStorage.setItem('token', data.result.token);
                try {
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: { Authorization: `Bearer ${data.result.token}` },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const displayName = meData?.result?.firstName || meData?.result?.username || payload.username;
                    localStorage.setItem('displayName', displayName);
                } catch (_) {
                    localStorage.setItem('displayName', payload.username);
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
                    <button className="auth-close" onClick={onClose} aria-label="Đóng">×</button>
                    <h3 className="auth-title">Đăng nhập</h3>
                </div>
                <p className="auth-subtext">
                    Bạn chưa có tài khoản? <a href="/register" onClick={onClose}>Đăng ký</a>
                </p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="pw-wrap">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
                            <span className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
                        </div>
                    </div>
                    {error && <div className="error-text">{error}</div>}
                    <div className="auth-row">
                        <label><input type="checkbox" /> Remember me</label>
                        <a className="auth-link" href="/forgot-password" onClick={onClose}>Quên mật khẩu?</a>
                    </div>
                    <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
                </form>
            </div>
        </div>
    );
}
