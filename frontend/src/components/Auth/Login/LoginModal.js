import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import Button from '../../Common/Button';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function LoginModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToRegister, switchToForgotPassword } = useAuth();
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
                navigate('/');
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
            <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Đăng nhập</h3>
                <Button
                    onClick={onClose}
                    aria-label="Đóng"
                    type="button"
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                >
                    ×
                </Button>
            </div>
            <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                Bạn chưa có tài khoản?{' '}
                <button 
                    onClick={switchToRegister}
                    style={{ background: 'none', border: 'none', color: '#0077ff', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Đăng ký
                </button>
            </p>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1px solid #ddd', borderRadius: '5px' }}
                            required
                        />
                        <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                            }}
                        >
                            <img
                                src={showPassword ? invisibleIcon : visibleIcon}
                                alt={showPassword ? 'Ẩn' : 'Hiện'}
                                style={{ width: 20, height: 20 }}
                            />
                        </Button>
                    </div>
                </div>
                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <label>
                        <input type="checkbox" /> Nhớ tài khoản
                    </label>
                    <button
                        onClick={switchToForgotPassword}
                        style={{ background: 'none', border: 'none', color: '#0077ff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Quên mật khẩu?
                    </button>
                </div>
                <Button
                    type="submit"
                    style={{ width: '100%', padding: '12px', background: '#2E2E2E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
        </div>
    );
}
