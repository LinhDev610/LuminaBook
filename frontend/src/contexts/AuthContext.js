import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authStep, setAuthStep] = useState('login'); // 'login', 'register', 'forgot-password', 'verify-code'
    const [registerStep, setRegisterStep] = useState(1); // 1: email, 2: verify, 3: password
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: verify, 3: reset
    const [authRedirectPath, setAuthRedirectPath] = useState(null);

    const openLoginModal = (redirectPath = null) => {
        setAuthStep('login');
        setAuthRedirectPath(redirectPath || null);
        setAuthModalOpen(true);
    };

    const openRegisterModal = () => {
        setAuthStep('register');
        setRegisterStep(1);
        setAuthModalOpen(true);
    };

    const openForgotPasswordModal = () => {
        setAuthStep('forgot-password');
        setForgotPasswordStep(1);
        setAuthModalOpen(true);
    };

    const openVerifyCodeModal = (email, mode) => {
        localStorage.setItem('verifyEmail', email);
        localStorage.setItem('verifyMode', mode);
        setAuthStep('verify-code');
        setAuthModalOpen(true);
    };

    const switchToLogin = () => {
        setAuthStep('login');
        // Đảm bảo modal vẫn mở khi chuyển sang login
        setAuthModalOpen(true);
    };

    const switchToRegister = () => {
        setAuthStep('register');
        // Force set to step 3 if email is verified
        const isVerified = localStorage.getItem('emailVerified') === 'true';
        if (isVerified) {
            setRegisterStep(3);
        }
    };

    const switchToForgotPassword = () => {
        setAuthStep('forgot-password');
        // Force set to step 3 if email is verified
        const isVerified = localStorage.getItem('emailVerified') === 'true';
        if (isVerified) {
            setForgotPasswordStep(3);
        }
    };

    const switchToVerifyCode = (email, mode) => {
        openVerifyCodeModal(email, mode);
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
        setAuthRedirectPath(null);
        // Clear stored data when closing modal
        localStorage.removeItem('verifyEmail');
        localStorage.removeItem('verifyMode');
        localStorage.removeItem('emailVerified');
        localStorage.removeItem('verifiedEmail');
        localStorage.removeItem('verifiedOtp');
    };

    const value = {
        authModalOpen,
        authStep,
        registerStep,
        forgotPasswordStep,
        openLoginModal,
        openRegisterModal,
        openForgotPasswordModal,
        openVerifyCodeModal,
        switchToLogin,
        switchToRegister,
        switchToForgotPassword,
        switchToVerifyCode,
        closeAuthModal,
        authRedirectPath,
        setAuthRedirectPath,
        setAuthStep,
        setRegisterStep,
        setForgotPasswordStep,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};