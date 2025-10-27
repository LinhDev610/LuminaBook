import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ManageCustomerAccountsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);

function ManageCustomerAccountsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allCustomers] = useState([
        { id: 'CUS001', username: 'VanA1234', email: 'vana@gmail.com', phone: '0123456789', status: 'active' },
        { id: 'CUS002', username: 'thib123', email: 'ThiB@gmail.com', phone: '0123456789', status: 'active' },
        { id: 'CUS003', username: 'levanc456', email: 'levanc@gmail.com', phone: '0123456787', status: 'locked' },
        { id: 'CUS004', username: 'phamthid789', email: 'phamthid@gmail.com', phone: '0123456786', status: 'locked' },
        { id: 'CUS005', username: 'nva3333', email: 'vana@gmail.com', phone: '0123456789', status: 'locked' },
    ]);
    const [filteredCustomers, setFilteredCustomers] = useState(allCustomers);

    // Search and sort options for customer accounts
    const customerSearchPlaceholder = "Tìm kiếm theo Email, SDT,...";
    const customerSortOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'active', label: 'Hoạt động' },
        { value: 'locked', label: 'Đã khóa' }
    ];

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        applyFilters(newSearchTerm, sortBy);
    };

    const handleSort = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        applyFilters(searchTerm, newSortBy);
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, sortBy);
    };

    const applyFilters = (search, status) => {
        let filtered = allCustomers;
        
        // Filter by search term (username, email, phone)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(customer => 
                customer.username.toLowerCase().includes(searchLower) ||
                customer.email.toLowerCase().includes(searchLower) ||
                customer.phone.includes(search.trim())
            );
        }
        
        // Filter by status - only if not "all"
        if (status !== 'all') {
            filtered = filtered.filter(customer => customer.status === status);
        }
        
        setFilteredCustomers(filtered);
    };

    const getStatusText = (status) => {
        return status === 'active' ? 'Hoạt động' : 'Đã khóa';
    };

    const getStatusClass = (status) => {
        return status === 'active' ? 'active' : 'locked';
    };

    const additionalButtons = [];

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý tài khoản khách hàng</h1>
            
            <SearchAndSort
                searchPlaceholder={customerSearchPlaceholder}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onSearchClick={handleSearchClick}
                sortLabel="Sắp xếp:"
                sortOptions={customerSortOptions}
                sortValue={sortBy}
                onSortChange={handleSort}
                additionalButtons={additionalButtons}
            />
            
            <div className={cx('table-container')}>
                <table className={cx('data-table')}>
                    <thead>
                        <tr className={cx('table-header')}>
                            <th>UserID</th>
                            <th>UserName</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} className={cx('table-row')}>
                                <td>{customer.id}</td>
                                <td>{customer.username}</td>
                                <td>{customer.email}</td>
                                <td>{customer.phone}</td>
                                <td className={cx('status', getStatusClass(customer.status))}>
                                    {getStatusText(customer.status)}
                                </td>
                                <td className={cx('actions')}>
                                    <button className={cx('btn', 'edit-btn')}>Sửa</button>
                                    {customer.status === 'active' ? (
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

export default ManageCustomerAccountsPage;
