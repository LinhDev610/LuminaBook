import { useAuth } from '../contexts/AuthContext';
import LoginModal from './Auth/Login/LoginModal';
import RegisterModal from './Auth/Register/RegisterModal';
import ForgotPasswordModal from './Auth/ForgotPassword/ForgotPasswordModal';
import './Auth/Auth.module.scss';

export default function AuthModals() {
    const {
        authModalOpen,
        authStep,
        closeAuthModal,
    } = useAuth();

    if (!authModalOpen) return null;

    return (
        <div className="auth-modal">
            <div className="auth-card">
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
            </div>
        </div>
    );
}
