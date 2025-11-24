import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './PaymentPolicyPage.module.scss';

const cx = classNames.bind(styles);

export default function PaymentPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <button className={cx('back-button')} onClick={() => navigate('/support/user')}>
                    ← Quay lại
                </button>

                <div className={cx('content')}>
                    <h1 className={cx('title')}>Chính sách thanh toán</h1>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>1. Phương thức thanh toán</h2>
                        <p className={cx('section-text')}>
                            LuminaBook hỗ trợ các phương thức thanh toán sau:
                        </p>
                        <div className={cx('payment-methods')}>
                            <div className={cx('method-item')}>
                                <h3 className={cx('method-title')}>💳 Thanh toán qua MoMo</h3>
                                <p className={cx('method-desc')}>
                                    Thanh toán trực tuyến qua ví điện tử MoMo. Bạn sẽ được chuyển hướng đến trang thanh toán MoMo để hoàn tất giao dịch.
                                </p>
                            </div>
                            <div className={cx('method-item')}>
                                <h3 className={cx('method-title')}>💰 Thanh toán khi nhận hàng (COD)</h3>
                                <p className={cx('method-desc')}>
                                    Thanh toán trực tiếp cho nhân viên giao hàng khi nhận sản phẩm. Phù hợp cho những khách hàng muốn kiểm tra hàng trước khi thanh toán.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>2. Quy trình thanh toán</h2>
                        <ul className={cx('list')}>
                            <li>Chọn sản phẩm và thêm vào giỏ hàng</li>
                            <li>Điền thông tin giao hàng</li>
                            <li>Chọn phương thức thanh toán</li>
                            <li>Xác nhận đơn hàng</li>
                            <li>Hoàn tất thanh toán (nếu chọn MoMo)</li>
                            <li>Nhận email xác nhận đơn hàng</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>3. Lưu ý khi thanh toán</h2>
                        <ul className={cx('list')}>
                            <li>Đảm bảo thông tin thanh toán chính xác</li>
                            <li>Kiểm tra số tiền thanh toán trước khi xác nhận</li>
                            <li>Lưu giữ mã đơn hàng để tra cứu sau này</li>
                            <li>Liên hệ hỗ trợ nếu gặp vấn đề trong quá trình thanh toán</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>4. Bảo mật thanh toán</h2>
                        <p className={cx('section-text')}>
                            Tất cả các giao dịch thanh toán đều được mã hóa và bảo mật. 
                            Thông tin thẻ tín dụng và tài khoản của bạn được bảo vệ an toàn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

