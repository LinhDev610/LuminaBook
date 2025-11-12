import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageComplaintsPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../services/utils';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);

// Map status from backend to display
const statusMap = {
    NEW: 'Chờ xử lý',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    ESCALATED: 'Chuyển Admin',
};

export default function ManageComplaintsPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [note, setNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

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
                const mappedComplaints = (data?.result || []).map((ticket) => {
                    // Extract username from email (part before @)
                    const username = ticket.email ? ticket.email.split('@')[0] : '';
                    // Format date as dd/mm/yyyy
                    const dateStr = ticket.createdAt 
                        ? formatDateTime(ticket.createdAt).split(' ')[0] 
                        : '';

                    return {
                        id: ticket.id,
                        orderCode: ticket.orderCode,
                        customer: ticket.customerName,
                        username: username,
                        phone: ticket.phone,
                        email: ticket.email,
                        status: statusMap[ticket.status] || ticket.status,
                        statusRaw: ticket.status,
                        assignedToRaw: ticket.assignedTo,
                        handlerId: ticket.handlerId || '',
                        handlerName: ticket.handlerName || '',
                        date: dateStr,
                        createdAt: ticket.createdAt,
                        content: ticket.content,
                        handlerNote: ticket.handlerNote || '',
                    };
                });

                setComplaints(mappedComplaints);
                setFilteredComplaints(mappedComplaints);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách khiếu nại');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, [API_BASE_URL]);

    // Filter complaints
    useEffect(() => {
        let filtered = [...complaints];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.orderCode?.toLowerCase().includes(term) ||
                    c.customer?.toLowerCase().includes(term) ||
                    c.username?.toLowerCase().includes(term) ||
                    c.phone?.toLowerCase().includes(term) ||
                    c.email?.toLowerCase().includes(term),
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter((c) => {
                if (!c.createdAt) return false;
                // Convert dateFilter (YYYY-MM-DD) to Date object
                const filterDate = new Date(dateFilter);
                const complaintDate = new Date(c.createdAt);
                // Compare dates (ignore time)
                return (
                    filterDate.getFullYear() === complaintDate.getFullYear() &&
                    filterDate.getMonth() === complaintDate.getMonth() &&
                    filterDate.getDate() === complaintDate.getDate()
                );
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((c) => c.status === statusFilter);
        }

        setFilteredComplaints(filtered);
    }, [complaints, searchTerm, dateFilter, statusFilter]);

    const handleSearch = () => {
        // Filter is handled by useEffect
    };

    const handleView = (complaint) => {
        setSelectedComplaint(complaint);
        setNote(complaint.handlerNote || '');
        setActionError('');
        setActionSuccess('');
        setShowDetailModal(true);
    };

    const closeModal = () => {
        setShowDetailModal(false);
        setSelectedComplaint(null);
        setNote('');
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
                const mappedComplaints = (data?.result || []).map((ticket) => {
                    const username = ticket.email ? ticket.email.split('@')[0] : '';
                    const dateStr = ticket.createdAt 
                        ? formatDateTime(ticket.createdAt).split(' ')[0] 
                        : '';

                    return {
                        id: ticket.id,
                        orderCode: ticket.orderCode,
                        customer: ticket.customerName,
                        username: username,
                        phone: ticket.phone,
                        email: ticket.email,
                        status: statusMap[ticket.status] || ticket.status,
                        statusRaw: ticket.status,
                        assignedToRaw: ticket.assignedTo,
                        handlerId: ticket.handlerId || '',
                        handlerName: ticket.handlerName || '',
                        date: dateStr,
                        createdAt: ticket.createdAt,
                        content: ticket.content,
                        handlerNote: ticket.handlerNote || '',
                    };
                });

                setComplaints(mappedComplaints);

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

    const handleSaveNote = async () => {
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
                throw new Error(data?.message || 'Không thể lưu ghi chú');
            }

            setActionSuccess('Đã lưu ghi chú thành công!');
            await refreshComplaints();
            setTimeout(() => {
                setActionSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error saving note:', err);
            setActionError(err.message || 'Đã xảy ra lỗi khi lưu ghi chú');
        } finally {
            setActionLoading(false);
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

            setActionSuccess('Đã đánh dấu giải quyết thành công!');
            await refreshComplaints();
            setTimeout(() => {
                setActionSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error resolving complaint:', err);
            setActionError(err.message || 'Đã xảy ra lỗi khi đánh dấu giải quyết');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý khiếu nại</h1>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải danh sách khiếu nại...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý khiếu nại</h1>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý khiếu nại</h1>

            {/* Search and Filter */}
            <SearchAndSort
                searchPlaceholder="Tìm kiếm theo mã đơn, Username,....."
                searchValue={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onSearchClick={handleSearch}
                dateFilter={dateFilter}
                onDateChange={setDateFilter}
                dateLabel="Ngày"
                sortLabel="Sắp xếp:"
                sortOptions={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'Chờ xử lý', label: 'Chờ xử lý' },
                    { value: 'Đang xử lý', label: 'Đang xử lý' },
                    { value: 'Đã giải quyết', label: 'Đã giải quyết' },
                    { value: 'Chuyển Admin', label: 'Chuyển Admin' },
                ]}
                sortValue={statusFilter}
                onSortChange={(e) => setStatusFilter(e.target.value)}
            />

            {/* Complaint List Table */}
            <div className={cx('table-container')}>
                <h2 className={cx('table-title')}>Danh sách khiếu nại</h2>
                {filteredComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Không tìm thấy khiếu nại nào</p>
                    </div>
                ) : (
                    <table className={cx('complaint-table')}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Họ và tên</th>
                                <th>Username</th>
                                <th>Nội dung khiếu nại</th>
                                <th>Ngày gửi</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComplaints.map((complaint, index) => (
                                <tr key={complaint.id} className={index % 2 === 1 ? cx('odd-row') : ''}>
                                    <td>{complaint.orderCode || `#${complaint.id.substring(0, 6).toUpperCase()}`}</td>
                                    <td>{complaint.customer}</td>
                                    <td>{complaint.username}</td>
                                    <td className={cx('content-cell')}>{complaint.content}</td>
                                    <td>{complaint.date}</td>
                                    <td>
                                        <span
                                            className={cx(
                                                'status-tag',
                                                `status-${complaint.statusRaw?.toLowerCase().replace(/_/g, '-')}`,
                                            )}
                                        >
                                            {complaint.status}
                                        </span>
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

            {/* Detail Modal */}
            {showDetailModal && selectedComplaint && (
                <div className={cx('modal-overlay')} onClick={closeModal}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h2 className={cx('modal-title')}>
                                Chi tiết khiếu nại {selectedComplaint.orderCode || `KN${selectedComplaint.id.substring(0, 6).toUpperCase()}`}
                            </h2>
                            <button className={cx('modal-close')} onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <div className={cx('modal-content')}>
                            <div className={cx('detail-info')}>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Họ và tên:</span>
                                    <span className={cx('detail-value')}>{selectedComplaint.customer}</span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Username:</span>
                                    <span className={cx('detail-value')}>{selectedComplaint.username}</span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Ngày gửi:</span>
                                    <span className={cx('detail-value')}>{selectedComplaint.date}</span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Nội dung:</span>
                                    <span className={cx('detail-value', 'content-value')}>{selectedComplaint.content}</span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Người phụ trách:</span>
                                    <span className={cx('detail-value')}>
                                        {selectedComplaint.handlerName 
                                            ? `CSKH - ${selectedComplaint.handlerName}`
                                            : selectedComplaint.assignedToRaw === 'ADMIN' 
                                                ? 'Admin' 
                                                : 'CSKH'}
                                    </span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Trạng thái:</span>
                                    <span className={cx('detail-value')}>{selectedComplaint.status}</span>
                                </div>
                                <div className={cx('detail-row')}>
                                    <span className={cx('detail-label')}>Ghi chú quản trị:</span>
                                    <span className={cx('detail-value', 'content-value')}>
                                        {selectedComplaint.handlerNote || 'Chưa có ghi chú'}
                                    </span>
                                </div>
                            </div>

                            <div className={cx('modal-action')}>
                                <button
                                    className={cx('view-detail-btn')}
                                    onClick={() => {
                                        closeModal();
                                        navigate(`/admin/complaints/${selectedComplaint.id}`);
                                    }}
                                >
                                    Xem chi tiết khiếu nại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
