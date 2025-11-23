import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ComplaintsDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';
import { sendNotificationToUser } from '../../../../services';

const cx = classNames.bind(styles);

// Map status from backend to display
const statusMap = {
    NEW: 'Chờ xử lý',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    ESCALATED: 'Chuyển Admin',
};

// Reverse map for updating
const statusReverseMap = {
    'Chờ xử lý': 'NEW',
    'Đang xử lý': 'IN_PROGRESS',
    'Đã giải quyết': 'RESOLVED',
    'Chuyển Admin': 'ESCALATED',
};

export default function ComplaintsDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Fetch staff list for assignee dropdown
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok && data?.result) {
                    // Filter CSKH and Admin
                    const staff = data.result
                        .filter((user) => {
                            const roleName = user?.role?.name;
                            return roleName === 'CUSTOMER_SUPPORT' || roleName === 'ADMIN';
                        })
                        .map((user) => ({
                            id: user.id,
                            name: user.fullName || user.full_name || user.email?.split('@')[0] || '',
                            role: user.role?.name || '',
                            email: user.email || '',
                        }));
                    setStaffList(staff);
                }
            } catch (err) {
                console.error('Error fetching staff:', err);
            }
        };

        fetchStaff();
    }, [API_BASE_URL]);

    // Fetch complaint detail
    useEffect(() => {
        const fetchComplaint = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để xem chi tiết khiếu nại');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải chi tiết khiếu nại');
                }

                const ticket = data?.result;
                if (ticket) {
                    const username = ticket.email ? ticket.email.split('@')[0] : '';
                    const dateStr = ticket.createdAt 
                        ? formatDateTime(ticket.createdAt).split(' ')[0] 
                        : '';
                    
                    // Format phone number with spaces (e.g., "0905123789" -> "0905 123 789")
                    const formatPhone = (phone) => {
                        if (!phone) return '';
                        const cleaned = phone.replace(/\s/g, '');
                        if (cleaned.length >= 10) {
                            return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
                        }
                        return phone;
                    };

                    setComplaint({
                        id: ticket.id,
                        orderCode: ticket.orderCode,
                        customer: ticket.customerName,
                        username: username,
                        phone: formatPhone(ticket.phone),
                        email: ticket.email,
                        status: statusMap[ticket.status] || ticket.status,
                        statusRaw: ticket.status,
                        assignedToRaw: ticket.assignedTo,
                        handlerId: ticket.handlerId || '',
                        handlerName: ticket.handlerName || '',
                        date: dateStr,
                        createdAt: ticket.createdAt,
                        updatedAt: ticket.updatedAt,
                        content: ticket.content,
                        handlerNote: ticket.handlerNote || '',
                    });
                    setNote(ticket.handlerNote || '');
                    setSelectedStatus(statusMap[ticket.status] || ticket.status);
                    setSelectedAssignee(ticket.assignedTo || 'CS');
                }
            } catch (err) {
                console.error('Error fetching complaint:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải chi tiết khiếu nại');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchComplaint();
        }
    }, [id, API_BASE_URL]);

    const handleSave = async () => {
        if (!complaint) return;

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

            const updateData = {
                handlerNote: note || '',
            };

            // Track changes for notifications
            const oldStatus = complaint.statusRaw;
            const oldAssignee = complaint.assignedToRaw;
            const newStatus = selectedStatus && statusReverseMap[selectedStatus] ? statusReverseMap[selectedStatus] : oldStatus;
            const newAssignee = selectedAssignee || oldAssignee;

            // Add status if changed
            if (selectedStatus && statusReverseMap[selectedStatus]) {
                updateData.status = statusReverseMap[selectedStatus];
            }

            // Add assignee if changed
            if (selectedAssignee) {
                updateData.assignedTo = selectedAssignee;
            }

            const response = await fetch(`${API_BASE_URL}/api/tickets/${complaint.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Không thể lưu thay đổi');
            }

            // Gửi thông báo cho CustomerSupport nếu admin nhận hoặc hoàn thành khiếu nại
            try {
                // Lấy danh sách CustomerSupport để gửi thông báo
                const usersResponse = await fetch(`${API_BASE_URL}/users`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    const customerSupportUsers = (usersData?.result || []).filter(
                        (user) => user?.role?.name === 'CUSTOMER_SUPPORT'
                    );

                    const orderCode = complaint.orderCode || `#KN${complaint.id.substring(0, 6).toUpperCase()}`;

                    // Case 1: Admin nhận khiếu nại (chuyển từ CS sang ADMIN hoặc status = IN_PROGRESS với ADMIN)
                    if (
                        (oldAssignee === 'CS' && newAssignee === 'ADMIN') ||
                        (newAssignee === 'ADMIN' && newStatus === 'IN_PROGRESS' && oldStatus !== 'IN_PROGRESS')
                    ) {
                        for (const user of customerSupportUsers) {
                            await sendNotificationToUser(
                                user.id,
                                {
                                    title: 'Admin đã nhận khiếu nại',
                                    message: `Admin đã nhận khiếu nại ${orderCode} để xử lý.`,
                                    type: 'INFO',
                                },
                                token
                            );
                        }
                    }

                    // Case 2: Admin hoàn thành khiếu nại (status = RESOLVED)
                    if (oldStatus !== 'RESOLVED' && newStatus === 'RESOLVED') {
                        for (const user of customerSupportUsers) {
                            await sendNotificationToUser(
                                user.id,
                                {
                                    title: 'Admin đã hoàn thành khiếu nại',
                                    message: `Admin đã hoàn thành xử lý khiếu nại ${orderCode}.`,
                                    type: 'SUCCESS',
                                },
                                token
                            );
                        }
                    }
                }
            } catch (notifError) {
                // Không throw error để không ảnh hưởng đến flow chính
                console.error('Error sending notification:', notifError);
            }

            setActionSuccess('Đã lưu thay đổi thành công!');
            setTimeout(() => {
                setActionSuccess('');
                navigate('/admin/complaints');
            }, 1500);
        } catch (err) {
            console.error('Error saving changes:', err);
            setActionError(err.message || 'Đã xảy ra lỗi khi lưu thay đổi');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/complaints');
    };

    if (loading) {
        return (
            <div className={cx('detail-page')}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải chi tiết khiếu nại...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('detail-page')}>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                    <button onClick={() => navigate('/admin/complaints')} style={{ marginTop: '16px', padding: '8px 16px' }}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className={cx('detail-page')}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Không tìm thấy khiếu nại</p>
                    <button onClick={() => navigate('/admin/complaints')} style={{ marginTop: '16px', padding: '8px 16px' }}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Get assignee options
    const assigneeOptions = [
        { value: 'CS', label: 'CSKH' },
        { value: 'ADMIN', label: 'Admin' },
    ];

    // Get staff options for CSKH
    const cskhStaff = staffList.filter((s) => s.role === 'CUSTOMER_SUPPORT');
    const adminStaff = staffList.filter((s) => s.role === 'ADMIN');

    // Helper: determine handler role label (prefer actual handler role over assignedTo)
    const getHandlerRoleLabel = () => {
        try {
            if (complaint?.handlerId && Array.isArray(staffList) && staffList.length > 0) {
                const staff = staffList.find(
                    (s) => String(s.id) === String(complaint.handlerId),
                );
                if (staff?.role === 'ADMIN') return 'Admin';
                if (staff?.role === 'CUSTOMER_SUPPORT') return 'CSKH';
            }
        } catch (_) {
            // ignore
        }
        return complaint?.assignedToRaw === 'ADMIN' ? 'Admin' : 'CSKH';
    };

    return (
        <div className={cx('detail-page')}>
            <div className={cx('page-header')}>
                <button className={cx('back-btn')} onClick={handleCancel}>
                    ←
                </button>
                <h1 className={cx('page-title')}>Chi tiết khiếu nại</h1>
            </div>

            <div className={cx('content-card')}>
                {actionError && (
                    <div className={cx('alert', 'alert-error')}>
                        {actionError}
                    </div>
                )}
                {actionSuccess && (
                    <div className={cx('alert', 'alert-success')}>
                        {actionSuccess}
                    </div>
                )}

                {/* Complaint ID and Warning Banner */}
                <div className={cx('complaint-header')}>
                    <h2 className={cx('complaint-id')}>
                        Đơn khiếu nại {complaint.orderCode || `#KN${complaint.id.substring(0, 6).toUpperCase()}`}
                    </h2>
                    {complaint.statusRaw === 'RESOLVED' && (
                        <>
                            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                                {(() => {
                                    const roleLabel = getHandlerRoleLabel();
                                    const doneDate = complaint.updatedAt
                                        ? formatDateTime(complaint.updatedAt).split(' ')[0]
                                        : complaint.date;
                                    const namePart = complaint.handlerName ? ` - ${complaint.handlerName}` : '';
                                    return `Được xử lý bởi bộ phận ${roleLabel}${namePart} - Ngày hoàn tất: ${doneDate}`;
                                })()}
                            </div>
                            <div className={cx('alert', 'alert-success')} style={{ marginTop: '12px' }}>
                                {(() => {
                                    const roleLabel = getHandlerRoleLabel();
                                    const namePart = complaint.handlerName ? ` - ${complaint.handlerName}` : '';
                                    return `✓ Khiếu nại đã được ${roleLabel}${namePart} xử lý và cập nhật trạng thái.`;
                                })()}
                            </div>
                        </>
                    )}
                    <div className={cx('warning-banner')}>
                        <span className={cx('warning-icon')}>⚠️</span>
                        <span className={cx('warning-text')}>
                            Liên hệ khách hàng qua số điện thoại bên dưới để xác minh khiếu nại.
                        </span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className={cx('form-section')}>
                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Họ và tên khách hàng:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={complaint.customer}
                            readOnly
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Tên đăng nhập (Username):</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={complaint.username}
                            readOnly
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Số điện thoại:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={complaint.phone}
                            readOnly
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ngày gửi:</label>
                        <input
                            type="text"
                            className={cx('form-input')}
                            value={complaint.date}
                            readOnly
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Nội dung khiếu nại:</label>
                        <textarea
                            className={cx('form-textarea')}
                            value={complaint.content}
                            readOnly
                            rows={4}
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Người phụ trách:</label>
                        <select
                            className={cx('form-select')}
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            disabled={actionLoading}
                        >
                            {assigneeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.value === 'CS' && complaint.handlerName 
                                        ? `CSKH - ${complaint.handlerName}`
                                        : option.label}
                                </option>
                            ))}
                        </select>
                        {complaint.handlerName && selectedAssignee === 'CS' && (
                            <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                                Đang xử lý bởi: {complaint.handlerName}
                            </div>
                        )}
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Trạng thái khiếu nại:</label>
                        <select
                            className={cx('form-select')}
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            disabled={actionLoading}
                        >
                            {Object.entries(statusMap).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                        <div className={cx('status-warning')}>
                            <span className={cx('warning-icon-small')}>⚠️</span>
                            <span>Chỉ thay đổi trạng thái khi đơn đã được xử lý xong.</span>
                        </div>
                    </div>

                    <div className={cx('form-row')}>
                        <label className={cx('form-label')}>Ghi chú xử lý:</label>
                        <textarea
                            className={cx('form-textarea', 'notes-textarea')}
                            placeholder="Ghi chú ngắn"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={6}
                            disabled={actionLoading}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cx('action-buttons')}>
                    <button
                        className={cx('action-btn', 'btn-cancel')}
                        onClick={handleCancel}
                        disabled={actionLoading}
                    >
                        Hủy
                    </button>
                    <button
                        className={cx('action-btn', 'btn-save')}
                        onClick={handleSave}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
