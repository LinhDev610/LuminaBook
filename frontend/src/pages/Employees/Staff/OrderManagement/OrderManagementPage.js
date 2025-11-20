import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './OrderManagementPage.scss';
import { useNavigate } from 'react-router-dom';
import SearchAndSort from '../../../../components/Common/SearchAndSort';
import { formatDateTime, getApiBaseUrl, getStoredToken } from '../../../../services';

const cx = classNames.bind(styles);

// Mapping trạng thái đơn hàng từ backend sang label & class hiển thị
const mapOrderStatus = (statusRaw) => {
    const status = String(statusRaw || '').toUpperCase();
    switch (status) {
        case 'CREATED':
        case 'PENDING':
            return { label: 'Chờ xác nhận', css: 'pending' };
        case 'CONFIRMED':
        case 'PAID':
            return { label: 'Đang xử lý', css: 'processing' };
        case 'SHIPPED':
            return { label: 'Đang giao', css: 'shipping' };
        case 'DELIVERED':
            return { label: 'Hoàn thành', css: 'completed' };
        case 'CANCELLED':
            return { label: 'Đã hủy', css: 'cancelled' };
        default:
            return { label: statusRaw || 'Chờ xác nhận', css: 'pending' };
    }
};

// Dữ liệu mẫu dùng tạm nếu API chưa có / lỗi
const MOCK_ORDERS = [
    {
        id: 'DH001',
        username: '@nguyenvana',
        email: 'nguyenvana@gmail.com',
        orderDate: '2025-10-10',
        totalAmount: 1250000,
        status: 'CREATED',
    },
    {
        id: 'DH002',
        username: '@tranthib',
        email: 'tranthib@gmail.com',
        orderDate: '2025-10-11',
        totalAmount: 890000,
        status: 'PAID',
    },
    {
        id: 'DH003',
        username: '@levanc',
        email: 'levanc@gmail.com',
        orderDate: '2025-10-12',
        totalAmount: 2100000,
        status: 'SHIPPED',
    },
    {
        id: 'DH004',
        username: '@phamdd',
        email: 'phamdd@gmail.com',
        orderDate: '2025-10-09',
        totalAmount: 460000,
        status: 'DELIVERED',
    },
    {
        id: 'DH005',
        username: '@dothie',
        email: 'dothie@gmail.com',
        orderDate: '2025-10-08',
        totalAmount: 1780000,
        status: 'CREATED',
    },
];

// Chuyển đổi dữ liệu đơn hàng từ API sang dạng hiển thị
const mapOrderFromApi = (order) => {
    if (!order) return null;
    const { label, css } = mapOrderStatus(order.status);
    const user = order.user || {};
    const cart = order.cart || {};

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        username:
            user.username ||
            user.userName ||
            user.fullName ||
            user.name ||
            user.email ||
            'Khách hàng',
        email: user.email || '',
        orderDate: order.orderDate || order.createdAt || null,
        totalAmount:
            typeof order.totalAmount === 'number'
                ? order.totalAmount
                : typeof cart.totalAmount === 'number'
                  ? cart.totalAmount
                  : 0,
        rawStatus: order.status,
        statusLabel: label,
        statusClass: css,
    };
};

// Format ngày giờ hiển thị cho bảng đơn hàng: "HH:mm dd/MM/yy"
const formatOrderDateTime = (value) => {
    if (!value) return '--';
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '--';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mi} ${dd}/${mm}/${yy}`;
    } catch {
        // fallback: dùng formatDateTime chung nếu có lỗi bất ngờ
        return formatDateTime(value);
    }
};

export default function OrderManagementPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch danh sách đơn hàng (tạm thời: cố gắng gọi API, nếu lỗi dùng mock)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');

                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();

                // TODO: Điều chỉnh endpoint / quyền truy cập khi backend Order API sẵn sàng
                const resp = await fetch(`${apiBaseUrl}/orders/my-orders`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    console.warn('OrderManagement: API /orders/my-orders trả lỗi, dùng MOCK_ORDERS');
                    setOrders(
                        MOCK_ORDERS.map((o) => ({
                            ...o,
                            code: o.id,
                            statusLabel: mapOrderStatus(o.status).label,
                            statusClass: mapOrderStatus(o.status).css,
                        })),
                    );
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || [];
                const list = Array.isArray(raw) ? raw : [];
                const mapped = list
                    .map(mapOrderFromApi)
                    .filter(Boolean);
                setOrders(mapped.length > 0 ? mapped : []);
            } catch (err) {
                console.error('OrderManagement: Lỗi khi tải đơn hàng, dùng MOCK_ORDERS:', err);
                setError('Không thể tải danh sách đơn hàng từ server. Đang hiển thị dữ liệu mẫu.');
                setOrders(
                    MOCK_ORDERS.map((o) => ({
                        ...o,
                        code: o.id,
                        statusLabel: mapOrderStatus(o.status).label,
                        statusClass: mapOrderStatus(o.status).css,
                    })),
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Lọc đơn hàng theo ô tìm kiếm, ngày và trạng thái
    const filteredOrders = useMemo(() => {
        let result = orders;

        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            result = result.filter((o) => {
                return (
                    o.code?.toLowerCase().includes(kw) ||
                    o.username?.toLowerCase().includes(kw) ||
                    o.email?.toLowerCase().includes(kw)
                );
            });
        }

        if (dateFilter) {
            result = result.filter((o) => {
                if (!o.orderDate) return false;
                try {
                    const orderDateStr =
                        typeof o.orderDate === 'string'
                            ? o.orderDate.substring(0, 10)
                            : new Date(o.orderDate).toISOString().substring(0, 10);
                    return orderDateStr === dateFilter;
                } catch {
                    return false;
                }
            });
        }

        if (statusFilter !== 'all') {
            result = result.filter((o) => {
                const mapped = mapOrderStatus(o.rawStatus || o.status);
                return mapped.css === statusFilter;
            });
        }

        // Sắp xếp mới nhất lên trước theo ngày đặt
        return [...result].sort((a, b) => {
            const da = a.orderDate ? new Date(a.orderDate) : 0;
            const db = b.orderDate ? new Date(b.orderDate) : 0;
            return db - da;
        });
    }, [orders, keyword, dateFilter, statusFilter]);

    const handleConfirmOrder = (orderId) => {
        // TODO: Gọi API cập nhật trạng thái đơn sang CONFIRMED
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? {
                          ...o,
                          rawStatus: 'CONFIRMED',
                          ...mapOrderStatus('CONFIRMED'),
                      }
                    : o,
            ),
        );
    };

    const handleCancelOrder = (orderId) => {
        // TODO: Gọi API cập nhật trạng thái đơn sang CANCELLED
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? {
                          ...o,
                          rawStatus: 'CANCELLED',
                          ...mapOrderStatus('CANCELLED'),
                      }
                    : o,
            ),
        );
    };

    const handleViewDetail = (orderId) => {
        // TODO: Tạo route chi tiết đơn hàng riêng nếu cần
        navigate(`/staff/orders/${orderId}`);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý đơn hàng</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>

            <div className={cx('wrap')}>
                <SearchAndSort
                    searchPlaceholder="Tìm kiếm theo mã đơn, tên sản phẩm,...."
                    searchValue={keyword}
                    onSearchChange={(e) => setKeyword(e.target.value)}
                    onSearchClick={() => {}}
                    dateFilter={dateFilter}
                    onDateChange={(value) => setDateFilter(value)}
                    dateLabel="dd/mm/yyyy"
                    sortLabel="Sắp xếp:"
                    sortOptions={[
                        { value: 'all', label: 'Tất cả trạng thái' },
                        { value: 'pending', label: 'Chờ xác nhận' },
                        { value: 'processing', label: 'Đang xử lý' },
                        { value: 'shipping', label: 'Đang giao' },
                        { value: 'completed', label: 'Hoàn thành' },
                        { value: 'cancelled', label: 'Đã hủy' },
                    ]}
                    sortValue={statusFilter}
                    onSortChange={(e) => setStatusFilter(e.target.value)}
                />

                {loading && (
                    <div className={cx('info-row')}>Đang tải danh sách đơn hàng...</div>
                )}
                {error && !loading && (
                    <div className={cx('info-row', 'error')}>{error}</div>
                )}

                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách đơn hàng</div>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Username</th>
                                <th>Ngày</th>
                                <th>Tổng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                const { label, css } = mapOrderStatus(
                                    order.rawStatus || order.status,
                                );
                                const isPending = css === 'pending';

                                return (
                                    <tr key={order.id}>
                                        <td className={cx('code-cell')}>#{order.code}</td>
                                        <td className={cx('user-cell')}>
                                            <div className={cx('username')}>{order.username}</div>
                                            {order.email && (
                                                <div className={cx('email')}>{order.email}</div>
                                            )}
                                        </td>
                                        <td>
                                            {formatOrderDateTime(order.orderDate)}
                                        </td>
                                        <td>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(order.totalAmount || 0)}
                                        </td>
                                        <td className={cx('status-cell')}>
                                            <span className={cx('status-pill', css)}>{label}</span>
                                        </td>
                                        <td className={cx('actions-cell')}>
                                            <button
                                                className={cx('btn', 'view')}
                                                onClick={() => handleViewDetail(order.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                            {isPending && (
                                                <>
                                                    <button
                                                        className={cx('btn', 'confirm')}
                                                        onClick={() => handleConfirmOrder(order.id)}
                                                    >
                                                        Xác nhận
                                                    </button>
                                                    <button
                                                        className={cx('btn', 'cancel')}
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        Hủy
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        Không có đơn hàng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


