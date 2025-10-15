import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../Login/LoginModal.module.scss";
import Button from "../../Common/Button";
import iconBack from '../../../assets/icons/icon_back.png';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const API_BASE_URL = "http://localhost:8080/lumina_book";

export default function VerifyCode() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email || "";
    const mode = state?.mode || "recover";

    const [values, setValues] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputsRef = useRef([]);
    const [seconds, setSeconds] = useState(60);

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
                if (mode === "register") {
                    navigate("/register", { state: { verified: true, email } });
                } else {
                    navigate("/reset-password", { state: { email, otp: code } });
                }
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
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}`, {
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

    return (
        <div className={styles['forgot-container']}>
            <div className={styles['forgot-box']} style={{ height: "auto", paddingTop: 60, paddingBottom: 60 }}>
            <div className={styles['forgot-header']}>
                <Button 
                    className={styles['auth-back']} 
                    onClick={() => navigate(-1)} 
                    aria-label="Quay lại"
                >
                    <img src={iconBack} alt="Quay lại" className={styles['back-icon']} />
                </Button>
                <h2 className={styles['forgot-title']}>Xác nhận mã code</h2>
            </div>
                <p className={styles['sub-text']} style={{ marginBottom: 24 }}>
                    Vui lòng nhập mã xác nhận đã được gửi{email ? ` đến email của bạn (${email}).` : " đến email của bạn vào đây."}
                </p>
                <form onSubmit={handleSubmit}>
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
                                className={cx('otp-input', { 'error': error })}
                            />
                        ))}
                    </div>
                    {error && (
                        <div className={cx('error-text')}>{error}</div>
                    )}
                    {seconds === 0 && (
                        <div className={cx('resend-container')}>
                            <span className={cx('resend-text')}>Bạn không nhận được mã code</span>
                            <Button text onClick={handleResend} className={cx('resend-btn')}>Gửi lại.</Button>
                        </div>
                    )}
                    <Button type="submit" className={cx('auth-submit')} disabled={isLoading}>
                        {isLoading ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                    {seconds > 0 && (
                        <div className={cx('countdown')}>
                            <span>Gửi lại sau</span>
                            <span className={cx('countdown-time')}>{`00:${seconds.toString().padStart(2, "0")}`}</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
