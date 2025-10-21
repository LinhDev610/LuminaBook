import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Button from "../../Common/Button";
import classNames from 'classnames/bind';
import styles from "./VerifyCodeModal.module.scss";

const cx = classNames.bind(styles);

const API_BASE_URL = "http://localhost:8080/lumina_book";

export default function VerifyCodeModal({ open = false, onClose }) {
    const { 
        authStep, 
        switchToLogin, 
        switchToRegister, 
        switchToForgotPassword,
        setAuthStep 
    } = useAuth();
    
    const [values, setValues] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputsRef = useRef([]);
    const [seconds, setSeconds] = useState(60);
    const [email, setEmail] = useState("");
    const [mode, setMode] = useState("register");

    useEffect(() => {
        if (!open) return;
        
        // Reset state when modal opens
        setValues(["", "", "", "", "", ""]);
        setError("");
        setIsLoading(false);
        setSeconds(60);
        
        // Get email and mode from AuthContext or props
        // This will be set by the parent component (Register/ForgotPassword)
        const storedEmail = localStorage.getItem('verifyEmail');
        const storedMode = localStorage.getItem('verifyMode');
        if (storedEmail) setEmail(storedEmail);
        if (storedMode) setMode(storedMode);
    }, [open]);

    useEffect(() => {
        const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, []);

    const code = useMemo(() => values.join(""), [values]);

    const onChange = (idx, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...values];
        next[idx] = val;
        setValues(next);
        if (error) setError("");
        if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
    };

    const onKeyDown = (idx, e) => {
        if (e.key === "Backspace" && !values[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                // Store verification success
                localStorage.setItem('emailVerified', 'true');
                localStorage.setItem('verifiedEmail', email);
                localStorage.setItem('verifiedOtp', code);
                    // Use setTimeout to ensure localStorage is set before switching
                setTimeout(() => {
                    if (mode === "register") {
                        switchToRegister(); // Go back to register step 3 (password)
                    } else {
                        switchToForgotPassword(); // Go back to forgot password step 3 (reset password)
                    }
                }, 100);
            } else {
                // Xử lý lỗi OTP cụ thể
                if (data.code === 1010 || (data.message && data.message.includes('OTP'))) {
                    setError('Mã OTP không đúng, yêu cầu nhập lại');
                } else {
                    setError(data.message || "Mã code sai, vui lòng nhập lại mã code.");
                }
            }
        } catch (err) {
            setError("Có lỗi xảy ra khi xác thực mã code. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (seconds > 0) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}&mode=${mode}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                setValues(["", "", "", "", "", ""]);
                inputsRef.current[0]?.focus();
                setSeconds(60);
                setError("");
            } else {
                setError(data.message || "Không thể gửi lại mã code. Vui lòng thử lại.");
            }
        } catch (err) {
            setError("Có lỗi xảy ra khi gửi lại mã code. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (mode === "register") {
            switchToRegister();
        } else {
            switchToForgotPassword();
        }
    };

    if (!open) return null;

    return (
        <div className={cx('verify-container')}>
            <Button 
                onClick={handleBack}
                className={cx('back-button')}
            >
                ←
            </Button>
            
            <div className={cx('verify-content')}>
                <h1 className={cx('verify-title')}>Xác nhận mã code</h1>
                
                <p className={cx('verify-description')}>
                    Vui lòng nhập mã xác nhận đã được gửi đến email của bạn vào đây.
                </p>
                
                <form onSubmit={handleSubmit} className={cx('verify-form')}>
                    <div className={cx('otp-container')}>
                        {values.map((v, i) => (
                            <input
                                key={i}
                                ref={(el) => (inputsRef.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={v}
                                onChange={(e) => onChange(i, e.target.value)}
                                onKeyDown={(e) => onKeyDown(i, e)}
                                className={cx('otp-input', { 
                                    'active': i === 0 && !v, 
                                    'filled': v,
                                    'error': error 
                                })}
                            />
                        ))}
                    </div>
                    
                    {error && (
                        <div className={cx('error-text')}>{error}</div>
                    )}
                    
                    <Button 
                        type="submit" 
                        className={cx('verify-submit')} 
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                    
                    <div className={cx('resend-section')}>
                        {seconds > 0 ? (
                            <span className={cx('countdown-text')}>
                                Gửi lại sau <span className={cx('countdown-time')}>{`00:${seconds.toString().padStart(2, "0")}`}</span>
                            </span>
                        ) : (
                            <div className={cx('resend-container')}>
                                <span className={cx('resend-text')}>Bạn không nhận được mã code</span>
                                <button 
                                    type="button"
                                    onClick={handleResend} 
                                    className={cx('resend-button')}
                                >
                                    Gửi lại.
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}