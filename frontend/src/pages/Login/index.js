import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/Auth/Login.css";
import visibleIcon from "../../assets/Icon/icons8-visible.png";
import invisibleIcon from "../../assets/Icon/icons8-invisible.png";

const API_BASE_URL = "http://localhost:8080/identity";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const payload = {
                username: email.trim(),
                password: password,
            };
            const resp = await fetch(`${API_BASE_URL}/auth/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data?.result?.token) {
                localStorage.setItem("token", data.result.token);
                try {
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: { Authorization: `Bearer ${data.result.token}` },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const displayName = meData?.result?.firstName || meData?.result?.username || payload.username;
                    localStorage.setItem("displayName", displayName);
                } catch (_) {
                    localStorage.setItem("displayName", payload.username);
                }
                navigate("/");
            } else {
                setError("Tài khoản hoặc mật khẩu không đúng");
            }
        } catch (err) {
            setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Đăng nhập</h2>
                <p className="sub-text">
                    Bạn chưa có tài khoản? <a href="/register">Đăng ký</a>
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Nhập email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                style={{ background: "transparent", border: "none", padding: 0 }}
                            >
                                <img src={showPassword ? invisibleIcon : visibleIcon} alt={showPassword ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </button>
                        </div>
                    </div>

                    <div className="extra-options">
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="/forgot-password" className="forgot-link">
                            Forgot Password ?
                        </a>
                    </div>

                    {error && (
                        <div style={{ color: "#ff4d4f", textAlign: "center", marginBottom: 12 }}>{error}</div>
                    )}
                    <button type="submit" className="login-btn">
                        {isLoading ? "Đang đăng nhập..." : "Log In"}
                    </button>
                </form>
            </div>
        </div>
    );
}


