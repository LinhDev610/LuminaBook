import { useAuth } from '../contexts/AuthContext';
import LoginModal from './Auth/Login/LoginModal';
import RegisterModal from './Auth/Register/RegisterModal';
import ForgotPasswordModal from './Auth/ForgotPassword/ForgotPasswordModal';
import VerifyCodeModal from './Auth/VerifyCode/VerifyCodeModal';
import classNames from 'classnames/bind';
import styles from './AuthModals.module.scss';

const cx = classNames.bind(styles);

export default function AuthModals() {
    const {
        authModalOpen,
        authStep,
        closeAuthModal,
    } = useAuth();

    if (!authModalOpen) return null;

    return (
        <div className={cx('auth-modal-overlay')}>
            <div className={cx('auth-modal-content')}>
                {authStep === 'login' && (
                    <LoginModal
                        open={true}
                        onClose={closeAuthModal}
                    />
                )}
                {authStep === 'register' && (
                    <RegisterModal
                        open={true}
                        onClose={closeAuthModal}
                    />
                )}
                {authStep === 'forgot-password' && (
                    <ForgotPasswordModal
                        open={true}
                        onClose={closeAuthModal}
                    />
                )}
                {authStep === 'verify-code' && (
                    <VerifyCodeModal
                        open={true}
                        onClose={closeAuthModal}
                    />
                )}
            </div>
        </div>
    );
}
