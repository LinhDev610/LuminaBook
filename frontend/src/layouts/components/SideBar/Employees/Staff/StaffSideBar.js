import EmployeesSideBar from '../EmployeesSideBar';

const menuItems = [
    { path: '/staff/products', label: 'Quản lý sản phẩm' },
    { path: '/staff/content', label: 'Quản lý nội dung' },
    { path: '/staff/vouchers-promotions', label: 'Voucher & Khuyến mãi' },
    { path: '/staff/orders', label: 'Đơn hàng' },
    { path: '/staff/profile', label: 'Hồ sơ cá nhân' },
];

const roleDisplay = (rawRole) => {
    return rawRole === 'CUSTOMER_SUPPORT' ? 'Chăm sóc khách hàng' : 'Nhân viên';
};

export default function StaffSideBar() {
    return (
        <EmployeesSideBar
            title="Hệ thống - Nhân viên"
            homePath="/staff"
            menuItems={menuItems}
            roleDisplay={roleDisplay}
        />
    );
}
