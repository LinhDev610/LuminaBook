import styles from './VoucherDetailPage.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function VoucherDetailPage() {
    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1>Chi tiết voucher</h1>
            </div>
        </div>
    );
}

export default VoucherDetailPage;