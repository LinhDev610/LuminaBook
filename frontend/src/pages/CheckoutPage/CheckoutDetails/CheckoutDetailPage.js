import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CheckoutDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken } from '../../../services/utils';
import {
    getMyInfo,
    getCart,
    applyVoucherToCart,
    clearVoucherFromCart,
} from '../../../services';
import { normalizeMediaUrl } from '../../../services/productUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Common/Notification';
import defaultProductImage from '../../../assets/images/img_sach.png';

const cx = classNames.bind(styles);

export default function CheckoutDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { openLoginModal } = useAuth();
    const { success, error: showError } = useNotification();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    const selectedItemIds = location.state?.selectedItemIds || [];

    const [userInfo, setUserInfo] = useState(null);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('standard'); // 'standard' | 'cod'
    const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' | 'cod'
    const [note, setNote] = useState('');
    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
    // Lưu meta sản phẩm: ảnh + giá gốc chưa giảm
    const [productMeta, setProductMeta] = useState({});

    const isLoggedIn = !!getStoredToken('token');

    // Fetch user info & cart
    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            showError('Vui lòng đăng nhập để thanh toán');
            openLoginModal();
            navigate('/cart');
            return;
        }

        const fetchAll = async () => {
            try {
                setLoading(true);
                const token = getStoredToken('token');
                if (!token) {
                    showError('Vui lòng đăng nhập để thanh toán');
                    openLoginModal();
                    navigate('/cart');
                    return;
                }

                const [me, cartResp] = await Promise.all([
                    getMyInfo(token),
                    (async () => {
                        const { ok, status, data } = await getCart(token);
                        if (!ok) {
                            if (status === 401) {
                                showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                                openLoginModal();
                            } else {
                                showError('Không thể tải giỏ hàng để thanh toán');
                            }
                            navigate('/cart');
                            return null;
                        }
                        return data;
                    })(),
                ]);

                if (!cartResp) return;

                setUserInfo(me || null);
                setCart(cartResp);
                if (cartResp.appliedVoucherCode) {
                    setSelectedVoucherCode(cartResp.appliedVoucherCode);
                }
            } catch (err) {
                console.error('Error loading checkout data:', err);
                showError('Có lỗi xảy ra khi tải thông tin thanh toán');
                navigate('/cart');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isLoggedIn, API_BASE_URL, openLoginModal, navigate, showError]);

    // Fetch product meta (ảnh + giá gốc) cho checkout items
    useEffect(() => {
        if (!cart?.items || !cart.items.length) return;

        const metaMap = {};
        cart.items.forEach((item) => {
            if (!item.productId) return;

            fetch(`${API_BASE_URL}/products/${item.productId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
                .then((res) => res.json())
                .then((productData) => {
                    const product = productData?.result || productData;
                    const imageUrl =
                        product?.defaultMediaUrl ||
                        (product?.mediaUrls && product.mediaUrls.length > 0
                            ? product.mediaUrls[0]
                            : '');
                    const normalizedImage = imageUrl
                        ? normalizeMediaUrl(imageUrl, API_BASE_URL)
                        : defaultProductImage;

                    const originalUnitPrice =
                        typeof product?.price === 'number' && product.price > 0
                            ? product.price
                            : typeof product?.unitPrice === 'number' &&
                              product.unitPrice > 0
                                ? product.unitPrice
                                : item.unitPrice || 0;

                    metaMap[item.productId] = {
                        imageUrl: normalizedImage,
                        originalUnitPrice,
                    };
                    setProductMeta((prev) => ({ ...prev, ...metaMap }));
                })
                .catch(() => {
                    metaMap[item.productId] = {
                        imageUrl: defaultProductImage,
                        originalUnitPrice: item.unitPrice || 0,
                    };
                    setProductMeta((prev) => ({ ...prev, ...metaMap }));
                });
        });
    }, [cart, API_BASE_URL]);

    // Derived items: only selected from CartPage, fallback to all
    const checkoutItems = (() => {
        const items = cart?.items || [];
        if (!selectedItemIds || selectedItemIds.length === 0) return items;
        const selectedSet = new Set(selectedItemIds);
        const filtered = items.filter((item) => selectedSet.has(item.id));
        return filtered.length > 0 ? filtered : items;
    })();

    const SHIPPING_FEE_STANDARD = 25000;
    const SHIPPING_FEE_COD = 30000;

    const shippingFee =
        shippingMethod === 'standard' ? SHIPPING_FEE_STANDARD : SHIPPING_FEE_COD;

    const itemsSubtotal = checkoutItems.reduce(
        (sum, item) => sum + (item.finalPrice || 0),
        0,
    );

    const voucherDiscount = cart?.voucherDiscount || 0;
    const total = Math.max(0, itemsSubtotal + shippingFee - voucherDiscount);

    const formatPrice = (value) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value || 0);

    const handleApplyVoucher = async () => {
        const code = (voucherCodeInput || '').trim().toUpperCase();
        if (!code) {
            showError('Vui lòng nhập mã giảm giá');
            return;
        }

        if (!checkoutItems.length) {
            showError('Vui lòng chọn sản phẩm ở trang giỏ hàng trước khi áp dụng mã');
            navigate('/cart');
            return;
        }

        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await applyVoucherToCart(code, token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    const msg =
                        data?.message ||
                        data?.error ||
                        `Không thể áp dụng mã giảm giá (Lỗi: ${status})`;
                    showError(msg);
                }
                return;
            }

            setCart(data);
            setSelectedVoucherCode(code);
            setVoucherCodeInput('');
            success('Đã áp dụng mã giảm giá thành công');
        } catch (err) {
            console.error('Error applying voucher in checkout:', err);
            showError('Có lỗi xảy ra khi áp dụng mã giảm giá');
        }
    };

    const handleClearVoucher = async () => {
        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await clearVoucherFromCart(token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    const msg =
                        data?.message ||
                        data?.error ||
                        `Không thể hủy mã giảm giá (Lỗi: ${status})`;
                    showError(msg);
                }
                return;
            }

            setCart(data);
            setSelectedVoucherCode('');
            success('Đã hủy mã giảm giá');
        } catch (err) {
            console.error('Error clearing voucher in checkout:', err);
            showError('Có lỗi xảy ra khi hủy mã giảm giá');
        }
    };

    const handlePlaceOrder = () => {
        if (!checkoutItems.length) {
            showError('Không có sản phẩm nào để thanh toán');
            navigate('/cart');
            return;
        }

        // TODO: Gọi API tạo đơn hàng
        success('Đặt hàng thành công (demo)!');
        navigate('/');
    };

    if (loading) {
        return (
            <div className={cx('checkout-page')}>
                <div className={cx('container')}>
                    <div className={cx('loading')}>Đang tải thông tin thanh toán...</div>
                </div>
            </div>
        );
    }

    if (!cart || checkoutItems.length === 0) {
        return (
            <div className={cx('checkout-page')}>
                <div className={cx('container')}>
                    <div className={cx('empty')}>
                        <p>Không có sản phẩm nào để thanh toán.</p>
                        <button
                            type="button"
                            className={cx('back-to-cart')}
                            onClick={() => navigate('/cart')}
                        >
                            Quay lại giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const addressText =
        userInfo?.address ||
        userInfo?.shippingAddress ||
        'Vui lòng cập nhật địa chỉ giao hàng trong tài khoản của bạn';

    return (
        <div className={cx('checkout-page')}>
            <div className={cx('container')}>
                <div className={cx('content')}>
                    <div className={cx('left')}>
                        <section className={cx('card')}>
                            <div className={cx('card-header')}>
                                <h2>Thông tin vận chuyển</h2>
                                <button
                                    type="button"
                                    className={cx('link-button')}
                                    onClick={() => navigate('/customer-account')}
                                >
                                    Thay đổi
                                </button>
                            </div>
                            <div className={cx('address-box')}>
                                <div className={cx('address-line')}>
                                    <strong>Giao đến: </strong>
                                    <span>{addressText}</span>
                                </div>
                                {userInfo && (
                                    <div className={cx('address-meta')}>
                                        Người nhận:{' '}
                                        <strong>
                                            {userInfo.fullName || userInfo.name || 'Khách hàng'}
                                        </strong>{' '}
                                        · {userInfo.phoneNumber || userInfo.phone || '---'}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className={cx('card')}>
                            <h2>Phương thức giao hàng</h2>
                            <div className={cx('radio-group')}>
                                <label className={cx('radio-option')}>
                                    <input
                                        type="radio"
                                        name="shipping"
                                        value="standard"
                                        checked={shippingMethod === 'standard'}
                                        onChange={() => setShippingMethod('standard')}
                                    />
                                    <div className={cx('radio-content')}>
                                        <span className={cx('radio-title')}>
                                            Giao hàng GHN (Tiêu chuẩn)
                                        </span>
                                        <span className={cx('radio-desc')}>
                                            Dự kiến giao: Thứ Ba, 14/10
                                        </span>
                                    </div>
                                    
                                </label>
                            
                                    
        
                            </div>
                        </section>

                        <section className={cx('card')}>
                            <h2>Phương thức thanh toán</h2>
                            <div className={cx('radio-group')}>
                                <label className={cx('radio-option')}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="momo"
                                        checked={paymentMethod === 'momo'}
                                        onChange={() => setPaymentMethod('momo')}
                                    />
                                    <div className={cx('radio-content')}>
                                        <span className={cx('radio-title')}>
                                            MOMO (Thanh toán online)
                                        </span>
                                        <span className={cx('radio-desc')}>
                                            Sử dụng ví MOMO để quét mã hoặc thanh toán trực tuyến.
                                            Xác nhận tự động.
                                        </span>
                                    </div>
                                </label>
                                <label className={cx('radio-option')}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                    />
                                    <div className={cx('radio-content')}>
                                        <span className={cx('radio-title')}>
                                            COD — Thanh toán khi nhận hàng
                                        </span>
                                        <span className={cx('radio-desc')}>
                                            Thanh toán trực tiếp cho nhân viên vận chuyển khi nhận
                                            hàng.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </section>

                        <section className={cx('card')}>
                            <h2>Ghi chú đơn hàng</h2>
                            <textarea
                                className={cx('note-input')}
                                placeholder="Ghi chú cho người giao hàng (ví dụ: gọi trước khi giao)"
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </section>

                        <section className={cx('card')}>
                            <div className={cx('products-header')}>
                                <h2>Sản phẩm</h2>
                                <span className={cx('products-count')}>
                                    {checkoutItems.length} sản phẩm
                                </span>
                            </div>
                            <div className={cx('products-list')}>
                                {checkoutItems.map((item) => {
                                    const meta = productMeta[item.productId] || {};
                                    const imgSrc = meta.imageUrl || defaultProductImage;

                                    const quantity = item.quantity || 1;
                                    const unitPrice = item.unitPrice || 0; // giá đã giảm trong cart
                                    const originalUnitPrice =
                                        typeof meta.originalUnitPrice === 'number'
                                            ? meta.originalUnitPrice
                                            : unitPrice;

                                    const originalTotal = originalUnitPrice * quantity;
                                    const finalTotal =
                                        typeof item.finalPrice === 'number'
                                            ? item.finalPrice
                                            : unitPrice * quantity;
                                    const showOriginal =
                                        originalTotal > finalTotal && originalTotal > 0;

                                    return (
                                        <div key={item.id} className={cx('product-row')}>
                                            <div className={cx('product-image')}>
                                                <img
                                                    src={imgSrc}
                                                    alt={item.productName}
                                                    onError={(e) => {
                                                        e.target.src = defaultProductImage;
                                                    }}
                                                />
                                            </div>
                                            <div className={cx('product-info')}>
                                                <div className={cx('product-name')}>
                                                    {item.productName}
                                                </div>
                                                <div className={cx('product-qty')}>
                                                    Số lượng: {quantity}
                                                </div>
                                            </div>
                                            <div className={cx('product-price')}>
                                                <div className={cx('current-price')}>
                                                    {formatPrice(finalTotal)}
                                                </div>
                                                {showOriginal && (
                                                    <div className={cx('unit-price')}>
                                                        {formatPrice(originalTotal)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <aside className={cx('right')}>
                        <div className={cx('summary-card')}>
                            <h2 className={cx('summary-title')}>Tóm tắt đơn hàng</h2>

                            <div className={cx('summary-row')}>
                                <span>Tạm tính:</span>
                                <span>{formatPrice(itemsSubtotal)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span>Phí vận chuyển (GHN):</span>
                                <span>{formatPrice(shippingFee)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span>Giảm giá:</span>
                                <span>{formatPrice(voucherDiscount)}</span>
                            </div>
                            <div className={cx('summary-row', 'summary-total')}>
                                <span>Tổng cộng (đã bao gồm VAT):</span>
                                <span className={cx('summary-total-price')}>
                                    {formatPrice(total)}
                                </span>
                            </div>

                            <div className={cx('summary-divider')} />

                            <div className={cx('voucher-section')}>
                                <h3 className={cx('voucher-title')}>Mã giảm giá</h3>
                                <div className={cx('voucher-card')}>
                                    <div className={cx('voucher-input-row')}>
                                        <input
                                            type="text"
                                            className={cx('voucher-input')}
                                            placeholder="Nhập mã giảm giá (ví dụ: MGG20)"
                                            value={voucherCodeInput}
                                            onChange={(e) =>
                                                setVoucherCodeInput(e.target.value.toUpperCase())
                                            }
                                        />
                                        <button
                                            type="button"
                                            className={cx('voucher-apply-btn')}
                                            onClick={handleApplyVoucher}
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                    {selectedVoucherCode && (
                                        <p className={cx('voucher-applied')}>
                                            Đã áp dụng mã: <strong>{selectedVoucherCode}</strong>
                                            <button
                                                type="button"
                                                className={cx('remove-voucher-inline')}
                                                onClick={handleClearVoucher}
                                            >
                                                Hủy mã
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                className={cx('pay-btn')}
                                onClick={handlePlaceOrder}
                            >
                                Thanh toán
                            </button>

                            <p className={cx('payment-note')}>
                                Chú ý: MOMO xử lý thanh toán online. COD thanh toán khi nhận hàng qua
                                GHN.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}


