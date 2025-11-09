import styles from './AddPromotionPage.module.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

function AddPromotionPage() {   
    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1>Thêm promotion</h1>
            </div>
        </div>
    );
}

export default AddPromotionPage;