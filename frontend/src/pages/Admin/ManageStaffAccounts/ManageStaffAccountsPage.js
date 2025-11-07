import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageStaffAccountsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import ConfirmDialog from '../../../layouts/components/ConfirmDialog';
import Notification from '../../../components/Common/Notification/Notification';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

function ManageStaffAccountsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allEmployees, setAllEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
    });
    const [notif, setNotif] = useState({ open: false, type: 'success', title: '', message: '', duration: 3000 });

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

    // Fetch staff from API - tách thành function để có thể gọi lại
    const fetchStaff = async () => {
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

            // Filter only staff (role.name === 'STAFF' or 'CUSTOMER_SUPPORT')
            const employees = users
                .filter(user => {
                    const roleName = user?.role?.name;
                    return roleName === 'STAFF' || roleName === 'CUSTOMER_SUPPORT';
                })
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
                        name: fullName || user.email?.split('@')[0] || 'N/A',
                        email: user.email || '',
                        phone: user.phoneNumber || user.phone_number || '',
                        status: isActiveStatus ? 'active' : 'locked',
                        fullName: fullName,
                        role: user?.role?.name || '',
                    };
                });

            setAllEmployees(employees);
            setFilteredEmployees(employees);
        } catch (err) {
            console.error('Error fetching staff:', err);
            // Display more detailed error message
            const errorMessage = err.message || 'Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch staff khi component mount
    useEffect(() => {
        fetchStaff();
    }, []);

    // Search and sort options for staff accounts
    const staffSearchPlaceholder = "Tìm kiếm theo Họ tên, Email, SDT,...";
    const staffSortOptions = [
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
    const applyFiltersWithData = (search, status, employees) => {
        let filtered = employees;
        
        // Filter by search term (fullName, email, phone)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(employee => 
                (employee.fullName || '').toLowerCase().includes(searchLower) ||
                (employee.name || '').toLowerCase().includes(searchLower) ||
                (employee.email || '').toLowerCase().includes(searchLower) ||
                (employee.phone || '').includes(search.trim())
            );
        }
        
        // Filter by status - only if not "all"
        if (status !== 'all') {
            filtered = filtered.filter(employee => employee.status === status);
        }
        
        setFilteredEmployees(filtered);
    };

    const applyFilters = (search, status) => {
        applyFiltersWithData(search, status, allEmployees);
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

    // Handle lock/unlock staff account
    const handleToggleLock = (employeeId, currentStatus) => {
        // Nếu đang active thì khóa (isActive = false), nếu đang locked thì mở khóa (isActive = true)
        const isCurrentlyActive = currentStatus === 'active';
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
        const employee = allEmployees.find(e => e.id === employeeId);
        const employeeName = employee?.fullName || employee?.name || employee?.email || `#${employeeId}`;
        
        setConfirmDialog({
            open: true,
            title: 'Xác nhận hành động',
            message: `Bạn có chắc chắn muốn ${action} tài khoản ${employeeName}?`,
            onConfirm: () => performToggleLock(employeeId, currentStatus),
        });
    };

    const performToggleLock = async (employeeId, currentStatus) => {
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        
        const isCurrentlyActive = currentStatus === 'active';
        const newIsActive = !isCurrentlyActive;
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';

        try {
            const token = getStoredToken();
            if (!token) {
                alert('Vui lòng đăng nhập để tiếp tục');
                return;
            }

            const requestBody = {
                isActive: newIsActive,
            };

            const response = await fetch(`${API_BASE_URL}/users/${employeeId}`, {
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
            setAllEmployees(prevEmployees => 
                prevEmployees.map(employee => 
                    employee.id === employeeId 
                        ? { ...employee, status: newIsActive ? 'active' : 'locked' }
                        : employee
                )
            );
            setFilteredEmployees(prevFiltered => 
                prevFiltered.map(employee => 
                    employee.id === employeeId 
                        ? { ...employee, status: newIsActive ? 'active' : 'locked' }
                        : employee
                )
            );
            
            setNotif({ 
                open: true, 
                type: 'success', 
                title: 'Thành công', 
                message: `Đã ${action} tài khoản thành công`, 
                duration: 3000 
            });
        } catch (err) {
            console.error(`Error ${action} staff:`, err);
            setNotif({ 
                open: true, 
                type: 'error', 
                title: 'Thất bại', 
                message: `Không thể ${action} tài khoản: ${err.message || 'Vui lòng thử lại sau.'}`, 
                duration: 4000 
            });
        }
    };

    // Handle delete staff account
    const handleDelete = async (employeeId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.')) {
            return;
        }

        try {
            const token = getStoredToken();
            if (!token) {
                alert('Vui lòng đăng nhập để tiếp tục');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/users/${employeeId}`, {
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
            await fetchStaff();
            alert('Đã xóa tài khoản thành công');
        } catch (err) {
            console.error('Error deleting staff:', err);
            alert('Không thể xóa tài khoản. Vui lòng thử lại sau.');
        }
    };

    const handleViewDetails = (employeeId) => {
        navigate(`/admin/staff/${employeeId}`);
    };

    const handleAddEmployee = () => {
        navigate('/admin/add-employee');
    };

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
                                <th>Mã nhân viên</th>
                                <th>Tên nhân viên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                                <th>Chi tiết nhân viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                        Không có dữ liệu nhân viên
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className={cx('table-row')}>
                                        <td>{employee.id}</td>
                                        <td>{employee.fullName || employee.name || 'N/A'}</td>
                                        <td>{employee.email}</td>
                                        <td>{employee.phone}</td>
                                        <td className={cx('status', getStatusClass(employee.status))}>
                                            {getStatusText(employee.status)}
                                        </td>
                                        <td className={cx('actions')}>
                                            <button 
                                                className={cx('btn', 'edit-btn')}
                                                onClick={() => navigate(`/admin/staff/${employee.id}`)}
                                            >
                                                Sửa
                                            </button>
                                            {employee.status === 'active' ? (
                                                <button 
                                                    className={cx('btn', 'lock-btn')}
                                                    onClick={() => handleToggleLock(employee.id, employee.status)}
                                                >
                                                    Khóa
                                                </button>
                                            ) : (
                                                <button 
                                                    className={cx('btn', 'unlock-btn')}
                                                    onClick={() => handleToggleLock(employee.id, employee.status)}
                                                >
                                                    Mở khóa
                                                </button>
                                            )}
                                            <button 
                                                className={cx('btn', 'delete-btn')}
                                                onClick={() => handleDelete(employee.id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className={cx('btn', 'detail-btn')}
                                                onClick={() => handleViewDetails(employee.id)}
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
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm || (() => {})}
                onCancel={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
            />
            <Notification
                open={notif.open}
                type={notif.type}
                title={notif.title}
                message={notif.message}
                duration={notif.duration}
                onClose={() => setNotif((n) => ({ ...n, open: false }))}
            />
        </div>
    );
}

export default ManageStaffAccountsPage;

