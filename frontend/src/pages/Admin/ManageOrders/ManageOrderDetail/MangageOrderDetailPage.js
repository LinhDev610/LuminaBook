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
    const [formData, setFormData] = useState({
        returnStatus: 'Khách đã gửi trả',
        returnDate: new Date().toISOString().split('T')[0],
        verificationResult: 'Hợp lệ - Hoàn tiền toàn bộ',
        refundAmount: '',
        bankAccount: '',
        bankName: 'Ngân hàng ABC',
        accountHolder: '',
        processingNote: 'Sản phẩm gửi nhầm tựa do kho. Đã xác nhận hoàn tiền và yêu cầu gửi trả hàng.',
    });

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
                    setFormData((prev) => ({
                        ...prev,
                        refundAmount: mapped?.totalAmount ? String(mapped.totalAmount) : '',
                        bankAccount: mapped?.phone ? `0123${mapped.phone.slice(-6)}` : '0123456789',
                        accountHolder: mapped?.customerName || 'Khách hàng',
                    }));
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

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveDraft = () => {
        console.log('Draft return/refund payload', { orderId: id, formData });
        alert('Đã lưu ghi nhận xử lý tạm thời');
    };

    const handleConfirmRefund = () => {
        console.log('Confirm refund payload', { orderId: id, formData });
        alert('Đã xác nhận hoàn tiền cho đơn hàng');
    };

    if (loading) {
        return (
            <div className={cx('page')}>
                <div className={cx('pageHeader')}>
                    <button type="button" className={cx('backBtn')} onClick={handleBack}>
                        ←
                    </button>
                    <div>
                        <p className={cx('eyebrow')}>Đơn hàng</p>
                        <h1>Xử lý hoàn tiền/ trả hàng</h1>
                    </div>
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
                    <div>
                        <p className={cx('eyebrow')}>Đơn hàng</p>
                        <h1>Xử lý hoàn tiền/ trả hàng</h1>
                    </div>
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

    const primaryItem = order.items[0] || null;

    return (
        <div className={cx('page')}>
            <div className={cx('pageHeader')}>
                <button type="button" className={cx('backBtn')} onClick={handleBack}>
                    ←
                </button>
                <div className={cx('titleGroup')}>
                    <p className={cx('eyebrow')}>Đơn hàng #{order.code}</p>
                    <h1>Xử lý hoàn tiền/ trả hàng</h1>
                </div>
                <span className={cx('statusBadge', order.statusClass)}>{order.statusLabel}</span>
            </div>

            <div className={cx('layout')}>
                <section className={cx('summaryCard')}>
                    <div className={cx('summaryHeader')}>
                        <div>
                            <p className={cx('summaryEyebrow')}>Đối chiếu với đơn khách hàng</p>
                            <h2>Thông tin</h2>
                        </div>
                        <div className={cx('summaryMeta')}>
                            <span>Nhân viên xử lý</span>
                            <p>ADMIN</p>
                        </div>
                    </div>

                    <div className={cx('comparisonGrid')}>
                        <div>
                            <p className={cx('metaLabel')}>Sản phẩm</p>
                            <p className={cx('metaValue')}>
                                {primaryItem?.name || primaryItem?.productName || '---'}
                            </p>
                            <p className={cx('metaLabel')}>Số lượng</p>
                            <p className={cx('metaValue')}>{primaryItem?.quantity || 1}</p>
                            <p className={cx('metaLabel')}>Thành tiền</p>
                            <p className={cx('metaValue')}>{formatCurrency(order.totalAmount)}</p>
                            <p className={cx('metaLabel')}>Địa chỉ</p>
                            <p className={cx('metaValue')}>{order.address || '---'}</p>
                        </div>
                        <div>
                            <p className={cx('metaLabel')}>Khách hàng</p>
                            <p className={cx('metaValue')}>{order.customerName}</p>
                            <p className={cx('metaLabel')}>SĐT</p>
                            <p className={cx('metaValue')}>{order.phone || '---'}</p>
                            <p className={cx('metaLabel')}>Ngày đặt</p>
                            <p className={cx('metaValue')}>
                                {order.orderDate ? formatDateTime(order.orderDate) : '---'}
                            </p>
                            <p className={cx('metaLabel')}>Phương thức thanh toán</p>
                            <p className={cx('metaValue')}>{order.paymentMethod || '---'}</p>
                        </div>
                    </div>
                </section>

                <section className={cx('sectionCard')}>
                    <div className={cx('sectionHeader')}>
                        <h3>Xử lý trả hàng</h3>
                        <span className={cx('pill')}>{formData.returnStatus}</span>
                    </div>
                    <div className={cx('formGrid')}>
                        <label className={cx('formField')}>
                            <span>Trạng thái hàng hóa</span>
                            <select
                                value={formData.returnStatus}
                                onChange={(e) => handleInputChange('returnStatus', e.target.value)}
                            >
                                <option value="Chưa nhận">Chưa nhận</option>
                                <option value="Khách đã gửi trả">Khách đã gửi trả</option>
                                <option value="Đã nhận hàng hoàn">Đã nhận hàng hoàn</option>
                                <option value="Đã kiểm tra">Đã kiểm tra</option>
                            </select>
                        </label>
                        <label className={cx('formField')}>
                            <span>Ngày nhận hàng hoàn</span>
                            <input
                                type="date"
                                value={formData.returnDate}
                                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                            />
                        </label>
                        <label className={cx('formField', 'full')}>
                            <span>Địa chỉ nhận hàng trả</span>
                            <input type="text" value="Kho trung tâm - 12 Nguyễn Văn Linh, Hà Nội" readOnly />
                        </label>
                    </div>
                </section>

                <section className={cx('sectionCard')}>
                    <div className={cx('sectionHeader')}>
                        <h3>Xử lý hoàn tiền</h3>
                        <p>Kết quả xác minh & thông tin thanh toán</p>
                    </div>
                    <div className={cx('formGrid')}>
                        <label className={cx('formField')}>
                            <span>Kết quả xác minh</span>
                            <select
                                value={formData.verificationResult}
                                onChange={(e) => handleInputChange('verificationResult', e.target.value)}
                            >
                                <option value="Chưa xác minh">Chưa xác minh</option>
                                <option value="Hợp lệ - Hoàn tiền toàn bộ">Hợp lệ - Hoàn tiền toàn bộ</option>
                                <option value="Hợp lệ - Hoàn tiền một phần">Hợp lệ - Hoàn tiền một phần</option>
                                <option value="Không hợp lệ">Không hợp lệ</option>
                            </select>
                        </label>
                        <label className={cx('formField')}>
                            <span>Số tiền hoàn (VNĐ)</span>
                            <input
                                type="number"
                                value={formData.refundAmount}
                                onChange={(e) => handleInputChange('refundAmount', e.target.value)}
                            />
                        </label>
                        <label className={cx('formField')}>
                            <span>Số tài khoản</span>
                            <input
                                type="text"
                                value={formData.bankAccount}
                                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                            />
                        </label>
                        <label className={cx('formField')}>
                            <span>Ngân hàng</span>
                            <input
                                type="text"
                                value={formData.bankName}
                                onChange={(e) => handleInputChange('bankName', e.target.value)}
                            />
                        </label>
                        <label className={cx('formField')}>
                            <span>Chủ tài khoản</span>
                            <input
                                type="text"
                                value={formData.accountHolder}
                                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                            />
                        </label>
                    </div>
                    <label className={cx('formField', 'full')}>
                        <span>Ghi chú xử lý</span>
                        <textarea
                            rows={4}
                            value={formData.processingNote}
                            onChange={(e) => handleInputChange('processingNote', e.target.value)}
                        />
                    </label>
                </section>
            </div>

            <div className={cx('actions')}>
                <button type="button" className={cx('btn', 'ghost')} onClick={handleBack}>
                    Hủy
                </button>
                <button type="button" className={cx('btn', 'secondary')} onClick={handleSaveDraft}>
                    Lưu
                </button>
                <button type="button" className={cx('btn', 'primary')} onClick={handleConfirmRefund}>
                    Xác nhận hoàn tiền
                </button>
            </div>
        </div>
    );
}