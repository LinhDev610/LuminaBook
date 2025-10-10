import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./AccountPage.module.scss";

export default function Account() {
    const navigate = useNavigate();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    const [email, setEmail, removeEmail] = useLocalStorage('email', "user123@gmail.com");
    const [token, setToken, removeToken] = useLocalStorage('token', null);

    const handleLogout = () => {
        removeToken();
        removeDisplayName();
        removeEmail();
        navigate("/");
    };

    return (
        <div className="account-wrapper">
            <Header />
            <nav className="account-nav">
                <button className="nav-trigger" />
                <Link className="active" to="#">TẤT CẢ DANH MỤC</Link>
                <Link to="#">KHUYẾN MÃI</Link>
                <Link to="#">SÁCH MỚI</Link>
                <Link to="#">HỖ TRỢ KHÁCH HÀNG</Link>
                <Link to="#">LIÊN HỆ</Link>
            </nav>
            <div className="account-content">
                <aside className="account-side">
                    <div className="side-profile">
                        <div className="side-avatar" />
                        <div className="side-name">{displayName || "User………12"}</div>
                    </div>
                    <ul className="side-menu">
                        <li className="menu-item active">
                            <img className="mi" src={require('../../assets/icons/icon_user.png')} alt="user" />
                            <span>Thông tin cá nhân</span>
                        </li>
                        <li className="menu-item">
                            <img className="mi" src={require('../../assets/icons/icon_clock.png')} alt="history" />
                            <span>Lịch sử mua hàng</span>
                        </li>
                        <li className="menu-item">
                            <img className="mi" src={require('../../assets/icons/icon_voucher.png')} alt="voucher" />
                            <span>Voucher và khuyến mãi</span>
                        </li>
                        <li className="menu-item">
                            <img className="mi" src={require('../../assets/icons/icon_lock.png')} alt="lock" />
                            <span>Đổi mật khẩu</span>
                        </li>
                        <li className="menu-item" onClick={handleLogout}>
                            <img className="mi" src={require('../../assets/icons/icon_logout.png')} alt="logout" />
                            <span>Đăng xuất</span>
                        </li>
                    </ul>
                </aside>
                <main className="account-main">
                    <section className="panel">
                        <h3><span className="icon-user" /> Thông tin cá nhân</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username</label>
                                <input defaultValue={displayName || "User………12"} />
                            </div>
                            <div className="form-group">
                                <label>Gmail</label>
                                <input defaultValue={email} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input defaultValue="0123456789" />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <input defaultValue="123 Đường ABC, phường Thanh Xuân, Hà Nội" />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="primary">Lưu thay đổi</button>
                        </div>
                    </section>
                </main>
            </div>
            <Footer />
        </div>
    );
}


