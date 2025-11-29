import classNames from 'classnames/bind';
import styles from './FinancialReport.module.scss';

const cx = classNames.bind(styles);

function FinancialReport() {
    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo tài chính</div>
            <div className={cx('cardSubtitle')}>Tổng thu - chi - lợi nhuận</div>
            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng thu</div>
                    <div className={cx('statValue', 'statValueAccent')}>
                        {/* Tổng thu */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng chi</div>
                    <div className={cx('statValue')} style={{ color: '#b91c1c' }}>
                        {/* Tổng chi */}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Lợi nhuận</div>
                    <div className={cx('statValue')}>
                        {/* Lợi nhuận */}
                    </div>
                </div>
            </div>

            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th>Phương thức thanh toán</th>
                        <th>Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Danh sách doanh thu theo phương thức thanh toán */}
                </tbody>
            </table>
            <div className={cx('helper')}>
                Tổng thu dựa trên doanh thu bán hàng (không bao gồm phí ship), tổng chi bao gồm các khoản hoàn tiền/hoàn trả.
            </div>
        </div>
    );
}

export default FinancialReport;
