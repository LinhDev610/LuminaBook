import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageCustomerAccountsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

function ManageCustomerAccountsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to get token from storage
    const getStoredToken = () => {
        try {
            const raw = localStorage.getItem('token');
            if (!raw) return sessionStorage.getItem('token');
            if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
                return JSON.parse(raw);
            }
            return raw;
        } catch (_) {
            return sessionStorage.getItem('token');
        }
    };

    // Fetch customers from API - tách thành function để có thể gọi lại
    const fetchCustomers = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để tiếp tục');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // Try to parse error response
                    let errorMessage = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData?.message || errorMessage;
                    } catch (e) {
                        // If response is not JSON, use default message
                    }
                    console.error('API Error:', errorMessage, response.status);
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                const users = data?.result || [];

                // Filter only customers (role.name === 'CUSTOMER')
                const customers = users
                    .filter(user => user?.role?.name === 'CUSTOMER')
                    .map(user => {
                        // Handle fullName - check both camelCase and snake_case
                        const fullName = user.fullName || user.full_name || '';
                        
                        // Handle isActive - check field name
                        let activeValue;
                        if ('isActive' in user) {
                            activeValue = user.isActive;
                        } else if ('active' in user) {
                            activeValue = user.active;
                        } else {
                            activeValue = user.isActive !== undefined ? user.isActive : user.active;
                        }
                        
                        // Determine active status
                        let isActiveStatus = false;
                        if (activeValue !== undefined && activeValue !== null) {
                            if (typeof activeValue === 'number') {
                                isActiveStatus = activeValue === 1;
                            } else if (typeof activeValue === 'boolean') {
                                isActiveStatus = activeValue === true;
                            } else if (typeof activeValue === 'string') {
                                const lower = String(activeValue).toLowerCase().trim();
                                isActiveStatus = lower === '1' || lower === 'true';
                            } else {
                                isActiveStatus = Boolean(activeValue);
                            }
                        }
                        
                        return {
                            id: user.id,
                            username: user.email?.split('@')[0] || fullName || 'N/A',
                            email: user.email || '',
                            phone: user.phoneNumber || user.phone_number || '',
                            status: isActiveStatus ? 'active' : 'locked',
                            fullName: fullName,
                        };
                    });

                setAllCustomers(customers);
                setFilteredCustomers(customers);
            } catch (err) {
                console.error('Error fetching customers:', err);
                // Display more detailed error message
                const errorMessage = err.message || 'Không thể tải dữ liệu khách hàng. Vui lòng thử lại sau.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
    };

    // Fetch customers khi component mount
    useEffect(() => {
        fetchCustomers();
    }, []);

    // Search and sort options for customer accounts
    const customerSearchPlaceholder = "Tìm kiếm theo Họ tên, Email, SDT,...";
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

    // Helper function to apply filters with specific data
    const applyFiltersWithData = (search, status, customers) => {
        let filtered = customers;
        
        // Filter by search term (fullName, email, phone)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(customer => 
                (customer.fullName || '').toLowerCase().includes(searchLower) ||
                (customer.username || '').toLowerCase().includes(searchLower) ||
                (customer.email || '').toLowerCase().includes(searchLower) ||
                (customer.phone || '').includes(search.trim())
            );
        }
        
        // Filter by status - only if not "all"
        if (status !== 'all') {
            filtered = filtered.filter(customer => customer.status === status);
        }
        
        setFilteredCustomers(filtered);
    };

    const applyFilters = (search, status) => {
        applyFiltersWithData(search, status, allCustomers);
    };

    const getStatusText = (status) => {
        // isActive = 1 → status = 'active' → hiển thị 'Hoạt động'
        // isActive = 0 → status = 'locked' → hiển thị 'Đã khóa'
        if (status === 'active') {
            return 'Hoạt động';
        }
        return 'Đã khóa';
    };

    const getStatusClass = (status) => {
        return status === 'active' ? 'active' : 'locked';
    };

    // Handle lock/unlock customer account
    const handleToggleLock = async (customerId, currentStatus) => {
        // Nếu đang active thì khóa (isActive = false), nếu đang locked thì mở khóa (isActive = true)
        const isCurrentlyActive = currentStatus === 'active';
        const newIsActive = !isCurrentlyActive; // false khi khóa, true khi mở khóa
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
        
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) {
            return;
        }

        try {
            const token = getStoredToken();
            if (!token) {
                alert('Vui lòng đăng nhập để tiếp tục');
                return;
            }

            const requestBody = {
                isActive: newIsActive,
            };

            const response = await fetch(`${API_BASE_URL}/users/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || errorData?.error || errorMessage;
                } catch (e) {
                    // Ignore parse error
                }
                throw new Error(errorMessage);
            }

            await response.json();

            // Cập nhật state local thay vì refetch để tránh nhấp nháy
            setAllCustomers(prevCustomers => 
                prevCustomers.map(customer => 
                    customer.id === customerId 
                        ? { ...customer, status: newIsActive ? 'active' : 'locked' }
                        : customer
                )
            );
            setFilteredCustomers(prevFiltered => 
                prevFiltered.map(customer => 
                    customer.id === customerId 
                        ? { ...customer, status: newIsActive ? 'active' : 'locked' }
                        : customer
                )
            );
            
            alert(`Đã ${action} tài khoản thành công`);
        } catch (err) {
            console.error(`Error ${action} customer:`, err);
            alert(`Không thể ${action} tài khoản: ${err.message || 'Vui lòng thử lại sau.'}`);
        }
    };

    // Handle delete customer account
    const handleDelete = async (customerId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            const token = getStoredToken();
            if (!token) {
                alert('Vui lòng đăng nhập để tiếp tục');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/users/${customerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData?.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            // Sau khi xóa thành công, fetch lại dữ liệu từ backend để đảm bảo hiển thị đúng
            await fetchCustomers();
            alert('Đã xóa tài khoản thành công');
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('Không thể xóa tài khoản. Vui lòng thử lại sau.');
        }
    };

    const handleViewDetails = (customerId) => {
        navigate(`/admin/customers/${customerId}`);
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
            
            {loading ? (
                <div className={cx('loading-container')}>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : error ? (
                <div className={cx('error-container')}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Tải lại</button>
                </div>
            ) : (
                <div className={cx('table-container')}>
                    <table className={cx('data-table')}>
                        <thead>
                            <tr className={cx('table-header')}>
                                <th>UserID</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                                <th>Chi tiết khách hàng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                        Không có dữ liệu khách hàng
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className={cx('table-row')}>
                                        <td>{customer.id}</td>
                                        <td>{customer.fullName || customer.username || 'N/A'}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td className={cx('status', getStatusClass(customer.status))}>
                                            {getStatusText(customer.status)}
                                        </td>
                                        <td className={cx('actions')}>
                                            <button 
                                                className={cx('btn', 'edit-btn')}
                                                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                            >
                                                Sửa
                                            </button>
                                            {customer.status === 'active' ? (
                                                <button 
                                                    className={cx('btn', 'lock-btn')}
                                                    onClick={() => handleToggleLock(customer.id, customer.status)}
                                                >
                                                    Khóa
                                                </button>
                                            ) : (
                                                <button 
                                                    className={cx('btn', 'unlock-btn')}
                                                    onClick={() => handleToggleLock(customer.id, customer.status)}
                                                >
                                                    Mở khóa
                                                </button>
                                            )}
                                            <button 
                                                className={cx('btn', 'delete-btn')}
                                                onClick={() => handleDelete(customer.id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    <td>
                                        <button 
                                            className={cx('btn', 'detail-btn')}
                                            onClick={() => handleViewDetails(customer.id)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ManageCustomerAccountsPage;
