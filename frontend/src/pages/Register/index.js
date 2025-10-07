import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import visibleIcon from "../../assets/icons/icons8-visible.png";
import invisibleIcon from "../../assets/icons/icons8-invisible.png";
import "../../assets/styles/Auth/Login.css";

const API_BASE_URL = "http://localhost:8080/identity";

export default function Register() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [step, setStep] = useState(state?.verified ? 2 : 1);

    const [email, setEmail] = useState(state?.email || "");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [agree, setAgree] = useState(false);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}&mode=register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (response.ok && data.code === 200) {
                navigate("/verify-code", { state: { mode: "register", email } });
            } else {
                const msg = data.message || "Không thể gửi mã code. Vui lòng thử lại.";
                setError(msg === "Email đã được sử dụng" ? "Email đã được sử dụng" : msg);
            }
        } catch (err) {
            setError("Có lỗi xảy ra khi gửi mã code. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agree) return setError("Hãy đồng ý điều khoản");
        if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
        if (password !== confirm) return setError("Mật khẩu không khớp");
        setIsLoading(true);
        setError("");
        try {
            const payload = {
                username: (email || "").trim(),
                password: password,
                firstName: (username || "").trim(),
            };
            const resp = await fetch(`${API_BASE_URL}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && (data?.result || data?.code === 200)) {
                try {
                    const loginResp = await fetch(`${API_BASE_URL}/auth/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: (email || "").trim(), password }),
                    });
                    const loginData = await loginResp.json().catch(() => ({}));
                    if (loginResp.ok && loginData?.result?.token) {
                        localStorage.setItem("token", loginData.result.token);
                        localStorage.setItem("displayName", (username || "").trim() || (email || "").trim());
                        navigate("/");
                    } else {
                        navigate("/login");
                    }
                } catch (_) {
                    navigate("/login");
                }
            } else {
                const message = data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
                setError(message === "User existed" ? "Tài khoản đã tồn tại" : message);
            }
        } catch (err) {
            setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-box" style={{ height: "auto", paddingTop: 60, paddingBottom: 60, width: 560 }}>
                <div className="forgot-header">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">←</button>
                    <h2 className="forgot-title">Đăng ký</h2>
                </div>
                {step === 1 ? (
                    <form onSubmit={handleSendEmail}>
                        <div className="form-group">
                            <label>Địa chỉ Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" />
                        </div>
                        <p className="sub-text" style={{ marginTop: -6 }}>Mã xác nhận sẽ được gửi đến địa chỉ email của bạn.</p>
                        {error && (
                            <div style={{ textAlign: "center", color: "#ff4d4f", marginBottom: 16, fontSize: 14 }}>
                                {error}
                            </div>
                        )}
                        <button type="submit" className="login-btn" style={{ background: "#fff", color: "#111", border: "1px solid #111", fontWeight: 600 }} disabled={isLoading}>
                            {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Tên đăng nhập</label>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập" />
                        </div>
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
                        <div className="form-group" style={{ marginTop: 8, marginBottom: 16 }}>
                            <label className="agreement">
                                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                                <span>Tôi đồng ý với các điều khoản và chính sách bảo mật</span>
                            </label>
                        </div>
                        {error && <div style={{ color: "#ff4d4f", textAlign: "center", marginBottom: 16 }}>{error}</div>}
                        <button type="submit" className="login-btn">Đăng ký</button>
                    </form>
                )}
            </div>
        </div>
    );
}


