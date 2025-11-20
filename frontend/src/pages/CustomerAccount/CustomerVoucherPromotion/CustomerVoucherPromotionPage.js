import classNames from 'classnames/bind';
import styles from './CustomerVoucherPromotionPage.module.scss';

const cx = classNames.bind(styles);

function CustomerVoucherPromotionPage() {
    return (
        <div>
            <h1>Customer Voucher Promotion Page</h1>
            <div className={cx('voucher-list')}>
                <div className={cx('voucher-item')}>
                    <h2>Voucher 1</h2>
                    <p>Description 1</p>
                </div>
            </div>
            <div className={cx('promotion-list')}>
                <div className={cx('promotion-item')}>
                    <h2>Promotion 1</h2>
                    <p>Description 1</p>
                </div>
            </div>
        </div>
    );
}

export default CustomerVoucherPromotionPage;