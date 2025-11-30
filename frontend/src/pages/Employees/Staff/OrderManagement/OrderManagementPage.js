import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './OrderManagementPage.scss';
import { useNavigate } from 'react-router-dom';
import SearchAndSort from '../../../../components/Common/SearchAndSort';
import CancelOrderDialog from '../../../../components/Common/ConfirmDialog/CancelOrderDialog';
import {
    formatDateTime,
    getApiBaseUrl,
    getStoredToken,
    confirmOrder as confirmOrderApi,
    createShipment as createShipmentApi,
    cancelOrder as cancelOrderApi,
} from '../../../../services';

const cx = classNames.bind(styles);

// Mapping trạng thái đơn hàng từ backend sang label & class hiển thị
const mapOrderStatus = (statusRaw) => {
    const status = String(statusRaw || '').toUpperCase();
    switch (status) {
        case 'CREATED':
        case 'PENDING':
            return { label: 'Chờ xác nhận', css: 'pending' };
        case 'CONFIRMED':
        case 'PAID':
            return { label: 'Đang xử lý', css: 'processing' };
        case 'SHIPPED':
            return { label: 'Đang giao', css: 'shipping' };
        case 'DELIVERED':
            return { label: 'Hoàn thành', css: 'completed' };
        case 'CANCELLED':
            return { label: 'Đã hủy', css: 'cancelled' };
        case 'RETURN_REQUESTED':
            return { label: 'Khách hàng yêu cầu hoàn tiền/ trả hàng', css: 'return-requested' };
        case 'RETURN_CS_CONFIRMED':
            return { label: 'Chờ nhân viên xác nhận hàng', css: 'return-requested' };
        case 'RETURN_STAFF_CONFIRMED':
            return { label: 'Chờ Admin hoàn tiền', css: 'processing' };
        case 'REFUNDED':
            return { label: 'Hoàn tiền thành công', css: 'refunded' };
        case 'RETURN_REJECTED':
            return { label: 'Từ chối', css: 'return-rejected' };
        default:
            return { label: statusRaw || 'Chờ xác nhận', css: 'pending' };
    }
};

// Kiểm tra xem đơn hàng có phải là đơn hoàn về không
const isRefundOrder = (order) => {
    const status = String(order?.rawStatus || order?.status || '').toUpperCase();
    return (
        status === 'RETURN_REQUESTED' ||
        status === 'RETURN_CS_CONFIRMED' ||
        status === 'RETURN_STAFF_CONFIRMED' ||
        status === 'REFUNDED' ||
        status === 'RETURN_REJECTED'
    );
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

// Chuyển đổi dữ liệu đơn hàng từ API sang dạng hiển thị
const getOrderDateValue = (order) => {
    if (!order) return null;
    return order.orderDateTime || order.orderDate || order.createdAt || null;
};

const mapOrderFromApi = (order) => {
    if (!order) return null;
    const rawStatus = order.status || order.rawStatus;
    const { label, css } = mapOrderStatus(rawStatus);
    const shippingInfo = parseShippingInfo(order.shippingAddress);
    const orderDateValue = getOrderDateValue(order);

    // Tính refund amount (nếu có)
    const refundAmount = order.refundAmount ||
        (order.totalAmount && order.refundReturnFee
            ? order.totalAmount - (order.refundReturnFee || 0)
            : order.totalAmount || 0);

    return {
        id: order.id || '',
        code: order.code || order.orderCode || order.id || '',
        username:
            order.receiverName ||
            shippingInfo?.name ||
            order.customerName ||
            'Khách hàng',
        phoneDisplay: order.receiverPhone || shippingInfo?.phone || '',
        email: order.customerEmail || '',
        orderDate: orderDateValue,
        orderDateOnly: order.orderDate || null,
        totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
        refundAmount: typeof refundAmount === 'number' ? refundAmount : 0,
        receivedDate: order.orderDate || orderDateValue, // Ngày nhận hàng (dùng orderDate tạm thời)
        rawStatus: rawStatus,
        statusLabel: label,
        statusClass: css,
    };
};

// Format ngày giờ hiển thị cho bảng đơn hàng: "HH:mm dd/MM/yy"
const formatOrderDateTime = (value) => {
    if (!value) return '--';
    try {
        const raw = typeof value === 'string' ? value.trim() : value;
        const hasExplicitTime =
            typeof raw === 'string' &&
            (raw.includes('T') || /\d{2}:\d{2}/.test(raw));

        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return '--';

        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = String(d.getFullYear());
        const datePart = `${dd}/${mm}/${yyyy}`;

        if (!hasExplicitTime) {
            return datePart;
        }

        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mi} ${datePart}`;
    } catch {
        // fallback: dùng formatDateTime chung nếu có lỗi bất ngờ
        return formatDateTime(value);
    }
};

export default function OrderManagementPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [cancelDialogOrderId, setCancelDialogOrderId] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [processingOrderId, setProcessingOrderId] = useState(null);

    // Filters cho phần Quản lý đơn hàng
    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filters cho phần Quản lý đơn hoàn về
    const [refundKeyword, setRefundKeyword] = useState('');
    const [refundDateFilter, setRefundDateFilter] = useState('');
    const [refundStatusFilter, setRefundStatusFilter] = useState('all');
    const [refundCurrentPage, setRefundCurrentPage] = useState(1);
    const refundItemsPerPage = 8;
    const [activeTab, setActiveTab] = useState('orders');

    // Fetch danh sách đơn hàng (ưu tiên gọi API thật, nếu lỗi dùng mock)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError('');
                setActionError('');
                setActionMessage('');

                const token = getStoredToken('token');
                // Staff xem tất cả đơn hàng
                const resp = await fetch(`${apiBaseUrl}/orders`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (!resp.ok) {
                    console.error('OrderManagement: API /orders trả lỗi:', resp.status, resp.statusText);
                    setError('Không thể tải danh sách đơn hàng từ server. Vui lòng thử lại sau.');
                    setOrders([]);
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const raw = data?.result || data || [];
                const list = Array.isArray(raw) ? raw : [];
                const mapped = list
                    .map(mapOrderFromApi)
                    .filter(Boolean);
                setOrders(mapped.length > 0 ? mapped : []);
            } catch (err) {
                console.error('OrderManagement: Lỗi khi tải đơn hàng:', err);
                setError('Không thể tải danh sách đơn hàng từ server. Vui lòng thử lại sau.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [apiBaseUrl]);

    // Tách orders thành 2 nhóm: normal orders và refund orders
    // Loại bỏ các đơn đã hoàn tiền thành công (REFUNDED) và các đơn đang chờ khách yêu cầu (RETURN_REQUESTED)
    const { normalOrders, refundOrders } = useMemo(() => {
        const normal = [];
        const refund = [];

        orders.forEach((order) => {
            if (isRefundOrder(order)) {
                const status = String(order?.rawStatus || order?.status || '').trim().toUpperCase();
                // Thêm vào refundOrders nếu là RETURN_CS_CONFIRMED hoặc RETURN_STAFF_CONFIRMED hoặc RETURN_REJECTED
                // Loại bỏ RETURN_REQUESTED (CSKH chưa xác nhận) và REFUNDED (đã hoàn tiền thành công)
                if (status === 'RETURN_CS_CONFIRMED' ||
                    status === 'RETURN_STAFF_CONFIRMED' ||
                    status === 'RETURN_REJECTED') {
                    refund.push(order);
                } else {
                    // Debug: log các đơn refund không được thêm vào
                    console.log('OrderManagement: Refund order not added - status:', status, 'order:', order.code, 'rawStatus:', order.rawStatus, 'status prop:', order.status);
                }
            } else {
                normal.push(order);
            }
        });
        return { normalOrders: normal, refundOrders: refund };
    }, [orders]);

    // Lọc đơn hàng thông thường theo ô tìm kiếm, ngày và trạng thái
    const filteredOrders = useMemo(() => {
        let result = normalOrders;

        if (keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            result = result.filter((o) => {
                return (
                    o.code?.toLowerCase().includes(kw) ||
                    o.username?.toLowerCase().includes(kw) ||
                    o.email?.toLowerCase().includes(kw)
                );
            });
        }

        if (dateFilter) {
            result = result.filter((o) => {
                const base = o.orderDateOnly || o.orderDate;
                if (!base) return false;
                try {
                    const orderDateStr =
                        typeof base === 'string'
                            ? base.substring(0, 10)
                            : new Date(base).toISOString().substring(0, 10);
                    return orderDateStr === dateFilter;
                } catch {
                    return false;
                }
            });
        }

        if (statusFilter !== 'all') {
            result = result.filter((o) => {
                const mapped = mapOrderStatus(o.rawStatus || o.status);
                return mapped.css === statusFilter;
            });
        }

        // Sắp xếp mới nhất lên trước theo ngày đặt
        return [...result].sort((a, b) => {
            const da = a.orderDate ? new Date(a.orderDate) : 0;
            const db = b.orderDate ? new Date(b.orderDate) : 0;
            return db - da;
        });
    }, [normalOrders, keyword, dateFilter, statusFilter]);

    // Tính toán pagination cho đơn hàng thông thường
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, dateFilter, statusFilter]);

    // Lọc đơn hoàn về theo ô tìm kiếm, ngày và trạng thái
    const filteredRefundOrders = useMemo(() => {
        let result = refundOrders;

        if (refundKeyword.trim()) {
            const kw = refundKeyword.trim().toLowerCase();
            result = result.filter((o) => {
                return (
                    o.code?.toLowerCase().includes(kw) ||
                    o.username?.toLowerCase().includes(kw) ||
                    o.email?.toLowerCase().includes(kw)
                );
            });
        }

        if (refundDateFilter) {
            result = result.filter((o) => {
                const base = o.orderDateOnly || o.orderDate;
                if (!base) return false;
                try {
                    const orderDateStr =
                        typeof base === 'string'
                            ? base.substring(0, 10)
                            : new Date(base).toISOString().substring(0, 10);
                    return orderDateStr === refundDateFilter;
                } catch {
                    return false;
                }
            });
        }

        if (refundStatusFilter !== 'all') {
            result = result.filter((o) => {
                const status = String(o.rawStatus || o.status || '').toUpperCase();
                if (refundStatusFilter === 'return-cs') {
                    return status === 'RETURN_CS_CONFIRMED';
                } else if (refundStatusFilter === 'return-staff') {
                    return status === 'RETURN_STAFF_CONFIRMED';
                } else if (refundStatusFilter === 'return-rejected') {
                    return status === 'RETURN_REJECTED';
                }
                return true;
            });
        }

        // Sắp xếp mới nhất lên trước theo ngày đặt
        return [...result].sort((a, b) => {
            const da = a.orderDate ? new Date(a.orderDate) : 0;
            const db = b.orderDate ? new Date(b.orderDate) : 0;
            return db - da;
        });
    }, [refundOrders, refundKeyword, refundDateFilter, refundStatusFilter]);

    // Tính toán pagination cho đơn hoàn về
    const refundTotalPages = Math.ceil(filteredRefundOrders.length / refundItemsPerPage);
    const refundStartIndex = (refundCurrentPage - 1) * refundItemsPerPage;
    const refundEndIndex = refundStartIndex + refundItemsPerPage;
    const paginatedRefundOrders = filteredRefundOrders.slice(refundStartIndex, refundEndIndex);

    // Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setRefundCurrentPage(1);
    }, [refundKeyword, refundDateFilter, refundStatusFilter]);

    const renderPaginationControls = (page, total, handlePrev, handleNext) => {
        if (total <= 1) return null;
        return (
            <div className={cx('pagination')}>
                <button
                    type="button"
                    className={cx('pagination-btn')}
                    disabled={page === 1}
                    onClick={handlePrev}
                >
                    Trước
                </button>
                <span className={cx('pagination-info')}>
                    Trang {page}/{total}
                </span>
                <button
                    type="button"
                    className={cx('pagination-btn')}
                    disabled={page === total}
                    onClick={handleNext}
                >
                    Tiếp
                </button>
            </div>
        );
    };

    const handleConfirmOrder = async (orderId) => {
        if (!orderId) return;

        try {
            setActionError('');
            setActionMessage('');
            setProcessingOrderId(orderId);

            const token = getStoredToken('token');
            const { ok: confirmOk, data: confirmedOrder, status } = await confirmOrderApi(orderId, token);

            if (!confirmOk) {
                throw new Error(`Confirm API error ${status || ''}`.trim());
            }

            const mapped = mapOrderFromApi(confirmedOrder);

            if (!mapped) {
                throw new Error('Không nhận được dữ liệu đơn hàng sau khi xác nhận');
            }

            setOrders((prev) => prev.map((o) => (o.id === orderId ? mapped : o)));
            setActionMessage(`Đã xác nhận đơn #${mapped.code}.`);

            try {
                const {
                    ok: shipmentOk,
                    status: shipmentStatus,
                    data: shipmentData,
                } = await createShipmentApi(orderId, {}, token);

                if (!shipmentOk || !shipmentData) {
                    throw new Error(
                        shipmentStatus
                            ? `Không thể tạo vận đơn GHN (HTTP ${shipmentStatus})`
                            : 'Không thể tạo vận đơn GHN.',
                    );
                }

                setActionMessage(`Đã xác nhận đơn #${mapped.code} và tạo vận đơn GHN.`);
            } catch (shipmentErr) {
                console.error('OrderManagement: tạo vận đơn GHN thất bại', shipmentErr);
                setActionError(
                    shipmentErr?.message
                        ? `Không thể tạo vận đơn GHN: ${shipmentErr.message}`
                        : 'Không thể tạo vận đơn GHN. Vui lòng thử lại trong trang chi tiết đơn.',
                );
            }
        } catch (err) {
            console.error('OrderManagement: xác nhận đơn hàng thất bại', err);
            setActionError(err?.message || 'Không thể xác nhận đơn hàng. Vui lòng thử lại.');
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handleCancelOrder = (orderId) => {
        if (!orderId || processingOrderId) return;
        setActionError('');
        setActionMessage('');
        setCancelDialogOrderId(orderId);
    };

    const handleOpenCancelDialog = (orderId) => {
        setCancelDialogOrderId(orderId);
    };

    const handleConfirmCancelOrder = async (reason) => {
        const orderId = cancelDialogOrderId;
        if (!orderId) return;
        try {
            setProcessingOrderId(orderId);
            const token = getStoredToken('token');
            const { ok } = await cancelOrderApi(orderId, reason, token);
            if (!ok) {
                setActionError('Không thể hủy đơn hàng. Vui lòng thử lại.');
                return;
            }
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId
                        ? {
                            ...o,
                            rawStatus: 'CANCELLED',
                            ...mapOrderStatus('CANCELLED'),
                        }
                        : o,
                ),
            );
        } catch (err) {
            console.error('OrderManagement: hủy đơn hàng thất bại', err);
            setActionError(err?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
        } finally {
            setProcessingOrderId(null);
            setCancelDialogOrderId(null);
        }
    };

    const handleViewRefundDetail = (orderId) => {
        if (!orderId) return;
        navigate(`/staff/refund-orders/${orderId}`);
    };

    const renderOrdersSection = () => (
        <div className={cx('section')}>
            <h2 className={cx('section-title')}>Danh sách đơn hàng</h2>
            <div className={cx('wrap')}>
                <SearchAndSort
                    searchPlaceholder="Tìm kiếm theo mã đơn, tên sản phẩm,...."
                    searchValue={keyword}
                    onSearchChange={(e) => setKeyword(e.target.value)}
                    onSearchClick={() => { }}
                    dateFilter={dateFilter}
                    onDateChange={(value) => setDateFilter(value)}
                    dateLabel="dd/mm/yyyy"
                    sortLabel="Sắp xếp:"
                    sortOptions={[
                        { value: 'all', label: 'Tất cả trạng thái' },
                        { value: 'pending', label: 'Chờ xác nhận' },
                        { value: 'processing', label: 'Đang xử lý' },
                        { value: 'shipping', label: 'Đang giao' },
                        { value: 'completed', label: 'Hoàn thành' },
                        { value: 'cancelled', label: 'Đã hủy' },
                    ]}
                    sortValue={statusFilter}
                    onSortChange={(e) => setStatusFilter(e.target.value)}
                />

                {loading && (
                    <div className={cx('info-row')}>Đang tải danh sách đơn hàng...</div>
                )}
                {error && !loading && (
                    <div className={cx('info-row', 'error')}>{error}</div>
                )}
                {actionMessage && (
                    <div className={cx('info-row', 'success')}>{actionMessage}</div>
                )}
                {actionError && (
                    <div className={cx('info-row', 'error')}>{actionError}</div>
                )}

                <div className={cx('card')}>
                    <div className={cx('card-header')}>Danh sách đơn hàng</div>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Username</th>
                                <th>Ngày</th>
                                <th>Tổng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => {
                                const { label, css } = mapOrderStatus(
                                    order.rawStatus || order.status,
                                );
                                const isPending = css === 'pending';

                                return (
                                    <tr key={order.id}>
                                        <td className={cx('code-cell')}>#{order.code}</td>
                                        <td className={cx('user-cell')}>
                                            <div className={cx('username')}>{order.username}</div>
                                            {order.email && (
                                                <div className={cx('email')}>{order.email}</div>
                                            )}
                                            {order.phoneDisplay && (
                                                <div className={cx('email')}>{order.phoneDisplay}</div>
                                            )}
                                        </td>
                                        <td>
                                            {formatOrderDateTime(order.orderDate)}
                                        </td>
                                        <td>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(order.totalAmount || 0)}
                                        </td>
                                        <td className={cx('status-cell')}>
                                            <span className={cx('status-pill', css)}>{label}</span>
                                        </td>
                                        <td className={cx('actions-cell')}>
                                            <button
                                                className={cx('btn', 'view')}
                                                onClick={() => navigate(`/staff/orders/${order.id}`)}
                                            >
                                                Xem chi tiết
                                            </button>
                                            <div
                                                className={cx('action-buttons')}
                                                style={{
                                                    visibility: isPending ? 'visible' : 'hidden',
                                                }}
                                            >
                                                <button
                                                    className={cx('btn', 'confirm')}
                                                    onClick={() => handleConfirmOrder(order.id)}
                                                    disabled={processingOrderId === order.id}
                                                >
                                                    Xác nhận
                                                </button>
                                                <button
                                                    className={cx('btn', 'cancel')}
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedOrders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className={cx('empty')}>
                                        Không có đơn hàng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {renderPaginationControls(
                    currentPage,
                    totalPages,
                    () => setCurrentPage((prev) => Math.max(1, prev - 1)),
                    () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
                )}
            </div>
            <CancelOrderDialog
                open={Boolean(cancelDialogOrderId)}
                loading={Boolean(processingOrderId && processingOrderId === cancelDialogOrderId)}
                title="Hủy đơn hàng của khách"
                message="Bạn có chắc chắn muốn hủy đơn hàng này? Vui lòng nhập lý do để lưu lại lịch sử."
                confirmText="Hủy đơn"
                cancelText="Đóng"
                onConfirm={handleConfirmCancelOrder}
                onCancel={() => !processingOrderId && setCancelDialogOrderId(null)}
            />
        </div>
    );

    const renderRefundSection = () => (
        <div className={cx('section', 'refund-section')}>
            <h2 className={cx('section-title')}>Quản lý đơn hoàn về</h2>
            <div className={cx('wrap')}>
                <SearchAndSort
                    searchPlaceholder="Tìm kiếm theo mã đơn, tên khách hàng,...."
                    searchValue={refundKeyword}
                    onSearchChange={(e) => setRefundKeyword(e.target.value)}
                    onSearchClick={() => { }}
                    dateFilter={refundDateFilter}
                    onDateChange={(value) => setRefundDateFilter(value)}
                    dateLabel="dd/mm/yyyy"
                    sortLabel="Sắp xếp:"
                    sortOptions={[
                        { value: 'all', label: 'Tất cả trạng thái' },
                        { value: 'return-cs', label: 'Chờ nhân viên xác nhận hàng' },
                        { value: 'return-staff', label: 'Chờ Admin' },
                        { value: 'return-rejected', label: 'Từ chối' },
                    ]}
                    sortValue={refundStatusFilter}
                    onSortChange={(e) => setRefundStatusFilter(e.target.value)}
                />

                {loading && (
                    <div className={cx('info-row')}>Đang tải danh sách đơn hoàn về...</div>
                )}

                <div className={cx('card', 'refund-card')}>
                    <div className={cx('card-header')}>Danh sách đơn hoàn về</div>
                    <table className={cx('table', 'refund-table')}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Tiền hoàn</th>
                                <th>Ngày nhận hàng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRefundOrders.map((order) => {
                                const { label, css } = mapOrderStatus(
                                    order.rawStatus || order.status,
                                );

                                return (
                                    <tr key={order.id}>
                                        <td className={cx('code-cell')}>#{order.code}</td>
                                        <td className={cx('user-cell')}>
                                            <div className={cx('username')}>{order.username}</div>
                                            {order.email && (
                                                <div className={cx('email')}>{order.email}</div>
                                            )}
                                        </td>
                                        <td>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(order.totalAmount || 0)}
                                        </td>
                                        <td>
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                            }).format(order.refundAmount || 0)}
                                        </td>
                                        <td>
                                            {order.receivedDate
                                                ? formatOrderDateTime(order.receivedDate).split(' ')[1] || formatOrderDateTime(order.receivedDate)
                                                : '--'}
                                        </td>
                                        <td className={cx('status-cell')}>
                                            <span className={cx('status-pill', css)}>{label}</span>
                                        </td>
                                        <td className={cx('actions-cell')}>
                                            <button
                                                className={cx('btn', 'view')}
                                                onClick={() => handleViewRefundDetail(order.id)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedRefundOrders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className={cx('empty')}>
                                        Không có đơn hoàn về nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {renderPaginationControls(
                    refundCurrentPage,
                    refundTotalPages,
                    () => setRefundCurrentPage((prev) => Math.max(1, prev - 1)),
                    () =>
                        setRefundCurrentPage((prev) => Math.min(refundTotalPages, prev + 1)),
                )}
            </div>
        </div>
    );

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý đơn hàng</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>

            <div className={cx('tabs-container')}>
                <button
                    className={cx('tab', { active: activeTab === 'orders' })}
                    onClick={() => setActiveTab('orders')}
                >
                    Quản lý đơn hàng
                </button>
                <button
                    className={cx('tab', { active: activeTab === 'refunds' })}
                    onClick={() => setActiveTab('refunds')}
                >
                    Quản lý đơn hoàn về
                </button>
            </div>

            {activeTab === 'orders' ? renderOrdersSection() : renderRefundSection()}
        </div>
    );
}


