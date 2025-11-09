import styles from './PromotionDetailPage.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function PromotionDetailPage() {
    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1>Chi tiết promotion</h1>
            </div>
        </div>
    );
}

export default PromotionDetailPage;