// RegisterModal Component
// Modal đăng ký với form đầy đủ

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import Button from '../../Common/Button';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function RegisterModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToLogin } = useAuth();
    const [token, setToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [agree, setAgree] = useState(false);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!open) return null;

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(
                    email,
                )}&mode=register`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
            );
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setStep(2);
            } else {
                const msg =
                    data.message || 'Không thể gửi mã code. Vui lòng thử lại.';
                setError(
                    msg === 'Email đã được sử dụng'
                        ? 'Email đã được sử dụng'
                        : msg,
                );
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi gửi mã code. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agree) return setError('Hãy đồng ý điều khoản');
        if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
        if (password !== confirm) return setError('Mật khẩu không khớp');
        setIsLoading(true);
        setError('');
        try {
            const payload = {
                username: (email || '').trim(),
                password,
                firstName: (username || '').trim(),
            };
            const resp = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && (data?.result || data?.code === 200)) {
                try {
                    const loginResp = await fetch(
                        `${API_BASE_URL}/auth/token`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: (email || '').trim(),
                                password,
                            }),
                        },
                    );
                    const loginData = await loginResp.json().catch(() => ({}));
                    if (loginResp.ok && loginData?.result?.token) {
                        setToken(loginData.result.token);
                        setDisplayName(
                            (username || '').trim() || (email || '').trim(),
                        );
                        onClose?.();
                        navigate(0);
                    } else {
                        onClose?.();
                        navigate('/login');
                    }
                } catch (_) {
                    onClose?.();
                    navigate('/login');
                }
            } else {
                const message =
                    data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
                setError(
                    message === 'User existed'
                        ? 'Tài khoản đã tồn tại'
                        : message,
                );
            }
        } catch (err) {
            setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    // If used as standalone page, return page version
    if (open === undefined) {
        return (
            <div className="forgot-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
                <div className="forgot-box" style={{ background: '#fff', padding: '60px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', width: '560px', maxWidth: '90%' }}>
                    <div className="forgot-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <Button
                            className="back-btn"
                            onClick={() => navigate(-1)}
                            aria-label="Quay lại"
                            style={{ position: 'absolute', left: 0, background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                        >
                            ←
                        </Button>
                        <h2 className="forgot-title" style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Đăng ký</h2>
                    </div>
                    {step === 1 ? (
                        <form onSubmit={handleSendEmail}>
                            <div className="form-group" style={{ marginBottom: '15px', marginTop: '30px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#555' }}>Địa chỉ Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@domain.com"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                                />
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '14px', color: '#555', marginTop: '-6px' }}>Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.</p>
                            {error && (
                                <div style={{ textAlign: 'center', color: '#ff4d4f', marginBottom: '16px', fontSize: '14px' }}>
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                style={{ width: '100%', padding: '20px', background: '#fff', color: '#111', border: '1px solid #111', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '15px', marginTop: '30px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#555' }}>Tên đăng nhập</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Tên đăng nhập"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#555' }}>Mật khẩu</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={show1 ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="********"
                                        style={{ width: '100%', padding: '12px', paddingRight: '42px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setShow1(!show1)}
                                        aria-label={show1 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 0 }}
                                    >
                                        <img
                                            src={show1 ? invisibleIcon : visibleIcon}
                                            alt={show1 ? 'Ẩn' : 'Hiện'}
                                            style={{ width: 20, height: 20 }}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#555' }}>Xác nhận mật khẩu</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={show2 ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                                        placeholder="********"
                                        style={{ width: '100%', padding: '12px', paddingRight: '42px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setShow2(!show2)}
                                        aria-label={show2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 0 }}
                                    >
                                        <img
                                            src={show2 ? invisibleIcon : visibleIcon}
                                            alt={show2 ? 'Ẩn' : 'Hiện'}
                                            style={{ width: 20, height: 20 }}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '8px', marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#333' }}>
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                    />
                                    <span>Tôi đồng ý với các điều khoản và chính sách bảo mật</span>
                                </label>
                            </div>
                            {error && <div style={{ color: '#ff4d4f', textAlign: 'center', marginBottom: '16px' }}>{error}</div>}
                            <Button
                                type="submit"
                                style={{ width: '100%', padding: '20px', background: '#2E2E2E', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Đăng ký
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // Modal version
    return (
        <div>
            <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Đăng ký</h3>
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
                Đã có tài khoản?{' '}
                <button 
                    onClick={switchToLogin}
                    style={{ background: 'none', border: 'none', color: '#0077ff', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Đăng nhập
                </button>
            </p>
            {step === 1 ? (
                <form onSubmit={handleSendEmail}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@domain.com"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                            required
                        />
                    </div>
                    {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
                    <Button
                        type="submit"
                        style={{ width: '100%', padding: '12px', background: '#2E2E2E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên hiển thị</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tên hiển thị"
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={show1 ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="********"
                                style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                            <Button
                                type="button"
                                onClick={() => setShow1(!show1)}
                                aria-label={show1 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 0 }}
                            >
                                <img src={show1 ? invisibleIcon : visibleIcon} alt={show1 ? 'Ẩn' : 'Hiện'} style={{ width: 20, height: 20 }} />
                            </Button>
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Xác nhận mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={show2 ? 'text' : 'password'}
                                value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                                placeholder="********"
                                style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1px solid #ddd', borderRadius: '5px' }}
                            />
                            <Button
                                type="button"
                                onClick={() => setShow2(!show2)}
                                aria-label={show2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: 0 }}
                            >
                                <img src={show2 ? invisibleIcon : visibleIcon} alt={show2 ? 'Ẩn' : 'Hiện'} style={{ width: 20, height: 20 }} />
                            </Button>
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                            Tôi đồng ý với điều khoản
                        </label>
                    </div>
                    {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
                    <Button
                        type="submit"
                        style={{ width: '100%', padding: '12px', background: '#2E2E2E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                    </Button>
                </form>
            )}
        </div>
    );
}