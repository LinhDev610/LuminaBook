import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CustomerOrderHistoryPage.module.scss';
import { formatCurrency, getApiBaseUrl, getStoredToken } from '../../../services';

const cx = classNames.bind(styles);

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

// Mock data - sẽ được thay thế bằng API sau
const MOCK_ORDERS = [
    {
        id: '1',
        code: 'DH123456',
        orderDate: '2025-09-25',
        status: 'PENDING',
        totalAmount: 200000,
        items: [
            {
                id: '1',
                name: 'Miền Bắc - Một Thời Chiến Tranh Một Thời Hòa Bình',
                quantity: 1,
                price: 200000,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, phường Thanh Xuân, Hà Nội',
    },
    {
        id: '2',
        code: 'DH123457',
        orderDate: '2025-10-08',
        status: 'DELIVERED',
        totalAmount: 316600,
        items: [
            {
                id: '1',
                name: 'Miền Bắc - Một Thời Chiến Tranh Một Thời Hòa Bình',
                quantity: 1,
                price: 200000,
                image: 'https://via.placeholder.com/80x100',
            },
            {
                id: '2',
                name: 'Hồ Điệp và Kình Ngư',
                quantity: 1,
                price: 111600,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, phường Thanh Xuân, Hà Nội',
    },
    {
        id: '3',
        code: 'DH123458',
        orderDate: '2025-09-20',
        status: 'RETURNING',
        totalAmount: 316600,
        items: [
            {
                id: '1',
                name: 'Miền Bắc - Một Thời Chiến Tranh Một Thời Hòa Bình',
                quantity: 1,
                price: 200000,
                image: 'https://via.placeholder.com/80x100',
            },
            {
                id: '2',
                name: 'Hồ Điệp và Kình Ngư',
                quantity: 1,
                price: 111600,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, Phường Tham Xuân, Hà Nội',
        refundStatus: 'REFUNDING',
    },
    {
        id: '4',
        code: 'DH123459',
        orderDate: '2025-09-15',
        status: 'CONFIRMED',
        totalAmount: 150000,
        items: [
            {
                id: '3',
                name: 'Sách Văn Học',
                quantity: 1,
                price: 150000,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, phường Thanh Xuân, Hà Nội',
    },
    {
        id: '5',
        code: 'DH123460',
        orderDate: '2025-09-10',
        status: 'SHIPPING',
        totalAmount: 250000,
        items: [
            {
                id: '4',
                name: 'Sách Khoa Học',
                quantity: 2,
                price: 125000,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, phường Thanh Xuân, Hà Nội',
    },
    {
        id: '6',
        code: 'DH123461',
        orderDate: '2025-09-05',
        status: 'CANCELLED',
        totalAmount: 180000,
        items: [
            {
                id: '5',
                name: 'Sách Lịch Sử',
                quantity: 1,
                price: 180000,
                image: 'https://via.placeholder.com/80x100',
            },
        ],
        recipient: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, phường Thanh Xuân, Hà Nội',
    },
];

// Mapping status
const STATUS_MAP = {
    PENDING: { label: 'Chờ xác nhận', key: 'pending' },
    CONFIRMED: { label: 'Chờ lấy hàng', key: 'confirmed' },
    SHIPPING: { label: 'Chờ giao hàng', key: 'shipping' },
    DELIVERED: { label: 'Đã giao', key: 'delivered' },
    RETURNING: { label: 'Trả hàng', key: 'returning' },
    CANCELLED: { label: 'Đã hủy', key: 'cancelled' },
    RETURN_REQUESTED: { label: 'Hoàn tiền/ trả hàng', key: 'return-requested' },
    REFUNDED: { label: 'Đã hoàn tiền/ trả hàng', key: 'refunded' },
    RETURN_REJECTED: { label: 'Từ chối hoàn tiền/ trả hàng', key: 'return-rejected' },
};

const TABS = [
    { key: 'pending', label: 'Chờ xác nhận', status: 'PENDING' },
    { key: 'confirmed', label: 'Chờ lấy hàng', status: 'CONFIRMED' },
    { key: 'shipping', label: 'Chờ giao hàng', status: 'SHIPPING' },
    { key: 'delivered', label: 'Đã giao', status: 'DELIVERED' },
    { key: 'return-requested', label: 'Hoàn tiền/ trả hàng', status: 'RETURN_REQUESTED' },
    { key: 'cancelled', label: 'Đã hủy', status: 'CANCELLED' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Ngày mới nhất' },
    { value: 'oldest', label: 'Ngày cũ nhất' },
    { value: 'price-high', label: 'Giá cao đến thấp' },
    { value: 'price-low', label: 'Giá thấp đến cao' },
];

// Chuyển trạng thái từ backend (CREATED, PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
// sang trạng thái hiển thị cho khách (PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED)
const mapOrderStatus = (statusRaw) => {
    const status = String(statusRaw || '').toUpperCase();
    switch (status) {
        case 'CREATED':
        case 'PENDING':
        case 'PAID':
            return { mappedStatus: 'PENDING', ...STATUS_MAP.PENDING };
        case 'CONFIRMED':
            return { mappedStatus: 'CONFIRMED', ...STATUS_MAP.CONFIRMED };
        case 'SHIPPED':
            return { mappedStatus: 'SHIPPING', ...STATUS_MAP.SHIPPING };
        case 'DELIVERED':
            return { mappedStatus: 'DELIVERED', ...STATUS_MAP.DELIVERED };
        case 'CANCELLED':
            return { mappedStatus: 'CANCELLED', ...STATUS_MAP.CANCELLED };
        case 'RETURN_REQUESTED':
            return { mappedStatus: 'RETURN_REQUESTED', ...STATUS_MAP.RETURN_REQUESTED };
        case 'REFUNDED':
            return { mappedStatus: 'REFUNDED', ...STATUS_MAP.REFUNDED };
        case 'RETURN_REJECTED':
            return { mappedStatus: 'RETURN_REJECTED', ...STATUS_MAP.RETURN_REJECTED };
        default:
            return { mappedStatus: 'PENDING', ...STATUS_MAP.PENDING };
    }
};

// Chuyển dữ liệu đơn hàng từ API sang dạng dùng trong UI khách hàng
const mapOrderFromApi = (order) => {
    if (!order) return null;
    const { mappedStatus, key } = mapOrderStatus(order.status);
    const shippingInfo = parseShippingInfo(order.shippingAddress);
    const orderDateValue = order.orderDateTime || order.orderDate || null;

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        orderDate: orderDateValue,
        orderDateOnly: order.orderDate || null,
        totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
        status: mappedStatus,
        rawStatus: order.status || mappedStatus,
        statusKey: key,
        recipient:
            order.receiverName ||
            shippingInfo?.name ||
            order.customerName ||
            'Khách hàng',
        phone: order.receiverPhone || shippingInfo?.phone || '',
        address: shippingInfo?.address || '',
        items: Array.isArray(order.items) ? order.items : [],
    };
};

function CustomerOrderHistoryPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Lấy lịch sử đơn hàng thật từ backend (/orders/my-orders)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');

                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();

                const resp = await fetch(`${apiBaseUrl}/orders/my-orders`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    console.warn('CustomerOrderHistory: API /orders/my-orders trả lỗi, dùng MOCK_ORDERS');
                    setError('Không thể tải lịch sử đơn hàng từ server. Đang hiển thị dữ liệu mẫu.');
                    setOrders(
                        MOCK_ORDERS.map((o) => {
                            const mapped = mapOrderStatus(o.status);
                            return {
                                ...o,
                                rawStatus: o.status,
                                statusKey: mapped.key,
                            };
                        }),
                    );
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || [];
                const list = Array.isArray(raw) ? raw : [];
                const mapped = list
                    .map(mapOrderFromApi)
                    .filter(Boolean);
                setOrders(mapped);
            } catch (err) {
                console.error('CustomerOrderHistory: Lỗi khi tải lịch sử đơn hàng, dùng MOCK_ORDERS:', err);
                setError('Không thể tải lịch sử đơn hàng từ server. Đang hiển thị dữ liệu mẫu.');
                setOrders(
                    MOCK_ORDERS.map((o) => {
                        const mapped = mapOrderStatus(o.status);
                        return {
                            ...o,
                            rawStatus: o.status,
                            statusKey: mapped.key,
                        };
                    }),
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        let list = orders.filter((order) => order.statusKey === activeTab);

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter((order) => {
                const matchesCode = order.code?.toLowerCase().includes(query);
                const matchesItems =
                    Array.isArray(order.items) &&
                    order.items.some((item) => item.name?.toLowerCase().includes(query));
                return matchesCode || matchesItems;
            });
        }

        // Date filter
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

        // Sort
        list = [...list].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
                case 'oldest':
                    return new Date(a.orderDate || 0) - new Date(b.orderDate || 0);
                case 'price-high':
                    return (b.totalAmount || 0) - (a.totalAmount || 0);
                case 'price-low':
                    return (a.totalAmount || 0) - (b.totalAmount || 0);
                default:
                    return 0;
            }
        });

        return list;
    }, [orders, activeTab, searchQuery, selectedDate, sortBy]);

    const handleViewDetail = (orderId, orderCode) => {
        // Use orderId if available, otherwise fallback to orderCode
        const targetId = orderId || orderCode;
        if (!targetId) {
            console.error('CustomerOrderHistory: Cannot navigate - missing order ID and code');
            return;
        }
        console.log('CustomerOrderHistory: Navigating to order detail with id/code:', targetId);
        navigate(`/customer-account/orders/${targetId}`);
    };

    const formatOrderDate = (dateString) => {
        if (!dateString) return '--';
        try {
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return dateString;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hasTime =
                (typeof dateString === 'string' && dateString.includes('T')) ||
                date.getHours() !== 0 ||
                date.getMinutes() !== 0 ||
                date.getSeconds() !== 0;
            if (!hasTime) {
            return `${day}/${month}/${year}`;
            }
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${hour}:${minute} ${day}/${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    return (
        <div className={cx('order-history-wrapper')}>
            <div className={cx('order-history-content')}>
                <main className={cx('order-history-main')}>
                    {/* Header */}
                    <section className={cx('header-section')}>
                        <div className={cx('header-title')}>
                            <img
                                src={require('../../../assets/icons/icon_clock.png')}
                                alt="clock"
                                className={cx('header-icon')}
                            />
                            <h1>Lịch sử mua hàng</h1>
                        </div>
                    </section>

                    {/* Tabs */}
                    <section className={cx('tabs-section')}>
                        <div className={cx('tabs')}>
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={cx('tab', { active: activeTab === tab.key })}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Search and Filter */}
                    <section className={cx('filter-section')}>
                        <div className={cx('filter-row')}>
                            <input
                                type="text"
                                className={cx('search-input')}
                                placeholder="Tìm kiếm theo mã đơn, tên sản phẩm,......"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className={cx('date-input-wrapper')}>
                                <input
                                    type="date"
                                    className={cx('date-input')}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    placeholder="dd/mm/yyyy"
                                />
                                <img
                                    src={require('../../../assets/icons/icon_clock.png')}
                                    alt="calendar"
                                    className={cx('calendar-icon')}
                                />
                            </div>
                            <button className={cx('search-btn')}>Tìm kiếm</button>
                            <div className={cx('sort-wrapper')}>
                                <span className={cx('sort-label')}>Sắp xếp:</span>
                                <select
                                    className={cx('sort-select')}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Orders List */}
                    <section className={cx('orders-section')}>
                        {loading ? (
                            <div className={cx('empty-state')}>
                                <p>Đang tải lịch sử đơn hàng...</p>
                            </div>
                        ) : error ? (
                            <div className={cx('empty-state')}>
                                <p>{error}</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className={cx('empty-state')}>
                                <p>Không có đơn hàng nào</p>
                            </div>
                        ) : (
                            <div className={cx('orders-list')}>
                                {filteredOrders.map((order) => {
                                    // Nếu order có rawStatus là RETURN_REQUESTED, REFUNDED, hoặc RETURN_REJECTED,
                                    // thì hiển thị status đó thay vì status mapped
                                    let displayStatus = order.status;
                                    if (order.rawStatus === 'RETURN_REQUESTED' || 
                                        order.rawStatus === 'REFUNDED' || 
                                        order.rawStatus === 'RETURN_REJECTED') {
                                        displayStatus = order.rawStatus;
                                    }
                                    const statusInfo = STATUS_MAP[displayStatus] || STATUS_MAP.PENDING;
                                    
                                    return (
                                        <div key={order.id} className={cx('order-card')}>
                                            <div className={cx('order-header')}>
                                                <div className={cx('order-info')}>
                                                    <h3 className={cx('order-code')}>
                                                        Đơn hàng #{order.code}
                                                    </h3>
                                                    <p className={cx('order-date')}>
                                                        Ngày đặt: {formatOrderDate(order.orderDate)}
                                                    </p>
                                                </div>
                                                <div className={cx('order-status-wrapper')}>
                                                    <button
                                                        className={cx('status-badge', statusInfo.key)}
                                                    >
                                                        {statusInfo.label}
                                                    </button>
                                                    <p className={cx('order-total')}>
                                                        {formatCurrency(order.totalAmount)}
                                                    </p>
                                                </div>
                                            </div>

                                            {Array.isArray(order.items) && order.items.length > 0 && (
                                            <div className={cx('order-items')}>
                                                {order.items.map((item) => (
                                                    <div key={item.id} className={cx('order-item')}>
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className={cx('item-image')}
                                                        />
                                                        <div className={cx('item-info')}>
                                                            <p className={cx('item-name')}>
                                                                {item.name}
                                                            </p>
                                                            <p className={cx('item-quantity')}>
                                                                Số lượng: {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            )}

                                            <div className={cx('order-actions')}>
                                                <button
                                                    className={cx('view-detail-btn')}
                                                    onClick={() => handleViewDetail(order.id, order.code)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default CustomerOrderHistoryPage;
