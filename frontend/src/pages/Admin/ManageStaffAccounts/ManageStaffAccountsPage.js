import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageStaffAccountsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);

function ManageStaffAccountsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allEmployees, setAllEmployees] = useState([
        { id: 'NV001', name: 'Nguyễn Văn A', email: 'vana@lumina.com', phone: '0123456789', status: 'active' },
        { id: 'NV002', name: 'Trần Thị B', email: 'thib@lumina.com', phone: '0123456788', status: 'active' },
        { id: 'NV003', name: 'Lê Văn C', email: 'levanc@lumina.com', phone: '0123456787', status: 'locked' },
        { id: 'NV004', name: 'Phạm Thị D', email: 'phamthid@lumina.com', phone: '0123456786', status: 'locked' },
        { id: 'NV005', name: 'Hoàng Văn E', email: 'hoangvane@lumina.com', phone: '0123456785', status: 'active' },
    ]);
    const [filteredEmployees, setFilteredEmployees] = useState(allEmployees);

    // Auto-search is now handled by onChange, no need for Enter key handler

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);

        // Apply filters immediately when search term changes
        applyFilters(newSearchTerm, sortBy);
    };

    const handleSort = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);

        // Apply filters immediately when status changes
        applyFilters(searchTerm, newSortBy);
    };

    const applyFilters = (search, status) => {
        let filtered = allEmployees;

        // Filter by search term (name, email, phone)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(employee =>
                employee.name.toLowerCase().includes(searchLower) ||
                employee.email.toLowerCase().includes(searchLower) ||
                employee.phone.includes(search.trim())
            );
        }

        // Filter by status - only if not "all"
        if (status !== 'all') {
            filtered = filtered.filter(employee => employee.status === status);
        }

        setFilteredEmployees(filtered);
    };


    const getStatusText = (status) => {
        return status === 'active' ? 'Hoạt động' : 'Đã khóa';
    };

    const getStatusClass = (status) => {
        return status === 'active' ? 'active' : 'locked';
    };

    const handleAddEmployee = () => {
        navigate('/admin/add-employee');
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, sortBy);
    };

    // Search and sort options for staff accounts
    const staffSearchPlaceholder = "Tìm kiếm theo Email, SDT,...";
    const staffSortOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'locked', label: 'Đã khóa' }
    ];

    const additionalButtons = [
        {
            text: 'Thêm nhân viên',
            className: 'add-btn',
            onClick: handleAddEmployee
        }
    ];

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý tài khoản nhân viên</h1>

            <SearchAndSort
                searchPlaceholder={staffSearchPlaceholder}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onSearchClick={handleSearchClick}
                sortLabel="Sắp xếp:"
                sortOptions={staffSortOptions}
                sortValue={sortBy}
                onSortChange={handleSort}
                additionalButtons={additionalButtons}
            />

            <div className={cx('table-container')}>
                <table className={cx('data-table')}>
                    <thead>
                        <tr className={cx('table-header')}>
                            <th>Mã nhân viên</th>
                            <th>Tên nhân viên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((employee) => (
                            <tr key={employee.id} className={cx('table-row')}>
                                <td>{employee.id}</td>
                                <td>{employee.name}</td>
                                <td>{employee.email}</td>
                                <td>{employee.phone}</td>
                                <td className={cx('status', getStatusClass(employee.status))}>
                                    {getStatusText(employee.status)}
                                </td>
                                <td className={cx('actions')}>
                                    <button className={cx('btn', 'edit-btn')}>Sửa</button>
                                    {employee.status === 'active' ? (
                                        <button className={cx('btn', 'lock-btn')}>Khóa</button>
                                    ) : (
                                        <button className={cx('btn', 'unlock-btn')}>Mở khóa</button>
                                    )}
                                    <button className={cx('btn', 'delete-btn')}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ManageStaffAccountsPage;
