import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './AdminSideBar.module.scss';
import adminHeaderStyles from '../../Header/Admin/AdminHeader.module.scss';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';

const cx = classNames.bind(styles);
const cxModal = classNames.bind(adminHeaderStyles);

export default function AdminSideBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage('displayName', null);
    
    // Check if current path is related to staff management
    const isStaffManagementActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/add-employee');
    
    const handleLogout = () => {
        // Close confirm modal immediately so it disappears before navigation
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        // Always go back to home after logout
        navigate('/', { replace: true });
    };
    
    return (
        <>
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
                    <li><NavLink to="#" className={cx('link', 'logout')} onClick={(e) => { e.preventDefault(); setShowLogoutConfirm(true); }}>Đăng xuất</NavLink></li>
                </ul>
            </div>
            {showLogoutConfirm && (
                <div className={cxModal('modal-overlay')} role="dialog" aria-modal="true">
                    <div className={cxModal('modal')}>
                        <h3 className={cxModal('modal-title')}>Đăng xuất tài khoản?</h3>
                        <p className={cxModal('modal-desc')}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className={cxModal('modal-actions')}>
                            <button className={cxModal('btn', 'btn-muted')} onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                            <button className={cxModal('btn', 'btn-primary')} onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
