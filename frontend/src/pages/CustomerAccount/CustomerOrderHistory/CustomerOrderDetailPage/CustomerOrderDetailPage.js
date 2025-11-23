import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CustomerOrderDetailPage.scss';
import { formatCurrency, getApiBaseUrl, getStoredToken } from '../../../../services';

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

// Map status từ backend sang status key cho UI
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

const REFUND_STEPS = [
    { key: 'requestReturn', label: 'Yêu cầu trả hàng' },
    { key: 'shopReceived', label: 'Shop đã nhận hàng' },
    { key: 'refunding', label: 'Đang hoàn tiền' },
    { key: 'completed', label: 'Hoàn tất' },
];

// Map dữ liệu đơn hàng từ API /orders/{id} sang dạng dùng cho UI chi tiết của khách
const mapOrderFromApi = (apiOrder) => {
    if (!apiOrder) return null;

    const rawStatus = (apiOrder.status || 'PENDING').toUpperCase();
    const shippingInfo = parseShippingInfo(apiOrder.shippingAddress);

    // Map items từ API response
    const items = Array.isArray(apiOrder.items)
        ? apiOrder.items.map((item, index) => ({
              id: item.id || String(index),
              name: item.name || 'Sản phẩm',
              quantity: item.quantity || 1,
              price: item.unitPrice || 0,
              image: item.imageUrl || 'https://via.placeholder.com/80x100',
          }))
        : [];

    const orderDateValue = apiOrder.orderDateTime || apiOrder.orderDate || null;

    // Map payment method từ API
    const rawPaymentMethod = (apiOrder.paymentMethod || '').toUpperCase();
    let paymentMethod = 'ONLINE';
    let paymentMethodLabel = 'Thanh toán online';
    
    if (rawPaymentMethod === 'COD') {
        paymentMethod = 'COD';
        paymentMethodLabel = 'Thanh toán khi nhận hàng';
    } else if (rawPaymentMethod === 'MOMO') {
        paymentMethod = 'MOMO';
        paymentMethodLabel = 'Thanh toán qua MoMo';
    }

    // Map status để có key đúng cho UI
    const statusMapped = mapOrderStatus(rawStatus);

    return {
        id: apiOrder.id || '',
        code: apiOrder.code || apiOrder.orderCode || apiOrder.id || '',
        orderDate: orderDateValue,
        orderDateOnly: apiOrder.orderDate || null,
        status: statusMapped.mappedStatus,
        rawStatus: rawStatus, // Giữ nguyên raw status từ backend
        statusKey: statusMapped.key, // Key để match với tabs
        totalAmount: typeof apiOrder.totalAmount === 'number' ? apiOrder.totalAmount : 0,
        recipient:
            apiOrder.receiverName ||
            shippingInfo?.name ||
            apiOrder.customerName ||
            apiOrder.customerEmail ||
            'Khách hàng',
        phone: apiOrder.receiverPhone || shippingInfo?.phone || apiOrder.customerEmail || '',
        address: shippingInfo?.address || apiOrder.shippingAddress || '',
        paymentMethod,
        paymentMethodLabel,
        items,
        refundStatus: null,
        refundProgress: null,
        refundMessage: '',
    };
};

function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                setError('');

                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();

                if (!id) {
                    setError('Không tìm thấy mã đơn hàng.');
                    setLoading(false);
                    return;
                }

                console.log('CustomerOrderDetail: Fetching order with id/code:', id);
                const apiUrl = `${apiBaseUrl}/orders/${encodeURIComponent(id)}`;
                console.log('CustomerOrderDetail: API URL:', apiUrl);

                // Gọi API /orders/{id} để lấy chi tiết đơn hàng kèm danh sách sản phẩm
                const resp = await fetch(apiUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    const errorText = await resp.text().catch(() => 'Unknown error');
                    console.error(
                        `CustomerOrderDetail: API /orders/${id} trả lỗi ${resp.status}:`,
                        errorText,
                    );
                    setError(
                        `Không thể tải chi tiết đơn hàng từ server (${resp.status}). Vui lòng thử lại sau.`,
                    );
                    setLoading(false);
                    return;
                }

                const data = await resp.json().catch((parseErr) => {
                    console.error('CustomerOrderDetail: Lỗi parse JSON:', parseErr);
                    return null;
                });

                if (!data) {
                    setError('Không thể đọc dữ liệu từ server.');
                    setLoading(false);
                    return;
                }

                const raw = data?.result || data || null;

                if (!raw) {
                    setError('Không tìm thấy đơn hàng này trong lịch sử của bạn.');
                    setLoading(false);
                    return;
                }

                const mapped = mapOrderFromApi(raw);
                
                if (!mapped) {
                    setError('Không thể xử lý dữ liệu đơn hàng.');
                    setLoading(false);
                    return;
                }

                // Log để debug nếu items rỗng
                if (!mapped.items || mapped.items.length === 0) {
                    console.warn('CustomerOrderDetail: Đơn hàng không có items:', {
                        orderId: id,
                        orderCode: mapped.code,
                        rawData: raw,
                    });
                }

                setOrder(mapped);
            } catch (err) {
                console.error('CustomerOrderDetail: Lỗi khi tải chi tiết đơn hàng:', err);
                setError(
                    `Không thể tải chi tiết đơn hàng từ server: ${err.message || 'Lỗi không xác định'}.`,
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetail();
    }, [id]);

    const handleBack = () => {
        navigate('/customer-account/orders');
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

    if (!order) {
        return (
            <div className={cx('order-detail-wrapper')}>
                <div className={cx('loading')}>
                    {loading ? 'Đang tải...' : 'Không tìm thấy đơn hàng.'}
                </div>
            </div>
        );
    }

    // Sử dụng statusKey từ order nếu có, nếu không thì map lại
    const statusKey = order.statusKey || mapOrderStatus(order.status || order.rawStatus).key;
    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
    const isReturning = order.status === 'RETURNING' || order.status === 'RETURN_REQUESTED' || order.rawStatus === 'RETURN_REQUESTED';

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
                                className={cx('tab', { active: statusKey === tab.key })}
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
                    <div className={cx('shipping-card')}>
                        <div className={cx('info-line')}>
                            <span className={cx('info-label')}>Người nhận :</span>
                            <span className={cx('info-value')}>{order.recipient}</span>
                        </div>
                        <div className={cx('info-line')}>
                            <span className={cx('info-label')}>Số điện thoại :</span>
                            <span className={cx('info-value')}>{order.phone}</span>
                        </div>
                        <div className={cx('info-line')}>
                            <span className={cx('info-label')}>Địa chỉ :</span>
                            <span className={cx('info-value')}>{order.address}</span>
                        </div>
                        {isReturning && (
                            <div className={cx('info-line')}>
                                <span className={cx('info-label')}>Hình thức thanh toán :</span>
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
                        <div className={cx('payment-card')}>
                            <div className={cx('info-line')}>
                                <span className={cx('info-label')}>Phương thức :</span>
                                <span className={cx('info-value')}>{order.paymentMethodLabel}</span>
                            </div>
                            <div className={cx('info-line')}>
                                <span className={cx('info-label')}>Ngày đặt hàng :</span>
                                <span className={cx('info-value')}>{formatOrderDate(order.orderDate)}</span>
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
                    {order.status === 'DELIVERED' && (
                        <button 
                            className={cx('contact-btn')}
                            onClick={() => navigate(`/customer-account/orders/${order.id || order.code}/refund`, { state: { orderCode: order.code, orderId: order.id } })}
                        >
                            Hoàn tiền/ Trả hàng
                        </button>
                    )}
                    {(order.status === 'RETURN_REQUESTED' || order.rawStatus === 'RETURN_REQUESTED') && (
                        <button 
                            className={cx('contact-btn', 'refund-detail-btn')}
                            onClick={() => navigate(`/customer-account/orders/${order.id || order.code}/refund-detail`)}
                        >
                            Xem yêu cầu hoàn tiền
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderDetailPage;

