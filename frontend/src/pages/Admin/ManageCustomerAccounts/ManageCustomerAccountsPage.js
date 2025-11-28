import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageCustomerAccountsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';
import ConfirmDialog from '../../../components/Common/ConfirmDialog/DeleteAccountDialog';
import Notification from '../../../components/Common/Notification/Notification';
import { getAllUsers, updateUser, deleteUser } from '../../../services';

const cx = classNames.bind(styles);

function ManageCustomerAccountsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('all');
    const [allCustomers, setAllCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialConfirmState = {
        open: false,
        title: '',
        message: '',
        onConfirm: null,
    };
    const [confirmDialog, setConfirmDialog] = useState(initialConfirmState);
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

            const users = await getAllUsers(token);

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
    const handleToggleLock = (customerId, currentStatus) => {
        // Nếu đang active thì khóa (isActive = false), nếu đang locked thì mở khóa (isActive = true)
        const isCurrentlyActive = currentStatus === 'active';
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
        const customer = allCustomers.find(c => c.id === customerId);
        const customerName = customer?.fullName || customer?.email || `#${customerId}`;

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hành động',
            message: `Bạn có chắc chắn muốn ${action} tài khoản ${customerName}?`,
            onConfirm: () => performToggleLock(customerId, currentStatus),
        });
    };

    const performToggleLock = async (customerId, currentStatus) => {
        setConfirmDialog(initialConfirmState);

        const isCurrentlyActive = currentStatus === 'active';
        const newIsActive = !isCurrentlyActive;
        const action = isCurrentlyActive ? 'khóa' : 'mở khóa';

        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Chưa đăng nhập',
                    message: 'Vui lòng đăng nhập để tiếp tục',
                    duration: 3000,
                });
                return;
            }

            const requestBody = { isActive: newIsActive };
            await updateUser(customerId, requestBody, token);

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

            setNotif({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: `Đã ${action} tài khoản thành công`,
                duration: 3000
            });
        } catch (err) {
            console.error(`Error ${action} customer:`, err);
            setNotif({
                open: true,
                type: 'error',
                title: 'Thất bại',
                message: `Không thể ${action} tài khoản: ${err.message || 'Vui lòng thử lại sau.'}`,
                duration: 4000
            });
        }
    };

    // Handle delete customer account
    const handleDelete = (customerId) => {
        const customer = allCustomers.find((c) => c.id === customerId);
        const customerName = customer?.fullName || customer?.email || `#${customerId}`;
        setConfirmDialog({
            open: true,
            title: 'Xác nhận xóa tài khoản',
            message: `Bạn có chắc chắn muốn xóa tài khoản ${customerName}? Hành động này không thể hoàn tác.`,
            onConfirm: () => performDelete(customerId),
        });
    };

    const performDelete = async (customerId) => {
        setConfirmDialog(initialConfirmState);

        try {
            const token = getStoredToken();
            if (!token) {
                setNotif({
                    open: true,
                    type: 'error',
                    title: 'Chưa đăng nhập',
                    message: 'Vui lòng đăng nhập để tiếp tục',
                    duration: 3000,
                });
                return;
            }

            await deleteUser(customerId, token);

            // Sau khi xóa thành công, fetch lại dữ liệu từ backend để đảm bảo hiển thị đúng
            await fetchCustomers();
            setNotif({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: 'Đã xóa tài khoản thành công',
                duration: 3000,
            });
        } catch (err) {
            console.error('Error deleting customer:', err);
            setNotif({
                open: true,
                type: 'error',
                title: 'Thất bại',
                message: 'Không thể xóa tài khoản. Vui lòng thử lại sau.',
                duration: 4000,
            });
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
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm || (() => { })}
                onCancel={() => setConfirmDialog(initialConfirmState)}
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

export default ManageCustomerAccountsPage;
