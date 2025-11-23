import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ConfirmCheckoutPage.module.scss';
import defaultProductImage from '../../../assets/images/img_sach.png';
import { getApiBaseUrl, getStoredToken } from '../../../services/utils';
import { removeCartItem } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Common/Notification';
import { formatFullAddress } from '../../../components/Common/AddressModal/useGhnLocations';

const cx = classNames.bind(styles);

const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value || 0);

export default function ConfirmCheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { openLoginModal } = useAuth();
    const { success, error: showError } = useNotification();

    const state = location.state || {};

    // Mặc định ưu tiên MOMO nếu không có state truyền từ trang trước
    const paymentMethod = state.paymentMethod || 'momo'; // 'momo' | 'cod'
    const address = state.address || {};
    const summary = state.summary || {};
    const cartItemIds = state.cartItemIds || [];
    
    // Direct checkout: mua ngay từ sản phẩm (không qua giỏ hàng)
    const directCheckout = state.directCheckout || false;
    const directProductId = state.productId || null;
    const directQuantity = state.quantity || 1;

    const items = summary.items || [];
    const shippingFee = summary.shippingFee || 0;
    const voucherDiscount = summary.voucherDiscount || 0;

    const [orderItems, setOrderItems] = useState(items);
    const [submitting, setSubmitting] = useState(false);

    const currentSubtotal = useMemo(
        () => orderItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0),
        [orderItems],
    );

    const currentTotal = useMemo(
        () => Math.max(0, currentSubtotal + shippingFee - voucherDiscount),
        [currentSubtotal, shippingFee, voucherDiscount],
    );

    const confirmButtonLabel =
        paymentMethod === 'momo'
            ? 'Xác nhận đặt hàng (MOMO)'
            : 'Xác nhận đặt hàng (COD)';

    const handleRemoveItem = async (itemId) => {
        try {
            const token = getStoredToken('token');
            const { ok, status } = await removeCartItem(itemId, token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    showError('Không thể xóa sản phẩm khỏi giỏ hàng');
                }
                return;
            }

            setOrderItems((prev) => {
                const next = prev.filter((item) => item.id !== itemId);
                success('Đã xóa sản phẩm khỏi giỏ hàng');
                if (next.length === 0) {
                    navigate('/cart');
                }
                return next;
            });
        } catch (err) {
            console.error('Error removing item in ConfirmCheckoutPage:', err);
            showError('Có lỗi xảy ra khi xóa sản phẩm');
        }
    };

    const buildShippingInfo = () => {
        const name =
            address.recipientName ||
            address.receiverName ||
            address.recipient ||
            state.receiverName ||
            'Khách hàng';
        const phone =
            address.recipientPhone ||
            address.recipientPhoneNumber ||
            address.phone ||
            state.receiverPhone ||
            '';
        const addressText =
            address.addressText ||
            formatFullAddress(address) ||
            address.rawAddress ||
            state.shippingAddress ||
            '';

        return {
            name,
            phone,
            address: addressText,
        };
    };

    // Lưu đơn hàng gần nhất (bao gồm danh sách sản phẩm) để các màn khác có thể đọc lại
    const persistLatestOrder = (order, paymentMethodLabel, totalOverride) => {
        if (!order || !order.id) return;

        try {
            const itemsForStorage = (orderItems || []).map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                lineTotal: item.lineTotal,
                imageUrl: item.imageUrl,
            }));

            const shippingInfo = buildShippingInfo();

            const latestOrderInfo = {
                orderId: order.id,
                code: order.code || order.orderCode || order.id || null,
                receiverName: shippingInfo.name,
                receiverPhone: shippingInfo.phone || '---',
                paymentMethod: paymentMethodLabel,
                subtotal: currentSubtotal,
                shippingFee,
                voucherDiscount: summary.voucherDiscount || 0,
                total:
                    typeof totalOverride === 'number'
                        ? totalOverride
                        : Math.max(0, currentSubtotal + shippingFee - voucherDiscount),
                shippingProvider: address.shippingProvider || 'GHN',
                shippingAddress: shippingInfo.address,
                items: itemsForStorage,
            };

            window.localStorage.setItem('lumina_latest_order', JSON.stringify(latestOrderInfo));
        } catch (storageErr) {
            console.warn('Cannot persist latest order info', storageErr);
        }
    };

    const handleConfirm = async () => {
        if (submitting) return;

        try {
            setSubmitting(true);

            const apiBaseUrl = getApiBaseUrl();
            const token = getStoredToken('token');

            // Bước 1: tạo đơn hàng
            const shippingInfo = buildShippingInfo();
            
            let orderResp;
            
            if (directCheckout && directProductId) {
                // Direct checkout: mua ngay từ sản phẩm (không qua giỏ hàng)
                const directPayload = {
                    productId: directProductId,
                    quantity: directQuantity,
                    addressId: address.id || address.addressId || null,
                    shippingAddress: JSON.stringify(shippingInfo),
                    note: '',
                    shippingFee,
                    paymentMethod: paymentMethod?.toUpperCase() || 'COD',
                };

                orderResp = await fetch(`${apiBaseUrl}/orders/checkout-direct`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(directPayload),
                });
            } else {
                // Checkout từ giỏ hàng (flow cũ)
                const orderPayload = {
                    addressId: address.id || address.addressId || null,
                    shippingAddress: JSON.stringify(shippingInfo),
                    note: '',
                    shippingFee,
                    cartItemIds,
                    paymentMethod: paymentMethod?.toUpperCase() || 'COD',
                };

                orderResp = await fetch(`${apiBaseUrl}/orders/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(orderPayload),
                });
            }

            if (!orderResp.ok) {
                let message = 'Không thể tạo đơn hàng. Vui lòng thử lại.';
                try {
                    const errorBody = await orderResp.json();
                    message =
                        errorBody?.message ||
                        errorBody?.error ||
                        errorBody?.detail ||
                        message;
                } catch {
                    // ignore parse error, dùng message mặc định
                }
                showError(message);
                setSubmitting(false);
                return;
            }

            const orderData = await orderResp.json().catch(() => null);
            const initResult = orderData?.result || orderData || {};
            const order = initResult?.order || initResult;
            const payUrl = initResult?.payUrl;
            const orderCode = initResult?.orderCode; // For MoMo: order code to be created

            if (paymentMethod === 'momo') {
                // Với MoMo: chưa có đơn hàng, chỉ có payment URL
                if (!payUrl) {
                    showError('Không nhận được đường dẫn thanh toán MoMo.');
                    setSubmitting(false);
                    return;
                }
                
                // Lưu thông tin checkout để tạo đơn hàng sau khi thanh toán thành công
                const checkoutInfo = {
                    paymentMethod: 'momo',
                    orderCode: orderCode,
                    directCheckout: directCheckout,
                    productId: directProductId,
                    quantity: directQuantity,
                    addressId: address.id || address.addressId || null,
                    shippingAddress: JSON.stringify(buildShippingInfo()),
                    shippingFee: shippingFee,
                    cartItemIds: directCheckout ? [] : cartItemIds,
                    summary: {
                        items: orderItems,
                        subtotal: currentSubtotal,
                        shippingFee: shippingFee,
                        voucherDiscount: voucherDiscount,
                        total: currentTotal,
                    },
                    address: {
                        recipientName: address.recipientName || address.name,
                        recipientPhone: address.recipientPhone || address.phone,
                        addressText: address.addressText || address.address,
                    },
                };
                
                // Lưu checkout info vào localStorage
                window.localStorage.setItem('lumina_checkout_info', JSON.stringify(checkoutInfo));
                
                // Lưu preview order info để hiển thị trong OrderSuccess
                persistLatestOrder({
                    code: orderCode,
                    orderCode: orderCode,
                }, 'Thanh toán qua MoMo', Math.round(currentTotal));
                
                window.location.href = payUrl;
                return;
            }

            // COD: Đơn hàng đã được tạo
            if (!order || !order.id) {
                showError('Không nhận được thông tin đơn hàng từ server.');
                setSubmitting(false);
                return;
            }

            persistLatestOrder(order, 'Thanh toán khi nhận hàng', Math.round(currentTotal));
            // COD: Chuyển về trang cảm ơn (giống MoMo)
            navigate('/order-success', {
                state: {
                    orderId: order.id,
                    orderCode: order.code || order.orderCode,
                },
            });
        } catch (err) {
            console.error('Error when confirming checkout:', err);
            showError('Có lỗi xảy ra khi xác nhận đặt hàng.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={cx('confirm-page')}>
            <div className={cx('container')}>
                <div className={cx('card')}>
                    <section className={cx('section', 'address-section')}>
                        <div className={cx('section-header')}>
                            <h2 className={cx('section-title')}>Địa chỉ giao hàng</h2>
                        </div>
                        <div className={cx('address-content')}>
                            <div className={cx('address-labels')}>
                                <div>Người nhận:</div>
                                <div>Số điện thoại:</div>
                                <div>Địa chỉ:</div>
                                <div>Đơn vị vận chuyển:</div>
                            </div>
                            <div className={cx('address-values')}>
                                <div>{address.recipientName || 'Khách hàng'}</div>
                                <div>{address.recipientPhone || '---'}</div>
                                <div>{address.addressText || 'Chưa có địa chỉ giao hàng'}</div>
                                <div>{address.shippingProvider || 'GHN'}</div>
                            </div>
                        </div>
                    </section>

                    <section className={cx('section', 'products-section')}>
                        <h2 className={cx('section-title')}>Sản phẩm</h2>
                        <div className={cx('products-list')}>
                            {orderItems.map((item) => {
                                const imgSrc = item.imageUrl || defaultProductImage;
                                return (
                                    <div key={item.id} className={cx('product-row')}>
                                        <div className={cx('product-main')}>
                                            <div className={cx('product-thumb')}>
                                                <img
                                                    src={imgSrc}
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.target.src = defaultProductImage;
                                                    }}
                                                />
                                            </div>
                                            <div className={cx('product-info')}>
                                                <div className={cx('product-name')}>{item.name}</div>
                                                <div className={cx('product-qty')}>
                                                    Số lượng: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cx('product-price')}>
                                            {formatPrice(item.lineTotal)}
                                        </div>
                                        <button
                                            type="button"
                                            className={cx('product-remove')}
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={cx('section', 'summary-section')}>
                        <h2 className={cx('section-title')}>Tóm tắt đơn hàng</h2>
                        <div className={cx('summary-rows')}>
                            <div className={cx('summary-row')}>
                                <span className={cx('summary-label')}>Tạm tính:</span>
                                <span className={cx('summary-value')}>
                                    {formatPrice(currentSubtotal)}
                                </span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span className={cx('summary-label')}>Phí vận chuyển:</span>
                                <span className={cx('summary-value')}>
                                    {formatPrice(shippingFee)}
                                </span>
                            </div>
                            <div className={cx('summary-row', 'summary-total-row')}>
                                <span className={cx('summary-total-label')}>Tổng cộng:</span>
                                <span className={cx('summary-total-value')}>
                                    {formatPrice(currentTotal)}
                                </span>
                            </div>
                        </div>
                        <p className={cx('summary-note')}>
                            (Giá sản phẩm đã bao gồm VAT)
                        </p>
                    </section>
                </div>

                <div className={cx('bottom-bar')}>
                    <button
                        type="button"
                        className={cx('confirm-button')}
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting ? 'Đang xử lý...' : confirmButtonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
