import classNames from 'classnames/bind';
import styles from './CustomerProfilePage.module.scss';
import useLocalStorage from '../../../hooks/useLocalStorage';

const cx = classNames.bind(styles);

export default function CustomerProfilePage() {
    const [displayName] = useLocalStorage('displayName', 'Khách');
    const [email] = useLocalStorage('email', 'user123@gmail.com');

    return (
        <section className={cx('panel')}>
            <h3 className={cx('panel-title')}>Thông tin cá nhân</h3>
            <div className={cx('form-row')}>
                <div className={cx('form-group')}>
                    <label>Username</label>
                    <input defaultValue={displayName} />
                </div>
                <div className={cx('form-group')}>
                    <label>Gmail</label>
                    <input defaultValue={email} />
                </div>
            </div>
            <div className={cx('form-row')}>
                <div className={cx('form-group')}>
                    <label>Số điện thoại</label>
                    <input defaultValue="0123456789" />
                </div>
                <div className={cx('form-group')}>
                    <label>Địa chỉ</label>
                    <input defaultValue="123 Đường ABC, phường Thanh Xuân, Hà Nội" />
                </div>
            </div>
            <div className={cx('form-actions')}>
                <button className={cx('primary')}>Lưu thay đổi</button>
            </div>
        </section>
    );
}


