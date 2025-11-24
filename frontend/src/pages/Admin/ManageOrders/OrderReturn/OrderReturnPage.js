import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderReturnPage.module.scss';
import { formatCurrency, getApiBaseUrl, getStoredToken } from '../../../../services';

const cx = classNames.bind(styles);

export default function OrderReturnPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const orderData = location.state?.order || null;

    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [complaint, setComplaint] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        returnStatus: 'Khách đã gửi trả',
        returnDate: new Date().toISOString().split('T')[0],
        verificationResult: 'Hợp lệ - Hoàn tiền toàn bộ',
        refundAmount: '',
        refundMethod: 'Ví Momo',
        processingNotes: 'Sản phẩm gửi nhầm tựa do lỗi kho. Đã xác nhận hoàn tiền và yêu cầu gửi trả hàng.',
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                navigate('/admin/orders');
                return;
            }

            setLoading(true);
            try {
                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();

                // Fetch order details
                const orderResp = await fetch(`${apiBaseUrl}/orders/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (orderResp.ok) {
                    const orderData = await orderResp.json();
                    const orderResult = orderData?.result || orderData;
                    setOrder(orderResult);
                    
                    // Set default refund amount to order total
                    if (orderResult.totalAmount) {
                        setFormData(prev => ({
                            ...prev,
                            refundAmount: orderResult.totalAmount.toString(),
                        }));
                    }

                    // Try to fetch complaint/ticket for this order
                    try {
                        const orderCode = orderResult.code || orderResult.orderCode || id;
                        const ticketsResp = await fetch(`${apiBaseUrl}/api/tickets?orderCode=${orderCode}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        });
                        if (ticketsResp.ok) {
                            const ticketsData = await ticketsResp.json();
                            const tickets = ticketsData?.result || ticketsData || [];
                            if (Array.isArray(tickets) && tickets.length > 0) {
                                setComplaint(tickets[0]);
                            }
                        }
                    } catch (err) {
                        console.warn('Could not fetch complaint:', err);
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (orderData) {
            setOrder(orderData);
            if (orderData.totalAmount) {
                setFormData(prev => ({
                    ...prev,
                    refundAmount: orderData.totalAmount.toString(),
                }));
            }
        } else {
            fetchData();
        }
    }, [id, navigate, orderData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        // TODO: Implement save logic
        console.log('Saving return/refund data:', formData);
        alert('Đã lưu thông tin xử lý hoàn tiền/trả hàng');
    };

    const handleConfirmRefund = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xác nhận hoàn tiền?')) {
            return;
        }
        // TODO: Implement confirm refund logic
        console.log('Confirming refund:', formData);
        alert('Đã xác nhận hoàn tiền thành công');
        navigate(`/admin/orders/${id}`);
    };

    const handleCancel = () => {
        navigate(`/admin/orders/${id}`);
    };

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('container')}>
                    <div className={cx('loading')}>Đang tải dữ liệu...</div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('container')}>
                    <div className={cx('error')}>Không tìm thấy đơn hàng</div>
                    <button className={cx('back-button')} onClick={() => navigate('/admin/orders')}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Parse shipping address safely
    let shippingInfo = null;
    if (order.shippingAddress) {
        try {
            if (typeof order.shippingAddress === 'string' && order.shippingAddress.startsWith('{')) {
                shippingInfo = JSON.parse(order.shippingAddress);
            }
        } catch (e) {
            // Ignore parse error
        }
    }

    const orderCode = order.code || order.orderCode || `ORD${id?.substring(0, 8).toUpperCase()}`;
    const customerName = order.receiverName || 
                        shippingInfo?.name ||
                        order.customerName || 
                        order.userFullName || 
                        'Khách hàng';
    const customerPhone = shippingInfo?.phone ||
                         order.receiverPhone || 
                         order.customerPhone || 
                         '';
    const customerEmail = order.customerEmail || order.userEmail || '';
    const paymentMethod = order.paymentMethodLabel || 
                         (order.paymentMethod === 'MOMO' ? 'Ví Momo' : 
                          order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 
                          order.paymentMethod || 'Ví Momo');
    const orderItems = order.items || [];
    const totalAmount = order.totalAmount || 0;
    const complaintContent = complaint?.issue || complaint?.notes || complaint?.content ||
                            'Khách hàng phản ánh sản phẩm bị sai tựa sách và yêu cầu trả hàng + hoàn tiền 100%.';
    const returnAddress = 'Kho trung tâm - 12 Nguyễn Văn Linh, Hà Nội';

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <button className={cx('back-button')} onClick={() => navigate(`/admin/orders/${id}`)}>
                        ←
                    </button>
                    <h1 className={cx('title')}>Xử lý hoàn tiền/ trả hàng</h1>
                </div>

                <div className={cx('content')}>
                    {/* Order Info */}
                    <div className={cx('section')}>
                        <div className={cx('section-header')}>
                            <h2 className={cx('section-title')}>Đơn hàng #{orderCode}</h2>
                            <span className={cx('status-badge', 'processing')}>Đang xử lý</span>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Thông tin khách hàng</h3>
                        <div className={cx('form-grid')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Họ tên</label>
                                <input
                                    type="text"
                                    className={cx('form-input', 'readonly')}
                                    value={customerName}
                                    readOnly
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>SĐT</label>
                                <input
                                    type="text"
                                    className={cx('form-input', 'readonly')}
                                    value={customerPhone}
                                    readOnly
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Email</label>
                                <input
                                    type="email"
                                    className={cx('form-input', 'readonly')}
                                    value={customerEmail}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Chi tiết đơn hàng</h3>
                        <div className={cx('order-details')}>
                            {orderItems.length > 0 ? (
                                orderItems.map((item, index) => (
                                    <div key={item.id || index} className={cx('order-item')}>
                                        <div className={cx('item-row')}>
                                            <span className={cx('item-label')}>Sản phẩm:</span>
                                            <span className={cx('item-value')}>
                                                {item.name || item.productName || 'Sản phẩm'}
                                            </span>
                                        </div>
                                        <div className={cx('item-row')}>
                                            <span className={cx('item-label')}>Số lượng:</span>
                                            <span className={cx('item-value')}>{item.quantity || 1}</span>
                                        </div>
                                        <div className={cx('item-row')}>
                                            <span className={cx('item-label')}>Thành tiền:</span>
                                            <span className={cx('item-value')}>
                                                {formatCurrency(item.finalPrice || item.totalPrice || item.price || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={cx('order-item')}>
                                    <div className={cx('item-row')}>
                                        <span className={cx('item-label')}>Sản phẩm:</span>
                                        <span className={cx('item-value')}>Không có thông tin</span>
                                    </div>
                                    <div className={cx('item-row')}>
                                        <span className={cx('item-label')}>Số lượng:</span>
                                        <span className={cx('item-value')}>1</span>
                                    </div>
                                    <div className={cx('item-row')}>
                                        <span className={cx('item-label')}>Thành tiền:</span>
                                        <span className={cx('item-value')}>{formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            )}
                            <div className={cx('item-row', 'payment-row')}>
                                <span className={cx('item-label')}>Thanh toán:</span>
                                <span className={cx('item-value')}>{paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Content */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Nội dung khiếu nại</h3>
                        <textarea
                            className={cx('form-textarea', 'readonly')}
                            value={complaintContent}
                            readOnly
                            rows={4}
                        />
                    </div>

                    {/* Return Processing */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Xử lý trả hàng</h3>
                        <div className={cx('form-grid')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Trạng thái hàng hóa</label>
                                <select
                                    name="returnStatus"
                                    value={formData.returnStatus}
                                    onChange={handleInputChange}
                                    className={cx('form-select')}
                                >
                                    <option value="Chưa nhận">Chưa nhận</option>
                                    <option value="Khách đã gửi trả">Khách đã gửi trả</option>
                                    <option value="Đã nhận hàng hoàn">Đã nhận hàng hoàn</option>
                                    <option value="Đã kiểm tra">Đã kiểm tra</option>
                                </select>
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Ngày nhận hàng hoàn</label>
                                <input
                                    type="date"
                                    name="returnDate"
                                    value={formData.returnDate}
                                    onChange={handleInputChange}
                                    className={cx('form-input')}
                                />
                            </div>
                        </div>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Địa chỉ nhận hàng trả</label>
                            <input
                                type="text"
                                className={cx('form-input', 'readonly')}
                                value={returnAddress}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Refund Processing */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Xử lý hoàn tiền</h3>
                        <div className={cx('form-grid')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Kết quả xác minh</label>
                                <select
                                    name="verificationResult"
                                    value={formData.verificationResult}
                                    onChange={handleInputChange}
                                    className={cx('form-select')}
                                >
                                    <option value="Chưa xác minh">Chưa xác minh</option>
                                    <option value="Hợp lệ - Hoàn tiền toàn bộ">Hợp lệ - Hoàn tiền toàn bộ</option>
                                    <option value="Hợp lệ - Hoàn tiền một phần">Hợp lệ - Hoàn tiền một phần</option>
                                    <option value="Không hợp lệ">Không hợp lệ</option>
                                </select>
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Số tiền hoàn (VNĐ)</label>
                                <input
                                    type="number"
                                    name="refundAmount"
                                    value={formData.refundAmount}
                                    onChange={handleInputChange}
                                    className={cx('form-input')}
                                    placeholder="Nhập số tiền"
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Phương thức hoàn</label>
                                <select
                                    name="refundMethod"
                                    value={formData.refundMethod}
                                    onChange={handleInputChange}
                                    className={cx('form-select')}
                                >
                                    <option value="Ví Momo">Ví Momo</option>
                                    <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng</option>
                                    <option value="Tiền mặt">Tiền mặt</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Processing Notes */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Ghi chú xử lý</h3>
                        <textarea
                            name="processingNotes"
                            value={formData.processingNotes}
                            onChange={handleInputChange}
                            className={cx('form-textarea')}
                            rows={4}
                            placeholder="Nhập ghi chú xử lý..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className={cx('actions')}>
                        <button type="button" className={cx('btn', 'btn-cancel')} onClick={handleCancel}>
                            Hủy
                        </button>
                        <button type="button" className={cx('btn', 'btn-save')} onClick={handleSave}>
                            Lưu
                        </button>
                        <button type="button" className={cx('btn', 'btn-confirm')} onClick={handleConfirmRefund}>
                            Xác nhận hoàn tiền
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

