import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../Layout/Header";
import Footer from "../../Layout/Footer";
import useLocalStorage from "../../../hooks/useLocalStorage";
import styles from "../Login/LoginModal.module.scss";
import visibleIcon from "../../../assets/icons/icon-visible.png";
import invisibleIcon from "../../../assets/icons/icon-invisible.png";
import Button from "../../Common/Button";

const API_BASE_URL = "http://localhost:8080/identity";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [token, setToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName] = useLocalStorage('displayName', null);

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
                setToken(data.result.token);
                try {
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: { Authorization: `Bearer ${data.result.token}` },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const displayNameValue = meData?.result?.firstName || meData?.result?.username || payload.username;
                    setDisplayName(displayNameValue);
                } catch (_) {
                    setDisplayName(payload.username);
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
        <div>
            <Header />
            <div className={styles['login-container']}>
                <div className={styles['login-box']}>
                <h2>Đăng nhập</h2>
                <p className={styles['sub-text']}>
                    Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </p>
                <form onSubmit={handleSubmit}>
                    <div className={styles['form-group']}>
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Nhập email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles['form-group']}>
                        <label>Password</label>
                        <div className={styles['password-wrapper']}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button
                                type="button"
                                className={styles['toggle-password']}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                style={{ background: "transparent", border: "none", padding: 0 }}
                            >
                                <img src={showPassword ? invisibleIcon : visibleIcon} alt={showPassword ? "Ẩn" : "Hiện"} style={{ width: 20, height: 20 }} />
                            </Button>
                        </div>
                    </div>

                    <div className={styles['extra-options']}>
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <Link to="/forgot-password" className={styles['forgot-link']}>
                            Forgot Password ?
                        </Link>
                    </div>

                    {error && (
                        <div style={{ color: "#ff4d4f", textAlign: "center", marginBottom: 12 }}>{error}</div>
                    )}
                    <Button type="submit" className={styles['login-btn']}>
                        {isLoading ? "Đang đăng nhập..." : "Log In"}
                    </Button>
                </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}


