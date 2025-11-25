import { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './RefundManagementPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl, getStoredToken, formatCurrency } from '../../../../services';

const cx = classNames.bind(styles);

// Map status from backend to display
const statusMap = {
    RETURN_REQUESTED: 'Yêu cầu hoàn tiền/ trả hàng',
    REFUNDED: 'Đã hoàn tiền/ trả hàng',
    RETURN_REJECTED: 'Từ chối hoàn tiền/ trả hàng',
};

export default function RefundManagementPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch refund requests from API
    useEffect(() => {
        const fetchRefunds = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để xem danh sách yêu cầu trả hàng');
                    setLoading(false);
                    return;
                }

                // Fetch return requests from backend
                // Endpoint: GET /orders/return-requests
                // Returns orders with status RETURN_REQUESTED (and other return statuses if added later)
                
                const response = await fetch(`${API_BASE_URL}/orders/return-requests`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMessage = data?.message || 'Không thể tải danh sách yêu cầu trả hàng';
                    
                    if (response.status === 403 || response.status === 401) {
                        console.error('❌ Permission denied for /orders/return-requests');
                        console.error('📋 Backend endpoint exists but CUSTOMER_SUPPORT role may not have permission.');
                        console.error('💡 Check backend security configuration for role CUSTOMER_SUPPORT');
                        setRefunds([]);
                        setError('Bạn không có quyền truy cập tính năng này. Vui lòng liên hệ quản trị viên.');
                        setLoading(false);
                        return;
                    } else {
                        throw new Error(errorMessage);
                    }
                }

                // Map backend data to display format
                // Backend returns OrderResponse objects with return status
                const rawOrders = data?.result || data || [];
                console.log('🔍 RefundManagement: Raw orders from API:', rawOrders.length, rawOrders);
                
                const mappedRefunds = rawOrders.map((order) => {
                    // Use refundAmount from backend if available, otherwise calculate or use totalAmount
                    const refundAmount = order.refundAmount != null ? order.refundAmount : (order.totalAmount || 0);
                    
                    // Use orderDateTime as confirmation date (when staff/admin confirms the refund)
                    // For RETURN_REQUESTED status, this is the date when customer requested
                    const confirmationDate = order.orderDateTime || order.orderDate || '';
                    
                    console.log('🔍 Mapping refund order:', {
                        code: order.code,
                        totalAmount: order.totalAmount,
                        refundAmount: order.refundAmount,
                        refundReturnFee: order.refundReturnFee,
                        refundReasonType: order.refundReasonType,
                        refundMethod: order.refundMethod,
                        refundReturnAddress: order.refundReturnAddress,
                        mappedRefundAmount: refundAmount,
                        status: order.status,
                    });
                    
                    return {
                        id: order.id,
                        orderCode: order.code || order.id || '',
                        customer: order.customerName || order.receiverName || '',
                        totalAmount: order.totalAmount || 0,
                        refundAmount: refundAmount, // Use refundAmount from backend
                        refundReturnFee: order.refundReturnFee || 0, // Phí trả hàng
                        refundReasonType: order.refundReasonType || '',
                        refundDescription: order.refundDescription || '',
                        refundEmail: order.refundEmail || '',
                        refundReturnAddress: order.refundReturnAddress || '',
                        refundMethod: order.refundMethod || '',
                        refundBank: order.refundBank || '',
                        refundAccountNumber: order.refundAccountNumber || '',
                        refundAccountHolder: order.refundAccountHolder || '',
                        confirmationDate: confirmationDate,
                        status: statusMap[order.status] || order.status || 'Chờ xác nhận',
                        statusRaw: order.status,
                    };
                });
                
                console.log('🔍 RefundManagement: Mapped refunds:', mappedRefunds.length, mappedRefunds);

                setRefunds(mappedRefunds);
            } catch (err) {
                console.error('Error fetching refunds:', err);
                // Don't show error if it's just a 404 (endpoint not implemented yet)
                if (err.message && !err.message.includes('404')) {
                    setError(err.message || 'Đã xảy ra lỗi khi tải danh sách yêu cầu trả hàng');
                } else {
                    setRefunds([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRefunds();
    }, [API_BASE_URL]);

    // Filter refunds based on search, date, and status
    const filteredRefunds = useMemo(() => {
        let filtered = [...refunds];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (refund) =>
                    refund.orderCode?.toLowerCase().includes(query) ||
                    refund.customer?.toLowerCase().includes(query)
            );
        }

        // Date filter
        if (selectedDate) {
            filtered = filtered.filter((refund) => {
                if (!refund.confirmationDate) return false;
                const refundDate = new Date(refund.confirmationDate).toISOString().split('T')[0];
                return refundDate === selectedDate;
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((refund) => refund.statusRaw === statusFilter);
        }

        return filtered;
    }, [refunds, searchQuery, selectedDate, statusFilter]);

    const handleViewDetail = (refund) => {
        // Navigate to refund detail page
        navigate(`/customer-support/refund-management/${refund.id}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
        }
    };

    // Format currency with dot separator (180.000 instead of 180,000)
    const formatCurrencyWithDot = (amount) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace(/,/g, '.');
    };

    const getStatusClass = (statusRaw) => {
        const statusClasses = {
            RETURN_REQUESTED: 'pending',
            REFUNDED: 'completed',
            RETURN_REJECTED: 'rejected',
        };
        return statusClasses[statusRaw] || 'pending';
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('top-line')}></div>
            <div className={cx('page-header')}>
                <h1 className={cx('page-title')}>Quản lý Trả hàng/ Hoàn tiền</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/customer-support')}>
                    ← Dashboard
                </button>
            </div>

            <div className={cx('content-wrapper')}>
                {/* Search and Filter Section */}
                <div className={cx('search-section')}>
                    <div className={cx('search-row')}>
                        <input
                            type="text"
                            className={cx('search-input')}
                            placeholder="Tìm kiếm theo mã đơn, tên sản phẩm,......"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <input
                            type="date"
                            className={cx('date-input')}
                            placeholder="dd/mm/yyyy"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <button className={cx('search-btn')}>Tìm kiếm</button>
                    </div>
                    <div className={cx('filter-row')}>
                        <label className={cx('filter-label')}>Sắp xếp:</label>
                        <select
                            className={cx('filter-select')}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="RETURN_REQUESTED">Yêu cầu hoàn tiền/ trả hàng</option>
                            <option value="REFUNDED">Đã hoàn tiền/ trả hàng</option>
                            <option value="RETURN_REJECTED">Từ chối hoàn tiền/ trả hàng</option>
                        </select>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className={cx('loading')}>Đang tải...</div>
                ) : error ? (
                    <div className={cx('error')}>{error}</div>
                ) : (
                    <div className={cx('table-container')}>
                        {filteredRefunds.length === 0 ? (
                            <div className={cx('empty-state')}>
                                <p>Chưa có yêu cầu trả hàng nào</p>
                            </div>
                        ) : (
                            <table className={cx('refund-table')}>
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Tổng tiền</th>
                                        <th>Tiền hoàn</th>
                                        <th>Ngày nhân viên xác nhận</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRefunds.map((refund) => (
                                        <tr key={refund.id}>
                                            <td>{refund.orderCode}</td>
                                            <td>{refund.customer}</td>
                                            <td>{formatCurrencyWithDot(refund.totalAmount)}</td>
                                            <td>{formatCurrencyWithDot(refund.refundAmount)}</td>
                                            <td>{formatDate(refund.confirmationDate)}</td>
                                            <td>
                                                <span
                                                    className={cx('status-badge', getStatusClass(refund.statusRaw))}
                                                >
                                                    {refund.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={cx('view-btn')}
                                                    onClick={() => handleViewDetail(refund)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

