import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderDetailPage.module.scss';
import { formatCurrency, formatDateTime, getApiBaseUrl, getStoredToken } from '../../../../../services';

const cx = classNames.bind(styles);

// Mapping trạng thái sang label & màu (tương đồng trang danh sách đơn)
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

// Dữ liệu mock dùng khi không fetch được từ API
const MOCK_ORDER_DETAIL = {
    id: 'DH001',
    code: 'DH001',
    customerName: 'Nguyễn Văn A',
    address: '123 Nguyễn Trãi, Hà Nội',
    phone: '0909 123 456',
    orderDate: '2025-10-10T10:00:00',
    ghnStatus: 'PENDING',
    items: [
        { id: '1', name: 'Sách Data Mining', quantity: 1, unitPrice: 750000, totalPrice: 750000 },
        { id: '2', name: 'Giáo trình Cấu trúc dữ liệu', quantity: 1, unitPrice: 500000, totalPrice: 500000 },
    ],
    history: [
        {
            id: 'h1',
            time: '2025-10-10T10:00:00',
            description: 'Đơn được tạo (Chờ xác nhận)',
        },
    ],
};

const mapItemsFromOrder = (order) => {
    if (!order) return [];
    const cart = order.cart || order.orderCart || {};
    const rawItems =
        order.items ||
        order.orderItems ||
        order.detailItems ||
        cart.items ||
        cart.cartItems ||
        [];

    if (!Array.isArray(rawItems)) return [];

    return rawItems.map((item, index) => {
        const product = item.product || item.book || {};
        const quantity = item.quantity || item.qty || item.amount || 1;
        const unitPrice =
            item.unitPrice ?? item.price ?? item.productPrice ?? product.price ?? product.unitPrice ?? 0;
        const totalPrice = item.totalPrice ?? item.subtotal ?? quantity * unitPrice;

        return {
            id: item.id || product.id || String(index),
            name:
                item.name ||
                item.productName ||
                product.title ||
                product.name ||
                product.bookName ||
                'Sản phẩm',
            quantity,
            unitPrice,
            totalPrice,
        };
    });
};

const mapOrderDetailFromApi = (order) => {
    if (!order) return null;
    const user = order.user || {};
    const shipment = order.shipment || {};
    const { label, css } = mapOrderStatus(order.status || shipment.status);

    const items = mapItemsFromOrder(order);
    const totalAmount =
        typeof order.totalAmount === 'number'
            ? order.totalAmount
            : typeof order.cartTotal === 'number'
              ? order.cartTotal
              : items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);

    const historyRaw = order.history || order.logs || order.events || [];
    const history = Array.isArray(historyRaw)
        ? historyRaw.map((h, idx) => ({
              id: h.id || String(idx),
              time: h.time || h.createdAt || order.orderDate || null,
              description: h.description || h.note || h.message || '',
          }))
        : [];

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        customerName:
            order.customerName ||
            user.fullName ||
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Khách hàng',
        address: order.shippingAddress || order.address || user.address || '',
        phone: order.phone || user.phone || user.phoneNumber || '',
        orderDate: order.orderDate || order.createdAt || null,
        ghnStatus: order.status || shipment.status,
        ghnStatusLabel: label,
        ghnStatusClass: css,
        items,
        totalAmount,
        history: history.length > 0 ? history : MOCK_ORDER_DETAIL.history,
    };
};

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchDetail = async () => {
            if (!id) {
                setOrder(MOCK_ORDER_DETAIL);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const token = getStoredToken('token');
                const resp = await fetch(`${apiBaseUrl}/orders/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    console.warn('OrderDetail: API /orders/:id trả lỗi, dùng MOCK_ORDER_DETAIL');
                    if (isMounted) {
                        setOrder({ ...MOCK_ORDER_DETAIL, id, code: id });
                    }
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || null;
                const mapped = mapOrderDetailFromApi(raw);
                if (isMounted) {
                    setOrder(mapped || { ...MOCK_ORDER_DETAIL, id, code: id });
                }
            } catch (e) {
                console.error('OrderDetail: lỗi khi tải chi tiết đơn hàng, dùng MOCK_ORDER_DETAIL', e);
                if (isMounted) {
                    setError('Không thể tải chi tiết đơn hàng từ server. Đang hiển thị dữ liệu mẫu.');
                    setOrder({ ...MOCK_ORDER_DETAIL, id, code: id });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDetail();

        return () => {
            isMounted = false;
        };
    }, [apiBaseUrl, id]);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className={cx('page')}>
                <div className={cx('page-header')}>
                    <h1 className={cx('title')}>Chi tiết đơn hàng</h1>
                </div>
                <div className={cx('loading')}>Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={cx('page')}>
                <div className={cx('page-header')}>
                    <h1 className={cx('title')}>Chi tiết đơn hàng</h1>
                </div>
                <div className={cx('error')}>
                    Không tìm thấy đơn hàng.
                    <button className={cx('btn', 'back-btn')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const { ghnStatusLabel, ghnStatusClass } = mapOrderStatus(order.ghnStatus);
    const items = order.items || [];

    return (
        <div className={cx('page')}>
            <div className={cx('page-header')}>
                <h1 className={cx('title')}>Chi tiết đơn hàng</h1>
                <button className={cx('top-back-btn')} onClick={handleBack}>
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
                    Quay lại
                </button>
            </div>

            <div className={cx('wrap')}>
                {/* Thông tin khách hàng */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Thông tin khách hàng</div>
                    <div className={cx('card-body')}>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Khách hàng:</span>
                            <span className={cx('value')}>{order.customerName}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Địa chỉ:</span>
                            <span className={cx('value')}>{order.address || '---'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Điện thoại:</span>
                            <span className={cx('value')}>{order.phone || '---'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Ngày đặt:</span>
                            <span className={cx('value')}>
                                {order.orderDate ? formatDateTime(order.orderDate) : '---'}
                            </span>
                        </div>
                        <div className={cx('info-row', 'status-row')}>
                            <span className={cx('label')}>Trạng thái GHN:</span>
                            <span className={cx('status-pill', ghnStatusClass)}>{ghnStatusLabel}</span>
                        </div>

                        <div className={cx('actions')}>
                            <button className={cx('btn', 'primary')}>Xác nhận đơn hàng</button>
                            <p className={cx('note')}>
                                (Trạng thái sẽ tự động đồng bộ từ GHN sau khi xác nhận)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách sản phẩm</div>
                    <div className={cx('card-body')}>
                        <table className={cx('table')}>
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td className={cx('product-name')}>{item.name}</td>
                                        <td className={cx('center')}>{item.quantity}</td>
                                        <td className={cx('right')}>
                                            {formatCurrency(item.unitPrice || 0)}
                                        </td>
                                        <td className={cx('right')}>
                                            {formatCurrency(item.totalPrice || 0)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className={cx('summary-row')}>
                                    <td colSpan={3} className={cx('summary-label')}>
                                        Tổng:
                                    </td>
                                    <td className={cx('summary-value')}>
                                        {formatCurrency(order.totalAmount || 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lịch sử trạng thái */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Lịch sử trạng thái</div>
                    <div className={cx('card-body')}>
                        <ul className={cx('history-list')}>
                            {order.history.map((h) => (
                                <li key={h.id} className={cx('history-item')}>
                                    <span className={cx('history-dot')} />
                                    <span className={cx('history-text')}>
                                        {h.time ? `${formatDateTime(h.time)} - ` : ''}
                                        {h.description}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}


