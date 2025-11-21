import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import styles from './ManageOrdersPage.module.scss';
import { formatDateTime, getApiBaseUrl, getStoredToken } from '../../../services/utils';

const cx = classNames.bind(styles);

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
            return { label: 'Đã giao', css: 'delivered' };
        case 'CANCELLED':
            return { label: 'Đã hủy', css: 'cancelled' };
        default:
            return { label: statusRaw || 'Chờ xác nhận', css: 'pending' };
    }
};

const STATUS_FILTERS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const parseShippingInfo = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            return {
                name: parsed.name || parsed.receiverName || '',
                phone: parsed.phone || parsed.receiverPhone || '',
                address: parsed.address || parsed.fullAddress || '',
            };
        }
    } catch {
        return { address: raw };
    }
    return { address: raw };
};

const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(typeof value === 'number' ? value : Number(value) || 0);

const getOrderDateValue = (order) => {
    if (!order) return null;
    return order.orderDateTime || order.orderDate || order.createdAt || null;
};

const mapOrderFromApi = (order) => {
    if (!order) return null;
    const rawStatus = order.status || order.rawStatus;
    const { label, css } = mapOrderStatus(rawStatus);
    const shippingInfo = parseShippingInfo(order.shippingAddress);
    const orderDate = getOrderDateValue(order);

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        customerName:
            order.receiverName ||
            shippingInfo?.name ||
            order.customerName ||
            order.userFullName ||
            'Khách hàng',
        email: order.customerEmail || order.userEmail || '',
        orderDate,
        orderDateOnly: order.orderDate || null,
        totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : Number(order.totalAmount) || 0,
        statusLabel: label,
        statusClass: css,
        rawStatus,
    };
};

function ManageOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchOrders = useMemo(
        () => async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();
                const resp = await fetch(`${apiBaseUrl}/orders`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    throw new Error(`API error ${resp.status}`);
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || [];
                const list = Array.isArray(raw) ? raw : [];
                const mapped = list.map(mapOrderFromApi).filter(Boolean);
                setOrders(mapped);
            } catch (err) {
                console.error('ManageOrders: load orders failed', err);
                setOrders([]);
                setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        let list = orders;
        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            list = list.filter((order) => {
                return (
                    order.code?.toLowerCase().includes(query) ||
                    order.customerName?.toLowerCase().includes(query) ||
                    order.email?.toLowerCase().includes(query)
                );
            });
        }

        if (selectedDate) {
            list = list.filter((order) => {
                const base = order.orderDateOnly || order.orderDate;
                if (!base) return false;
                try {
                    return String(base).substring(0, 10) === selectedDate;
                } catch {
                    return false;
                }
            });
        }

        if (statusFilter !== 'all') {
            list = list.filter((order) => order.statusClass === statusFilter);
        }

        return [...list].sort((a, b) => {
            const da = a.orderDate ? new Date(a.orderDate) : 0;
            const db = b.orderDate ? new Date(b.orderDate) : 0;
            return db - da;
        });
    }, [orders, searchTerm, selectedDate, statusFilter]);

    const handleViewDetail = (orderId) => {
        if (!orderId) return;
        navigate(`/admin/orders/${orderId}`);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <h1>Quản lý đơn hàng</h1>
            </div>

            <form
                className={cx('filters')}
                onSubmit={(e) => {
                    e.preventDefault();
                }}
            >
                <input
                    type="text"
                    className={cx('searchInput')}
                    placeholder="Tìm kiếm theo mã đơn, tên khách, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className={cx('dateInputWrapper')}>
                    <input
                        type="date"
                        className={cx('dateInput')}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
                <button type="submit" className={cx('searchButton')}>
                    Tìm kiếm
                </button>
                <div className={cx('statusFilter')}>
                    <label htmlFor="order-status-select">Sắp xếp:</label>
                    <select
                        id="order-status-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {STATUS_FILTERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </form>

            {loading ? (
                <div className={cx('stateCard')}>Đang tải danh sách đơn hàng...</div>
            ) : error ? (
                <div className={cx('stateCard', 'error')}>
                    <p>{error}</p>
                    <button type="button" onClick={fetchOrders}>
                        Thử lại
                    </button>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className={cx('stateCard')}>Không có đơn hàng phù hợp.</div>
            ) : (
                <div className={cx('tableWrapper')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Họ và tên</th>
                                <th>Email</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.code}</td>
                                    <td>{order.customerName}</td>
                                    <td>{order.email || '---'}</td>
                                    <td>{order.orderDate ? formatDateTime(order.orderDate) : '--'}</td>
                                    <td>{formatPrice(order.totalAmount)}</td>
                                    <td>
                                        <span className={cx('statusBadge', order.statusClass)}>
                                            {order.statusLabel}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={cx('detailButton')}
                                            onClick={() => handleViewDetail(order.id)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ManageOrdersPage;

