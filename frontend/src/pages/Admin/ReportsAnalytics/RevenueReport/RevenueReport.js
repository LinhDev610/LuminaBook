import classNames from 'classnames/bind';
import styles from './RevenueReport.module.scss';

const cx = classNames.bind(styles);

function RevenueReport() {
    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo doanh thu</div>
            <div className={cx('cardSubtitle')}>Tổng quan doanh thu theo thời gian</div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng doanh thu</div>
                    <div className={cx('statValue', 'statValueAccent')}>
                        {/* Tổng doanh thu */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng đơn hàng</div>
                    <div className={cx('statValue')}>
                        {/* Tổng đơn hàng */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Giá trị trung bình</div>
                    <div className={cx('statValue')}>
                        {/* Giá trị trung bình */}
                    </div>
                </div>
            </div>

            <div className={cx('chartContainer')}>
                {/* Biểu đồ doanh thu */}
            </div>
        </div>
    );
}

export default RevenueReport;
