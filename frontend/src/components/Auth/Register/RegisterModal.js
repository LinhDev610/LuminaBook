// RegisterModal Component
// Modal đăng ký với form đầy đủ

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import './Auth.css';
import visibleIcon from '../../assets/styles/Icon/icons8-visible.png';
import invisibleIcon from '../../assets/styles/Icon/icons8-invisible.png';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function RegisterModal({ open = false, onClose }) {
    const navigate = useNavigate();
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
                    <h3 className="auth-title">Đăng ký</h3>
                </div>
                {step === 1 ? (
                    <form className="auth-form" onSubmit={handleSendEmail}>
                        <div className="form-group">
                            <label>Địa chỉ Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@domain.com"
                                required
                            />
                        </div>
                        {error && <div className="error-text">{error}</div>}
                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Tên hiển thị</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Tên hiển thị"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu</label>
                            <div className="pw-wrap">
                                <input
                                    type={show1 ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="********"
                                />
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShow1(!show1)}
                                    aria-label={
                                        show1 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                                    }
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                    }}
                                >
                                    <img
                                        src={
                                            show1 ? invisibleIcon : visibleIcon
                                        }
                                        alt={show1 ? 'Ẩn' : 'Hiện'}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu</label>
                            <div className="pw-wrap">
                                <input
                                    type={show2 ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={(e) => {
                                        setConfirm(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="********"
                                />
                                <button
                                    type="button"
                                    className="pw-toggle"
                                    onClick={() => setShow2(!show2)}
                                    aria-label={
                                        show2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                                    }
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                    }}
                                >
                                    <img
                                        src={
                                            show2 ? invisibleIcon : visibleIcon
                                        }
                                        alt={show2 ? 'Ẩn' : 'Hiện'}
                                        style={{ width: 20, height: 20 }}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="agree">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                />{' '}
                                Tôi đồng ý với điều khoản
                            </label>
                        </div>
                        {error && <div className="error-text">{error}</div>}
                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
