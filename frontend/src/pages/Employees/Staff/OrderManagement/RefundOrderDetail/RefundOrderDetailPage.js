import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './RefundOrderDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatCurrency } from '../../../../../services';
import { normalizeMediaUrl } from '../../../../../services/productUtils';

const cx = classNames.bind(styles);

const parseShippingInfo = (raw) => {
    if (!raw || typeof raw !== 'string') return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            name: parsed.name || parsed.receiverName || parsed.recipientName || '',
            phone: parsed.phone || parsed.receiverPhone || parsed.recipientPhone || '',
            address: parsed.address || parsed.fullAddress || parsed.addressText || '',
        };
    } catch {
        return { address: raw };
    }
};

const parseRefundInfo = (order) => {
    if (!order) {
        return {
            reasonType: '',
            description: '',
            refundAmount: 0,
            selectedProductIds: [],
            mediaUrls: [],
        };
    }

    let mediaUrls = [];
    if (order.refundMediaUrls) {
        try {
            const parsed = JSON.parse(order.refundMediaUrls);
            if (Array.isArray(parsed)) {
                mediaUrls = parsed;
            }
        } catch {
            mediaUrls = [];
        }
    }

    let selectedProductIds = [];
    if (order.refundSelectedProductIds) {
        try {
            const parsed = JSON.parse(order.refundSelectedProductIds);
            if (Array.isArray(parsed)) {
                selectedProductIds = parsed;
            }
        } catch {
            selectedProductIds = [];
        }
    }

    return {
        reasonType: order.refundReasonType || '',
        description: order.refundDescription || '',
        refundAmount: order.refundAmount || 0,
        mediaUrls,
        selectedProductIds,
    };
};

const formatDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

export default function RefundOrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inspectionStatus, setInspectionStatus] = useState('valid_customer');
    const [receivedDate, setReceivedDate] = useState(formatDateInput(new Date()));
    const [refundAmount, setRefundAmount] = useState('');
    const [inspectionNote, setInspectionNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const apiBaseUrl = getApiBaseUrl();

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                setLoading(true);
                const token = getStoredToken('token');
                if (!token) {
                    setError('Vui lòng đăng nhập để xem chi tiết đơn hoàn về.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(id)}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Không thể tải thông tin đơn hàng');
                }

                const data = await response.json();
                const orderData = data?.result || data;

                setOrder(orderData);
                const refundInfo = parseRefundInfo(orderData);
                setRefundAmount(
                    refundInfo.refundAmount ||
                        orderData.selectedItemsTotal ||
                        orderData.totalAmount ||
                        0,
                );
            } catch (err) {
                setError(err.message || 'Đã xảy ra lỗi khi tải thông tin.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetail();
        } else {
            setLoading(false);
            setError('Không tìm thấy ID đơn hàng');
        }
    }, [apiBaseUrl, id]);

    const refundInfo = useMemo(() => parseRefundInfo(order), [order]);
    const shippingInfo = useMemo(() => parseShippingInfo(order?.shippingAddress), [order]);
    const shippingFee = useMemo(() => Number(order?.shippingFee) || 0, [order]);

    const selectedItems =
        order?.items?.filter((item) => {
            if (!refundInfo.selectedProductIds.length) return true;
            return refundInfo.selectedProductIds.includes(item.id);
        }) || [];

    const calculatedRefundAmount = useMemo(() => {
        if (refundInfo.refundAmount) return Number(refundInfo.refundAmount);
        return selectedItems.reduce(
            (sum, item) => sum + Number(item.totalPrice || item.finalPrice || 0),
            0,
        );
    }, [refundInfo.refundAmount, selectedItems]);

    useEffect(() => {
        let autoAmount = 0;
        if (inspectionStatus === 'invalid') {
            autoAmount = 0;
        } else if (inspectionStatus === 'valid_store') {
            autoAmount = calculatedRefundAmount + shippingFee;
        } else {
            autoAmount = calculatedRefundAmount;
        }
        setRefundAmount(autoAmount);
    }, [inspectionStatus, calculatedRefundAmount, shippingFee]);

    const normalizedMediaUrls = useMemo(() => {
        if (!refundInfo.mediaUrls || !refundInfo.mediaUrls.length) return [];
        const baseUrlForStatic = apiBaseUrl.replace('/api', '');
        return refundInfo.mediaUrls.map((url) => normalizeMediaUrl(url, baseUrlForStatic));
    }, [apiBaseUrl, refundInfo.mediaUrls]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleReject = async () => {
        if (!inspectionNote.trim()) {
            alert('Vui lòng nhập ghi chú/ lý do từ chối');
            return;
        }

        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const response = await fetch(
                `${apiBaseUrl}/orders/${encodeURIComponent(id)}/reject-refund`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: inspectionNote }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Không thể từ chối đơn này');
            }

            alert('Đã từ chối đơn hoàn về.');
            navigate('/staff/orders');
        } catch (err) {
            alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setProcessing(true);
            const token = getStoredToken('token');
            const response = await fetch(
                `${apiBaseUrl}/orders/${encodeURIComponent(id)}/confirm-refund`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Không thể xác nhận đơn này');
            }

            alert('Đã xác nhận đơn hoàn về thành công.');
            navigate('/staff/orders');
        } catch (err) {
            alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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
                    <button onClick={handleBack}>Quay lại</button>
                </div>
            </div>
        );
    }

    const normalizedStatus = (order?.status || '').toUpperCase();
    const canProcess = normalizedStatus === 'RETURN_REQUESTED';

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Kiểm tra đơn hàng hoàn về</h1>
                <button className={cx('back-btn')} onClick={handleBack}>
                    ← Quay lại
                </button>
            </div>

            <div className={cx('card')}>
                <div className={cx('order-code')}>Đơn hàng #{order.code || order.id}</div>

                <div className={cx('section')}>
                    <h3 className={cx('section-heading')}>Thông tin khách hàng</h3>
                    <div className={cx('info-grid')}>
                        <div>
                            <div className={cx('labels')}>Họ tên</div>
                            <input
                                className={cx('input')}
                                value={shippingInfo.name || order.receiverName || ''}
                                readOnly
                            />
                        </div>
                        <div>
                            <div className={cx('labels')}>SĐT</div>
                            <input
                                className={cx('input')}
                                value={shippingInfo.phone || order.receiverPhone || ''}
                                readOnly
                            />
                        </div>
                        <div>
                            <div className={cx('labels')}>Địa chỉ</div>
                            <input
                                className={cx('input')}
                                value={shippingInfo.address || order.shippingAddress || ''}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                <div className={cx('section')}>
                    <h3 className={cx('section-heading')}>Đơn khách hàng gửi</h3>
                    <div className={cx('request-box')}>
                        <div className={cx('request-row')}>
                            <span>Sản phẩm:</span>
                            <span>
                                {selectedItems.length > 0
                                    ? selectedItems.map((item) => item.name).join(', ')
                                    : 'Không xác định'}
                            </span>
                        </div>
                        <div className={cx('request-row')}>
                            <span>Số lượng:</span>
                            <span>
                                {selectedItems.reduce(
                                    (sum, item) => sum + (item.quantity || 0),
                                    0,
                                )}
                            </span>
                        </div>
                        <div className={cx('request-row')}>
                            <span>Yêu cầu hoàn tiền:</span>
                            <span>{formatCurrency(calculatedRefundAmount)}</span>
                        </div>
                        <div className={cx('request-row')}>
                            <span>Lý do:</span>
                            <span>{refundInfo.description || 'Không có mô tả'}</span>
                        </div>
                        <div>
                            <div className={cx('labels')}>Ảnh khách gửi</div>
                            <div className={cx('media-grid')}>
                                {normalizedMediaUrls.length > 0
                                    ? normalizedMediaUrls.map((url, index) => {
                                          const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(
                                              url,
                                          );
                                          return (
                                              <div key={url} className={cx('media-item')}>
                                                  {isVideo ? (
                                                      <video src={url} controls className={cx('media-content')} />
                                                  ) : (
                                                      <img
                                                          src={url}
                                                          alt={`Ảnh ${index + 1}`}
                                                          className={cx('media-content')}
                                                      />
                                                  )}
                                              </div>
                                          );
                                      })
                                    : [1, 2, 3].map((item) => (
                                          <div key={item} className={cx('media-item')}>
                                              <span className={cx('media-placeholder')}>Ảnh {item}</span>
                                          </div>
                                      ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cx('section')}>
                    <h3 className={cx('section-heading')}>Kiểm tra hàng hoàn</h3>
                    {!canProcess && (
                        <div style={{ background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 10, padding: 12, marginBottom: 16, color: '#856404' }}>
                            Đơn này hiện không ở trạng thái <b>Hoàn tiền/ trả hàng</b>. Vui lòng yêu cầu khách gửi lại trước khi xác nhận.
                        </div>
                    )}
                    <div className={cx('inspection-form')}>
                        <div>
                            <div className={cx('labels')}>Trạng thái hàng nhận về</div>
                            <select
                                className={cx('select')}
                                value={inspectionStatus}
                                onChange={(e) => setInspectionStatus(e.target.value)}
                            >
                                <option value="valid_store">Hợp lệ - lỗi cửa hàng</option>
                                <option value="valid_customer">Hợp lệ - lỗi khách hàng</option>
                                <option value="invalid">Không hợp lệ</option>
                            </select>
                        </div>
                        <div>
                            <div className={cx('labels')}>Ngày nhận hàng</div>
                            <input
                                type="date"
                                className={cx('input-inline')}
                                value={receivedDate}
                                onChange={(e) => setReceivedDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className={cx('labels')}>Số tiền hoàn (VND)</div>
                            <input
                                type="number"
                                className={cx('input-inline')}
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <div className={cx('labels')}>Ghi chú / lý do nếu không hợp lệ</div>
                        <textarea
                            className={cx('textarea')}
                            value={inspectionNote}
                            onChange={(e) => setInspectionNote(e.target.value)}
                            placeholder="Nhập ghi chú hoặc lý do nếu hàng không hợp lệ..."
                        />
                    </div>
                </div>

                <div className={cx('actions')}>
                    <button className={cx('btn', 'btn-cancel')} onClick={handleBack} disabled={processing}>
                        Hủy
                    </button>
                    <button className={cx('btn', 'btn-reject')} onClick={handleReject} disabled={processing}>
                        {processing ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                    <button
                        className={cx('btn', 'btn-confirm')}
                        onClick={handleConfirm}
                        disabled={processing || !canProcess}
                    >
                        {processing ? 'Đang xử lý...' : 'Xác nhận hợp lệ & gửi Admin'}
                    </button>
                </div>
            </div>
        </div>
    );
}


