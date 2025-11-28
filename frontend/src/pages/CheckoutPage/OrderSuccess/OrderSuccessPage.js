import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderSuccessPage.module.scss';
import { verifyPaymentAndSendEmail } from '../../../services/api';
import { getStoredToken, getApiBaseUrl } from '../../../services';

const cx = classNames.bind(styles);


const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value || 0);

export default function OrderSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [orderInfo, setOrderInfo] = useState(null);
    const [isError, setIsError] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const searchParams = useMemo(
        () => new URLSearchParams(location.search || ''),
        [location.search],
    );

    useEffect(() => {
        const resultCode = searchParams.get('resultCode');
        const orderIdFromQuery = searchParams.get('orderId');

        // Lấy thông tin từ location.state (cho COD) hoặc query params (cho MoMo)
        const stateOrderId = location.state?.orderId;
        const stateOrderCode = location.state?.orderCode;

        // Đọc thông tin đơn hàng được lưu trước khi redirect sang MoMo hoặc từ COD
        const savedRaw = window.localStorage.getItem('lumina_latest_order');
        let saved = null;
        if (savedRaw) {
            try {
                saved = JSON.parse(savedRaw);
            } catch {
                saved = null;
            }
        }

        // Nếu MoMo trả về lỗi thì coi như lỗi thanh toán
        if (resultCode && resultCode !== '0') {
            setIsError(true);
        }

        // Ưu tiên: location.state > query params > localStorage
        const finalOrderId = stateOrderId || orderIdFromQuery || saved?.orderId || saved?.id;
        const finalOrderCode = stateOrderCode || saved?.code || saved?.orderCode;

        // Cập nhật saved với thông tin từ state nếu có
        if (saved) {
            if (finalOrderId && saved.orderId !== finalOrderId) {
                saved = { ...saved, orderId: finalOrderId };
            }
            if (finalOrderCode && saved.code !== finalOrderCode) {
                saved = { ...saved, code: finalOrderCode };
            }
        }

        setOrderInfo(
            saved || {
                orderId: finalOrderId || '',
                code: finalOrderCode || '',
            },
        );

        // Nếu thanh toán thành công (resultCode = '0'), tạo đơn hàng và gửi email
        // Chỉ thực hiện 1 lần bằng cách check emailSent flag
        if (resultCode === '0' && !emailSent) {
            const token = getStoredToken();
            if (token) {
                setEmailSent(true); // Đánh dấu đã xử lý

                // Kiểm tra xem có checkout info được lưu không (cho MoMo)
                const checkoutInfoRaw = window.localStorage.getItem('lumina_checkout_info');
                if (checkoutInfoRaw) {
                    try {
                        const checkoutInfo = JSON.parse(checkoutInfoRaw);
                        const apiBaseUrl = getApiBaseUrl();

                        // Tạo đơn hàng sau khi thanh toán thành công
                        const createOrderEndpoint = checkoutInfo.directCheckout
                            ? `${apiBaseUrl}/orders/create-direct-after-payment`
                            : `${apiBaseUrl}/orders/create-after-payment`;

                        const createOrderPayload = checkoutInfo.directCheckout ? {
                            productId: checkoutInfo.productId,
                            quantity: checkoutInfo.quantity,
                            addressId: checkoutInfo.addressId,
                            shippingAddress: checkoutInfo.shippingAddress,
                            note: '',
                            shippingFee: checkoutInfo.shippingFee,
                            paymentMethod: 'MOMO',
                            orderCode: checkoutInfo.orderCode,
                        } : {
                            addressId: checkoutInfo.addressId,
                            shippingAddress: checkoutInfo.shippingAddress,
                            note: '',
                            shippingFee: checkoutInfo.shippingFee,
                            cartItemIds: checkoutInfo.cartItemIds,
                            paymentMethod: 'MOMO',
                            orderCode: checkoutInfo.orderCode,
                        };

                        fetch(createOrderEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(createOrderPayload),
                        })
                            .then(resp => resp.json())
                            .then(data => {
                                const createdOrder = data?.result || data;
                                if (createdOrder && createdOrder.id) {
                                    // Cập nhật orderInfo với đơn hàng vừa tạo
                                    setOrderInfo(prev => ({
                                        ...prev,
                                        orderId: createdOrder.id,
                                        id: createdOrder.id,
                                        code: createdOrder.code || checkoutInfo.orderCode,
                                        orderCode: createdOrder.code || checkoutInfo.orderCode,
                                    }));

                                    // Xóa checkout info đã dùng
                                    window.localStorage.removeItem('lumina_checkout_info');

                                    // Verify payment và gửi email
                                    return verifyPaymentAndSendEmail(createdOrder.id, token);
                                } else {
                                    console.error('Failed to create order after payment:', data);
                                    setEmailSent(false);
                                }
                            })
                            .catch((error) => {
                                console.error('Error creating order after payment:', error);
                                setEmailSent(false); // Reset để có thể thử lại
                            });
                    } catch (parseError) {
                        console.error('Error parsing checkout info:', parseError);
                        setEmailSent(false);
                    }
                } else {
                    // COD hoặc đơn hàng đã được tạo trước đó
                    const orderId = saved?.orderId || saved?.id || orderIdFromQuery;
                    if (orderId) {
                        verifyPaymentAndSendEmail(orderId, token).catch((error) => {
                            console.error('Error verifying payment:', error);
                            setEmailSent(false);
                        });
                    }
                }
            }
        }
    }, [searchParams, location.state]);

    if (isError) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('card')}>
                    <div className={cx('icon-wrapper', 'icon-error')}>!</div>
                    <h1 className={cx('title')}>Thanh toán thất bại</h1>
                    <p className={cx('subtitle')}>
                        Rất tiếc, thanh toán MoMo của bạn chưa được hoàn tất. Vui lòng thử lại
                        hoặc chọn phương thức thanh toán khác.
                    </p>
                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('primary-btn')}
                            onClick={() => navigate('/checkout/confirm')}
                        >
                            Quay lại thanh toán
                        </button>
                        <button
                            type="button"
                            className={cx('secondary-btn')}
                            onClick={() => navigate('/')}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = orderInfo?.subtotal || 0;
    const shippingFee = orderInfo?.shippingFee || 0;
    const voucherDiscount = orderInfo?.voucherDiscount || 0;
    const total =
        typeof orderInfo?.total === 'number'
            ? orderInfo.total
            : Math.max(0, subtotal + shippingFee - voucherDiscount);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('card')}>
                <div className={cx('icon-wrapper')}>
                    <span className={cx('icon-check')}>✓</span>
                </div>
                <h1 className={cx('title')}>Cảm ơn bạn đã đặt hàng tại Lumina Book!</h1>
                <p className={cx('subtitle')}>
                    Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ sớm xử lý và giao hàng qua GHN
                    đến địa chỉ của bạn.
                </p>

                <div className={cx('order-box')}>
                    <div className={cx('order-row', 'order-row--header')}>
                        <span>Mã đơn hàng:</span>
                        <span className={cx('order-code')}>
                            {orderInfo?.code || orderInfo?.orderCode || orderInfo?.orderId || '#'}
                        </span>
                    </div>
                    <div className={cx('order-row')}>
                        <span>Người nhận:</span>
                        <span>{orderInfo?.receiverName || 'Khách hàng'}</span>
                    </div>
                    <div className={cx('order-row')}>
                        <span>Phương thức thanh toán:</span>
                        <span>{orderInfo?.paymentMethod || 'Thanh toán qua MoMo'}</span>
                    </div>
                    <div className={cx('order-row')}>
                        <span>Tạm tính:</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className={cx('order-row')}>
                        <span>Phí vận chuyển:</span>
                        <span>{formatPrice(shippingFee)}</span>
                    </div>
                    {voucherDiscount > 0 && (
                        <div className={cx('order-row')}>
                            <span>Giảm giá:</span>
                            <span>-{formatPrice(voucherDiscount)}</span>
                        </div>
                    )}
                    <div className={cx('order-row', 'order-row--total')}>
                        <span>Tổng cộng:</span>
                        <span className={cx('order-total')}>{formatPrice(total)}</span>
                    </div>
                </div>

                <div className={cx('actions')}>
                    <button
                        type="button"
                        className={cx('primary-btn')}
                        onClick={() => navigate('/')}
                    >
                        Tiếp tục mua sắm
                    </button>
                    <button
                        type="button"
                        className={cx('secondary-btn')}
                        onClick={() => {
                            // Navigate đến trang chi tiết đơn hàng vừa tạo
                            // Ưu tiên orderId (UUID) > id > code > orderCode
                            const targetId =
                                orderInfo?.orderId ||
                                orderInfo?.id ||
                                orderInfo?.code ||
                                orderInfo?.orderCode;
                            if (targetId) {
                                navigate(`/customer-account/orders/${targetId}`);
                            } else {
                                // Fallback: nếu không có orderId/code thì chuyển đến danh sách đơn hàng
                                navigate('/customer-account/orders');
                            }
                        }}
                    >
                        Xem đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
}

