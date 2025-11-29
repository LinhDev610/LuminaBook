import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderReturnPage.module.scss';
import { formatCurrency, getApiBaseUrl, getStoredToken } from '../../../../services';
import { useNotification } from '../../../../components/Common/Notification';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog/DeleteAccountDialog';

const cx = classNames.bind(styles);

export default function OrderReturnPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const orderData = location.state?.order || null;
    const { error: notifyError, success: notifySuccess } = useNotification();

    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [complaint, setComplaint] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
    });
    const refundSummary = useMemo(() => buildRefundSummary(order), [order]);

    // Form state – chỉ để hiển thị lại dữ liệu kho đã nhập
    const [formData, setFormData] = useState({
        returnStatus: '',
        returnDate: '',
        verificationResult: '',
        refundAmount: '',
        refundMethod: '',
        refundBank: '',
        refundAccountNumber: '',
        refundAccountHolder: '',
        processingNotes: '',
    });

const RETURN_PROGRESS_STEPS = [
    { id: 'requested', label: 'Khách hàng yêu cầu hoàn tiền/ trả hàng' },
    { id: 'cskh', label: 'CSKH xác nhận' },
    { id: 'staff', label: 'Nhân viên xác nhận hàng' },
    { id: 'admin', label: 'Admin hoàn tiền' },
];

const resolveReturnStepIndex = (status) => {
    switch (status) {
        case 'RETURN_REQUESTED':
            return 0;
        case 'RETURN_CS_CONFIRMED':
            return 1;
        case 'RETURN_STAFF_CONFIRMED':
            return 2;
        case 'REFUNDED':
            return 3;
        default:
            return 0;
    }
};

const statusLabelMap = useMemo(
    () => ({
            RETURN_REQUESTED: 'Khách hàng yêu cầu hoàn tiền/ trả hàng',
        RETURN_CS_CONFIRMED: 'CSKH đã xác nhận',
            RETURN_STAFF_CONFIRMED: 'Nhân viên đã xác nhận hàng',
        REFUNDED: 'Hoàn tiền thành công',
        RETURN_REJECTED: 'Từ chối hoàn tiền',
        CREATED: 'Đơn mới',
        CONFIRMED: 'Đã xác nhận',
        PAID: 'Đã thanh toán',
        SHIPPED: 'Đang giao',
        DELIVERED: 'Đã giao',
        CANCELLED: 'Đã hủy',
    }),
    [],
);

const buildRefundSummary = (order) => {
    if (!order) return null;

    const productValue =
        order.items?.reduce((sum, item) => sum + Number(item.total || item.finalPrice || 0), 0) ||
        0;
    const shippingFee = Number.isFinite(Number(order.shippingFee))
        ? Number(order.shippingFee)
        : 0;
    const totalPaid =
        Number.isFinite(Number(order.refundTotalPaid))
            ? Number(order.refundTotalPaid)
            : Number.isFinite(Number(order.totalAmount))
                ? Number(order.totalAmount)
                : productValue + shippingFee;

    const secondShippingFee = Math.max(
        0,
        Math.round(
            Number.isFinite(Number(order.refundSecondShippingFee))
                ? Number(order.refundSecondShippingFee)
                : Number.isFinite(Number(order.refundReturnFee))
                    ? Number(order.refundReturnFee)
                    : 0,
        ),
    );

    const basePenalty = Number.isFinite(Number(order.refundPenaltyAmount))
        ? Number(order.refundPenaltyAmount)
        : 0;

    const reason = String(order.refundReasonType || '').toLowerCase();

    // Tổng hoàn ban đầu theo logic khách nhìn thấy
    const customerTotal =
        reason === 'store'
            ? totalPaid + secondShippingFee
            : Math.max(0, totalPaid - secondShippingFee - basePenalty);

    // Suy ra nhận định của kho từ staffInspectionResult/note
    const inspectionText = String(order.staffInspectionResult || order.note || '').toLowerCase();
    let staffReason = null;
    if (inspectionText.includes('lỗi khách hàng')) {
        staffReason = 'customer';
    } else if (inspectionText.includes('lỗi cửa hàng')) {
        staffReason = 'store';
    }

    const staffPenalty =
        staffReason === 'customer'
            ? (basePenalty > 0 ? basePenalty : Math.max(0, Math.round(productValue * 0.1)))
            : 0;

    const staffFormulaTotal =
        staffReason === 'store'
            ? totalPaid + secondShippingFee
            : Math.max(0, totalPaid - secondShippingFee - staffPenalty);

    let staffTotal;
    if (staffReason) {
        // Nếu STAFF đã kết luận lỗi khách / lỗi cửa hàng thì luôn dùng công thức theo kết luận đó
        staffTotal = staffFormulaTotal;
    } else {
        // Nếu chưa có nhận định từ STAFF, ưu tiên số tiền đã lưu trong DB (nếu có)
        const staffRawTotal =
            Number.isFinite(Number(order.refundConfirmedAmount))
                ? Number(order.refundConfirmedAmount)
                : Number.isFinite(Number(order.refundAmount))
                    ? Number(order.refundAmount)
                    : NaN;
        staffTotal = Number.isFinite(staffRawTotal) ? staffRawTotal : customerTotal;
    }

    return {
        totalPaid,
        productValue,
        shippingFee,
        secondShippingFee,
        returnPenalty: staffReason === 'customer' ? staffPenalty : basePenalty,
        // Dùng cho popup/hiển thị tổng
        total: staffTotal,
        customerTotal,
        staffTotal,
    };
};

const buildAdminConfirmMessage = () =>
    'Bạn có chắc chắn muốn xác nhận hoàn tiền cho đơn hàng này?';

    const resolveStatusLabel = (status) => {
        if (!status) return '';
        const normalized = String(status).toUpperCase();
        return statusLabelMap[normalized] || status;
    };

    const initializeFormFromOrder = (orderObj) => {
        if (!orderObj) return;

        const normalizedStatus = String(orderObj.status || '').toUpperCase();
        const staffReviewed = normalizedStatus === 'RETURN_STAFF_CONFIRMED' || normalizedStatus === 'REFUNDED';
        const refundAmount = staffReviewed ? orderObj.refundAmount ?? '' : '';
        const refundMethodRaw = orderObj.refundMethod || '';
        const staffNotes = orderObj.note || orderObj.refundRejectionReason || '';

        const humanRefundMethod = (() => {
            if (!refundMethodRaw) {
                if (orderObj.paymentMethod === 'COD') {
                    return 'Hoàn bằng tiền mặt (COD)';
                }
                if (orderObj.paymentMethod === 'MOMO') {
                    return 'Ví Momo';
                }
                return '';
            }

            const normalized = refundMethodRaw.trim().toUpperCase();
            const directMap = {
                MOMO: 'Ví Momo',
                WALLET: 'Ví Momo',
                BANK_TRANSFER: 'Chuyển khoản ngân hàng',
                COD: 'Hoàn bằng tiền mặt (COD)',
            };
            if (directMap[normalized]) {
                return directMap[normalized];
            }
            return refundMethodRaw;
        })();

        setFormData((prev) => ({
            ...prev,
            returnStatus: resolveStatusLabel(orderObj.status) || prev.returnStatus,
            returnDate: orderObj.returnCheckedDate || prev.returnDate || '',
            verificationResult:
                staffReviewed && orderObj.staffInspectionResult ? orderObj.staffInspectionResult : '',
            refundAmount: refundAmount !== '' ? String(refundAmount) : '',
            refundMethod:
                orderObj.refundMethod ||
                orderObj.refundMethodLabel ||
                humanRefundMethod ||
                orderObj.paymentMethodLabel ||
                '',
            refundBank: orderObj.refundBank || '',
            refundAccountNumber: orderObj.refundAccountNumber || '',
            refundAccountHolder: orderObj.refundAccountHolder || '',
            processingNotes: staffNotes || prev.processingNotes || '',
        }));
    };

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!id) {
                navigate('/admin/orders');
                return;
            }

            setLoading(true);
            try {
                const token = getStoredToken('token');
                const apiBaseUrl = getApiBaseUrl();

                const orderResp = await fetch(`${apiBaseUrl}/orders/${id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (orderResp.ok) {
                    const orderData = await orderResp.json();
                    const orderResult = orderData?.result || orderData;
                    if (isMounted) {
                        setOrder(orderResult);
                        initializeFormFromOrder(orderResult);
                    }

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
                            if (isMounted && Array.isArray(tickets) && tickets.length > 0) {
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
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (orderData) {
            setOrder(orderData);
            initializeFormFromOrder(orderData);
        }
        fetchData();

        return () => {
            isMounted = false;
        };
    }, [id, navigate, orderData]);

    const executeConfirmRefund = async () => {
        try {
            setConfirming(true);
            const token = getStoredToken('token');
            const apiBaseUrl = getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}/confirm-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    note: formData.processingNotes || undefined,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Không thể xác nhận hoàn tiền');
            }
            notifySuccess('Đã xác nhận hoàn tiền thành công.');
            navigate(`/admin/orders/${id}`);
        } catch (err) {
            console.error(err);
            notifyError(err.message || 'Có lỗi xảy ra khi xác nhận hoàn tiền.');
        } finally {
            setConfirming(false);
        }
    };

    const handleConfirmRefund = () => {
        const normalizedStatus = (order?.status || '').toUpperCase();
        const canConfirm = normalizedStatus === 'RETURN_STAFF_CONFIRMED';
        if (!canConfirm) {
            notifyError('Không thể xác nhận hoàn tiền khi nhân viên chưa xác nhận đơn hàng.');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Xác nhận hoàn tiền',
            message: buildAdminConfirmMessage(refundSummary),
            onConfirm: async () => {
                setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                await executeConfirmRefund();
            },
        });
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
    const complaintContent =
        complaint?.issue ||
        complaint?.notes ||
        complaint?.content ||
        order.refundDescription ||
        '';
    const returnAddress = order.refundReturnAddress || order.shippingAddress || '';
    const normalizedStatus = (order?.status || '').toUpperCase();
    const canAdminConfirm = normalizedStatus === 'RETURN_STAFF_CONFIRMED';
    const isReturnRejected = normalizedStatus === 'RETURN_REJECTED';
    const isRefunded = normalizedStatus === 'REFUNDED';
    const currentReturnStep = resolveReturnStepIndex(normalizedStatus);
    const progressSteps = RETURN_PROGRESS_STEPS.map((step, index) => ({
        ...step,
        completed: !isReturnRejected && index < currentReturnStep,
        active: !isReturnRejected && index === currentReturnStep,
    }));

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
                    <div className={cx('returnProgressWrapper', { rejected: isReturnRejected })}>
                        {progressSteps.map((step, idx) => (
                            <div
                                key={step.id}
                                className={cx('returnStep', {
                                    completed: step.completed,
                                    active: step.active,
                                })}
                            >
                                <div className={cx('returnStepCircle')}>
                                    {step.completed ? '✓' : idx + 1}
                                </div>
                                {idx < progressSteps.length - 1 && (
                                    <div
                                        className={cx('returnStepConnector', {
                                            completed: step.completed,
                                        })}
                                    />
                                )}
                                <p className={cx('returnStepLabel')}>{step.label}</p>
                            </div>
                        ))}
                        {isReturnRejected && (
                            <div className={cx('returnStepRejected')}>
                                Yêu cầu đã bị từ chối. {formData.processingNotes ? `Ghi chú: ${formData.processingNotes}` : ''}
                            </div>
                        )}
                    </div>
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
                                <input
                                    type="text"
                                    className={cx('form-input', 'readonly')}
                                    value={formData.returnStatus || 'Chưa cập nhật'}
                                    readOnly
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Ngày nhận hàng hoàn</label>
                                <input
                                    type="date"
                                    value={formData.returnDate}
                                    className={cx('form-input')}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Refund Processing */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Xử lý hoàn tiền</h3>
                        <div className={cx('form-grid')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Kết quả xác minh</label>
                                <input
                                    type="text"
                                    className={cx('form-input', 'readonly')}
                                    value={formData.verificationResult || 'Chưa cập nhật'}
                                    readOnly
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Số tiền hoàn (VNĐ)</label>
                                <input
                                    type="number"
                                    value={formData.refundAmount}
                                    className={cx('form-input', 'readonly')}
                                    readOnly
                                />
                            </div>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Phương thức hoàn</label>
                                <input
                                    type="text"
                                    className={cx('form-input', 'readonly')}
                                    value={formData.refundMethod || 'Chưa cập nhật'}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Chi tiết hình thức hoàn tiền</label>
                            <div className={cx('refund-method-card')}>
                                <p className={cx('refund-method-main')}>
                                    {formData.refundMethod || 'Chưa cập nhật'}
                                </p>
                                {(formData.refundBank || formData.refundAccountNumber || formData.refundAccountHolder) && (
                                    <div className={cx('refund-method-details')}>
                                        {formData.refundBank && <span>{formData.refundBank}</span>}
                                        {formData.refundAccountNumber && <span>{formData.refundAccountNumber}</span>}
                                        {formData.refundAccountHolder && <span>{formData.refundAccountHolder}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Refund Summary for Admin: Khách đề xuất & Theo trạng thái hàng nhận về */}
                    {refundSummary && (
                        <div className={cx('section')}>
                            <h3 className={cx('section-label')}>Tóm tắt hoàn tiền</h3>
                            <div className={cx('summary-grid')}>
                                <div className={cx('summary-block')}>
                                    <p className={cx('summary-title')}>Khách đề xuất</p>
                                    <div className={cx('summary-row')}>
                                        <span>Tổng đơn (đã thanh toán)</span>
                                        <span>{formatCurrency(refundSummary.totalPaid)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Giá trị sản phẩm</span>
                                        <span>{formatCurrency(refundSummary.productValue)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí vận chuyển (lần đầu)</span>
                                        <span>{formatCurrency(refundSummary.shippingFee)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí ship (lần 2 - khách tạm ứng)</span>
                                        <span>{formatCurrency(refundSummary.secondShippingFee)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí hoàn trả (10% khi lỗi khách hàng)</span>
                                        <span>{formatCurrency(refundSummary.returnPenalty)}</span>
                                    </div>
                                    <div className={cx('summary-row', 'total')}>
                                        <span>Tổng hoàn (theo khách đề xuất)</span>
                                        <span>{formatCurrency(refundSummary.customerTotal)}</span>
                                    </div>
                                </div>

                                <div className={cx('summary-block')}>
                                    <p className={cx('summary-title')}>Theo trạng thái hàng nhận về</p>
                                    <div className={cx('summary-row')}>
                                        <span>Tổng đơn (đã thanh toán)</span>
                                        <span>{formatCurrency(refundSummary.totalPaid)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Giá trị sản phẩm</span>
                                        <span>{formatCurrency(refundSummary.productValue)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí vận chuyển (lần đầu)</span>
                                        <span>{formatCurrency(refundSummary.shippingFee)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí ship (lần 2 - khách tạm ứng)</span>
                                        <span>{formatCurrency(refundSummary.secondShippingFee)}</span>
                                    </div>
                                    <div className={cx('summary-row')}>
                                        <span>Phí hoàn trả (10% khi lỗi khách hàng)</span>
                                        <span>{formatCurrency(refundSummary.returnPenalty)}</span>
                                    </div>
                                    <div className={cx('summary-row', 'total')}>
                                        <span>Tổng hoàn (nhân viên xác nhận)</span>
                                        <span>{formatCurrency(refundSummary.staffTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Processing Notes */}
                    <div className={cx('section')}>
                        <h3 className={cx('section-label')}>Ghi chú xử lý</h3>
                        <textarea
                            value={formData.processingNotes}
                            className={cx('form-textarea', 'readonly')}
                            rows={4}
                            readOnly
                                placeholder="Chưa có ghi chú từ nhân viên"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className={cx('actions')}>
                        {isRefunded ? (
                            <div className={cx('refund-completed-message')}>
                                <p>✓ Đơn hàng đã được hoàn tiền thành công</p>
                            </div>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className={cx('btn', 'btn-cancel')} 
                                    onClick={handleCancel}
                                    disabled={confirming || isRefunded}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className={cx('btn', 'btn-confirm')}
                                    onClick={handleConfirmRefund}
                                    disabled={confirming || !canAdminConfirm || isRefunded}
                                >
                                    {confirming ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() =>
                    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
                }
                confirmText="Xác nhận"
                cancelText="Hủy"
            />
        </div>
    );
}

