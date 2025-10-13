import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import visibleIcon from "../../../assets/icons/icon-visible.png";
import invisibleIcon from "../../../assets/icons/icon-invisible.png";
import styles from "../Login/LoginModal.module.scss";
import Button from "../../Common/Button";

const API_BASE_URL = "http://localhost:8080/lumina_book";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email || "";
    const otp = state?.otp || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            navigate("/forgot-password");
        }
    }, [email, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Password policy: 8-32 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special
        if (password.length < 8) return setError("Mật khẩu quá ngắn, tối thiểu 8 ký tự");
        if (password.length > 32) return setError("Mật khẩu quá dài, tối đa 32 ký tự");
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        if (!(hasLowercase && hasUppercase && hasDigit && hasSpecial)) {
            return setError("Mật khẩu ít nhất phải chứa một chữ cái thường, 1 chữ cái in hoa,1 số và 1 kí tự đặc biệt");
        }
        if (password !== confirm) return setError("Mật khẩu không khớp");
        setIsLoading(true);
        setError("");
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword: password }),
            });
            const data = await resp.json();
            if (resp.ok && data?.code === 200) {
                alert("Đặt lại mật khẩu thành công");
                navigate("/login");
            } else {
                setError(data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
            }
        } catch (err) {
            setError("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles['forgot-container']}>
            <div className={styles['forgot-box']} style={{ height: "auto", paddingTop: 60, paddingBottom: 60 }}>
            <div className={styles['forgot-header']}>
                <Button className={styles['back-btn']} text onClick={() => navigate(-1)} aria-label="Quay lại">←</Button>
                <h2 className={styles['forgot-title']}>Đặt lại mật khẩu</h2>
            </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles['form-group']}>
                        <label>Mật khẩu</label>
                        <div className={styles['password-wrapper']}>
                            <input type={show1 ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="********" />
                            <Button className={styles['toggle-password']} text onClick={() => setShow1(!show1)} aria-label={show1 ? "Ẩn mật khẩu" : "Hiện mật khẩu"} style={{ padding: 0 }}>
                                <img src={show1 ? invisibleIcon : visibleIcon} alt={show1 ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </Button>
                        </div>
                    </div>
                    <div className={styles['form-group']}>
                        <label>Xác nhận mật khẩu</label>
                        <div className={styles['password-wrapper']}>
                            <input type={show2 ? "text" : "password"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="********" />
                            <Button className={styles['toggle-password']} text onClick={() => setShow2(!show2)} aria-label={show2 ? "Ẩn mật khẩu" : "Hiện mật khẩu"} style={{ padding: 0 }}>
                                <img src={show2 ? invisibleIcon : visibleIcon} alt={show2 ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </Button>
                        </div>
                    </div>
                    {error && <div style={{ textAlign: "center", color: "#ff4d4f", marginBottom: 16 }}>{error}</div>}
                    <Button type="submit" primary className={styles['login-btn']} disabled={isLoading}>{isLoading ? "Đang xử lý..." : "Xác nhận"}</Button>
                </form>
            </div>
        </div>
    );
}
