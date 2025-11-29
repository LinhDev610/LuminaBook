import React, { useEffect, useState, useCallback } from 'react';
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import styles from './StaffNotificationPage.module.scss';
import { useNotification } from '../../../../components/Common/Notification';
import {
    getStoredToken,
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllReadNotifications,
    formatDateTime,
} from '../../../../services';

const cx = classNames.bind(styles);
const LOW_STOCK_REGEX =
    /sản phẩm\s+"([^"]+)"\s*\(Mã:\s*([^)]+)\).*vui lòng nhập thêm\./i;

// Format thời gian tương đối (ví dụ: "5 phút trước")
const formatRelativeTime = (dateString) => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Vừa xong';
        } else if (diffMins < 60) {
            return `${diffMins} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return formatDateTime(dateString);
        }
    } catch (error) {
        return formatDateTime(dateString);
    }
};

export default function StaffNotificationPage() {
    const navigate = useNavigate();
    const { success, error: notifyError } = useNotification();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const token = getStoredToken('token');
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                return;
            }

            const result = await getMyNotifications(token);
            console.log('Notification API result:', result);

            if (result.ok) {
                // Kiểm tra nếu result.data là mảng
                if (Array.isArray(result.data)) {
                    if (result.data.length > 0) {
                        // Sắp xếp theo thời gian mới nhất trước
                        const sorted = result.data.sort((a, b) => {
                            const dateA = new Date(a.createdAt || a.created_at || 0);
                            const dateB = new Date(b.createdAt || b.created_at || 0);
                            return dateB - dateA;
                        });
                        setNotifications(sorted);
                    } else {
                        // Mảng rỗng - không có thông báo
                        setNotifications([]);
                    }
                } else {
                    // result.data không phải là mảng
                    console.warn('Notification API returned non-array data:', result.data);
                    setNotifications([]);
                }
            } else {
                // API trả về lỗi
                console.error('Notification API error:', result.status, result.data);
                if (result.status === 404) {
                    console.warn('Notification API endpoint not found (404). Check if backend is running and endpoint exists.');
                } else if (result.status === 401 || result.status === 403) {
                    notifyError('Không có quyền truy cập thông báo');
                } else {
                    notifyError('Không thể tải danh sách thông báo. Status: ' + result.status);
                }
                setNotifications([]);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            notifyError('Không thể tải danh sách thông báo');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [notifyError]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Đánh dấu một thông báo là đã đọc
    const handleMarkAsRead = async (notificationId) => {
        if (processingIds.has(notificationId)) return;

        try {
            setProcessingIds((prev) => new Set(prev).add(notificationId));
            const token = getStoredToken('token');
            const result = await markNotificationAsRead(notificationId, token);

            if (result.ok) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.id === notificationId
                            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                            : notif,
                    ),
                );
            } else {
                notifyError('Không thể đánh dấu đã đọc');
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
            notifyError('Có lỗi xảy ra khi đánh dấu đã đọc');
        } finally {
            setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    };

    // Đánh dấu tất cả là đã đọc
    const handleMarkAllAsRead = async () => {
        try {
            const token = getStoredToken('token');
            const result = await markAllNotificationsAsRead(token);

            if (result.ok) {
                setNotifications((prev) =>
                    prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date().toISOString() })),
                );
                success('Đã đánh dấu tất cả thông báo là đã đọc');
            } else {
                notifyError('Không thể đánh dấu tất cả đã đọc');
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
            notifyError('Có lỗi xảy ra');
        }
    };

    // Xóa một thông báo
    const handleDelete = async (notificationId) => {
        if (processingIds.has(notificationId)) return;

        if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            return;
        }

        try {
            setProcessingIds((prev) => new Set(prev).add(notificationId));
            const token = getStoredToken('token');
            const result = await deleteNotification(notificationId, token);

            if (result.ok) {
                setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
                success('Đã xóa thông báo');
            } else {
                notifyError('Không thể xóa thông báo');
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            notifyError('Có lỗi xảy ra khi xóa thông báo');
        } finally {
            setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    };

    // Xóa tất cả thông báo đã đọc
    const handleDeleteAllRead = async () => {
        const readCount = notifications.filter((n) => n.isRead || n.readAt).length;
        if (readCount === 0) {
            notifyError('Không có thông báo đã đọc để xóa');
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${readCount} thông báo đã đọc?`)) {
            return;
        }

        try {
            const token = getStoredToken('token');
            const result = await deleteAllReadNotifications(token);

            if (result.ok) {
                setNotifications((prev) => prev.filter((notif) => !notif.isRead && !notif.readAt));
                success(`Đã xóa ${readCount} thông báo đã đọc`);
            } else {
                notifyError('Không thể xóa thông báo đã đọc');
            }
        } catch (err) {
            console.error('Error deleting all read notifications:', err);
            notifyError('Có lỗi xảy ra');
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead && !n.readAt).length;

    const handleViewDetail = (notification) => {
        if (!notification?.link) return;
        if (!notification.isRead && !notification.readAt) {
            handleMarkAsRead(notification.id);
        }
        navigate(notification.link);
    };

    const renderNotificationMessage = (notification) => {
        const rawMessage = notification.message || notification.content || '';
        if (!rawMessage) return '';

        if (LOW_STOCK_REGEX.test(rawMessage)) {
            const match = rawMessage.match(LOW_STOCK_REGEX);
            const productCode = match?.[2]?.trim();

            if (productCode) {
                const productLink = `/staff/products/${encodeURIComponent(productCode)}`;

                return (
                    <>
                        {rawMessage}{' '}
                        <Link
                            to={productLink}
                            className={cx('notification-inline-link')}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (!notification.isRead && !notification.readAt) {
                                    handleMarkAsRead(notification.id);
                                }
                            }}
                        >
                            Xem chi tiết sản phẩm
                        </Link>
                    </>
                );
            }
        }

        return rawMessage;
    };

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>
                    Thông báo
                    {unreadCount > 0 && (
                        <span className={cx('badge')}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </h1>
                <div className={cx('actions')}>
                    <button className={cx('btn', 'btn-secondary')} onClick={() => navigate('/staff')}>
                        ← Quay lại Dashboard
                    </button>
                    <button
                        className={cx('btn', 'btn-primary')}
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0 || loading}
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                    <button
                        className={cx('btn', 'btn-danger')}
                        onClick={handleDeleteAllRead}
                        disabled={notifications.filter((n) => n.isRead || n.readAt).length === 0 || loading}
                    >
                        Xóa tất cả đã đọc
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={cx('loading')}>Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
                <div className={cx('empty')}>
                    <p className={cx('empty-title')}>Không có thông báo nào</p>
                    <p className={cx('empty-desc')}>
                        Các thông báo từ admin sẽ hiển thị tại đây khi bạn có thông báo mới.
                    </p>
                </div>
            ) : (
                <div className={cx('notifications-list')}>
                    {notifications.map((notification) => {
                        const isRead = notification.isRead || notification.readAt;
                        const isProcessing = processingIds.has(notification.id);
                        const relativeTime = formatRelativeTime(
                            notification.createdAt || notification.created_at,
                        );

                        return (
                            <div
                                key={notification.id}
                                className={cx('notification-item', { read: isRead, unread: !isRead })}
                            >
                                <div className={cx('notification-content')}>
                                    <h3 className={cx('notification-title')}>
                                        {notification.title || 'Thông báo'}
                                    </h3>
                                    <p className={cx('notification-message')}>
                                        {renderNotificationMessage(notification)}
                                    </p>
                                    <span className={cx('notification-time')}>{relativeTime}</span>
                                </div>
                                <div className={cx('notification-actions')}>
                                    {notification.link && (
                                        <button
                                            className={cx('btn', 'btn-link')}
                                            onClick={() => handleViewDetail(notification)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    )}
                                    {!isRead && (
                                        <button
                                            className={cx('btn', 'btn-read')}
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            disabled={isProcessing}
                                        >
                                            Đã đọc
                                        </button>
                                    )}
                                    <button
                                        className={cx('btn', 'btn-delete')}
                                        onClick={() => handleDelete(notification.id)}
                                        disabled={isProcessing}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

