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
    getMyAddresses,
} from '../../../services';
import { normalizeMediaUrl } from '../../../services/productUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../components/Common/Notification';
import defaultProductImage from '../../../assets/images/img_sach.png';
import AddressListModal from '../../../components/Common/AddressModal/AddressListModal';
import NewAddressModal from '../../../components/Common/AddressModal/NewAddressModal';
import AddressDetailModal from '../../../components/Common/AddressModal/AddressDetailModal';
import { formatFullAddress } from '../../../components/Common/AddressModal/useGhnLocations';

const cx = classNames.bind(styles);

export default function CheckoutDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { openLoginModal } = useAuth();
    const { success, error: showError } = useNotification();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    const selectedItemIds = location.state?.selectedItemIds || [];
    const directCheckout = location.state?.directCheckout || false;
    const directProductId = location.state?.productId || null;
    const directQuantity = location.state?.quantity || 1;
    
    // Debug log
    if (directCheckout) {
        console.log('CheckoutDetailPage: Direct checkout detected', {
            directCheckout,
            directProductId,
            directQuantity,
            locationState: location.state,
        });
    }

    const [userInfo, setUserInfo] = useState(null);
    const [cart, setCart] = useState(null);
    const [directProduct, setDirectProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shippingMethod, setShippingMethod] = useState('standard'); // 'standard' | 'cod'
    const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' | 'cod'
    const [note, setNote] = useState('');
    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
    // Lưu meta sản phẩm: ảnh + giá gốc chưa giảm
    const [productMeta, setProductMeta] = useState({});
    // Modal chọn / sửa địa chỉ giao hàng ngay trên trang checkout
    const [showAddressList, setShowAddressList] = useState(false);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [showAddressDetailModal, setShowAddressDetailModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressRefreshKey, setAddressRefreshKey] = useState(0);

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

                let addresses = [];
                
                if (directCheckout && directProductId) {
                    // Direct checkout: load product trực tiếp, không cần cart
                    console.log('CheckoutDetailPage: Direct checkout, loading product:', directProductId);
                    const [me, productResp, addressesData] = await Promise.all([
                        getMyInfo(token),
                        (async () => {
                            try {
                                const resp = await fetch(`${API_BASE_URL}/products/${directProductId}`, {
                                    headers: { 'Content-Type': 'application/json' },
                                });
                                if (!resp.ok) {
                                    console.error('CheckoutDetailPage: Failed to load product, status:', resp.status);
                                    showError('Không thể tải thông tin sản phẩm');
                                    navigate('/');
                                    return null;
                                }
                                const data = await resp.json();
                                const product = data?.result || data;
                                console.log('CheckoutDetailPage: Product loaded:', product?.id, product?.name);
                                return product;
                            } catch (err) {
                                console.error('Error fetching product:', err);
                                showError('Không thể tải thông tin sản phẩm');
                                navigate('/');
                                return null;
                            }
                        })(),
                        getMyAddresses(token),
                    ]);

                    if (!productResp || !productResp.id) {
                        console.error('CheckoutDetailPage: Product response is invalid:', productResp);
                        showError('Không thể tải thông tin sản phẩm');
                        navigate('/');
                        return;
                    }

                    console.log('CheckoutDetailPage: Setting directProduct:', {
                        id: productResp.id,
                        name: productResp.name,
                        price: productResp.price,
                    });
                    setUserInfo(me || null);
                    setDirectProduct(productResp);
                    addresses = addressesData || [];
                } else {
                    // Checkout từ giỏ hàng (flow cũ)
                    const [me, cartResp, addressesData] = await Promise.all([
                        getMyInfo(token),
                        (async () => {
                            const { ok, status, data } = await getCart(token);
                            if (!ok) {
                                if (status === 401) {
                                    showError(
                                        'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
                                    );
                                    openLoginModal();
                                } else {
                                    showError('Không thể tải giỏ hàng để thanh toán');
                                }
                                navigate('/cart');
                                return null;
                            }
                            return data;
                        })(),
                        getMyAddresses(token),
                    ]);

                    if (!cartResp) return;

                    setUserInfo(me || null);
                    setCart(cartResp);
                    addresses = addressesData || [];
                    if (cartResp.appliedVoucherCode) {
                        setSelectedVoucherCode(cartResp.appliedVoucherCode);
                    }
                }

                // Ưu tiên địa chỉ mặc định của user làm địa chỉ giao hàng ban đầu
                if (Array.isArray(addresses) && addresses.length > 0) {
                    const defaultAddress =
                        addresses.find((addr) => addr?.defaultAddress) || addresses[0];
                    if (defaultAddress) {
                        setSelectedAddress(defaultAddress);
                    }
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
    }, [isLoggedIn, API_BASE_URL, openLoginModal, navigate, showError, directCheckout, directProductId]);

    // Fetch product meta (ảnh + giá gốc & giá đang bán) cho checkout items
    useEffect(() => {
        if (directCheckout && directProduct) {
            // Direct checkout: load meta cho product
            const imageUrl =
                directProduct?.defaultMediaUrl ||
                (directProduct?.mediaUrls && directProduct.mediaUrls.length > 0
                    ? directProduct.mediaUrls[0]
                    : '');
            const normalizedImage = imageUrl
                ? normalizeMediaUrl(imageUrl, API_BASE_URL)
                : defaultProductImage;

            const currentPrice =
                typeof directProduct?.price === 'number' && directProduct.price > 0
                    ? directProduct.price
                    : 0;

            const originalUnitPrice =
                typeof directProduct?.originalPrice === 'number' &&
                directProduct.originalPrice > 0
                    ? directProduct.originalPrice
                    : currentPrice;

            setProductMeta({
                [directProductId]: {
                    imageUrl: normalizedImage,
                    currentPrice,
                    originalUnitPrice,
                },
            });
            return;
        }

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

                    // Logic giá giống CartPage / ProductDetail:
                    // - currentPrice: giá đang bán (đã giảm)
                    // - originalUnitPrice: giá gốc trước khi giảm
                    const currentPrice =
                        (typeof product?.price === 'number' && product.price > 0
                            ? product.price
                            : typeof product?.unitPrice === 'number' &&
                              product.unitPrice > 0
                            ? product.unitPrice
                            : undefined) ??
                        item.unitPrice ??
                        0;

                    const originalUnitPrice =
                        (typeof product?.originalPrice === 'number' &&
                        product.originalPrice > 0
                            ? product.originalPrice
                            : typeof product?.unitPrice === 'number' &&
                              product.unitPrice > 0
                            ? product.unitPrice
                            : undefined) ?? currentPrice;

                    metaMap[item.productId] = {
                        imageUrl: normalizedImage,
                        currentPrice,
                        originalUnitPrice,
                    };
                    setProductMeta((prev) => ({ ...prev, ...metaMap }));
                })
                .catch(() => {
                    metaMap[item.productId] = {
                        imageUrl: defaultProductImage,
                        currentPrice: item.unitPrice || 0,
                        originalUnitPrice: item.unitPrice || 0,
                    };
                    setProductMeta((prev) => ({ ...prev, ...metaMap }));
                });
        });
    }, [cart, directCheckout, directProduct, directProductId, API_BASE_URL]);

    // Derived items: direct checkout từ product hoặc từ cart
    const checkoutItems = useMemo(() => {
        console.log('CheckoutDetailPage: checkoutItems useMemo called', {
            directCheckout,
            directProductId,
            directProduct: directProduct ? { id: directProduct.id, name: directProduct.name } : null,
            directQuantity,
            cartItems: cart?.items?.length || 0,
            selectedItemIds: selectedItemIds?.length || 0,
        });
        
        if (directCheckout && directProductId) {
            // Direct checkout: tạo item từ product
            if (directProduct) {
                const unitPrice = directProduct.price || 0;
                const finalPrice = unitPrice * directQuantity;
                const items = [
                    {
                        id: `direct-${directProductId}`,
                        productId: directProductId,
                        product: directProduct,
                        quantity: directQuantity,
                        unitPrice: unitPrice,
                        finalPrice: finalPrice,
                    },
                ];
                console.log('CheckoutDetailPage: checkoutItems (direct):', items);
                return items;
            }
            // Nếu directProduct chưa load xong, trả về mảng rỗng tạm thời
            console.log('CheckoutDetailPage: checkoutItems (direct, product not loaded yet)', {
                directProductId,
                directProduct: directProduct,
                loading,
            });
            return [];
        }
        // Checkout từ giỏ hàng (flow cũ)
        const items = cart?.items || [];
        if (!selectedItemIds || selectedItemIds.length === 0) return items;
        const selectedSet = new Set(selectedItemIds);
        const filtered = items.filter((item) => selectedSet.has(item.id));
        return filtered.length > 0 ? filtered : items;
    }, [directCheckout, directProductId, directProduct, directQuantity, cart, selectedItemIds, loading]);

    const SHIPPING_FEE_STANDARD = 25000;
    const SHIPPING_FEE_COD = 30000;

    const shippingFee =
        shippingMethod === 'standard' ? SHIPPING_FEE_STANDARD : SHIPPING_FEE_COD;

    // Tạm tính: CHỈ tính trên các item được chọn (checkoutItems),
    // dùng finalPrice backend để khớp công thức trong OrderService.createOrderFromCurrentCart.
    const itemsSubtotal = checkoutItems.reduce((sum, item) => {
        const quantity = item.quantity || 1;
        const lineTotal =
            typeof item.finalPrice === 'number'
                ? item.finalPrice
                : (item.unitPrice || 0) * quantity;
        return sum + lineTotal;
    }, 0);

    const voucherDiscount = cart?.voucherDiscount || 0;

    // Tổng cộng hiển thị: giống backend = selectedSubtotal + shippingFee - voucherDiscount
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
        // Kiểm tra nếu đang directCheckout nhưng product chưa load xong
        if (directCheckout && !directProduct) {
            showError('Đang tải thông tin sản phẩm, vui lòng đợi...');
            return;
        }
        
        if (!checkoutItems.length) {
            showError('Không có sản phẩm nào để thanh toán');
            if (directCheckout) {
                navigate('/');
            } else {
                navigate('/cart');
            }
            return;
        }

        // Chuẩn bị dữ liệu tóm tắt đơn hàng để hiển thị ở màn hình xác nhận
        const summaryItems = checkoutItems.map((item) => {
            const meta = productMeta[item.productId] || {};
            const quantity = item.quantity || 1;
            const unitPriceFromMeta =
                typeof meta.currentPrice === 'number' ? meta.currentPrice : undefined;
            const unitPrice = unitPriceFromMeta ?? item.unitPrice ?? 0;
            const lineTotal = unitPrice * quantity;
            const imageUrl = meta.imageUrl || defaultProductImage;

            // Lấy tên sản phẩm: từ product object hoặc productName
            const productName = 
                (directCheckout && item.product?.name) ||
                item.productName ||
                item.product?.name ||
                'Sản phẩm';

            return {
                id: item.id,
                name: productName,
                quantity,
                lineTotal,
                imageUrl,
            };
        });

        // Lưu tạm thông tin tóm tắt đơn hàng để màn OrderSuccess có thể đọc lại
        try {
            const previewOrderInfo = {
                receiverName: recipientName,
                paymentMethod:
                    paymentMethod === 'momo'
                        ? 'Thanh toán qua MoMo'
                        : 'Thanh toán khi nhận hàng (COD)',
                subtotal: itemsSubtotal,
                shippingFee,
                voucherDiscount,
                total,
                shippingProvider: 'GHN',
            };
            window.localStorage.setItem(
                'lumina_latest_order',
                JSON.stringify(previewOrderInfo),
            );
        } catch (storageErr) {
            // Không chặn luồng nếu localStorage lỗi
            console.warn('Cannot persist preview order info', storageErr);
        }

        navigate('/checkout/confirm', {
            state: {
                paymentMethod,
                // Direct checkout flag
                directCheckout: directCheckout,
                productId: directProductId,
                quantity: directQuantity,
                // Giữ lại danh sách cartItemId đã chọn để backend biết item nào cần thanh toán (nếu không phải direct checkout)
                cartItemIds: directCheckout ? [] : selectedItemIds,
                address: {
                    recipientName,
                    recipientPhone,
                    addressText,
                    shippingProvider: 'GHN',
                },
                summary: {
                    items: summaryItems,
                    subtotal: itemsSubtotal,
                    shippingFee,
                    voucherDiscount,
                    total,
                },
            },
        });
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

    // Kiểm tra điều kiện hiển thị empty state
    const shouldShowEmpty = directCheckout
        ? !loading && checkoutItems.length === 0 // Direct checkout: chỉ cần items rỗng và không đang loading
        : !cart || checkoutItems.length === 0; // Checkout từ cart: cần cart và items

    if (shouldShowEmpty) {
        return (
            <div className={cx('checkout-page')}>
                <div className={cx('container')}>
                    <div className={cx('empty')}>
                        {loading ? (
                            <p>Đang tải thông tin...</p>
                        ) : (
                            <>
                                <p>Không có sản phẩm nào để thanh toán.</p>
                                <button
                                    type="button"
                                    className={cx('back-to-cart')}
                                    onClick={() => navigate(directCheckout ? '/' : '/cart')}
                                >
                                    {directCheckout ? 'Quay lại trang chủ' : 'Quay lại giỏ hàng'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const addressText =
        (selectedAddress && formatFullAddress(selectedAddress)) ||
        userInfo?.address ||
        userInfo?.shippingAddress ||
        'Vui lòng cập nhật địa chỉ giao hàng trong tài khoản của bạn';

    const recipientName =
        selectedAddress?.recipientName ||
        userInfo?.fullName ||
        userInfo?.name ||
        'Khách hàng';

    const recipientPhone =
        selectedAddress?.recipientPhoneNumber ||
        userInfo?.phoneNumber ||
        userInfo?.phone ||
        '---';

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
                                    onClick={() => setShowAddressList(true)}
                                >
                                    Thay đổi
                                </button>
                            </div>
                            <div className={cx('address-box')}>
                                <div className={cx('address-line')}>
                                    <strong>Giao đến: </strong>
                                    <span>{addressText}</span>
                                </div>
                                {(recipientName || recipientPhone) && (
                                    <div className={cx('address-meta')}>
                                        Người nhận: <strong>{recipientName}</strong> ·{' '}
                                        {recipientPhone}
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
                                            Sử dụng ví MOMO để quét mã hoặc thanh toán
                                            trực tuyến. Xác nhận tự động.
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
                                            Thanh toán trực tiếp cho nhân viên vận chuyển
                                            khi nhận hàng.
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
                                    // Giá đang bán ưu tiên lấy từ meta (giống CartPage),
                                    // fallback về unitPrice trong cart
                                    const unitPriceFromMeta =
                                        typeof meta.currentPrice === 'number'
                                            ? meta.currentPrice
                                            : undefined;
                                    const unitPrice =
                                        unitPriceFromMeta ?? item.unitPrice ?? 0;
                                    const originalUnitPrice =
                                        typeof meta.originalUnitPrice === 'number'
                                            ? meta.originalUnitPrice
                                            : unitPrice;

                                    // Thành tiền mỗi sản phẩm: ưu tiên dùng finalPrice backend
                                    const backendLineTotal =
                                        typeof item.finalPrice === 'number'
                                            ? item.finalPrice
                                            : unitPrice * quantity;
                                    const currentLineTotal = backendLineTotal;
                                    const originalLineTotal =
                                        originalUnitPrice * quantity;
                                    const showOriginal =
                                        originalLineTotal > currentLineTotal &&
                                        originalLineTotal > 0;

                                    const displayName = 
                                        (directCheckout && item.product?.name) ||
                                        item.productName ||
                                        item.product?.name ||
                                        'Sản phẩm';

                                    return (
                                        <div key={item.id} className={cx('product-row')}>
                                            <div className={cx('product-image')}>
                                                <img
                                                    src={imgSrc}
                                                    alt={displayName}
                                                    onError={(e) => {
                                                        e.target.src =
                                                            defaultProductImage;
                                                    }}
                                                />
                                            </div>
                                            <div className={cx('product-info')}>
                                                <div className={cx('product-name')}>
                                                    {displayName}
                                                </div>
                                                <div className={cx('product-qty')}>
                                                    Số lượng: {quantity}
                                                </div>
                                            </div>
                                            <div className={cx('product-price')}>
                                                <div className={cx('current-price')}>
                                                    {formatPrice(currentLineTotal)}
                                                </div>
                                                {showOriginal && (
                                                    <div className={cx('unit-price')}>
                                                        {formatPrice(originalLineTotal)}
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
                                                setVoucherCodeInput(
                                                    e.target.value.toUpperCase(),
                                                )
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
                                            Đã áp dụng mã:{' '}
                                            <strong>{selectedVoucherCode}</strong>
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
                                Chú ý: MOMO xử lý thanh toán online. COD thanh toán khi
                                nhận hàng qua GHN.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Modal chọn địa chỉ giao hàng */}
            <AddressListModal
                open={showAddressList}
                onClose={() => setShowAddressList(false)}
                onSelectAddress={(address) => {
                    if (!address) return;
                    setSelectedAddress(address);
                    setShowAddressList(false);
                }}
                onViewDetail={(address) => {
                    setSelectedAddress(address);
                    setShowAddressDetailModal(true);
                }}
                onAddNewAddress={() => {
                    setShowNewAddressModal(true);
                }}
                refreshKey={addressRefreshKey}
                highlightAddressId={selectedAddress?.id || null}
            />
            <NewAddressModal
                open={showNewAddressModal}
                onClose={() => setShowNewAddressModal(false)}
                onCreated={(newAddress) => {
                    if (newAddress) {
                        setSelectedAddress(newAddress);
                    }
                    setAddressRefreshKey((prev) => prev + 1);
                    setShowNewAddressModal(false);
                    setShowAddressList(false);
                }}
            />
            <AddressDetailModal
                open={showAddressDetailModal}
                address={selectedAddress}
                onClose={() => setShowAddressDetailModal(false)}
                onUpdated={(updated) => {
                    if (!updated) return;
                    setSelectedAddress(updated);
                    setAddressRefreshKey((prev) => prev + 1);
                }}
            />
        </div>
    );
}
