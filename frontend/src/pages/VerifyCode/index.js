import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/styles/Auth/Login.css";

const API_BASE_URL = "http://localhost:8080/identity";

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
                setError(data.message || "Mã code sai, vui lòng nhập lại mã code.");
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
        <div className="forgot-container">
            <div className="forgot-box" style={{ height: "auto", paddingTop: 60, paddingBottom: 60 }}>
                <div className="forgot-header">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">←</button>
                    <h2 className="forgot-title">Xác nhận mã code</h2>
                </div>
                <p className="sub-text" style={{ marginBottom: 24 }}>
                    Vui lòng nhập mã xác nhận đã được gửi{email ? ` đến email của bạn (${email}).` : " đến email của bạn vào đây."}
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
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
                                style={{
                                    width: 48,
                                    height: 56,
                                    borderRadius: 10,
                                    border: error ? "1px solid #ff4d4f" : "1px solid #ddd",
                                    textAlign: "center",
                                    fontSize: 20,
                                    outline: "none",
                                }}
                            />
                        ))}
                    </div>
                    {error && (
                        <div style={{ textAlign: "center", color: "#ff4d4f", marginBottom: 16, fontSize: 14 }}>{error}</div>
                    )}
                    {seconds === 0 && (
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <span style={{ color: "#666", marginRight: 6 }}>Bạn không nhận được mã code</span>
                            <button type="button" onClick={handleResend} style={{ background: "transparent", border: "none", color: "#111", fontWeight: 600, cursor: "pointer" }}>Gửi lại.</button>
                        </div>
                    )}
                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? "Đang xử lý..." : "Xác nhận"}
                    </button>
                    {seconds > 0 && (
                        <div style={{ textAlign: "center", marginTop: 16, color: "#666" }}>
                            <span>Gửi lại sau</span>
                            <span style={{ marginLeft: 8 }}>{`00:${seconds.toString().padStart(2, "0")}`}</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}


