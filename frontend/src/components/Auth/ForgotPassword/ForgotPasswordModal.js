import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { isValidEmail, validatePassword } from '../../../services/utils';
import { resetPassword as resetPasswordAPI, sendOTP } from '../../../services';
import styles from './ForgotPasswordModal.module.scss';
import Button from '../../Common/Button';
import classNames from 'classnames/bind';
import visibleIcon from '../../../assets/icons/icon-visible.png';
import invisibleIcon from '../../../assets/icons/icon-invisible.png';

const cx = classNames.bind(styles);

export default function ForgotPasswordModal({ open = false, onClose }) {
    const navigate = useNavigate();
    const {
        switchToLogin,
        switchToVerifyCode,
        forgotPasswordStep,
        setForgotPasswordStep,
    } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // reset password state
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [open]);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter' && open) {
                if (forgotPasswordStep === 1) {
                    sendOtp(event);
                } else if (forgotPasswordStep === 3) {
                    handleResetPassword(event);
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
            const { ok, data } = await sendOTP(email, 'forgot');
            if (ok && data.code === 200) {
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

    const handleResetPassword = async (e) => {
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
            if (!verifiedOtp) {
                setError('Mã OTP không hợp lệ. Vui lòng xác thực lại email.');
                setForgotPasswordStep(1);
                setIsLoading(false);
                return;
            }
            
            console.log('🔍 Resetting password for email:', email, 'with OTP:', verifiedOtp ? '***' : 'missing');
            const { ok, data, status } = await resetPasswordAPI({ email, otp: verifiedOtp, newPassword: password });
            console.log('🔍 Reset password response:', { ok, status, data, dataCode: data?.code, dataMessage: data?.message });
            
            // Backend returns code 200 for success (not 1000)
            // Check both HTTP status and response code
            if (ok && (data?.code === 200 || data?.code === 1000 || status === 200)) {
                // Đổi mật khẩu thành công, chuyển về form đăng nhập
                // Clear verification data
                localStorage.removeItem('verifiedEmail');
                localStorage.removeItem('emailVerified');
                localStorage.removeItem('verifiedOtp');
                
                setForgotPasswordStep(1);
                setEmail('');
                setPassword('');
                setConfirm('');
                setShowPassword(false);
                setShowConfirmPassword(false);
                switchToLogin();
            } else {
                // Handle backend validation errors
                const code = data?.code || status;
                let errorMessage =
                    data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
                    
                console.error('🔍 Reset password failed:', { code, errorMessage, data, status });
                
                if (code === 1004 || (errorMessage || '').includes('INVALID_PASSWORD')) {
                    errorMessage =
                        'Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa, 1 số và 1 kí tự đặc biệt';
                }

                // Kiểm tra nếu user không tồn tại
                if (
                    errorMessage.includes('User not found') ||
                    errorMessage.includes('User not existed') ||
                    errorMessage.includes('User không tồn tại')
                ) {
                    setError(
                        'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email và thử lại từ đầu.',
                    );
                    // Reset về step 1 để user nhập lại email
                    setForgotPasswordStep(1);
                    setEmail('');
                } else {
                    setError(errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại.');
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
                <Button onClick={onClose} aria-label="Đóng" className={cx('auth-close')}>
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
                    <p className={cx('auth-description')}>
                        Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.
                    </p>
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
                        <button onClick={switchToLogin} className={cx('auth-link')}>
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
            {forgotPasswordStep === 3 && (
                <form onSubmit={handleResetPassword} className={cx('auth-form')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Mật khẩu mới</label>
                        <div className={cx('pw-wrap')}>
                        <input
                                type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="********"
                                className={cx('form-input', 'pw-input')}
                            />
                            <Button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                className={cx('pw-toggle')}
                            >
                                <img
                                    src={showPassword ? invisibleIcon : visibleIcon}
                                    alt={showPassword ? 'Ẩn' : 'Hiện'}
                                    className={cx('pw-icon')}
                        />
                            </Button>
                        </div>
                    </div>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Xác nhận mật khẩu</label>
                        <div className={cx('pw-wrap')}>
                        <input
                                type={showConfirmPassword ? 'text' : 'password'}
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value);
                                setError('');
                            }}
                            placeholder="********"
                                className={cx('form-input', 'pw-input')}
                            />
                            <Button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                className={cx('pw-toggle')}
                            >
                                <img
                                    src={showConfirmPassword ? invisibleIcon : visibleIcon}
                                    alt={showConfirmPassword ? 'Ẩn' : 'Hiện'}
                                    className={cx('pw-icon')}
                        />
                            </Button>
                        </div>
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
                        <button onClick={switchToLogin} className={cx('auth-link')}>
                            Đăng nhập
                        </button>
                    </p>
                </form>
            )}
        </div>
    );
}
