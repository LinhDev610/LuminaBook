import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderDetailPage.module.scss';
import {
    formatCurrency,
    formatDateTime,
    getApiBaseUrl,
    getStoredToken,
    confirmOrder as confirmOrderApi,
    createShipment as createShipmentApi,
} from '../../../../../services';

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

const extractCancellationReason = (order) => {
    if (!order) return '';
    const direct =
        order.cancellationReason ||
        order.cancellation_reason ||
        (typeof order.cancellation_reason === 'string' ? order.cancellation_reason : null);
    if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
    }
    const note = order.note || '';
    if (typeof note !== 'string' || note.trim() === '') {
        return '';
    }
    if (!/hủy|huy/i.test(note)) {
        return '';
    }
    const match = note.match(/Lý do[:\s-]*(.+)$/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    return note.trim();
};

// Lấy nguồn hủy đơn hàng
const extractCancellationSource = (order) => {
    if (!order) return '';
    const raw = order.cancellationSource || order.cancellation_source;
    if (!raw) return '';
    return String(raw).toUpperCase();
};

const getCancellationSourceLabel = (source) => {
    switch (source) {
        case 'STAFF':
            return 'Nhân viên';
        case 'CUSTOMER':
            return 'Khách hàng';
        default:
            return '';
    }
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

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatIso = (date) => {
    if (!date) return null;
    try {
        return date.toISOString();
    } catch {
        return null;
    }
};

const generateFallbackHistory = (order) => {
    const fallback = [];
    const baseDate =
        toDate(order.orderDateTime || order.orderDate || order.createdAt) || new Date();
    const status = String(order.status || order.ghnStatus || '').toUpperCase();

    const pushEntry = (id, minutesOffset, description) => {
        const time = new Date(baseDate.getTime() + minutesOffset * 60 * 1000);
        fallback.push({
            id,
            time: formatIso(time),
            description,
        });
    };

    pushEntry('created', 0, 'Đơn được tạo (Chờ xác nhận)');

    if (['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED'].includes(status)) {
        pushEntry('confirmed', 15, 'Đơn đã được xác nhận nội bộ');
    }

    if (['SHIPPED', 'DELIVERED'].includes(status)) {
        pushEntry('shipped', 60, 'Đơn đã bàn giao cho GHN');
    }

    if (status === 'DELIVERED') {
        pushEntry('delivered', 120, 'Đơn đã giao thành công');
    }

    if (status === 'CANCELLED') {
        pushEntry('cancelled', 5, 'Đơn đã bị hủy');
    }

    return fallback;
};

const mapOrderDetailFromApi = (order) => {
    if (!order) return null;
    const user = order.user || {};
    const shipment = order.shipment || {};
    const { label, css } = mapOrderStatus(order.status || shipment.status);

    const items = mapItemsFromOrder(order);
    const shippingInfo = parseShippingInfo(order.shippingAddress);
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
            time: h.time || h.createdAt || order.orderDateTime || order.orderDate || null,
            description: h.description || h.note || h.message || '',
        }))
        : [];
    const timeline = history.length > 0 ? history : generateFallbackHistory(order);

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        customerName:
            order.customerName ||
            shippingInfo?.name ||
            user.fullName ||
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Khách hàng',
        address: shippingInfo?.address || order.shippingAddress || order.address || user.address || '',
        phone: order.receiverPhone || shippingInfo?.phone || order.phone || user.phone || user.phoneNumber || '',
        orderDate: order.orderDateTime || order.orderDate || order.createdAt || null,
        ghnStatus: order.status || shipment.status,
        ghnStatusLabel: label,
        ghnStatusClass: css,
        items,
        totalAmount,
        history: timeline,
        cancellationReason: extractCancellationReason(order),
        cancellationSource: extractCancellationSource(order),
    };
};

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');

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

    const handleConfirmOrder = async () => {
        if (!id) return;

        setActionError('');
        setActionMessage('');
        setConfirming(true);

        try {
            const token = getStoredToken('token');
            const { ok: confirmOk, data: confirmedOrder, status } = await confirmOrderApi(id, token);

            if (!confirmOk) {
                throw new Error(`Confirm API error ${status || ''}`.trim());
            }

            const mapped = mapOrderDetailFromApi(confirmedOrder);

            if (!mapped) {
                throw new Error('Không nhận được dữ liệu đơn hàng sau khi xác nhận');
            }

            setOrder(mapped);
            setActionMessage('Đơn đã được xác nhận.');

            try {
                const { ok: shipmentOk, status: shipmentStatus, data: shipmentData } = await createShipmentApi(
                    id,
                    {},
                    token,
                );

                if (!shipmentOk || !shipmentData) {
                    throw new Error(
                        shipmentStatus
                            ? `Không thể tạo vận đơn GHN (HTTP ${shipmentStatus})`
                            : 'Không thể tạo vận đơn GHN',
                    );
                }

                setActionMessage('Đã xác nhận đơn và gửi yêu cầu tạo vận đơn GHN.');
                setActionError('');
            } catch (shipmentErr) {
                console.error('OrderDetail: tạo vận đơn GHN thất bại', shipmentErr);
                setActionError(
                    shipmentErr?.message
                        ? `Không thể tạo vận đơn GHN: ${shipmentErr.message}`
                        : 'Không thể tạo vận đơn GHN. Vui lòng thử lại trong mục GHN.'
                );
            }
        } catch (err) {
            console.error('OrderDetail: xác nhận đơn hàng thất bại', err);
            setActionError(err?.message || 'Không thể xác nhận đơn hàng. Vui lòng thử lại.');
        } finally {
            setConfirming(false);
        }
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
    const orderStatusUpper = String(order.ghnStatus || '').toUpperCase();
    const isCancelled = orderStatusUpper === 'CANCELLED';
    const cancellationReason = order.cancellationReason;
    const isConfirmable = ['CREATED', 'PENDING', 'PAID'].includes(orderStatusUpper);
    const items = order.items || [];
    const cancellationSourceLabel = order.cancellationSource
        ? getCancellationSourceLabel(order.cancellationSource)
        : '';

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

                        {actionMessage && <div className={cx('note', 'success')}>{actionMessage}</div>}
                        {actionError && <div className={cx('note', 'error')}>{actionError}</div>}

                        {isConfirmable && (
                            <div className={cx('actions')}>
                                <button
                                    className={cx('btn', 'primary')}
                                    onClick={handleConfirmOrder}
                                    disabled={confirming}
                                >
                                    Xác nhận đơn hàng
                                </button>
                                <p className={cx('note')}>
                                    (Trạng thái sẽ tự động đồng bộ từ GHN sau khi xác nhận)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách sản phẩm</div>
                    <div className={cx('card-body')}>
                        {isCancelled && cancellationReason && (
                            <div className={cx('cancel-reason')}>
                                <strong>Lý do hủy đơn:</strong> {cancellationReason}
                                {cancellationSourceLabel && (
                                    <div className={cx('cancel-meta')}>
                                        Người hủy: <span>{cancellationSourceLabel}</span>
                                    </div>
                                )}
                            </div>
                        )}
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


