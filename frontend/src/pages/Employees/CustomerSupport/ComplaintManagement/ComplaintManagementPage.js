import { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './ComplaintManagementPage.module.scss';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';
import ConfirmDialog from '../../../../components/Common/ConfirmDialog/DeleteAccountDialog';
import Notification from '../../../../components/Common/Notification/Notification';

const cx = classNames.bind(styles);

// Map status from backend to display
const statusMap = {
    NEW: 'Mới',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    ESCALATED: 'Chuyển Admin',
};

// Map assignee from backend to display
const assigneeMap = {
    CS: 'CSKH',
    ADMIN: 'Admin',
};

export default function ComplaintManagementPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [note, setNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
    });
    const [notif, setNotif] = useState({
        open: false,
        type: 'success',
        title: '',
        message: '',
        duration: 2500,
    });

    // Fetch current user ID
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/users/my-info`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    setCurrentUserId(data.result.id);
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };

        fetchCurrentUser();
    }, [API_BASE_URL]);

    // Fetch complaints from API
    useEffect(() => {
        const fetchComplaints = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để xem danh sách khiếu nại');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải danh sách khiếu nại');
                }

                // Map backend data to display format
                const mappedComplaints = (data?.result || []).map((ticket) => ({
                    id: ticket.id,
                    orderCode: ticket.orderCode,
                    customer: ticket.customerName,
                    phone: ticket.phone,
                    email: ticket.email,
                    status: statusMap[ticket.status] || ticket.status,
                    statusRaw: ticket.status,
                    authority: assigneeMap[ticket.assignedTo] || ticket.assignedTo,
                    assignedToRaw: ticket.assignedTo,
                    handlerId: ticket.handlerId || '',
                    handlerName: ticket.handlerName || '',
                    date: ticket.createdAt ? formatDateTime(ticket.createdAt) : '',
                    createdAt: ticket.createdAt,
                    content: ticket.content,
                    handlerNote: ticket.handlerNote || '',
                }));

                setComplaints(mappedComplaints);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách khiếu nại');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, [API_BASE_URL]);

    const handleView = (complaint) => {
        setSelectedComplaint(complaint);
        setNote(complaint.handlerNote || '');
        setActionError('');
        setActionSuccess('');
    };

    const refreshComplaints = async () => {
        try {
            const token = getStoredToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                const mappedComplaints = (data?.result || []).map((ticket) => ({
                    id: ticket.id,
                    orderCode: ticket.orderCode,
                    customer: ticket.customerName,
                    phone: ticket.phone,
                    email: ticket.email,
                    status: statusMap[ticket.status] || ticket.status,
                    statusRaw: ticket.status,
                    authority: assigneeMap[ticket.assignedTo] || ticket.assignedTo,
                    assignedToRaw: ticket.assignedTo,
                    handlerId: ticket.handlerId || '',
                    handlerName: ticket.handlerName || '',
                    date: ticket.createdAt ? formatDateTime(ticket.createdAt) : '',
                    createdAt: ticket.createdAt,
                    content: ticket.content,
                    handlerNote: ticket.handlerNote || '',
                }));

                setComplaints(mappedComplaints);

                // Update selected complaint if it exists
                if (selectedComplaint) {
                    const updated = mappedComplaints.find((c) => c.id === selectedComplaint.id);
                    if (updated) {
                        setSelectedComplaint(updated);
                        setNote(updated.handlerNote || '');
                    }
                }
            }
        } catch (err) {
            console.error('Error refreshing complaints:', err);
        }
    };

    const handleResolved = async () => {
        if (!selectedComplaint) return;

        setActionLoading(true);
        setActionError('');
        setActionSuccess('');

        try {
            const token = getStoredToken();
            if (!token) {
                setActionError('Vui lòng đăng nhập');
                setActionLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/tickets/${selectedComplaint.id}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    handlerNote: note || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Không thể đánh dấu đã giải quyết');
            }

            const msg = 'Đã đánh dấu giải quyết thành công!';
            setActionSuccess(msg);
            setNotif({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: msg,
                duration: 2500,
            });
            await refreshComplaints();
            setTimeout(() => {
                setActionSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error resolving complaint:', err);
            const msg = err.message || 'Đã xảy ra lỗi khi đánh dấu giải quyết';
            setActionError(msg);
            setNotif({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: msg,
                duration: 3000,
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptComplaint = async () => {
        if (!selectedComplaint) return;

        setActionLoading(true);
        setActionError('');
        setActionSuccess('');

        try {
            const token = getStoredToken();
            if (!token) {
                setActionError('Vui lòng đăng nhập');
                setActionLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/tickets/${selectedComplaint.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    handlerNote: note || '',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Check if it's a permission error
                if (response.status === 403 || data?.code === 1006 || 
                    data?.message?.includes('permission') || 
                    data?.message?.includes('UNAUTHORIZED')) {
                    // Check if complaint is resolved
                    if (selectedComplaint.statusRaw === 'RESOLVED') {
                        throw new Error('Khiếu nại này đã được giải quyết. Bạn không thể tiếp nhận khiếu nại đã giải quyết.');
                    }
                    throw new Error('Khiếu nại này đã được CSKH khác tiếp nhận. Bạn không thể tiếp nhận khiếu nại này.');
                }
                throw new Error(data?.message || 'Không thể tiếp nhận khiếu nại');
            }

            const msg = 'Đã tiếp nhận khiếu nại thành công! Bạn đã trở thành người xử lý.';
            setActionSuccess(msg);
            setNotif({
                open: true,
                type: 'success',
                title: 'Thành công',
                message: msg,
                duration: 2500,
            });
            await refreshComplaints();
            setTimeout(() => {
                setActionSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error accepting complaint:', err);
            const msg = err.message || 'Đã xảy ra lỗi khi tiếp nhận khiếu nại';
            setActionError(msg);
            setNotif({
                open: true,
                type: 'error',
                title: 'Lỗi',
                message: msg,
                duration: 3000,
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransferAdmin = () => {
        if (!selectedComplaint) return;

        setActionError('');
        setActionSuccess('');

        setConfirmDialog({
            open: true,
            title: 'Chuyển khiếu nại cho Admin',
            message:
                'Bạn có chắc chắn muốn chuyển khiếu nại này cho Admin không? Hệ thống sẽ lưu lại ghi chú của CSKH trước khi chuyển.',
            onConfirm: async () => {
                setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
                setActionLoading(true);

                try {
                    const token = getStoredToken();
                    if (!token) {
                        setActionError('Vui lòng đăng nhập');
                        setActionLoading(false);
                        return;
                    }

                    // YÊU CẦU: CSKH phải là người đã tiếp nhận (handler) trước khi chuyển Admin
                    if (!selectedComplaint.handlerId || selectedComplaint.handlerId !== currentUserId) {
                    const msg =
                        'Bạn phải TIẾP NHẬN khiếu nại này (trở thành người phụ trách) trước khi chuyển cho Admin.';
                    setActionError(msg);
                    setNotif({
                        open: true,
                        type: 'error',
                        title: 'Lỗi',
                        message: msg,
                        duration: 3500,
                    });
                        setActionLoading(false);
                        return;
                    }

                    // YÊU CẦU: bắt buộc nhập ghi chú trước khi chuyển Admin
                    if (!note || !note.trim()) {
                        const msg = 'Vui lòng nhập ghi chú của CSKH trước khi chuyển cho Admin.';
                        setActionError(msg);
                        setNotif({
                            open: true,
                            type: 'error',
                            title: 'Thiếu ghi chú',
                            message: msg,
                            duration: 3000,
                        });
                        setActionLoading(false);
                        return;
                    }

                    // Lưu ghi chú CSKH trước khi chuyển Admin
                    const saveNoteResp = await fetch(
                        `${API_BASE_URL}/api/tickets/${selectedComplaint.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                handlerNote: note.trim(),
                            }),
                        },
                    );
                    const saveNoteData = await saveNoteResp.json().catch(() => ({}));
                    if (!saveNoteResp.ok) {
                        throw new Error(saveNoteData?.message || 'Không thể lưu ghi chú trước khi chuyển Admin');
                    }

                    const response = await fetch(
                        `${API_BASE_URL}/api/tickets/${selectedComplaint.id}/escalate`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data?.message || 'Không thể chuyển cho Admin');
                    }

                    const msg = 'Đã chuyển cho Admin thành công!';
                    setActionSuccess(msg);
                    setNotif({
                        open: true,
                        type: 'success',
                        title: 'Thành công',
                        message: msg,
                        duration: 2500,
                    });
                    await refreshComplaints();
                    setTimeout(() => {
                        setActionSuccess('');
                    }, 3000);
                } catch (err) {
                    console.error('Error escalating complaint:', err);
                    const msg = err.message || 'Đã xảy ra lỗi khi chuyển cho Admin';
                    setActionError(msg);
                    setNotif({
                        open: true,
                        type: 'error',
                        title: 'Lỗi',
                        message: msg,
                        duration: 3000,
                    });
                } finally {
                    setActionLoading(false);
                }
            },
        });
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('top-line')}></div>
            <div className={cx('page-header')}>
                <h1 className={cx('page-title')}>Quản lý khiếu nại</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/customer-support')}>
                    ← Dashboard
                </button>
            </div>

            <div className={cx('content-wrapper')}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Đang tải danh sách khiếu nại...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className={cx('cards-container')}>
                        {/* Card trái: Danh sách khiếu nại */}
                        <div className={cx('card', 'list-card')}>
                            <div className={cx('card-header')}>
                                <h2 className={cx('card-title')}>Danh sách khiếu nại</h2>
                                <p className={cx('card-desc')}>
                                    Quản lý các đơn khiếu nại của khách hàng. Nhấp "Xem" để mở chi tiết xử lý.
                                </p>
                            </div>

                            <div className={cx('table-container')}>
                                {complaints.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <p>Chưa có khiếu nại nào</p>
                                    </div>
                                ) : (
                                    <table className={cx('complaint-table')}>
                                        <thead>
                                            <tr>
                                                <th>Mã</th>
                                                <th>Khách hàng</th>
                                                <th>SĐT</th>
                                                <th>Trạng thái</th>
                                                <th>Phân quyền xử lý</th>
                                                <th>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {complaints.map((complaint) => (
                                                <tr key={complaint.id}>
                                                    <td>{complaint.orderCode || complaint.id.substring(0, 8)}</td>
                                                    <td>{complaint.customer}</td>
                                                    <td>{complaint.phone}</td>
                                                    <td>
                                                        <span
                                                            className={cx(
                                                                'status',
                                                                `status-${complaint.status.toLowerCase().replace(/\s+/g, '-')}`,
                                                            )}
                                                        >
                                                            {complaint.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {complaint.assignedToRaw === 'ADMIN' ? (
                                                            <span className={cx('authority-tag', 'authority-transfer')}>
                                                                {complaint.authority}
                                                            </span>
                                                        ) : (
                                                            <span className={cx('authority-tag')}>{complaint.authority}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={cx('view-btn')}
                                                            onClick={() => handleView(complaint)}
                                                        >
                                                            Xem
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Card phải: Chi tiết khiếu nại */}
                        <div className={cx('card', 'detail-card')}>
                            <div className={cx('card-header')}>
                                <h2 className={cx('card-title')}>Chi tiết khiếu nại</h2>
                                <p className={cx('card-desc')}>
                                    {selectedComplaint
                                        ? 'Thông tin chi tiết về khiếu nại được chọn.'
                                        : 'Chọn một khiếu nại từ danh sách để xem chi tiết.'}
                                </p>
                            </div>

                            {selectedComplaint ? (
                                <div className={cx('detail-content')}>
                                    {actionError && (
                                        <div style={{ color: 'red', marginBottom: '12px', padding: '8px', background: '#fee', borderRadius: '4px' }}>
                                            {actionError}
                                        </div>
                                    )}
                                    {actionSuccess && (
                                        <div style={{ color: 'green', marginBottom: '12px', padding: '8px', background: '#efe', borderRadius: '4px' }}>
                                            {actionSuccess}
                                        </div>
                                    )}

                                    <div className={cx('detail-section')}>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Mã đơn hàng:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.orderCode || selectedComplaint.id.substring(0, 8)}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Tên:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.customer}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Email:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.email}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>SĐT:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.phone}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Ngày:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.date}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Nội dung:</span>
                                            <span className={cx('detail-value')}>{selectedComplaint.content}</span>
                                        </div>
                                        <div className={cx('detail-row')}>
                                            <span className={cx('detail-label')}>Người xử lý:</span>
                                            <span className={cx('detail-value')}>
                                                {selectedComplaint.handlerName 
                                                    ? `CSKH - ${selectedComplaint.handlerName}`
                                                    : selectedComplaint.assignedToRaw === 'ADMIN' 
                                                        ? 'Admin' 
                                                        : 'Chưa có người xử lý'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={cx('notes-section')}>
                                        <label className={cx('notes-label')}>Ghi chú xử lý</label>
                                        <textarea
                                            className={cx('notes-input')}
                                            placeholder="Ghi chú ngắn"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={4}
                                            disabled={actionLoading}
                                        />
                                    </div>

                                    <div className={cx('action-buttons')}>
                                        <button
                                            className={cx('action-btn', 'btn-resolved')}
                                            onClick={handleResolved}
                                            disabled={actionLoading || selectedComplaint.statusRaw === 'RESOLVED'}
                                        >
                                            {actionLoading ? 'Đang xử lý...' : 'Đã giải quyết'}
                                        </button>
                                        <button
                                            className={cx('action-btn', 'btn-save-note')}
                                            onClick={handleAcceptComplaint}
                                            disabled={actionLoading || 
                                                selectedComplaint.statusRaw === 'RESOLVED' ||
                                                (selectedComplaint.handlerId && selectedComplaint.handlerId !== '' && selectedComplaint.handlerId !== currentUserId)}
                                        >
                                            {actionLoading 
                                                ? 'Đang tiếp nhận...' 
                                                : selectedComplaint.statusRaw === 'RESOLVED'
                                                    ? 'Đã giải quyết'
                                                    : selectedComplaint.handlerId 
                                                        ? (selectedComplaint.handlerId === currentUserId ? 'Đã tiếp nhận (Bạn)' : 'Đã có người xử lý') 
                                                        : 'Tiếp nhận khiếu nại'}
                                        </button>
                                        <button
                                            className={cx('action-btn', 'btn-transfer')}
                                            onClick={handleTransferAdmin}
                                            disabled={actionLoading || selectedComplaint.assignedToRaw === 'ADMIN'}
                                        >
                                            {actionLoading ? 'Đang chuyển...' : 'Chuyển cho Admin'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={cx('empty-detail')}>
                                    <p>Chưa có khiếu nại nào được chọn</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm || (() => {})}
                onCancel={() =>
                    setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
                }
                confirmText="Chuyển Admin"
                cancelText="Hủy"
            />
            <Notification
                open={notif.open}
                type={notif.type}
                title={notif.title}
                message={notif.message}
                duration={notif.duration}
                onClose={() => setNotif((prev) => ({ ...prev, open: false }))}
            />
        </div>
    );
}
