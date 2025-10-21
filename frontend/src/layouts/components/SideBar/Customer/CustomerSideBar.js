import classNames from 'classnames/bind';
import styles from './CustmerSideBar.module.scss';
import { NavLink } from 'react-router-dom';

const cx = classNames.bind(styles);

export default function CustomerSideBar() {
    return (
        <div className={cx('side')}> {/* simple placeholder, can be styled later */}
            <ul className={cx('menu')}>
                <li><NavLink to="/customer-account" end className={({ isActive }) => cx('link', { active: isActive })}>Thông tin cá nhân</NavLink></li>
                <li><NavLink to="/customer-account/password" className={({ isActive }) => cx('link', { active: isActive })}>Đổi mật khẩu</NavLink></li>
            </ul>
        </div>
    );
}


