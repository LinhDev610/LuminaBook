import React from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/Auth/AccountPage.css";

export default function Account() {
    const navigate = useNavigate();
    const displayName = typeof window !== 'undefined' ? localStorage.getItem('displayName') : null;
    const email = typeof window !== 'undefined' ? (localStorage.getItem('email') || "user123@gmail.com") : "";

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('displayName');
        localStorage.removeItem('email');
        navigate("/");
    };

    return (
        <div className="account-wrapper">
            <header className="account-header">
                <div className="logo">LuminaBook</div>
                <div className="search">
                    <input type="text" placeholder="Tìm kiếm theo tên tác phẩm,…" />
                    <button>Tim</button>
                </div>
                <div className="header-right">
                    <div className="header-user">
                        <span className="user-name">{displayName || "User……12"}</span>
                        <span className="user-avatar" />
                    </div>
                    <div className="header-icons">
                        <span className="icon notif" />
                        <span className="icon cart" />
                    </div>
                </div>
            </header>
            <nav className="account-nav">
                <button className="nav-trigger" />
                <a className="active" href="#">TẤT CẢ DANH MỤC</a>
                <a href="#">KHUYẾN MÃI</a>
                <a href="#">SÁCH MỚI</a>
                <a href="#">HỖ TRỢ KHÁCH HÀNG</a>
                <a href="#">LIÊN HỆ</a>
            </nav>
            <div className="account-content">
                <aside className="account-side">
                    <div className="side-profile">
                        <div className="side-avatar" />
                        <div className="side-name">{displayName || "User………12"}</div>
                    </div>
                    <ul className="side-menu">
                        <li className="active">Thông tin cá nhân</li>
                        <li>Lịch sử mua hàng</li>
                        <li>Voucher và khuyến mãi</li>
                        <li>Đổi mật khẩu</li>
                        <li onClick={handleLogout}>Đăng xuất</li>
                        <li className="danger">Xóa tài khoản</li>
                    </ul>
                </aside>
                <main className="account-main">
                    <section className="panel">
                        <h3>Thông tin cá nhân</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username</label>
                                <input defaultValue={displayName || "User……12"} />
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
                    <section className="panel orders">
                        <h3>Theo dõi đơn hàng</h3>
                        <div className="order-tabs">
                            <button className="active">Chờ xác nhận</button>
                            <button>Chờ lấy hàng</button>
                            <button>Chờ giao hàng</button>
                            <button>Đánh giá</button>
                        </div>
                        <div className="order-card">
                            <div className="order-head">
                                <div>
                                    <div className="order-id">Đơn hàng #DH123456</div>
                                    <div className="order-date">Ngày đặt: 25/9/2025</div>
                                </div>
                                <button className="status">Chờ xác nhận</button>
                            </div>
                            <div className="order-body">
                                <div className="thumb" />
                                <div className="meta">
                                    <div className="title">Miền Bắc - Một Thời Chiến Tranh Một Thời Hòa Bình</div>
                                    <div className="qty">Số lượng: 1</div>
                                </div>
                                <div className="price">200.000đ</div>
                                <button className="link">Xem chi tiết</button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
            <footer className="account-footer">
                <div className="footer-col">
                    <h4>Thông tin liên hệ</h4>
                    <div>136 Xuân Thủy, phường Cầu Giấy, TP.Hà Nội</div>
                    <div>Hotline: 0123 456 789</div>
                    <div>Email: support@luminabook.com</div>
                    <div>Hỗ trợ 24/7</div>
                </div>
                <div className="footer-col">
                    <h4>Danh mục sách</h4>
                    <div>Sách giáo dục</div>
                    <div>Sách văn học</div>
                    <div>Sách kỹ năng sống</div>
                    <div>Sách thiếu nhi</div>
                    <div>Sách Quản lý - Kinh doanh</div>
                </div>
                <div className="footer-col">
                    <h4>Hỗ trợ khách hàng</h4>
                    <div>Hướng dẫn mua hàng</div>
                    <div>Chính sách thanh toán</div>
                    <div>Chính sách vận chuyển</div>
                    <div>Chính sách đổi trả</div>
                    <div>FQA</div>
                </div>
            </footer>
        </div>
    );
}


