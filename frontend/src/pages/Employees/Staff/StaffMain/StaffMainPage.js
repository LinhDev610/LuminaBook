import classNames from 'classnames/bind';
import styles from './StaffMainPage.module.scss';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

export default function StaffMainPage() {
    const navigate = useNavigate();

    return (
        <div className={cx('wrap')}>
            <h2 className={cx('title')}>Bảng điều khiển</h2>

            <div className={cx('card')}>
                <div className={cx('card-title')}>Sản phẩm</div>
                <div className={cx('card-desc')}>
                    Quản lý sản phẩm bạn tạo - chờ admin duyệt trước khi hiển thị.
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('card-title')}>Voucher và khuyến mãi</div>
                <div className={cx('card-desc')}>
                    Quản lý mã giảm giá và chương trình khuyến mãi.
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('card-title')}>Đơn hàng</div>
                <div className={cx('card-desc')}>
                    Xem đơn, cập nhật trạng thái, hủy đơn (trước giao).
                </div>
            </div>

            <div className={cx('quick')}>Tác vụ nhanh</div>
            <div className={cx('actions')}>
                <button className={cx('btn')} onClick={() => navigate('/staff/products/new')}>
                    Thêm sản phẩm
                </button>
                <button className={cx('btn')} onClick={() => navigate('/staff/vouchers/new')}>
                    Thêm Voucher
                </button>
                <button className={cx('btn')} onClick={() => navigate('/staff/orders')}>
                    Quản lý đơn hàng
                </button>
            </div>
        </div>
    );
}


