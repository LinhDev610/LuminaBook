import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CustomerRefundDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatCurrency } from '../../../../services';
import { normalizeMediaUrl } from '../../../../services/productUtils';

const cx = classNames.bind(styles);

// Parse refund information from order (prefer dedicated fields, fallback to note)
const parseRefundInfo = (order) => {
    // First, try to get from dedicated refund fields (new way)
    if (order.refundReasonType || order.refundDescription || order.refundReturnAddress) {
        let selectedProducts = [];
        if (order.refundSelectedProductIds) {
            try {
                selectedProducts = JSON.parse(order.refundSelectedProductIds);
            } catch {
                selectedProducts = order.items?.map(item => item.id) || [];
            }
        } else {
            selectedProducts = order.items?.map(item => item.id) || [];
        }

        let mediaUrls = [];
        if (order.refundMediaUrls) {
            try {
                const parsed = JSON.parse(order.refundMediaUrls);
                if (Array.isArray(parsed)) {
                    mediaUrls = parsed;
                }
            } catch (e) {
                console.warn('Failed to parse refund media URLs', e);
            }
        }

        return {
            reason: order.refundReasonType === 'store' 
                ? 'Sản phẩm gặp sự cố từ cửa hàng'
                : order.refundReasonType === 'customer'
                ? 'Thay đổi nhu cầu / Mua nhầm'
                : '',
            reasonType: order.refundReasonType || null,
            description: order.refundDescription || '',
            email: order.refundEmail || order.customerEmail || '',
            returnAddress: order.refundReturnAddress || '',
            refundMethod: order.refundMethod || '',
            bank: order.refundBank || '',
            accountNumber: order.refundAccountNumber || '',
            accountHolder: order.refundAccountHolder || '',
            selectedProducts: selectedProducts,
            refundAmount: order.refundAmount || null,
            mediaUrls: mediaUrls,
        };
    }

    // Fallback: parse from note
    const note = order.note || '';
    if (!note || typeof note !== 'string') {
        return {
            reason: '',
            reasonType: null,
            description: '',
            email: order.customerEmail || '',
            returnAddress: '',
            refundMethod: '',
            bank: '',
            accountNumber: '',
            accountHolder: '',
            selectedProducts: order?.items?.map(item => item.id) || [],
            refundAmount: null,
            mediaUrls: [],
        };
    }

    const info = {
        reason: '',
        reasonType: null,
        description: '',
        email: order.customerEmail || '',
        returnAddress: '',
        refundMethod: '',
        bank: '',
        accountNumber: '',
        accountHolder: '',
        selectedProducts: order?.items?.map(item => item.id) || [],
        refundAmount: null,
        mediaUrls: [],
    };

    if (note.includes('Sản phẩm gặp sự cố từ cửa hàng')) {
        info.reason = 'Sản phẩm gặp sự cố từ cửa hàng';
        info.reasonType = 'store';
    } else if (note.includes('Thay đổi nhu cầu / Mua nhầm')) {
        info.reason = 'Thay đổi nhu cầu / Mua nhầm';
        info.reasonType = 'customer';
    }

    const descMatch = note.match(/Mô tả:\s*(.+?)(?:\n|$)/);
    if (descMatch) {
        info.description = descMatch[1].trim();
    }

    const emailMatch = note.match(/Email:\s*(.+?)(?:\n|$)/);
    if (emailMatch) {
        info.email = emailMatch[1].trim();
    }

    const addressMatch = note.match(/Địa chỉ gửi hàng:\s*(.+?)(?:\n|$)/);
    if (addressMatch) {
        info.returnAddress = addressMatch[1].trim();
    }

    const methodMatch = note.match(/Phương thức hoàn tiền:\s*(.+?)(?:\n|$)/);
    if (methodMatch) {
        info.refundMethod = methodMatch[1].trim();
    }

    const bankMatch = note.match(/Ngân hàng:\s*(.+?)(?:\n|$)/);
    if (bankMatch) {
        info.bank = bankMatch[1].trim();
    }

    const accountMatch = note.match(/Số tài khoản:\s*(.+?)(?:\n|$)/);
    if (accountMatch) {
        info.accountNumber = accountMatch[1].trim();
    }

    const holderMatch = note.match(/Chủ tài khoản:\s*(.+?)(?:\n|$)/);
    if (holderMatch) {
        info.accountHolder = holderMatch[1].trim();
    }

    return info;
};

const calculateRefund = (order, refundInfo) => {
    if (refundInfo.refundAmount != null) {
        if (!order || !order.items) return { productValue: 0, shippingFee: 0, returnFee: 0, total: refundInfo.refundAmount };
        
        const selectedItems = order.items.filter(item => refundInfo.selectedProducts.includes(item.id));
        const productValue = selectedItems.reduce((sum, item) => sum + (item.totalPrice || item.finalPrice || 0), 0);
        const shippingFee = order.shippingFee || 0;
        const returnFee = refundInfo.reasonType === 'store' ? 0 : Math.round(productValue * 0.1);
        
        return { 
            productValue, 
            shippingFee, 
            returnFee, 
            total: refundInfo.refundAmount 
        };
    }
    
    if (!order || !order.items) return { productValue: 0, shippingFee: 0, returnFee: 0, total: 0 };
    
    const selectedItems = order.items.filter(item => refundInfo.selectedProducts.includes(item.id));
    const productValue = selectedItems.reduce((sum, item) => sum + (item.totalPrice || item.finalPrice || 0), 0);
    const shippingFee = order.shippingFee || 0;
    const returnFee = refundInfo.reasonType === 'store' 
        ? 0
        : Math.round(productValue * 0.1);
    
    const total = productValue + shippingFee - returnFee;
    
    return { productValue, shippingFee, returnFee, total };
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
};

const getStatusLabel = (status) => {
    const statusMap = {
        RETURN_REQUESTED: 'Yêu cầu hoàn tiền/ trả hàng',
        REFUNDED: 'Đã hoàn tiền/ trả hàng',
        RETURN_REJECTED: 'Từ chối hoàn tiền/ trả hàng',
    };
    return statusMap[status] || status || '';
};

export default function CustomerRefundDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                setError('');
                const token = getStoredToken('token');
                if (!token) {
                    setError('Vui lòng đăng nhập để xem chi tiết đơn hàng');
                    setLoading(false);
                    return;
                }
                
                const apiBaseUrl = getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    let errorMessage = 'Không thể tải thông tin đơn hàng';
                    if (response.status === 403 || response.status === 401) {
                        errorMessage = 'Bạn không có quyền truy cập đơn hàng này';
                    } else if (response.status === 404) {
                        errorMessage = 'Không tìm thấy đơn hàng';
                    } else if (errorData?.message) {
                        errorMessage = errorData.message;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                const orderData = data?.result || data;
                
                if (!orderData || !orderData.id) {
                    throw new Error('Dữ liệu đơn hàng không hợp lệ');
                }
                
                setOrder(orderData);
            } catch (err) {
                console.error('Error fetching order detail:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải thông tin đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetail();
        } else {
            setError('Không có ID đơn hàng');
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return (
            <div className={cx('page')}>
                <div className={cx('loading')}>Đang tải thông tin...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className={cx('page')}>
                <div className={cx('error')}>
                    <p>{error || 'Không tìm thấy thông tin đơn hàng'}</p>
                    <button onClick={() => navigate(-1)}>Quay lại</button>
                </div>
            </div>
        );
    }

    const refundInfo = parseRefundInfo(order);
    const refund = calculateRefund(order, refundInfo);

    // Normalize media URLs
    const apiBaseUrl = getApiBaseUrl();
    const baseUrlForStatic = apiBaseUrl.replace('/api', '');
    const normalizedMediaUrls = (refundInfo.mediaUrls || []).map(url => 
        normalizeMediaUrl(url, baseUrlForStatic)
    );

    return (
        <div className={cx('page')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <button className={cx('back-btn')} onClick={() => navigate(-1)}>
                        ← Quay lại
                    </button>
                    <h1 className={cx('page-title')}>Chi tiết yêu cầu hoàn tiền/ trả hàng</h1>
                </div>

                {/* Order Info Summary */}
                <div className={cx('order-summary')}>
                    <div className={cx('summary-item')}>
                        <span className={cx('summary-label')}>Mã đơn hàng:</span>
                        <span className={cx('summary-value')}>#{order.code || order.id}</span>
                    </div>
                    <div className={cx('summary-item')}>
                        <span className={cx('summary-label')}>Ngày đặt:</span>
                        <span className={cx('summary-value')}>{formatDate(order.orderDateTime || order.orderDate)}</span>
                    </div>
                    <div className={cx('summary-item')}>
                        <span className={cx('summary-label')}>Trạng thái:</span>
                        <span className={cx('status-badge', order.status?.toLowerCase())}>
                            {getStatusLabel(order.status)}
                        </span>
                    </div>
                </div>

                {/* Refund Request Form (Read-only) */}
                <div className={cx('form')}>
                    <h2 className={cx('section-title')}>Yêu cầu trả hàng / hoàn tiền</h2>

                    {/* Reason Selection (Display) */}
                    <div className={cx('form-section')}>
                        <label className={cx('section-label')}>Lý do trả hàng / hoàn tiền</label>
                        <div className={cx('reason-cards')}>
                            <div className={cx('reason-card', { selected: refundInfo.reasonType === 'store' })}>
                                <h3 className={cx('reason-title')}>Sản phẩm gặp sự cố từ cửa hàng</h3>
                                <p className={cx('reason-desc')}>
                                    Sản phẩm có lỗi kỹ thuật, thiếu trang, bị hỏng do đóng gói, hoặc thông tin hiển thị không đúng.
                                </p>
                                <button className={cx('reason-badge', 'free')}>Miễn phí trả hàng</button>
                            </div>

                            <div className={cx('reason-card', { selected: refundInfo.reasonType === 'customer' })}>
                                <h3 className={cx('reason-title')}>Thay đổi nhu cầu / Mua nhầm</h3>
                                <p className={cx('reason-desc')}>
                                    Khách hàng muốn đổi phiên bản, đặt nhầm, hoặc thay đổi nhu cầu sử dụng sản phẩm.
                                </p>
                                <button className={cx('reason-badge', 'paid')}>Khách hỗ trợ phí trả hàng</button>
                            </div>
                        </div>
                    </div>

                    {/* Products in Order */}
                    {order.items && order.items.length > 0 && (
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Sản phẩm trong đơn</label>
                            <div className={cx('products-list')}>
                                {order.items.map((item) => {
                                    const isSelected = refundInfo.selectedProducts.includes(item.id);
                                    return (
                                        <div key={item.id} className={cx('product-item', { selected: isSelected })}>
                                            <div className={cx('product-checkbox', { checked: isSelected })}>
                                                {isSelected ? '✓' : ''}
                                            </div>
                                            <img 
                                                src={item.imageUrl || 'https://via.placeholder.com/80x100'} 
                                                alt={item.name} 
                                                className={cx('product-image')} 
                                            />
                                            <div className={cx('product-info')}>
                                                <h4 className={cx('product-name')}>{item.name || 'N/A'}</h4>
                                                <p className={cx('product-details')}>
                                                    Số lượng: {item.quantity || 0} | Mã SP: {item.productCode || item.productId || 'N/A'}
                                                </p>
                                                <p className={cx('product-price')}>
                                                    {formatCurrency(item.unitPrice || 0)} × {item.quantity || 0} = {formatCurrency(item.totalPrice || item.finalPrice || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className={cx('form-section')}>
                        <label className={cx('section-label')}>Mô tả chi tiết</label>
                        <div className={cx('textarea', 'readonly')}>
                            {refundInfo.description || 'N/A'}
                        </div>
                    </div>

                    {/* Attached Media */}
                    {normalizedMediaUrls.length > 0 && (
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Ảnh / Video đính kèm</label>
                            <p className={cx('media-hint')}>
                                Bạn đã đính kèm {normalizedMediaUrls.length} {normalizedMediaUrls.length === 1 ? 'tệp' : 'tệp'} làm bằng chứng
                            </p>
                            <div className={cx('media-previews')}>
                                {normalizedMediaUrls.map((url, index) => {
                                    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(url);
                                    return (
                                        <div key={index} className={cx('media-preview-item')}>
                                            {isVideo ? (
                                                <video 
                                                    src={url} 
                                                    controls
                                                    className={cx('preview-media')}
                                                    preload="metadata"
                                                    onError={(e) => {
                                                        console.error('Error loading video:', url, e);
                                                        e.target.style.display = 'none';
                                                        const errorDiv = document.createElement('div');
                                                        errorDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: #999;';
                                                        errorDiv.textContent = 'Không thể tải video';
                                                        e.target.parentElement.appendChild(errorDiv);
                                                    }}
                                                >
                                                    Trình duyệt của bạn không hỗ trợ video.
                                                </video>
                                            ) : (
                                                <img 
                                                    src={url} 
                                                    alt={`Bằng chứng ${index + 1}`}
                                                    className={cx('preview-media')}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error('Error loading image:', url, e);
                                                        e.target.style.display = 'none';
                                                        const errorDiv = document.createElement('div');
                                                        errorDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: #999;';
                                                        errorDiv.textContent = 'Không thể tải ảnh';
                                                        e.target.parentElement.appendChild(errorDiv);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Contact Email */}
                    <div className={cx('form-section')}>
                        <label className={cx('section-label')}>Email liên hệ</label>
                        <div className={cx('input', 'readonly')}>
                            {refundInfo.email || order.customerEmail || 'N/A'}
                        </div>
                    </div>

                    {/* Return Address */}
                    <div className={cx('form-section')}>
                        <label className={cx('section-label')}>Địa chỉ gửi hàng</label>
                        <div className={cx('input', 'readonly')}>
                            {refundInfo.returnAddress || 'N/A'}
                        </div>
                    </div>

                    {/* Refund Method */}
                    <div className={cx('form-section')}>
                        <label className={cx('section-label')}>Hình thức hoàn tiền</label>
                        <div className={cx('select', 'readonly')}>
                            {refundInfo.refundMethod || 'N/A'}
                        </div>

                        {refundInfo.bank && (
                            <div className={cx('bank-details')}>
                                <div className={cx('select', 'readonly')}>
                                    {refundInfo.bank}
                                </div>
                                <div className={cx('input', 'readonly')}>
                                    {refundInfo.accountNumber}
                                </div>
                                <div className={cx('input', 'readonly')}>
                                    {refundInfo.accountHolder}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className={cx('form-section', 'summary-section')}>
                        <label className={cx('section-label')}>Tóm tắt hoàn tiền</label>
                        <div className={cx('summary-list')}>
                            <div className={cx('summary-row')}>
                                <span>Giá trị sản phẩm</span>
                                <span>{formatCurrency(refund.productValue)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span>Phí vận chuyển (lần đầu)</span>
                                <span>{formatCurrency(refund.shippingFee)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span>Phí trả hàng</span>
                                <span>{formatCurrency(refund.returnFee)}</span>
                            </div>
                            <div className={cx('summary-row', 'total')}>
                                <span>Tổng hoàn</span>
                                <span>{formatCurrency(refund.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

