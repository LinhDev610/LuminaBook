import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail, validatePassword } from '../../../services/utils';
import styles from './ForgotPasswordModal.module.scss';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

export default function ForgotPasswordModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const { switchToLogin, switchToVerifyCode, forgotPasswordStep, setForgotPasswordStep } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // reset password state
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    useEffect(() => {
        if (!open) return;
        
        // Check if we have a verified email from localStorage
        const verifiedEmail = localStorage.getItem('verifiedEmail');
        const isVerified = localStorage.getItem('emailVerified') === 'true';
        
        if (isVerified && verifiedEmail) {
            // If email is verified, set email and go to step 3
            setEmail(verifiedEmail);
            setForgotPasswordStep(3);
        } else {
            // If not verified, start from step 1
            setForgotPasswordStep(1);
            setEmail('');
        }
        
        setError('');
        setIsLoading(false);
        setPassword('');
        setConfirm('');
    }, [open]);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter' && open) {
                if (forgotPasswordStep === 1) {
                    sendOtp(event);
                } else if (forgotPasswordStep === 3) {
                    resetPassword(event);
                }
            }
        };

        if (open) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [open, forgotPasswordStep, email, password, confirm]);

    // remove early return here to keep hooks order consistent

    const sendOtp = async (e) => {
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
            // Gửi OTP với mode=forgot để backend tự động kiểm tra email tồn tại
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}&mode=forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            
            if (response.ok && data.code === 200) {
                // Switch to verify code modal
                switchToVerifyCode(email, 'forgot-password');
            } else {
                setError(data.message || 'Không thể gửi mã code. Vui lòng thử lại.');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi kiểm tra email. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };


    const resetPassword = async (e) => {
        e.preventDefault();
        
        // Validate password using utility function
        const passwordValidation = validatePassword(password, confirm);
        if (!passwordValidation.isValid) {
            return setError(passwordValidation.error);
        }
        
        setIsLoading(true);
        setError('');
        try {
            const verifiedOtp = localStorage.getItem('verifiedOtp');
            const resp = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: verifiedOtp, newPassword: password }),
            });
            const data = await resp.json();
            if (resp.ok && data?.code === 200) {
                // Đổi mật khẩu thành công, chuyển về form đăng nhập
                setForgotPasswordStep(1);
                setEmail('');
                setPassword('');
                setConfirm('');
                switchToLogin();
            } else {
                // Handle backend validation errors
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
                    setForgotPasswordStep(1);
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
            {forgotPasswordStep === 1 && (
                <form onSubmit={sendOtp} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@example"
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
                        {isLoading ? 'Đang gửi...' : 'Gửi mã code'}
                    </Button>
                    <p className={cx('auth-subtext')}>
                        Nhớ mật khẩu?{' '}
                        <button 
                            onClick={switchToLogin}
                            className={cx('auth-link')}
                        >
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
            {forgotPasswordStep === 3 && (
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
                    <p className={cx('auth-subtext')}>
                        Nhớ mật khẩu?{' '}
                        <button 
                            onClick={switchToLogin}
                            className={cx('auth-link')}
                        >
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
        </div>
    );
}
