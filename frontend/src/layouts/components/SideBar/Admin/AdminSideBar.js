import classNames from 'classnames/bind';
import styles from './AdminSideBar.module.scss';
import { NavLink, useLocation } from 'react-router-dom';

const cx = classNames.bind(styles);

export default function AdminSideBar() {
    const location = useLocation();
    
    // Check if current path is related to staff management
    const isStaffManagementActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/add-employee');
    
    return (
        <div className={cx('side')}>
            <div className={cx('panel-title')}>ADMIN PANEL</div>
            <ul className={cx('menu')}>
                <li>
                    <NavLink 
                        to="/admin" 
                        end 
                        className={({ isActive }) => cx('link', { active: isActive || isStaffManagementActive })}
                    >
                        QL Tài khoản nhân viên
                    </NavLink>
                </li>
                <li><NavLink to="/admin/customer-accounts" className={({ isActive }) => cx('link', { active: isActive })}>QL Tài khoản khách hàng</NavLink></li>
                <li><NavLink to="/admin/products" className={({ isActive }) => cx('link', { active: isActive })}>QL Sản phẩm</NavLink></li>
                <li><NavLink to="/admin/categories" className={({ isActive }) => cx('link', { active: isActive })}>QL Danh mục</NavLink></li>
                <li><NavLink to="/admin/orders" className={({ isActive }) => cx('link', { active: isActive })}>QL Đơn hàng</NavLink></li>
                <li><NavLink to="/admin/vouchers" className={({ isActive }) => cx('link', { active: isActive })}>QL Voucher & Khuyến mãi</NavLink></li>
                <li><NavLink to="/admin/complaints" className={({ isActive }) => cx('link', { active: isActive })}>QL Khiếu nại</NavLink></li>
                <li><NavLink to="/admin/content" className={({ isActive }) => cx('link', { active: isActive })}>QL Nội dung</NavLink></li>
                <li><NavLink to="/admin/reports" className={({ isActive }) => cx('link', { active: isActive })}>Báo cáo và thống kê</NavLink></li>
                <li><NavLink to="/admin/profile" className={({ isActive }) => cx('link', { active: isActive })}>Hồ sơ cá nhân</NavLink></li>
                <li><NavLink to="/logout" className={cx('link', 'logout')}>Đăng xuất</NavLink></li>
            </ul>
        </div>
    );
}
