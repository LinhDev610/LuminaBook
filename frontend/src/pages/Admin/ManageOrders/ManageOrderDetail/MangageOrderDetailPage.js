import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './MangageOrderDetailPage.module.scss';
import { formatCurrency, formatDateTime, getApiBaseUrl, getStoredToken } from '../../../../services';

const cx = classNames.bind(styles);

const mapStatus = (statusRaw) => {
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

const mapItems = (apiOrder) => {
    if (!apiOrder || !Array.isArray(apiOrder.items)) return [];
    return apiOrder.items.map((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.unitPrice ?? item.price ?? 0;
        const total = item.totalPrice ?? price * quantity;
        return {
            id: item.id || String(index),
            name: item.name || item.productName || 'Sản phẩm',
            quantity,
            price,
            total,
        };
    });
};

const mapOrderDetail = (apiOrder) => {
    if (!apiOrder) return null;
    const shippingInfo = parseShippingInfo(apiOrder.shippingAddress);
    const { label, css } = mapStatus(apiOrder.status);
    const items = mapItems(apiOrder);

    return {
        id: apiOrder.id || '',
        code: apiOrder.code || apiOrder.orderCode || apiOrder.id || '',
        customerName:
            apiOrder.receiverName ||
            shippingInfo?.name ||
            apiOrder.customerName ||
            apiOrder.userFullName ||
            'Khách hàng',
        email: apiOrder.customerEmail || apiOrder.userEmail || '',
        phone: apiOrder.receiverPhone || shippingInfo?.phone || apiOrder.customerPhone || '',
        address: shippingInfo?.address || apiOrder.shippingAddress || '',
        paymentMethod:
            apiOrder.paymentMethodLabel ||
            apiOrder.paymentMethod ||
            (apiOrder.paymentType === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'),
        orderDate: apiOrder.orderDateTime || apiOrder.orderDate || apiOrder.createdAt || null,
        totalAmount:
            typeof apiOrder.totalAmount === 'number'
                ? apiOrder.totalAmount
                : Number(apiOrder.totalAmount) || 0,
        statusLabel: label,
        statusClass: css,
        items,
    };
};

export default function MangageOrderDetailPage() {
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
                    throw new Error(`API error ${resp.status}`);
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || null;
                const mapped = mapOrderDetail(raw);
                if (isMounted) {
                    setOrder(mapped);
                }
            } catch (err) {
                console.error('Admin order detail: fetch failed', err);
                if (isMounted) {
                    setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
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
                <div className={cx('pageHeader')}>
                    <button type="button" className={cx('backBtn')} onClick={handleBack}>
                        ←
                    </button>
                    <h1>Chi tiết đơn hàng</h1>
                </div>
                <div className={cx('stateCard')}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className={cx('page')}>
                <div className={cx('pageHeader')}>
                    <button type="button" className={cx('backBtn')} onClick={handleBack}>
                        ←
                    </button>
                    <h1>Chi tiết đơn hàng</h1>
                </div>
                <div className={cx('stateCard', 'error')}>
                    <p>{error || 'Không tìm thấy đơn hàng.'}</p>
                    <button type="button" onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('page')}>
            <div className={cx('pageHeader')}>
                <button type="button" className={cx('backBtn')} onClick={handleBack}>
                    ←
                </button>
                <h1>Chi tiết đơn hàng</h1>
            </div>

            <div className={cx('card')}>
                <div className={cx('cardHeader')}>
                    <div>
                        <p className={cx('orderCode')}>Chi tiết đơn hàng #{order.code}</p>
                    </div>
                    <span className={cx('statusBadge', order.statusClass)}>{order.statusLabel}</span>
                </div>

                <div className={cx('infoSection')}>
                    <div className={cx('infoBlock')}>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Họ và tên:</span>
                            <span className={cx('infoValue')}>{order.customerName || '---'}</span>
                        </div>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>SĐT:</span>
                            <span className={cx('infoValue')}>{order.phone || '---'}</span>
                        </div>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Ngày đặt:</span>
                            <span className={cx('infoValue')}>
                                {order.orderDate ? formatDateTime(order.orderDate) : '---'}
                            </span>
                        </div>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Tổng tiền:</span>
                            <span className={cx('infoValue')}>{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>
                    <div className={cx('infoBlock')}>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Email:</span>
                            <span className={cx('infoValue')}>{order.email || '---'}</span>
                        </div>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Địa chỉ:</span>
                            <span className={cx('infoValue')}>{order.address || '---'}</span>
                        </div>
                        <div className={cx('infoRow')}>
                            <span className={cx('infoLabel')}>Phương thức thanh toán:</span>
                            <span className={cx('infoValue')}>{order.paymentMethod || '---'}</span>
                        </div>
                    </div>
                </div>

                <div className={cx('tableWrapper')}>
                    <table>
                        <thead>
                            <tr>
                                <th>Tên sách</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className={cx('empty')}>
                                        Không có sản phẩm trong đơn hàng
                                    </td>
                                </tr>
                            ) : (
                                order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td>{formatCurrency(item.total)}</td>
                                    </tr>
                                ))
                            )}
                            <tr className={cx('summaryRow')}>
                                <td colSpan={3}>Tổng cộng</td>
                                <td>{formatCurrency(order.totalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className={cx('actions')}>
                    <button 
                        type="button" 
                        className={cx('refundButton')}
                        onClick={() => navigate(`/admin/orders/${id}/return`, { state: { order } })}
                    >
                        Xử lý hoàn tiền / trả hàng
                    </button>
                </div>
            </div>
        </div>
    );
}