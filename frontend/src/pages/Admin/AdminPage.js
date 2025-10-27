import React, { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './AdminPage.module.scss';

const cx = classNames.bind(styles);

function AdminPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allEmployees] = useState([
        { id: 'NV001', name: 'Nguyễn Văn A', email: 'vana@lumina.com', phone: '0123456789', status: 'active' },
        { id: 'NV002', name: 'Trần Thị B', email: 'thib@lumina.com', phone: '0123456788', status: 'active' },
        { id: 'NV003', name: 'Lê Văn C', email: 'levanc@lumina.com', phone: '0123456787', status: 'locked' },
        { id: 'NV004', name: 'Phạm Thị D', email: 'phamthid@lumina.com', phone: '0123456786', status: 'locked' },
        { id: 'NV005', name: 'Hoàng Văn E', email: 'hoangvane@lumina.com', phone: '0123456785', status: 'active' },
    ]);
    const [filteredEmployees, setFilteredEmployees] = useState(allEmployees);

    // Handle Enter key press for search
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                // Trigger search button click
                const searchBtn = document.querySelector(`.${styles['search-btn']}`);
                if (searchBtn) {
                    searchBtn.click();
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    const handleSearch = () => {
        applyFilters(searchTerm, sortBy);
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

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý tài khoản nhân viên</h1>
            
            <div className={cx('controls')}>
                <div className={cx('search-section')}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Email, SDT,..."
                        className={cx('search-input')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className={cx('search-btn')} onClick={handleSearch}>Tìm kiếm</button>
                </div>

                <div className={cx('sort-section')}>
                    <span className={cx('sort-label')}>Sắp xếp:</span>
                    <select className={cx('sort-dropdown')} value={sortBy} onChange={handleSort}>
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="locked">Đã khóa</option>
                    </select>
                </div>

                <button className={cx('add-btn')}>Thêm nhân viên</button>
            </div>
            
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

export default AdminPage;
