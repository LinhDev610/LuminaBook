// RegisterModal Component
// Modal đăng ký với form đầy đủ

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail, validatePassword } from '../../../services/utils';
import '../Auth.module.scss';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';
import styles from './RegisterModal.module.scss';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

export default function RegisterModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToLogin, switchToVerifyCode, registerStep, setRegisterStep } = useAuth();
    const [token, setToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // register state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [agree, setAgree] = useState(false);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);

    useEffect(() => {
        if (!open) return;
        
        // Check if we have a verified email from localStorage
        const verifiedEmail = localStorage.getItem('verifiedEmail');
        const isVerified = localStorage.getItem('emailVerified') === 'true';
        
        if (isVerified && verifiedEmail) {
            // If email is verified, set email and go to step 3
            setEmail(verifiedEmail);
            setRegisterStep(3);
        } else {
            // If not verified, start from step 1
            setRegisterStep(1);
            setEmail('');
        }
        
        setError('');
        setIsLoading(false);
        setUsername('');
        setPassword('');
        setConfirm('');
        setAgree(false);
    }, [open]);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter' && open) {
                if (registerStep === 1) {
                    handleSendEmail(event);
                } else if (registerStep === 3) {
                    handleSubmit(event);
                }
            }
        };

        if (open) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [open, registerStep, email, username, password, confirm]);

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
                // Switch to verify code modal
                switchToVerifyCode(email, 'register');
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
        
        // Validate password using utility function
        const passwordValidation = validatePassword(password, confirm);
        if (!passwordValidation.isValid) {
            return setError(passwordValidation.error);
        }
        
        setIsLoading(true);
        setError('');
        try {
            const payload = {
                email: (email || '').trim(),
                password,
                fullName: (username || '').trim(),
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
                                email: (email || '').trim(),
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
                // Handle backend validation errors
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

    // If used as standalone page, return page version
    if (open === undefined) {
        return (
            <div className={cx('standalone-container')}>
                <div className={cx('standalone-box')}>
                    <div className={cx('standalone-header')}>
                        <Button
                            className={cx('standalone-back-btn')}
                            onClick={() => navigate(-1)}
                            aria-label="Quay lại"
                        >
                            ←
                        </Button>
                        <h2 className={cx('standalone-title')}>Đăng ký</h2>
                    </div>
                    {registerStep === 1 ? (
                        <form onSubmit={handleSendEmail}>
                            <div className={cx('standalone-form-group')}>
                                <label className={cx('standalone-label')}>Địa chỉ Email</label>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@domain.com"
                                    className={cx('standalone-input')}
                                />
                            </div>
                            <p className={cx('standalone-description')}>Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.</p>
                            {error && (
                                <div className={cx('standalone-error')}>
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className={cx('standalone-submit')}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className={cx('standalone-form-group')}>
                                <label className={cx('standalone-label')}>Tên đăng nhập</label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Tên đăng nhập"
                                    className={cx('standalone-input')}
                                />
                            </div>
                            <div className={cx('standalone-password-group')}>
                                <label className={cx('standalone-label')}>Mật khẩu</label>
                                <div className={cx('standalone-password-wrapper')}>
                                    <input
                                        type={show1 ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="********"
                                        className={cx('standalone-password-input')}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setShow1(!show1)}
                                        aria-label={show1 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        className={cx('standalone-password-toggle')}
                                    >
                                        <img
                                            src={show1 ? invisibleIcon : visibleIcon}
                                            alt={show1 ? 'Ẩn' : 'Hiện'}
                                            className={cx('standalone-password-icon')}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <div className={cx('standalone-password-group')}>
                                <label className={cx('standalone-label')}>Xác nhận mật khẩu</label>
                                <div className={cx('standalone-password-wrapper')}>
                                    <input
                                        type={show2 ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                                        placeholder="********"
                                        className={cx('standalone-password-input')}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => setShow2(!show2)}
                                        aria-label={show2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        className={cx('standalone-password-toggle')}
                                    >
                                        <img
                                            src={show2 ? invisibleIcon : visibleIcon}
                                            alt={show2 ? 'Ẩn' : 'Hiện'}
                                            className={cx('standalone-password-icon')}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <div className={cx('standalone-checkbox-group')}>
                                <label className={cx('standalone-checkbox-label')}>
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                    />
                                    <span>Tôi đồng ý với các điều khoản và chính sách bảo mật</span>
                                </label>
                            </div>
                            {error && <div className={cx('standalone-error')}>{error}</div>}
                            <Button
                                type="submit"
                                className={cx('standalone-submit-dark')}
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
            <div className={cx('auth-header')}>
                <h3 className={cx('auth-title')}>Đăng ký</h3>
                <Button
                    onClick={onClose}
                    aria-label="Đóng"
                    type="button"
                    className={cx('auth-close')}
                >
                    ×
                </Button>
            </div>
            {registerStep === 1 && (
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
                    <p className={cx('auth-description')}>Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.</p>
                    {error && <div className={cx('error-text')}>{error}</div>}
                    <Button
                        type="submit"
                        className={cx('auth-submit')}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                    </Button>
                    <p className={cx('auth-subtext')}>
                        Đã có tài khoản?{' '}
                        <button 
                            onClick={switchToLogin}
                            className={cx('auth-link')}
                        >
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
            
            {registerStep === 3 && (
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