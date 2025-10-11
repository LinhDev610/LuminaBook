import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './Navbar.module.scss';

const cx = classNames.bind(styles);

function Navbar() {
    return (
        <nav className={cx('account-nav')}>
            <button className={cx('nav-trigger')} />
            <Link to="#">TẤT CẢ DANH MỤC</Link>
            <Link to="#">Khuyến mãi</Link>
            <Link to="#">Sách mới</Link>
            <Link to="#">Hỗ trợ khách hàng</Link>
            <Link to="#">Liên hệ</Link>
        </nav>
    );
}

export default Navbar;
