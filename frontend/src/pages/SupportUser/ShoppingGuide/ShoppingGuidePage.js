import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ShoppingGuidePage.module.scss';

const cx = classNames.bind(styles);

export default function ShoppingGuidePage() {
    const navigate = useNavigate();

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <button className={cx('back-button')} onClick={() => navigate('/support/user')}>
                    ← Quay lại
                </button>

                <div className={cx('content')}>
                    <h1 className={cx('title')}>Hướng dẫn mua hàng</h1>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>1. Tìm kiếm sản phẩm</h2>
                        <p className={cx('section-text')}>
                            Bạn có thể tìm kiếm sản phẩm bằng cách:
                        </p>
                        <ul className={cx('list')}>
                            <li>Sử dụng thanh tìm kiếm ở đầu trang</li>
                            <li>Duyệt theo danh mục sản phẩm</li>
                            <li>Xem các sản phẩm mới hoặc khuyến mãi</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>2. Xem chi tiết sản phẩm</h2>
                        <p className={cx('section-text')}>
                            Click vào sản phẩm để xem thông tin chi tiết:
                        </p>
                        <ul className={cx('list')}>
                            <li>Giá bán và giá gốc (nếu có giảm giá)</li>
                            <li>Thông tin tác giả, nhà xuất bản</li>
                            <li>Mô tả chi tiết về sản phẩm</li>
                            <li>Đánh giá và nhận xét từ khách hàng</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>3. Thêm vào giỏ hàng</h2>
                        <p className={cx('section-text')}>
                            Sau khi chọn sản phẩm, bạn có thể:
                        </p>
                        <ul className={cx('list')}>
                            <li>Chọn số lượng sản phẩm</li>
                            <li>Click nút "Thêm vào giỏ hàng"</li>
                            <li>Hoặc click "Mua ngay" để thanh toán trực tiếp</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>4. Thanh toán</h2>
                        <p className={cx('section-text')}>
                            Trong giỏ hàng, bạn có thể:
                        </p>
                        <ul className={cx('list')}>
                            <li>Xem lại các sản phẩm đã chọn</li>
                            <li>Áp dụng mã giảm giá (nếu có)</li>
                            <li>Chọn địa chỉ giao hàng</li>
                            <li>Chọn phương thức thanh toán (MoMo hoặc COD)</li>
                            <li>Xác nhận đơn hàng</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>5. Theo dõi đơn hàng</h2>
                        <p className={cx('section-text')}>
                            Sau khi đặt hàng thành công:
                        </p>
                        <ul className={cx('list')}>
                            <li>Bạn sẽ nhận được email xác nhận đơn hàng</li>
                            <li>Theo dõi trạng thái đơn hàng trong tài khoản</li>
                            <li>Nhận thông báo khi đơn hàng được giao</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

