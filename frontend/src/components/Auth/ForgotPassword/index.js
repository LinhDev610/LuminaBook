import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Layout/Header";
import Footer from "../../Layout/Footer";
import "../../assets/styles/Auth/ForgotPassword.css";

const API_BASE_URL = "http://localhost:8080/identity";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp?email=${encodeURIComponent(email)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok && data.code === 200) {
                navigate("/verify-code", { state: { email, mode: "recover" } });
            } else {
                setError(data.message || "Không thể gửi mã code. Vui lòng thử lại.");
            }
        } catch (err) {
            setError("Có lỗi xảy ra khi gửi mã code. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <div className="forgot-container">
                <div className="forgot-card">
                <div className="forgot-header">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Quay lại">←</button>
                    <h2 className="forgot-title">Khôi phục mật khẩu</h2>
                </div>

                <p className="forgot-description">Chúng tôi sẽ gửi cho bạn một mã code qua email để đặt lại mật khẩu.</p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="example@example"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? "Đang gửi..." : "Gửi mã code"}
                    </button>
                </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}


