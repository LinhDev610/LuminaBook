import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const API_BASE_URL = 'http://localhost:8080/identity';

export default function ForgotPasswordModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: verify, 3: reset
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // verify code state
    const [values, setValues] = useState(['', '', '', '', '', '']);
    const inputsRef = useRef([]);
    const [seconds, setSeconds] = useState(60);
    const code = useMemo(() => values.join(''), [values]);

    // reset password state
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    useEffect(() => {
        if (!open) return;
        setStep(1);
        setEmail('');
        setError('');
        setIsLoading(false);
        setValues(['', '', '', '', '', '']);
        setSeconds(60);
        setPassword('');
        setConfirm('');
    }, [open]);

    // remove early return here to keep hooks order consistent

    const sendOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setStep(2);
                setSeconds(60);
                setTimeout(() => inputsRef.current[0]?.focus(), 0);
            } else {
                setError(data.message || 'Không thể gửi mã code. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi gửi mã code. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

useEffect(() => {
    if (step !== 2) return;
    if (seconds === 0) return;
    const id = setTimeout(() => {
        setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearTimeout(id);
}, [step, seconds]);

    const onChangeDigit = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...values];
        next[idx] = val;
        setValues(next);
        if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
        if (error) setError('');
    };

    const onKeyDownDigit = (idx, e) => {
        if (e.key === 'Backspace' && !values[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        if (code.length !== 6) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setStep(3);
            } else {
                setError(data.message || 'Mã code sai, vui lòng nhập lại mã code.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi xác thực mã code. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const resend = async () => {
        if (seconds > 0) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setValues(['', '', '', '', '', '']);
                inputsRef.current[0]?.focus();
                setSeconds(60);
            } else {
                setError(data.message || 'Không thể gửi lại mã code. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi gửi lại mã code. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
        if (password !== confirm) return setError('Mật khẩu không khớp');
        setIsLoading(true);
        setError('');
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code, newPassword: password }),
            });
            const data = await resp.json();
            if (resp.ok && data?.code === 200) {
                onClose?.();
                navigate('/login');
            } else {
                setError(data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className="auth-modal" role="dialog" aria-modal="true">
            <div className="auth-card">
                <div className="auth-header">
                    <button className="auth-close" onClick={onClose} aria-label="Đóng">×</button>
                    <h3 className="auth-title">Khôi phục mật khẩu</h3>
                </div>
                {step === 1 && (
                    <form className="auth-form" onSubmit={sendOtp}>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example" required />
                        </div>
                        {error && <div className="error-text">{error}</div>}
                        <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Đang gửi...' : 'Gửi mã code'}</button>
                    </form>
                )}
                {step === 2 && (
                    <form className="auth-form" onSubmit={verifyOtp}>
                        <p className="auth-subtext">Nhập mã gồm 6 chữ số đã được gửi tới {email}</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                            {values.map((v, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (inputsRef.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={v}
                                    onChange={(e) => onChangeDigit(i, e.target.value)}
                                    onKeyDown={(e) => onKeyDownDigit(i, e)}
                                    style={{ width: 44, height: 52, textAlign: 'center', fontSize: 18, borderRadius: 8, border: '1px solid #ddd' }}
                                />
                            ))}
                        </div>
                        {error && <div className="error-text">{error}</div>}
                        {seconds === 0 ? (
                            <div style={{ textAlign: 'center', marginBottom: 10 }}>
                                <span style={{ color: '#666', marginRight: 6 }}>Bạn không nhận được mã code</span>
                                <button type="button" onClick={resend} style={{ background: 'transparent', border: 'none', color: '#111', fontWeight: 600, cursor: 'pointer' }}>Gửi lại</button>
                            </div>
                        ) : (
                            <div className="auth-subtext">Gửi lại sau 00:{seconds.toString().padStart(2, '0')}</div>
                        )}
                        <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Xác nhận'}</button>
                    </form>
                )}
                {step === 3 && (
                    <form className="auth-form" onSubmit={resetPassword}>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="********" />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu</label>
                            <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} placeholder="********" />
                        </div>
                        {error && <div className="error-text">{error}</div>}
                        <button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
                    </form>
                )}
            </div>
        </div>
    );
}
