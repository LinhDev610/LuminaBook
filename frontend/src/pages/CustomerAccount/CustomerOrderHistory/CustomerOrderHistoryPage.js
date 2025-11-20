import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CustomerOrderHistoryPage.module.scss';
import { formatCurrency } from '../../../services';

const cx = classNames.bind(styles);

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
};

const TABS = [
    { key: 'pending', label: 'Chờ xác nhận', status: 'PENDING' },
    { key: 'confirmed', label: 'Chờ lấy hàng', status: 'CONFIRMED' },
    { key: 'shipping', label: 'Chờ giao hàng', status: 'SHIPPING' },
    { key: 'delivered', label: 'Đã giao', status: 'DELIVERED' },
    { key: 'returning', label: 'Trả hàng', status: 'RETURNING' },
    { key: 'cancelled', label: 'Đã hủy', status: 'CANCELLED' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Ngày mới nhất' },
    { value: 'oldest', label: 'Ngày cũ nhất' },
    { value: 'price-high', label: 'Giá cao đến thấp' },
    { value: 'price-low', label: 'Giá thấp đến cao' },
];

function CustomerOrderHistoryPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        let orders = MOCK_ORDERS.filter((order) => {
            const statusMap = STATUS_MAP[order.status];
            if (!statusMap) return false;
            return statusMap.key === activeTab;
        });

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            orders = orders.filter(
                (order) =>
                    order.code.toLowerCase().includes(query) ||
                    order.items.some((item) => item.name.toLowerCase().includes(query)),
            );
        }

        // Date filter
        if (selectedDate) {
            orders = orders.filter((order) => order.orderDate === selectedDate);
        }

        // Sort
        orders = [...orders].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.orderDate) - new Date(a.orderDate);
                case 'oldest':
                    return new Date(a.orderDate) - new Date(b.orderDate);
                case 'price-high':
                    return b.totalAmount - a.totalAmount;
                case 'price-low':
                    return a.totalAmount - b.totalAmount;
                default:
                    return 0;
            }
        });

        return orders;
    }, [activeTab, searchQuery, selectedDate, sortBy]);

    const handleViewDetail = (orderId) => {
        navigate(`/customer-account/orders/${orderId}`);
    };

    const formatOrderDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
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
                        {filteredOrders.length === 0 ? (
                            <div className={cx('empty-state')}>
                                <p>Không có đơn hàng nào</p>
                            </div>
                        ) : (
                            <div className={cx('orders-list')}>
                                {filteredOrders.map((order) => {
                                    const statusInfo = STATUS_MAP[order.status];
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

                                            <div className={cx('order-actions')}>
                                                <button
                                                    className={cx('view-detail-btn')}
                                                    onClick={() => handleViewDetail(order.id)}
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
