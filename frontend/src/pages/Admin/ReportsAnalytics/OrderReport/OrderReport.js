import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './OrderReport.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency, getDateRange, formatNumber } from '../../../../services';

const cx = classNames.bind(styles);
const { orders } = API_ROUTES;

function OrderReport({ timeMode = 'day', customDateRange = null }) {
    const [orderStatistics, setOrderStatistics] = useState(null);
    const [orderPageData, setOrderPageData] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20); // Số đơn hàng mỗi trang
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Reset về trang đầu khi timeMode hoặc customDateRange thay đổi
        setCurrentPage(0);
    }, [timeMode, customDateRange]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiBaseUrl = getApiBaseUrl();
                const token = getStoredToken();
                const { start, end } = getDateRange(timeMode, customDateRange);

                // Fetch order statistics
                const statisticsResponse = await fetch(
                    `${apiBaseUrl}${orders.statistics(start, end)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!statisticsResponse.ok) {
                    throw new Error('Failed to fetch order statistics');
                }

                const statisticsData = await statisticsResponse.json();
                if (statisticsData.result) {
                    setOrderStatistics(statisticsData.result);
                }

                // Fetch orders with pagination
                const ordersResponse = await fetch(
                    `${apiBaseUrl}${orders.recent(start, end, currentPage, pageSize)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!ordersResponse.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const ordersData = await ordersResponse.json();
                if (ordersData.result) {
                    // Sắp xếp các đơn hàng theo độ mới (mới nhất trước)
                    const sortedOrders = [...(ordersData.result.orders || [])].sort((a, b) => {
                        const dateA = new Date(a.orderDateTime || a.orderDate || 0);
                        const dateB = new Date(b.orderDateTime || b.orderDate || 0);
                        return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
                    });
                    setOrderPageData({
                        ...ordersData.result,
                        orders: sortedOrders
                    });
                }
            } catch (err) {
                console.error('Error fetching order data:', err);
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeMode, customDateRange, currentPage, pageSize]);

    // Format order status
    const formatOrderStatus = (status) => {
        const statusMap = {
            'CREATED': { label: 'Đã tạo', className: 'badgeNeutral' },
            'CONFIRMED': { label: 'Đã xác nhận', className: 'badgeNeutral' },
            'PAID': { label: 'Đã thanh toán', className: 'badgeSuccess' },
            'SHIPPED': { label: 'Đang giao', className: 'badgeWarning' },
            'DELIVERED': { label: 'Thành công', className: 'badgeSuccess' },
            'CANCELLED': { label: 'Đã hủy', className: 'badgeDanger' },
            'RETURN_REQUESTED': { label: 'Yêu cầu trả hàng', className: 'badgeWarning' },
            'RETURN_CS_CONFIRMED': { label: 'CS xác nhận trả', className: 'badgeWarning' },
            'RETURN_STAFF_CONFIRMED': { label: 'NV xác nhận trả', className: 'badgeWarning' },
            'REFUNDED': { label: 'Hoàn tiền', className: 'badgeDanger' },
            'RETURN_REJECTED': { label: 'Từ chối trả hàng', className: 'badgeNeutral' },
        };
        return statusMap[status] || { label: status, className: 'badgeNeutral' };
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < (orderPageData?.totalPages || 0)) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderPagination = () => {
        if (!orderPageData || orderPageData.totalPages <= 1) return null;

        const pages = [];
        const totalPages = orderPageData.totalPages;
        const current = orderPageData.currentPage;

        // Hiển thị tối đa 7 số trang
        let startPage = Math.max(0, current - 3);
        let endPage = Math.min(totalPages - 1, current + 3);

        // Điều chỉnh nếu gần đầu hoặc cuối
        if (current < 3) {
            endPage = Math.min(6, totalPages - 1);
        }
        if (current > totalPages - 4) {
            startPage = Math.max(0, totalPages - 7);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className={cx('pagination')}>
                <button
                    className={cx('paginationButton')}
                    onClick={() => handlePageChange(0)}
                    disabled={current === 0}
                >
                    «
                </button>
                <button
                    className={cx('paginationButton')}
                    onClick={() => handlePageChange(current - 1)}
                    disabled={!orderPageData.hasPrevious}
                >
                    ‹
                </button>
                {startPage > 0 && (
                    <>
                        <button
                            className={cx('paginationButton')}
                            onClick={() => handlePageChange(0)}
                        >
                            1
                        </button>
                        {startPage > 1 && <span className={cx('paginationEllipsis')}>...</span>}
                    </>
                )}
                {pages.map((page) => (
                    <button
                        key={page}
                        className={cx('paginationButton', { paginationButtonActive: page === current })}
                        onClick={() => handlePageChange(page)}
                    >
                        {page + 1}
                    </button>
                ))}
                {endPage < totalPages - 1 && (
                    <>
                        {endPage < totalPages - 2 && <span className={cx('paginationEllipsis')}>...</span>}
                        <button
                            className={cx('paginationButton')}
                            onClick={() => handlePageChange(totalPages - 1)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    className={cx('paginationButton')}
                    onClick={() => handlePageChange(current + 1)}
                    disabled={!orderPageData.hasNext}
                >
                    ›
                </button>
                <button
                    className={cx('paginationButton')}
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={current === totalPages - 1}
                >
                    »
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo đơn hàng</div>
                <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo đơn hàng</div>
                <div style={{ padding: '20px', color: '#b91c1c' }}>Lỗi: {error}</div>
            </div>
        );
    }

    const orderList = orderPageData?.orders || [];

    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo đơn hàng</div>
            <div className={cx('cardSubtitle')}>Chi tiết trạng thái đơn hàng</div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng đơn</div>
                    <div className={cx('statValue')}>
                        {formatNumber(orderStatistics?.totalOrders || 0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Đơn bị hủy</div>
                    <div className={cx('statValue')} style={{ color: '#b91c1c' }}>
                        {formatNumber(orderStatistics?.cancelledOrders || 0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Hoàn tiền</div>
                    <div className={cx('statValue')} style={{ color: '#ea580c' }}>
                        {formatNumber(orderStatistics?.refundedOrders || 0)}
                    </div>
                </div>
            </div>

            {orderPageData && (
                <div className={cx('paginationInfo')}>
                    Hiển thị {orderList.length > 0 ? (currentPage * pageSize + 1) : 0} - {Math.min((currentPage + 1) * pageSize, orderPageData.totalElements)} trong tổng số {formatNumber(orderPageData.totalElements)} đơn hàng
                </div>
            )}

            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Ngày</th>
                        <th>Khách hàng</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {orderList.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                Không có đơn hàng nào trong khoảng thời gian đã chọn
                            </td>
                        </tr>
                    ) : (
                        orderList.map((order) => {
                            const statusInfo = formatOrderStatus(order.status);
                            return (
                                <tr key={order.id}>
                                    <td>#{order.code || order.id.substring(0, 8).toUpperCase()}</td>
                                    <td>{formatDate(order.orderDate || order.orderDateTime)}</td>
                                    <td>{order.customerName || order.customerEmail || 'N/A'}</td>
                                    <td>{formatCurrency(order.totalAmount || 0)}</td>
                                    <td>
                                        <span className={cx('badge', statusInfo.className)}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {renderPagination()}
        </div>
    );
}

export default OrderReport;

