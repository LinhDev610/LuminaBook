import classNames from 'classnames/bind';
import styles from './OrderReport.module.scss';

const cx = classNames.bind(styles);

function OrderReport() {
    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo đơn hàng</div>
            <div className={cx('cardSubtitle')}>Chi tiết trạng thái đơn hàng</div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng đơn</div>
                    <div className={cx('statValue')}>
                        {/* Tổng đơn */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Đơn bị hủy</div>
                    <div className={cx('statValue')} style={{ color: '#b91c1c' }}>
                        {/* Đơn bị hủy */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Hoàn tiền</div>
                    <div className={cx('statValue')} style={{ color: '#ea580c' }}>
                        {/* Hoàn tiền */}
                    </div>
                </div>
            </div>

            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Ngày</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Danh sách đơn hàng */}
                </tbody>
            </table>
            <div className={cx('helper')}>
                Hiển thị tối đa 10 đơn gần đây trong khoảng thời gian đã chọn.
            </div>
        </div>
    );
}

export default OrderReport;
