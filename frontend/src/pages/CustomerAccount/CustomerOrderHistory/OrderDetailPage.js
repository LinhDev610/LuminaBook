import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderDetailPage.module.scss';
import { formatCurrency } from '../../../services';

const cx = classNames.bind(styles);

// Mock data - sẽ được thay thế bằng API sau
const MOCK_ORDER_DETAILS = {
    '1': {
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
        paymentMethod: 'COD',
        paymentMethodLabel: 'Thanh toán khi nhận hàng',
    },
    '2': {
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
        paymentMethod: 'COD',
        paymentMethodLabel: 'Thanh toán khi nhận hàng',
    },
    '3': {
        id: '3',
        code: 'DH123458',
        orderDate: '2025-10-08',
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
        paymentMethod: 'ONLINE',
        paymentMethodLabel: 'Online',
        refundStatus: 'REFUNDING',
        refundProgress: {
            requestReturn: true,
            shopReceived: true,
            refunding: true,
            completed: false,
        },
        refundMessage:
            'Đang hoàn tiền: Shop đã nhận được hàng trả lại của bạn. Hệ thống đang xử lý hoàn tiền qua tài khoản ngân hàng đã thanh toán trước đó. Dự kiến hoàn tất trong 3-5 ngày làm việc.',
    },
};

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

const REFUND_STEPS = [
    { key: 'requestReturn', label: 'Yêu cầu trả hàng' },
    { key: 'shopReceived', label: 'Shop đã nhận hàng' },
    { key: 'refunding', label: 'Đang hoàn tiền' },
    { key: 'completed', label: 'Hoàn tất' },
];

function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        // TODO: Fetch order detail from API
        // const fetchOrderDetail = async () => {
        //     const token = getStoredToken();
        //     const response = await fetch(`${getApiBaseUrl()}/orders/${id}`, {
        //         headers: {
        //             Authorization: `Bearer ${token}`,
        //         },
        //     });
        //     const data = await response.json();
        //     setOrder(data.result);
        // };
        // fetchOrderDetail();

        // Using mock data for now
        const mockOrder = MOCK_ORDER_DETAILS[id] || MOCK_ORDER_DETAILS['1'];
        setOrder(mockOrder);
    }, [id]);

    const handleBack = () => {
        navigate('/customer-account/orders');
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

    if (!order) {
        return (
            <div className={cx('order-detail-wrapper')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
    const isReturning = order.status === 'RETURNING';

    return (
        <div className={cx('order-detail-wrapper')}>
            <div className={cx('order-detail-content')}>
                {/* Header */}
                <div className={cx('header')}>
                    <button className={cx('back-btn')} onClick={handleBack}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className={cx('title')}>Chi tiết đơn hàng #{order.code}</h1>
                    <button className={cx('status-badge-header', statusInfo.key)}>
                        {statusInfo.label}
                    </button>
                </div>

                {/* Tabs */}
                <div className={cx('tabs-section')}>
                    <div className={cx('tabs')}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={cx('tab', { active: statusInfo.key === tab.key })}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Refund Progress (only for returning orders) */}
                {isReturning && order.refundProgress && (
                    <div className={cx('refund-progress-section')}>
                        <div className={cx('progress-bar')}>
                            {REFUND_STEPS.map((step, index) => {
                                const isCompleted = order.refundProgress[step.key];
                                const isActive =
                                    isCompleted ||
                                    (index === 0 && !order.refundProgress[REFUND_STEPS[0].key]);
                                return (
                                    <div key={step.key} className={cx('progress-step')}>
                                        <div
                                            className={cx('step-circle', {
                                                completed: isCompleted,
                                                active: isActive && !isCompleted,
                                            })}
                                        />
                                        <span className={cx('step-label')}>{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Shipping Information */}
                <div className={cx('info-section')}>
                    <h2 className={cx('section-title')}>Thông tin giao hàng</h2>
                    <div className={cx('info-grid')}>
                        <div className={cx('info-item')}>
                            <span className={cx('info-label')}>Người nhận:</span>
                            <span className={cx('info-value')}>{order.recipient}</span>
                        </div>
                        <div className={cx('info-item')}>
                            <span className={cx('info-label')}>Số điện thoại:</span>
                            <span className={cx('info-value')}>{order.phone}</span>
                        </div>
                        <div className={cx('info-item', 'full-width')}>
                            <span className={cx('info-label')}>Địa chỉ:</span>
                            <span className={cx('info-value')}>{order.address}</span>
                        </div>
                        {isReturning && (
                            <div className={cx('info-item', 'full-width')}>
                                <span className={cx('info-label')}>Hình thức thanh toán:</span>
                                <span className={cx('info-value')}>
                                    {order.paymentMethodLabel}
                                    {order.refundStatus === 'REFUNDING' && ' (đang hoàn tiền)'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Products */}
                <div className={cx('products-section')}>
                    <h2 className={cx('section-title')}>Sản phẩm</h2>
                    <div className={cx('products-list')}>
                        {order.items.map((item) => (
                            <div key={item.id} className={cx('product-item')}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className={cx('product-image')}
                                />
                                <div className={cx('product-info')}>
                                    <p className={cx('product-name')}>{item.name}</p>
                                </div>
                                <div className={cx('product-price')}>
                                    {item.quantity} × {formatCurrency(item.price)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={cx('total-row')}>
                        <span className={cx('total-label')}>Tổng cộng:</span>
                        <span className={cx('total-value')}>
                            {formatCurrency(order.totalAmount)}
                        </span>
                    </div>
                    {isReturning && (
                        <div className={cx('refund-total-row')}>
                            <span className={cx('refund-total-label')}>Tổng tiền hoàn:</span>
                            <span className={cx('refund-total-value')}>
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Payment Information */}
                {!isReturning && (
                    <div className={cx('payment-section')}>
                        <h2 className={cx('section-title')}>Thanh toán</h2>
                        <div className={cx('payment-info-box')}>
                            <div className={cx('payment-item')}>
                                <span className={cx('payment-label')}>Phương thức:</span>
                                <span className={cx('payment-value')}>
                                    {order.paymentMethodLabel}
                                </span>
                            </div>
                            <div className={cx('payment-item')}>
                                <span className={cx('payment-label')}>Ngày đặt hàng:</span>
                                <span className={cx('payment-value')}>
                                    {formatOrderDate(order.orderDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refund Status Message */}
                {isReturning && order.refundMessage && (
                    <div className={cx('refund-status-section')}>
                        <div className={cx('refund-message')}>{order.refundMessage}</div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={cx('actions-section')}>
                    <button className={cx('contact-btn')}>Liên hệ CSKH</button>
                    {order.status === 'DELIVERED' && (
                        <button className={cx('buy-again-btn')}>Mua lại</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderDetailPage;

