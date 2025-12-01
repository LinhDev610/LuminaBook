import EmployeesSideBar from '../EmployeesSideBar';

const menuItems = [
    { path: '/customer-support/complaints', label: 'Quản lý khiếu nại' },
    { path: '/customer-support/reviews', label: 'Quản lý đánh giá và bình luận' },
    { path: '/customer-support/refund-management', label: 'Quản lý Trả hàng/ Hoàn tiền' },
    { path: '/customer-support/chat', label: 'Hỗ trợ và chăm sóc khách hàng' },
    { path: '/customer-support/profile', label: 'Hồ sơ cá nhân' },
];

const roleDisplay = (rawRole) => {
    return rawRole === 'CUSTOMER_SUPPORT' ? 'Chăm sóc khách hàng' : 'CSKH';
};

export default function CustomerSupportSideBar() {
    return (
        <EmployeesSideBar
            title="Hệ thống - CSKH"
            homePath="/customer-support"
            menuItems={menuItems}
            roleDisplay={roleDisplay}
        />
    );
}
