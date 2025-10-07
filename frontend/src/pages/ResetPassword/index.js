import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import visibleIcon from "../../assets/icons/icons8-visible.png";
import invisibleIcon from "../../assets/icons/icons8-invisible.png";
import "../../assets/styles/Auth/Login.css";

const API_BASE_URL = "http://localhost:8080/identity";

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
        if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
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
        <div className="forgot-container">
            <div className="forgot-box" style={{ height: "auto", paddingTop: 60, paddingBottom: 60 }}>
                <div className="forgot-header">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">←</button>
                    <h2 className="forgot-title">Đặt lại mật khẩu</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="password-wrapper">
                            <input type={show1 ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="********" />
                            <button type="button" className="toggle-password" onClick={() => setShow1(!show1)} aria-label={show1 ? "Ẩn mật khẩu" : "Hiện mật khẩu"} style={{ background: "transparent", border: "none", padding: 0 }}>
                                <img src={show1 ? invisibleIcon : visibleIcon} alt={show1 ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <div className="password-wrapper">
                            <input type={show2 ? "text" : "password"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="********" />
                            <button type="button" className="toggle-password" onClick={() => setShow2(!show2)} aria-label={show2 ? "Ẩn mật khẩu" : "Hiện mật khẩu"} style={{ background: "transparent", border: "none", padding: 0 }}>
                                <img src={show2 ? invisibleIcon : visibleIcon} alt={show2 ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                    </div>
                    {error && <div style={{ textAlign: "center", color: "#ff4d4f", marginBottom: 16 }}>{error}</div>}
                    <button type="submit" className="login-btn" disabled={isLoading}>{isLoading ? "Đang xử lý..." : "Xác nhận"}</button>
                </form>
            </div>
        </div>
    );
}


