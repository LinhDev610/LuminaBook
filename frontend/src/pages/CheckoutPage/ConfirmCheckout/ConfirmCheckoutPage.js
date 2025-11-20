import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ConfirmCheckoutPage.module.scss';
import defaultProductImage from '../../../assets/images/img_sach.png';
import { getStoredToken } from '../../../services/utils';
import { removeCartItem } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Common/Notification';

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

    const paymentMethod = state.paymentMethod || 'cod'; // 'cod' | 'momo'
    const address = state.address || {};
    const summary = state.summary || {};

    const items = summary.items || [];
    const shippingFee = summary.shippingFee || 0;
    const voucherDiscount = summary.voucherDiscount || 0;

    const [orderItems, setOrderItems] = useState(items);

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

    const handleConfirm = () => {
        // TODO: Gọi API tạo đơn hàng thực tế tại đây
        // Tạm thời chỉ điều hướng về trang chủ sau khi xác nhận
        navigate('/');
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
                    >
                        {confirmButtonLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
