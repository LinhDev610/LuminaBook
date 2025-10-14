import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ForgotPasswordModal.module.scss';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

export default function ForgotPasswordModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToLogin } = useAuth(); // dùng AuthContext để chuyển về màn đăng nhập
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
        if (!email || email.trim() === '') {
            setError('Vui lòng nhập địa chỉ email');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Bước 1: Kiểm tra email có tồn tại không bằng cách thử đăng nhập với password giả
            // Nếu email không tồn tại, API sẽ trả về lỗi "User not existed"
            const checkUserResponse = await fetch(`${API_BASE_URL}/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: email,
                    password: 'password-to-check-user-exists'
                })
            });
            
            const checkData = await checkUserResponse.json();
            
            // Nếu user không tồn tại (lỗi "User not existed"), báo lỗi
            if (checkData.message && (
                checkData.message.includes('User not existed') ||
                checkData.message.includes('User not found') ||
                checkData.message.includes('User không tồn tại')
            )) {
                setError('Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email.');
                return;
            }
            
            // Nếu user tồn tại (lỗi "Unauthenticated" - sai password), tiếp tục gửi OTP
            if (checkData.message && checkData.message.includes('Unauthenticated')) {
                // User tồn tại nhưng sai password, tiếp tục gửi OTP
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
            } else {
                // Trường hợp khác, thử gửi OTP trực tiếp
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
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi kiểm tra email. Vui lòng thử lại.');
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
                // Xử lý lỗi OTP cụ thể
                if (data.code === 1010 || (data.message && data.message.includes('OTP'))) {
                    setError('Mã OTP không đúng, yêu cầu nhập lại');
                } else {
                    setError(data.message || 'Mã code sai, vui lòng nhập lại mã code.');
                }
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
                // Xử lý các trường hợp lỗi cụ thể
                const errorMessage = data.message || 'Không thể gửi lại mã code. Vui lòng thử lại.';
                
                // Kiểm tra nếu email không tồn tại
                if (errorMessage.includes('User not found') || 
                    errorMessage.includes('Email không tồn tại') ||
                    errorMessage.includes('User not exist') ||
                    errorMessage.includes('Email not found')) {
                    setError('Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email.');
                } else {
                    setError(errorMessage);
                }
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi gửi lại mã code. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        // Password policy: 8-32 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special
        if (password.length < 8) return setError('Mật khẩu quá ngắn, tối thiểu 8 ký tự');
        if (password.length > 32) return setError('Mật khẩu quá dài, tối đa 32 ký tự');
        const hasAnyWhitespace = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/.test(password);
        if (hasAnyWhitespace) return setError('Mật khẩu không được chứa khoảng trắng.');
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
            const resp = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: code, newPassword: password }),
            });
            const data = await resp.json();
            if (resp.ok && data?.code === 200) {
                // Đổi mật khẩu thành công, chuyển về form đăng nhập
                setStep(1);
                setEmail('');
                setPassword('');
                setConfirm('');
                setValues(['', '', '', '', '', '']);
                switchToLogin();
            } else {
                // Xử lý lỗi cụ thể
                const whitespaceRegex = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D]/;
                if (whitespaceRegex.test(password)) {
                    setError('Mật khẩu không được chứa khoảng trắng.');
                    return;
                }
                const code = data?.code;
                let errorMessage = data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
                if (code === 1004 || (errorMessage || '').includes('INVALID_PASSWORD')) {
                    errorMessage = 'Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa, 1 số và 1 kí tự đặc biệt';
                }
                
                // Kiểm tra nếu user không tồn tại
                if (errorMessage.includes('User not found') || 
                    errorMessage.includes('User not existed') ||
                    errorMessage.includes('User không tồn tại')) {
                    setError('Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email và thử lại từ đầu.');
                    // Reset về step 1 để user nhập lại email
                    setStep(1);
                    setEmail('');
                } else {
                    setError(errorMessage);
                }
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div>
            <div className={cx('auth-header')}>
                <h3 className={cx('auth-title')}>Khôi phục mật khẩu</h3>
                <Button
                    onClick={onClose}
                    aria-label="Đóng"
                    className={cx('auth-close')}
                >
                    ×
                </Button>
            </div>
            <p className={cx('auth-subtext')}>
                Nhớ mật khẩu?{' '}
                <button 
                    onClick={switchToLogin}
                    className={cx('auth-link')}
                >
                    Đăng nhập
                </button>
            </p>
            {step === 1 && (
                <form onSubmit={sendOtp} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@example"
                            className={cx('form-input')}
                        />
                    </div>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    <Button
                        type="submit"
                        className={cx('auth-submit')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã code'}
                    </Button>
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
                <form onSubmit={resetPassword} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="********"
                            className={cx('form-input')}
                        />
                    </div>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                            placeholder="********"
                            className={cx('form-input')}
                        />
                    </div>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    <Button
                        type="submit"
                        className={cx('auth-submit')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </Button>
                </form>
            )}
        </div>
    );
}
