import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './RefundRequestPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatCurrency } from '../../../../services';
import { getMyInfo, getMyAddresses, uploadProductMedia } from '../../../../services';
import { normalizeMediaUrl } from '../../../../services/productUtils';
import { useNotification } from '../../../../components/Common/Notification';
import AddressListModal from '../../../../components/Common/AddressModal/AddressListModal';
import NewAddressModal from '../../../../components/Common/AddressModal/NewAddressModal';
import AddressDetailModal from '../../../../components/Common/AddressModal/AddressDetailModal';
import { formatFullAddress, normalizeAddressPayload } from '../../../../components/Common/AddressModal/useGhnLocations';

const cx = classNames.bind(styles);

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

const BANKS = [
    'Vietcombank',
    'BIDV',
    'Vietinbank',
    'Agribank',
    'ACB',
    'Techcombank',
    'MBBank',
    'VPBank',
    'TPBank',
    'Sacombank',
];

export default function RefundRequestPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const orderCode = location.state?.orderCode || '';
    const { success: showSuccess, error: showError } = useNotification();
    
    const [step, setStep] = useState(1); // 1: Select reason, 2: Fill form
    const [selectedReasonType, setSelectedReasonType] = useState(null); // 'store' or 'customer'
    const [order, setOrder] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    
    const [formData, setFormData] = useState({
        customerName: '',
        description: '',
        email: '',
        phone: '',
        returnAddress: '',
        refundMethod: 'Hoàn tiền bằng tài khoản ngân hàng',
        bank: '',
        accountNumber: '',
        accountHolder: '',
    });
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [rejectionReason, setRejectionReason] = useState(''); // Lý do từ chối từ staff
    const [selectedImagePreview, setSelectedImagePreview] = useState(null); // Ảnh đang được xem chi tiết

    // Address modal states
    const [showAddressList, setShowAddressList] = useState(false);
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [showAddressDetailModal, setShowAddressDetailModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressRefreshKey, setAddressRefreshKey] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const token = getStoredToken();
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                const apiBaseUrl = getApiBaseUrl();
                
                // Fetch user info
                const userInfo = await getMyInfo(token);
                if (userInfo) {
                    setFormData(prev => ({
                        ...prev,
                        customerName: userInfo.fullName || userInfo.full_name || prev.customerName || '',
                        email: userInfo.email || prev.email || '',
                        phone: userInfo.phoneNumber || userInfo.phone_number || prev.phone || '',
                    }));
                }

                // Fetch default address
                try {
                    const addresses = await getMyAddresses(token);
                    if (Array.isArray(addresses) && addresses.length > 0) {
                        const defaultAddress = addresses.find((addr) => addr?.defaultAddress === true);
                        if (defaultAddress) {
                            const formattedAddress = formatFullAddress(defaultAddress);
                            setFormData(prev => ({
                                ...prev,
                                returnAddress: formattedAddress,
                            }));
                            setSelectedAddress(defaultAddress);
                        }
                    }
                } catch (_addrErr) {
                    // Ignore address fetch errors
                }

                // Fetch order details
                const orderId = id || orderCode;
                if (orderId) {
                    const orderResp = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(orderId)}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (orderResp.ok) {
                        const orderData = await orderResp.json();
                        const rawOrder = orderData?.result || orderData;
                        
                        if (rawOrder) {
                            const items = Array.isArray(rawOrder.items)
                                ? rawOrder.items.map((item, index) => ({
                                      id: item.id || String(index),
                                      productId: item.productId || item.product?.id,
                                      name: item.name || item.product?.name || 'Sản phẩm',
                                      quantity: item.quantity || 1,
                                      unitPrice: item.unitPrice || item.unit_price || 0,
                                      totalPrice: (item.totalPrice || item.finalPrice || item.unitPrice || 0) * (item.quantity || 1),
                                      image: item.imageUrl || item.product?.defaultMedia?.mediaUrl || 'https://via.placeholder.com/80x100',
                                      productCode: item.productCode || item.product?.code || `SP${String(index + 1).padStart(3, '0')}`,
                                  }))
                                : [];

                            setOrder({
                                id: rawOrder.id || '',
                                code: rawOrder.code || rawOrder.orderCode || orderId,
                                items,
                                totalAmount: rawOrder.totalAmount || 0,
                                shippingFee: rawOrder.shippingFee || 0,
                            });

                            // Nếu đơn đã bị từ chối (RETURN_REJECTED), load dữ liệu cũ
                            if (rawOrder.status === 'RETURN_REJECTED') {
                                // Parse lý do từ chối từ nhiều nguồn
                                let parsedRejectionReason = rawOrder.refundRejectionReason || 
                                                           rawOrder.refund_rejection_reason || 
                                                           '';
                                
                                // Nếu không có refundRejectionReason, parse từ note field
                                // Format: "Yêu cầu hoàn tiền đã bị từ chối. Lý do: ..."
                                if (!parsedRejectionReason && rawOrder.note) {
                                    const noteText = String(rawOrder.note);
                                    const rejectionMatch = noteText.match(/Lý do:\s*(.+?)(?:\n|$)/i);
                                    if (rejectionMatch && rejectionMatch[1]) {
                                        parsedRejectionReason = rejectionMatch[1].trim();
                                    } else if (noteText.includes('Yêu cầu hoàn tiền đã bị từ chối')) {
                                        // Nếu không có "Lý do:", lấy phần sau "đã bị từ chối"
                                        const parts = noteText.split('đã bị từ chối');
                                        if (parts.length > 1) {
                                            const reasonPart = parts[1].replace(/^[.:\s]+/, '').trim();
                                            if (reasonPart) {
                                                parsedRejectionReason = reasonPart;
                                            }
                                        }
                                    }
                                }
                                
                                // Set rejection reason nếu có
                                if (parsedRejectionReason) {
                                    setRejectionReason(parsedRejectionReason);
                                }

                                // Load dữ liệu refund cũ
                                if (rawOrder.refundReasonType) {
                                    setSelectedReasonType(rawOrder.refundReasonType);
                                    setStep(2); // Chuyển thẳng sang step 2
                                }
                                
                                // Load selected products
                                if (rawOrder.refundSelectedProductIds) {
                                    try {
                                        const productIds = JSON.parse(rawOrder.refundSelectedProductIds);
                                        if (Array.isArray(productIds) && productIds.length > 0) {
                                            setSelectedProducts(productIds);
                                        } else {
                                            setSelectedProducts(items.map(item => item.id));
                                        }
                                    } catch {
                                        setSelectedProducts(items.map(item => item.id));
                                    }
                                } else {
                                    setSelectedProducts(items.map(item => item.id));
                                }

                                // Load form data
                                setFormData(prev => ({
                                    ...prev,
                                    description: rawOrder.refundDescription || prev.description,
                                    email: rawOrder.refundEmail || rawOrder.customerEmail || prev.email,
                                    returnAddress: rawOrder.refundReturnAddress || prev.returnAddress,
                                    refundMethod: rawOrder.refundMethod || prev.refundMethod,
                                    bank: rawOrder.refundBank || prev.bank,
                                    accountNumber: rawOrder.refundAccountNumber || prev.accountNumber,
                                    accountHolder: rawOrder.refundAccountHolder || prev.accountHolder,
                                }));

                                // Load media URLs nếu có
                                if (rawOrder.refundMediaUrls) {
                                    try {
                                        const mediaUrls = JSON.parse(rawOrder.refundMediaUrls);
                                        if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
                                            // Normalize URLs để hiển thị đúng
                                            const apiBaseUrl = getApiBaseUrl();
                                            const baseUrlForStatic = apiBaseUrl.replace('/api', '');
                                            
                                            // Set previews từ URLs (không upload lại)
                                            setImagePreviews(mediaUrls.map((url, idx) => {
                                                const normalizedUrl = normalizeMediaUrl(url, baseUrlForStatic);
                                                const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(normalizedUrl);
                                                return {
                                                    id: `existing-${idx}`,
                                                    url: normalizedUrl,
                                                    name: isVideo ? `Video ${idx + 1}` : `Ảnh ${idx + 1}`,
                                                    isVideo: isVideo,
                                                    isExisting: true, // Đánh dấu là ảnh cũ
                                                };
                                            }));
                                        }
                                    } catch (e) {
                                        console.warn('Failed to parse refund media URLs', e);
                                    }
                                }
                            } else {
                                // Auto-select all products cho đơn mới
                                setSelectedProducts(items.map(item => item.id));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, orderCode, navigate]);

    const handleReasonSelect = (type) => {
        setSelectedReasonType(type);
    };

    const handleContinue = () => {
        if (!selectedReasonType) {
            setError('Vui lòng chọn lý do trả hàng');
            return;
        }
        setStep(2);
        setError('');
    };

    const handleProductToggle = (productId) => {
        setSelectedProducts(prev => 
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        const remainingSlots = 5 - attachedFiles.length;
        
        if (remainingSlots <= 0) {
            e.target.value = ''; // Reset input
            return;
        }

        const filesToAdd = newFiles.slice(0, remainingSlots);
        const updatedFiles = [...attachedFiles, ...filesToAdd];
        setAttachedFiles(updatedFiles);

        // Create previews for new images and videos
        filesToAdd.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, {
                        id: Date.now() + Math.random() + index,
                        url: reader.result,
                        file: file,
                        name: file.name
                    }]);
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                // For video files, create a preview URL from the file
                const videoUrl = URL.createObjectURL(file);
                setImagePreviews(prev => [...prev, {
                    id: Date.now() + Math.random() + index,
                    url: videoUrl,
                    file: file,
                    name: file.name,
                    isVideo: true
                }]);
            } else {
                // For other files, create a placeholder preview
                setImagePreviews(prev => [...prev, {
                    id: Date.now() + Math.random() + index,
                    url: null,
                    file: file,
                    name: file.name,
                    isVideo: true
                }]);
            }
        });

        // Reset input to allow selecting the same file again
        e.target.value = '';
    };

    const handleRemoveImage = (imageId) => {
        setImagePreviews(prev => {
            const imageToRemove = prev.find(img => img.id === imageId);
            if (imageToRemove) {
                // Revoke object URL if it's a video preview
                if (imageToRemove.url && imageToRemove.url.startsWith('blob:')) {
                    URL.revokeObjectURL(imageToRemove.url);
                }
                setAttachedFiles(prevFiles => 
                    prevFiles.filter(file => file !== imageToRemove.file)
                );
            }
            return prev.filter(img => img.id !== imageId);
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const calculateRefund = () => {
        if (!order) return { productValue: 0, shippingFee: 0, returnFee: 0, total: 0 };
        
        const selectedItems = order.items.filter(item => selectedProducts.includes(item.id));
        const productValue = selectedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const shippingFee = order.shippingFee || 0;
        
        // Nếu đổi trả hàng sẽ trừ 10% giá trị sản phẩm
        const returnFee = selectedReasonType === 'store' 
            ? 0  // Miễn phí nếu lỗi từ cửa hàng
            : Math.round(productValue * 0.1); // Trừ 10% giá trị sản phẩm nếu lý do khách hàng
        
        const total = productValue + shippingFee - returnFee;
        
        return { productValue, shippingFee, returnFee, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (selectedProducts.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        if (!formData.description) {
            setError('Vui lòng mô tả chi tiết vấn đề');
            return;
        }

        if (!formData.returnAddress || !formData.returnAddress.trim()) {
            setError('Vui lòng nhập địa chỉ gửi hàng');
            return;
        }

        if (formData.refundMethod === 'Hoàn tiền bằng tài khoản ngân hàng') {
            if (!formData.bank || !formData.accountNumber || !formData.accountHolder) {
                setError('Vui lòng điền đầy đủ thông tin ngân hàng');
                return;
            }
        }

        try {
            setSubmitting(true);
            const token = getStoredToken();
            const apiBaseUrl = getApiBaseUrl();

            // Step 1: Upload media files if any
            let mediaUrls = [];
            
            // Lấy existing media URLs từ imagePreviews (nếu có URL từ lần trước)
            const existingMediaUrls = imagePreviews
                .filter(preview => preview.url && !preview.file) // Chỉ lấy URLs, không phải files mới
                .map(preview => preview.url);
            
            // Upload files mới nếu có
            if (attachedFiles.length > 0) {
                try {
                    const { ok, urls, message } = await uploadProductMedia(attachedFiles, token);
                    if (!ok || !urls || urls.length === 0) {
                        throw new Error(message || 'Upload ảnh/video thất bại');
                    }
                    mediaUrls = [...existingMediaUrls, ...urls]; // Merge existing và new URLs
                } catch (uploadError) {
                    console.error('Error uploading media:', uploadError);
                    throw new Error('Không thể upload ảnh/video. Vui lòng thử lại.');
                }
            } else {
                // Nếu không có files mới, chỉ dùng existing URLs
                mediaUrls = existingMediaUrls;
            }

            // Step 2: Prepare refund request payload with structured data
            const orderId = order?.id || id || orderCode;
            const requestPayload = {
                reasonType: selectedReasonType, // 'store' or 'customer'
                description: formData.description,
                email: formData.email,
                returnAddress: formData.returnAddress,
                refundMethod: formData.refundMethod,
                selectedProductIds: selectedProducts, // Array of product/item IDs
                mediaUrls: mediaUrls, // Array of uploaded media URLs
            };

            // Add bank details if refund method is bank transfer
            if (formData.refundMethod === 'Hoàn tiền bằng tài khoản ngân hàng') {
                requestPayload.bank = formData.bank;
                requestPayload.accountNumber = formData.accountNumber;
                requestPayload.accountHolder = formData.accountHolder;
            }

            // Also include note for backward compatibility
            const reasonText = selectedReasonType === 'store' 
                ? 'Sản phẩm gặp sự cố từ cửa hàng'
                : 'Thay đổi nhu cầu / Mua nhầm';
            const contentParts = [
                `Yêu cầu hoàn tiền/trả hàng - ${reasonText}`,
                `\nMô tả: ${formData.description}`,
                `\nĐịa chỉ gửi hàng: ${formData.returnAddress}`,
                `\nPhương thức hoàn tiền: ${formData.refundMethod}`,
            ];
            if (formData.bank) {
                contentParts.push(
                    `\nNgân hàng: ${formData.bank}`,
                    `\nSố tài khoản: ${formData.accountNumber}`,
                    `\nChủ tài khoản: ${formData.accountHolder}`
                );
            }
            requestPayload.note = contentParts.join('').trim();

            const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(orderId)}/request-return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
            }

            // Hiển thị thông báo thành công
            showSuccess('Gửi yêu cầu hoàn tiền/ trả hàng thành công! Chúng tôi sẽ xử lý yêu cầu của bạn sớm nhất có thể.');

            // Navigate sau một chút để người dùng thấy thông báo
            setTimeout(() => {
                navigate('/customer-account/orders');
            }, 1500);
        } catch (err) {
            console.error('Error submitting refund request:', err);
            setError(err.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setError('');
        } else {
            navigate(-1);
        }
    };

    if (loading) {
        return (
            <div className={cx('page')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    const refund = calculateRefund();

    return (
        <div className={cx('page')}>
            <div className={cx('container')}>
                {/* Return Conditions */}
                <div className={cx('conditions-box')}>
                    <h3 className={cx('conditions-title')}>Điều kiện áp dụng trả hàng</h3>
                    <ul className={cx('conditions-list')}>
                        <li>Yêu cầu gửi trong vòng 7 ngày kể từ khi nhận sách.</li>
                        <li>Sách còn nguyên trạng (không rách, không viết/đánh dấu).</li>
                        <li>Cung cấp ảnh/video làm bằng chứng.</li>
                    </ul>
                </div>

                {step === 1 ? (
                    <>
                        {/* Reason Selection */}
                        <div className={cx('reason-section')}>
                            <h2 className={cx('section-title')}>Lý do trả hàng / hoàn tiền</h2>
                            <div className={cx('reason-cards')}>
                                <div 
                                    className={cx('reason-card', { selected: selectedReasonType === 'store' })}
                                    onClick={() => handleReasonSelect('store')}
                                >
                                    <h3 className={cx('reason-title')}>Sản phẩm gặp sự cố từ cửa hàng</h3>
                                    <p className={cx('reason-desc')}>
                                        Sản phẩm có lỗi kỹ thuật, thiếu trang, bị hỏng do đóng gói, hoặc thông tin hiển thị không đúng.
                                    </p>
                                    <button className={cx('reason-badge', 'free')}>Miễn phí trả hàng</button>
                                </div>

                                <div 
                                    className={cx('reason-card', { selected: selectedReasonType === 'customer' })}
                                    onClick={() => handleReasonSelect('customer')}
                                >
                                    <h3 className={cx('reason-title')}>Thay đổi nhu cầu / Mua nhầm</h3>
                                    <p className={cx('reason-desc')}>
                                        Khách hàng muốn đổi phiên bản, đặt nhầm, hoặc thay đổi nhu cầu sử dụng sản phẩm.
                                    </p>
                                    <button className={cx('reason-badge', 'paid')}>Khách hỗ trợ phí trả hàng</button>
                                </div>
                            </div>

                            {error && <div className={cx('error-message')}>{error}</div>}

                            <div className={cx('continue-wrapper')}>
                                <button className={cx('continue-btn')} onClick={handleContinue}>
                                    Tiếp tục
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <form className={cx('form')} onSubmit={handleSubmit}>
                        <h2 className={cx('section-title')}>Yêu cầu trả hàng / hoàn tiền</h2>

                        {/* Rejection Reason Alert (only show if order was rejected) - Hiển thị ở trên cùng */}
                        {rejectionReason && (
                            <div className={cx('rejection-alert', 'top-alert')}>
                                <div className={cx('alert-header')}>
                                    <span className={cx('alert-icon')}>⚠️</span>
                                    <h3 className={cx('alert-title')}>Lý do từ chối từ CSKH</h3>
                                </div>
                                <p className={cx('alert-message')}>{rejectionReason}</p>
                                <p className={cx('alert-hint')}>
                                    Vui lòng xem lại và chỉnh sửa thông tin trước khi gửi lại yêu cầu.
                                </p>
                            </div>
                        )}

                        {/* Products in Order */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Sản phẩm trong đơn</label>
                            <div className={cx('products-list')}>
                                {order?.items?.map((item) => (
                                    <div key={item.id} className={cx('product-item')}>
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(item.id)}
                                            onChange={() => handleProductToggle(item.id)}
                                            className={cx('product-checkbox')}
                                        />
                                        <img src={item.image} alt={item.name} className={cx('product-image')} />
                                        <div className={cx('product-info')}>
                                            <h4 className={cx('product-name')}>{item.name}</h4>
                                            <p className={cx('product-details')}>
                                                Số lượng: {item.quantity} | Mã SP: {item.productCode}
                                            </p>
                                            <p className={cx('product-price')}>{formatCurrency(item.unitPrice || item.totalPrice)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Attached Files */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Ảnh / Video đính kèm</label>
                            <div className={cx('file-upload')}>
                                <label className={cx('file-label')}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className={cx('file-input')}
                                        disabled={attachedFiles.length >= 5}
                                    />
                                    <span className={cx('file-button')}>Chọn tệp</span>
                                    <span className={cx('file-text')}>
                                        {attachedFiles.length > 0 
                                            ? `${attachedFiles.length}/5 tệp đã chọn`
                                            : 'Chưa có tệp nào được chọn'}
                                    </span>
                                </label>
                                <p className={cx('file-hint')}>
                                    Chọn tối đa 5 tệp. Vui lòng đảm bảo hình ảnh/video rõ ràng.
                                </p>
                            </div>

                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className={cx('image-previews')}>
                                    {imagePreviews.map((preview) => {
                                        const isVideo = preview.isVideo || /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(preview.url || '');
                                        return (
                                            <div key={preview.id} className={cx('image-preview-item')}>
                                                {preview.url ? (
                                                    <>
                                                        {isVideo ? (
                                                            <div className={cx('video-wrapper')}>
                                                                <video 
                                                                    src={preview.url} 
                                                                    className={cx('preview-image', 'preview-video')}
                                                                    preload="metadata"
                                                                    muted
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedImagePreview(preview);
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.target.play().catch(() => {});
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.target.pause();
                                                                        e.target.currentTime = 0;
                                                                    }}
                                                                >
                                                                    Trình duyệt của bạn không hỗ trợ video.
                                                                </video>
                                                                <div className={cx('video-overlay')} onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedImagePreview(preview);
                                                                }}>
                                                                    <span className={cx('play-icon')}>▶</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <img 
                                                                src={preview.url} 
                                                                alt={preview.name}
                                                                className={cx('preview-image')}
                                                                onClick={() => setSelectedImagePreview(preview)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        )}
                                                        {preview.isExisting && (
                                                            <span className={cx('existing-badge')}>Đã gửi</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div 
                                                        className={cx('preview-placeholder')}
                                                        onClick={() => {
                                                            // Nếu có file, tạo blob URL tạm thời để xem
                                                            if (preview.file) {
                                                                const tempUrl = URL.createObjectURL(preview.file);
                                                                setSelectedImagePreview({
                                                                    ...preview,
                                                                    url: tempUrl
                                                                });
                                                            } else if (preview.url) {
                                                                setSelectedImagePreview(preview);
                                                            }
                                                        }}
                                                        style={{ cursor: preview.file || preview.url ? 'pointer' : 'default' }}
                                                    >
                                                        <span className={cx('preview-icon')}>📹</span>
                                                        <span className={cx('preview-filename')}>{preview.name}</span>
                                                        {(preview.file || preview.url) && (
                                                            <span className={cx('preview-hint')}>Click để xem</span>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className={cx('remove-image-btn')}
                                                    onClick={() => handleRemoveImage(preview.id)}
                                                    title="Xóa tệp"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Mô tả chi tiết</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={cx('textarea')}
                                placeholder="Mô tả vấn đề... (bắt buộc)"
                                rows="6"
                                required
                            />
                        </div>

                        {/* Contact Email */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Email liên hệ</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={cx('input')}
                                required
                            />
                        </div>

                        {/* Return Address */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Địa chỉ gửi hàng</label>
                            <input
                                type="text"
                                value={formData.returnAddress || ''}
                                readOnly
                                onClick={() => setShowAddressList(true)}
                                onFocus={() => setShowAddressList(true)}
                                className={cx('input')}
                                placeholder="Chọn từ danh sách địa chỉ của bạn"
                                required
                            />
                        </div>

                        {/* Refund Method */}
                        <div className={cx('form-section')}>
                            <label className={cx('section-label')}>Hình thức hoàn tiền</label>
                            <select
                                name="refundMethod"
                                value={formData.refundMethod}
                                onChange={handleInputChange}
                                className={cx('select')}
                                disabled
                            >
                                <option value="Hoàn tiền bằng tài khoản ngân hàng">Hoàn tiền bằng tài khoản ngân hàng</option>
                            </select>

                            {formData.refundMethod === 'Hoàn tiền bằng tài khoản ngân hàng' && (
                                <div className={cx('bank-details')}>
                                    <select
                                        name="bank"
                                        value={formData.bank}
                                        onChange={handleInputChange}
                                        className={cx('select')}
                                        required
                                    >
                                        <option value="">Chọn ngân hàng</option>
                                        {BANKS.map(bank => (
                                            <option key={bank} value={bank}>{bank}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleInputChange}
                                        className={cx('input')}
                                        placeholder="Nhập số tài khoản"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="accountHolder"
                                        value={formData.accountHolder}
                                        onChange={handleInputChange}
                                        className={cx('input')}
                                        placeholder="Nhập tên chủ tài khoản"
                                        required
                                    />
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

                        {error && <div className={cx('error-message')}>{error}</div>}

                        <div className={cx('actions')}>
                            <button
                                type="button"
                                className={cx('btn', 'cancel-btn')}
                                onClick={handleBack}
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className={cx('btn', 'submit-btn')}
                                disabled={submitting}
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Address Modals */}
            <AddressListModal
                open={showAddressList}
                onClose={() => setShowAddressList(false)}
                onSelectAddress={(address) => {
                    if (!address) return;
                    const formattedAddress = formatFullAddress(address);
                    setFormData(prev => ({
                        ...prev,
                        returnAddress: formattedAddress,
                    }));
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
                        const formattedAddress = formatFullAddress(newAddress);
                        setFormData(prev => ({
                            ...prev,
                            returnAddress: formattedAddress,
                        }));
                        setSelectedAddress(newAddress);
                        setAddressRefreshKey((prev) => prev + 1);
                    }
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
                    const formattedAddress = formatFullAddress(updated);
                    setFormData(prev => ({
                        ...prev,
                        returnAddress: formattedAddress,
                    }));
                    setSelectedAddress(updated);
                    setAddressRefreshKey((prev) => prev + 1);
                }}
                onDeleted={(deletedId) => {
                    setShowAddressDetailModal(false);
                    setAddressRefreshKey((prev) => prev + 1);
                    if (selectedAddress?.id === deletedId) {
                        setSelectedAddress(null);
                        setFormData(prev => ({
                            ...prev,
                            returnAddress: '',
                        }));
                    }
                }}
            />

            {/* Image Preview Modal */}
            {selectedImagePreview && (
                <div className={cx('image-modal')} onClick={() => setSelectedImagePreview(null)}>
                    <div className={cx('image-modal-content')} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={cx('image-modal-close')}
                            onClick={() => setSelectedImagePreview(null)}
                        >
                            ×
                        </button>
                        {selectedImagePreview.isVideo || /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(selectedImagePreview.url || '') ? (
                            <video 
                                src={selectedImagePreview.url} 
                                controls
                                autoPlay
                                className={cx('image-modal-media')}
                            >
                                Trình duyệt của bạn không hỗ trợ video.
                            </video>
                        ) : (
                            <img 
                                src={selectedImagePreview.url} 
                                alt={selectedImagePreview.name}
                                className={cx('image-modal-image')}
                            />
                        )}
                        <p className={cx('image-modal-name')}>{selectedImagePreview.name}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
