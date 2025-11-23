import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ShippingPolicyPage.module.scss';

const cx = classNames.bind(styles);

export default function ShippingPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <button className={cx('back-button')} onClick={() => navigate('/support')}>
                    ← Quay lại
                </button>

                <div className={cx('content')}>
                    <h1 className={cx('title')}>Chính sách vận chuyển</h1>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>1. Phạm vi giao hàng</h2>
                        <p className={cx('section-text')}>
                            LuminaBook giao hàng toàn quốc thông qua đối tác vận chuyển GHN (Giao Hàng Nhanh).
                        </p>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>2. Phí vận chuyển</h2>
                        <p className={cx('section-text')}>
                            Phí vận chuyển được tính dựa trên:
                        </p>
                        <ul className={cx('list')}>
                            <li>Khoảng cách từ kho hàng đến địa chỉ nhận hàng</li>
                            <li>Trọng lượng và kích thước sản phẩm</li>
                            <li>Loại dịch vụ vận chuyển</li>
                        </ul>
                        <p className={cx('section-text', 'note')}>
                            Phí vận chuyển sẽ được hiển thị trước khi bạn xác nhận đơn hàng.
                        </p>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>3. Thời gian giao hàng</h2>
                        <div className={cx('shipping-time')}>
                            <div className={cx('time-item')}>
                                <h3 className={cx('time-title')}>Nội thành</h3>
                                <p className={cx('time-desc')}>1-2 ngày làm việc</p>
                            </div>
                            <div className={cx('time-item')}>
                                <h3 className={cx('time-title')}>Tỉnh thành khác</h3>
                                <p className={cx('time-desc')}>3-5 ngày làm việc</p>
                            </div>
                            <div className={cx('time-item')}>
                                <h3 className={cx('time-title')}>Vùng sâu, vùng xa</h3>
                                <p className={cx('time-desc')}>5-7 ngày làm việc</p>
                            </div>
                        </div>
                        <p className={cx('section-text', 'note')}>
                            * Thời gian giao hàng có thể thay đổi do các yếu tố khách quan như thời tiết, thiên tai,...
                        </p>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>4. Quy trình giao hàng</h2>
                        <ul className={cx('list')}>
                            <li>Đơn hàng được xử lý và đóng gói trong vòng 24 giờ</li>
                            <li>Đơn hàng được chuyển cho đối tác vận chuyển</li>
                            <li>Nhân viên giao hàng liên hệ trước khi giao</li>
                            <li>Khách hàng kiểm tra hàng trước khi nhận</li>
                            <li>Thanh toán (nếu chọn COD) và ký xác nhận</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>5. Theo dõi đơn hàng</h2>
                        <p className={cx('section-text')}>
                            Bạn có thể theo dõi trạng thái đơn hàng:
                        </p>
                        <ul className={cx('list')}>
                            <li>Trong tài khoản của bạn trên website</li>
                            <li>Qua email thông báo tự động</li>
                            <li>Liên hệ hotline hỗ trợ khách hàng</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

