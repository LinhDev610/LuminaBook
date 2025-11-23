import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './RefundDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatCurrency } from '../../../../../services';
import { normalizeMediaUrl } from '../../../../../services/productUtils';

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
                // If parsing fails, default to all products
                selectedProducts = order.items?.map(item => item.id) || [];
            }
        } else {
            // Default to all products if not specified
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

    // Fallback: parse from note (old way, for backward compatibility)
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

    // Parse reason
    if (note.includes('Sản phẩm gặp sự cố từ cửa hàng')) {
        info.reason = 'Sản phẩm gặp sự cố từ cửa hàng';
        info.reasonType = 'store';
    } else if (note.includes('Thay đổi nhu cầu / Mua nhầm')) {
        info.reason = 'Thay đổi nhu cầu / Mua nhầm';
        info.reasonType = 'customer';
    }

    // Parse description
    const descMatch = note.match(/Mô tả:\s*(.+?)(?:\n|$)/);
    if (descMatch) {
        info.description = descMatch[1].trim();
    }

    // Parse email
    const emailMatch = note.match(/Email:\s*(.+?)(?:\n|$)/);
    if (emailMatch) {
        info.email = emailMatch[1].trim();
    }

    // Parse return address
    const addressMatch = note.match(/Địa chỉ gửi hàng:\s*(.+?)(?:\n|$)/);
    if (addressMatch) {
        info.returnAddress = addressMatch[1].trim();
    }

    // Parse refund method
    const methodMatch = note.match(/Phương thức hoàn tiền:\s*(.+?)(?:\n|$)/);
    if (methodMatch) {
        info.refundMethod = methodMatch[1].trim();
    }

    // Parse bank info
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

export default function RefundDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectionNote, setRejectionNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

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
                console.log('🔍 Fetching order detail for id:', id);

                const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log('🔍 Order detail response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('🔍 Order detail error:', errorData);
                    
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
                console.log('🔍 Order detail data:', data);
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

    const handleCancel = () => {
        navigate(-1);
    };

    const handleImageClick = (index) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleCloseLightbox = () => {
        setLightboxOpen(false);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        if (normalizedMediaUrls.length > 0) {
            setLightboxIndex((prev) => (prev - 1 + normalizedMediaUrls.length) % normalizedMediaUrls.length);
        }
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        if (normalizedMediaUrls.length > 0) {
            setLightboxIndex((prev) => (prev + 1) % normalizedMediaUrls.length);
        }
    };

    const handleReject = async () => {
        if (!rejectionNote.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu hoàn tiền này?')) {
            return;
        }

        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const apiBaseUrl = getApiBaseUrl();

            // TODO: Implement API endpoint for rejecting refund
            // For now, we'll update the order status via a generic update endpoint
            const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}/reject-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reason: rejectionNote,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Không thể từ chối yêu cầu hoàn tiền');
            }

            alert('Đã từ chối yêu cầu hoàn tiền thành công');
            navigate('/customer-support/refund-management');
        } catch (err) {
            console.error('Error rejecting refund:', err);
            alert(err.message || 'Có lỗi xảy ra khi từ chối yêu cầu. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xác nhận yêu cầu hoàn tiền này?')) {
            return;
        }

        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const apiBaseUrl = getApiBaseUrl();

            // TODO: Implement API endpoint for confirming refund
            const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}/confirm-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.message || 'Không thể xác nhận yêu cầu hoàn tiền');
            }

            alert('Đã xác nhận yêu cầu hoàn tiền thành công');
            navigate('/customer-support/refund-management');
        } catch (err) {
            console.error('Error confirming refund:', err);
            alert(err.message || 'Có lỗi xảy ra khi xác nhận yêu cầu. Vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

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
    const shippingInfo = parseShippingInfo(order.shippingAddress);
    
    // Get selected products for refund
    const selectedItems = order.items?.filter(item => refundInfo.selectedProducts.includes(item.id)) || [];
    const totalRefundAmount = refundInfo.refundAmount || 
        selectedItems.reduce((sum, item) => sum + (item.totalPrice || item.finalPrice || 0), 0);

    // Normalize media URLs
    const apiBaseUrl = getApiBaseUrl();
    const baseUrlForStatic = apiBaseUrl.replace('/api', '');
    const normalizedMediaUrls = (refundInfo.mediaUrls || []).map(url => 
        normalizeMediaUrl(url, baseUrlForStatic)
    );

    return (
        <div className={cx('page')}>
            <div className={cx('container')}>
                {/* Header */}
                <div className={cx('header')}>
                    <h1 className={cx('page-title')}>Chi tiết yêu cầu trả hàng/ hoàn tiền</h1>
                    <button className={cx('dashboard-btn')} onClick={() => navigate('/customer-support/refund-management')}>
                        ← Dashboard
                    </button>
                </div>

                {/* Order Code */}
                <div className={cx('order-code')}>
                    Đơn hàng #{order.code || order.id}
                </div>

                {/* Customer Information */}
                <div className={cx('section')}>
                    <h2 className={cx('section-title')}>Thông tin khách hàng</h2>
                    <div className={cx('info-grid')}>
                        <div className={cx('info-item')}>
                            <label className={cx('info-label')}>Họ tên</label>
                            <input 
                                type="text" 
                                className={cx('info-input')} 
                                value={shippingInfo?.name || order.receiverName || order.customerName || ''} 
                                readOnly 
                            />
                        </div>
                        <div className={cx('info-item')}>
                            <label className={cx('info-label')}>SĐT</label>
                            <input 
                                type="text" 
                                className={cx('info-input')} 
                                value={shippingInfo?.phone || order.receiverPhone || ''} 
                                readOnly 
                            />
                        </div>
                        <div className={cx('info-item', 'full-width')}>
                            <label className={cx('info-label')}>Địa chỉ</label>
                            <input 
                                type="text" 
                                className={cx('info-input')} 
                                value={shippingInfo?.address || order.shippingAddress || ''} 
                                readOnly 
                            />
                        </div>
                    </div>
                </div>

                {/* Refund Reason */}
                <div className={cx('section')}>
                    <h2 className={cx('section-title')}>Lý do trả hàng / hoàn tiền</h2>
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

                {/* Customer Submitted Request */}
                <div className={cx('section')}>
                    <h2 className={cx('section-title')}>Thông tin & ảnh khách gửi</h2>
                    
                    {/* Product Details */}
                    {selectedItems.length > 0 && (
                        <div className={cx('product-details')}>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Sản phẩm:</span>
                                <span className={cx('detail-value')}>
                                    {selectedItems.map(item => item.name || 'N/A').join(', ')}
                                </span>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Số lượng:</span>
                                <span className={cx('detail-value')}>
                                    {selectedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </span>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Yêu cầu hoàn tiền:</span>
                                <span className={cx('detail-value', 'amount')}>
                                    {formatCurrency(totalRefundAmount)}
                                </span>
                            </div>
                            <div className={cx('detail-row')}>
                                <span className={cx('detail-label')}>Lý do:</span>
                                <span className={cx('detail-value')}>
                                    {refundInfo.description || refundInfo.reason || 'N/A'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Attached Media */}
                    <div className={cx('media-section')}>
                        <label className={cx('media-label')}>Ảnh khách gửi</label>
                        <div className={cx('media-boxes')}>
                            {normalizedMediaUrls.length > 0 ? (
                                normalizedMediaUrls.map((url, index) => {
                                    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(url);
                                    return (
                                        <div key={index} className={cx('media-box')}>
                                            {isVideo ? (
                                                <video 
                                                    src={url} 
                                                    controls
                                                    className={cx('media-content')}
                                                    preload="metadata"
                                                    onClick={() => handleImageClick(index)}
                                                    style={{ cursor: 'pointer' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const errorDiv = document.createElement('div');
                                                        errorDiv.className = cx('media-placeholder');
                                                        errorDiv.textContent = `Ảnh ${index + 1}`;
                                                        e.target.parentElement.appendChild(errorDiv);
                                                    }}
                                                />
                                            ) : (
                                                <img 
                                                    src={url} 
                                                    alt={`Ảnh ${index + 1}`}
                                                    className={cx('media-content')}
                                                    loading="lazy"
                                                    onClick={() => handleImageClick(index)}
                                                    style={{ cursor: 'pointer' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const errorDiv = document.createElement('div');
                                                        errorDiv.className = cx('media-placeholder');
                                                        errorDiv.textContent = `Ảnh ${index + 1}`;
                                                        e.target.parentElement.appendChild(errorDiv);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                // Show placeholder boxes if no media
                                [1, 2, 3].map((num) => (
                                    <div key={num} className={cx('media-box', 'placeholder')}>
                                        <span className={cx('media-placeholder')}>Ảnh {num}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Rejection Note */}
                <div className={cx('section')}>
                    <h2 className={cx('section-title')}>Ghi chú / lý do nếu không hợp lệ</h2>
                    <textarea
                        className={cx('rejection-textarea')}
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Nhập ghi chú hoặc lý do từ chối yêu cầu hoàn tiền (nếu có)..."
                        rows={6}
                    />
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    <button 
                        className={cx('btn', 'btn-cancel')} 
                        onClick={handleCancel}
                        disabled={processing}
                    >
                        Hủy
                    </button>
                    <button 
                        className={cx('btn', 'btn-reject')} 
                        onClick={handleReject}
                        disabled={processing}
                    >
                        {processing ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                    <button 
                        className={cx('btn', 'btn-confirm')} 
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Đang xử lý...' : 'Xác nhận đơn'}
                    </button>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && normalizedMediaUrls.length > 0 && (
                <div className={cx('lightbox')} onClick={handleCloseLightbox}>
                    <button className={cx('lightbox-close')} onClick={handleCloseLightbox}>
                        ×
                    </button>
                    {normalizedMediaUrls.length > 1 && (
                        <>
                            <button className={cx('lightbox-nav', 'lightbox-prev')} onClick={handlePrevImage}>
                                ‹
                            </button>
                            <button className={cx('lightbox-nav', 'lightbox-next')} onClick={handleNextImage}>
                                ›
                            </button>
                        </>
                    )}
                    <div className={cx('lightbox-content')} onClick={(e) => e.stopPropagation()}>
                        {(() => {
                            const currentUrl = normalizedMediaUrls[lightboxIndex];
                            const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(currentUrl);
                            return isVideo ? (
                                <video 
                                    src={currentUrl} 
                                    controls
                                    autoPlay
                                    className={cx('lightbox-media')}
                                >
                                    Trình duyệt của bạn không hỗ trợ video.
                                </video>
                            ) : (
                                <img 
                                    src={currentUrl} 
                                    alt={`Ảnh ${lightboxIndex + 1}`}
                                    className={cx('lightbox-media')}
                                />
                            );
                        })()}
                        {normalizedMediaUrls.length > 1 && (
                            <div className={cx('lightbox-counter')}>
                                {lightboxIndex + 1} / {normalizedMediaUrls.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
