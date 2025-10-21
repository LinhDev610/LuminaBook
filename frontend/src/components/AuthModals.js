import { useAuth } from '../contexts/AuthContext';
import LoginModal from './Auth/Login/LoginModal';
import RegisterModal from './Auth/Register/RegisterModal';
import ForgotPasswordModal from './Auth/ForgotPassword/ForgotPasswordModal';
import VerifyCodeModal from './Auth/VerifyCode/VerifyCodeModal';

export default function AuthModals() {
    const {
        authModalOpen,
        authStep,
        closeAuthModal,
    } = useAuth();

    if (!authModalOpen) return null;

    return (
        <div className="auth-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="auth-modal-content" style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '20px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
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
