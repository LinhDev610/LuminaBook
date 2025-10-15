// RegisterModal Component
// Modal đăng ký với form đầy đủ

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail } from '../../../services/utils';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import iconBack from '../../../assets/icons/icon_back.png';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';
import styles from './RegisterModal.module.scss';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

export default function RegisterModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToLogin } = useAuth();
    const [token, setToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);
    const [step, setStep] = useState(1); // 1: email, 2: verify, 3: register
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // verify code state
    const [values, setValues] = useState(['', '', '', '', '', '']);
    const inputsRef = useRef([]);
    const [seconds, setSeconds] = useState(60);
    const code = useMemo(() => values.join(''), [values]);

    // register state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [agree, setAgree] = useState(false);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);

    useEffect(() => {
        if (!open) return;
        setStep(1);
        setEmail('');
        setError('');
        setIsLoading(false);
        setValues(['', '', '', '', '', '']);
        setSeconds(60);
        setUsername('');
        setPassword('');
        setConfirm('');
        setAgree(false);
    }, [open]);

    useEffect(() => {
        if (seconds > 0) {
            const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [seconds]);

    const onChangeDigit = (index, value) => {
        if (value.length > 1) return;
        const newValues = [...values];
        newValues[index] = value;
        setValues(newValues);
        setError('');

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const onKeyDownDigit = (index, e) => {
        if (e.key === 'Backspace' && !values[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    if (!open) return null;

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!email || email.trim() === '') {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Email sai định dạng');
            return;
        }
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

    const verifyOtp = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Vui lòng nhập đầy đủ 6 chữ số');
            return;
        }

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
                // Xử lý lỗi OTP cụ thể
                if (data.code === 1010 || (data.message && data.message.includes('OTP'))) {
                    setError('Mã OTP không đúng, yêu cầu nhập lại');
                } else {
                    setError(data.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
                }
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const resend = async () => {
        if (seconds > 0) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}&mode=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setValues(['', '', '', '', '', '']);
                inputsRef.current[0]?.focus();
                setSeconds(60);
            } else {
                setError(data.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi gửi lại mã. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agree) return setError('Hãy đồng ý điều khoản');
        // Password policy: 8-32 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special
        if (password.length < 8) return setError('Mật khẩu quá ngắn, tối thiểu 8 ký tự');
        if (password.length > 32) return setError('Mật khẩu quá dài, tối đa 32 ký tự');
        const hasAnyWhitespace = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/.test(password);
        const confirmHasWhitespace = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/.test(confirm);
        if (hasAnyWhitespace || confirmHasWhitespace) return setError('Mật khẩu không được chứa khoảng trắng.');
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        if (!(hasLowercase && hasUppercase && hasDigit && hasSpecial)) {
            return setError('Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa,1 số và 1 kí tự đặc biệt');
        }
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
                // If current password contains whitespace, always prefer FE message
                const whitespaceRegex = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/;
                if (whitespaceRegex.test(password)) {
                    setError('Mật khẩu không được chứa khoảng trắng.');
                    return;
                }
                const code = data?.code;
                if (code === 1004 || (data?.message || '').includes('INVALID_PASSWORD')) {
                    setError('Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa,1 số và 1 kí tự đặc biệt');
                } else {
                    const message = data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
                    setError(message === 'User existed' ? 'Tài khoản đã tồn tại' : message);
                }
            }
        } catch (err) {
            setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };


    // Modal version
    return (
        <div>
            <div className={cx('auth-header')}>
                {step === 1 ? (
                    <Button
                        onClick={switchToLogin}
                        aria-label="Quay lại đăng nhập"
                        type="button"
                        className={styles['auth-back']}
                    >
                        <img src={iconBack} alt="Quay lại đăng nhập" className={styles['back-icon']} />
                    </Button>
                ) : step === 2 ? (
                    <Button
                        onClick={() => setStep(step - 1)}
                        aria-label="Quay lại bước trước"
                        type="button"
                        className={styles['auth-back']}
                    >
                        <img src={iconBack} alt="Quay lại bước trước" className={styles['back-icon']} />
                    </Button>
                ) : (
                    <Button
                        onClick={onClose}
                        aria-label="Đóng"
                        type="button"
                        className={cx('auth-close')}
                    >
                        ×
                    </Button>
                )}
                <h3 className={cx('auth-title')}>Đăng ký</h3>
            </div>
            {/* Subtext sẽ hiển thị bên dưới nút ở Bước 1 */}
            {step === 1 && (
                <form onSubmit={handleSendEmail} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Địa chỉ Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@domain.com"
                            className={cx('form-input')}
                        />
                    </div>
                    <p className={cx('helper-text')}>Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.</p>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    <Button
                        type="submit"
                        className={cx('auth-submit', 'auth-submit--nohover')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                    </Button>
                    <p className={cx('auth-subtext', 'auth-subtext--below')}>
                        Đã có tài khoản?{' '}
                        <button 
                            onClick={switchToLogin}
                            type="button"
                            className={cx('auth-link')}
                        >
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
            
            {step === 2 && (
                <form onSubmit={verifyOtp} className={cx('auth-form')}>
                    <p className={cx('auth-subtext')}>Nhập mã gồm 6 chữ số đã được gửi tới {email}</p>
                    <div className={cx('otp-container')}>
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
                                className={cx('otp-input')}
                            />
                        ))}
                    </div>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    {seconds === 0 ? (
                        <div className={cx('resend-container')}>
                            <span className={cx('resend-text')}>Bạn không nhận được mã code</span>
                            <Button
                                onClick={resend}
                                className={cx('resend-btn')}
                            >
                                Gửi lại
                            </Button>
                        </div>
                    ) : (
                        <div className={cx('countdown')}>Gửi lại sau 00:{seconds.toString().padStart(2, '0')}</div>
                    )}
                    <Button
                        type="submit"
                        className={cx('auth-submit')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </form>
            )}
            
            {step === 3 && (
                <form onSubmit={handleSubmit} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Tên hiển thị</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tên hiển thị"
                            className={cx('form-input')}
                        />
                    </div>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Mật khẩu</label>
                        <div className={cx('pw-wrap')}>
                            <input
                                type={show1 ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="********"
                                className={cx('form-input', 'pw-input')}
                            />
                            <Button
                                type="button"
                                onClick={() => setShow1(!show1)}
                                aria-label={show1 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                className={cx('pw-toggle')}
                            >
                                <img src={show1 ? invisibleIcon : visibleIcon} alt={show1 ? 'Ẩn' : 'Hiện'} className={cx('pw-icon')} />
                            </Button>
                        </div>
                    </div>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Xác nhận mật khẩu</label>
                        <div className={cx('pw-wrap')}>
                            <input
                                type={show2 ? 'text' : 'password'}
                                value={confirm}
                                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                                placeholder="********"
                                className={cx('form-input', 'pw-input')}
                            />
                            <Button
                                type="button"
                                onClick={() => setShow2(!show2)}
                                aria-label={show2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                className={cx('pw-toggle')}
                            >
                                <img src={show2 ? invisibleIcon : visibleIcon} alt={show2 ? 'Ẩn' : 'Hiện'} className={cx('pw-icon')} />
                            </Button>
                        </div>
                    </div>
                    <div className={cx('form-group')}>
                        <label className={cx('agree')}>
                            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                            Tôi đồng ý với điều khoản
                        </label>
                    </div>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    <Button
                        type="submit"
                        className={cx('auth-submit')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                    </Button>
                </form>
            )}
        </div>
    );
}