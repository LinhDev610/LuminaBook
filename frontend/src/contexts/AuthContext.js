import React, { createContext, useContext, useState } from 'react';

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
    const [authStep, setAuthStep] = useState('login'); // 'login', 'register', 'forgot-password'

    const openLoginModal = () => {
        setAuthStep('login');
        setAuthModalOpen(true);
    };

    const openRegisterModal = () => {
        setAuthStep('register');
        setAuthModalOpen(true);
    };

    const openForgotPasswordModal = () => {
        setAuthStep('forgot-password');
        setAuthModalOpen(true);
    };

    const switchToLogin = () => {
        setAuthStep('login');
    };

    const switchToRegister = () => {
        setAuthStep('register');
    };

    const switchToForgotPassword = () => {
        setAuthStep('forgot-password');
    };

    const closeAuthModal = () => {
        setAuthModalOpen(false);
    };

    const value = {
        authModalOpen,
        authStep,
        openLoginModal,
        openRegisterModal,
        openForgotPasswordModal,
        switchToLogin,
        switchToRegister,
        switchToForgotPassword,
        closeAuthModal,
        setAuthStep,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};