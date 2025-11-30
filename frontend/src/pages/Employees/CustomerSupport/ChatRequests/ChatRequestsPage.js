import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ChatRequestsPage.module.scss';
import { getStoredToken } from '../../../../services/utils';
import { getPendingConversations, acceptConversation } from '../../../../services';
import { useNotification } from '../../../../components/Common/Notification';
import { getMyInfo } from '../../../../services';

const cx = classNames.bind(styles);

export default function ChatRequestsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [pendingConversations, setPendingConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPending, setIsLoadingPending] = useState(false);
    const { error: showError, success } = useNotification();

    // Load user info
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = getStoredToken('token');
                if (!token) {
                    setUser(null);
                    setLoadingUser(false);
                    return;
                }
                const userData = await getMyInfo(token);
                if (userData && userData.id) {
                    const role = userData?.role?.name || userData?.role || null;
                    setUser({ ...userData, role });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Error loading user:', err);
                setUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        loadUser();
    }, []);

    // Load pending conversations
    useEffect(() => {
        if (user) {
            loadPendingConversations();
            // Poll mỗi 10 giây để cập nhật yêu cầu mới
            const interval = setInterval(() => {
                loadPendingConversations();
            }, 10000);
            return () => clearInterval(interval);
        } else {
            setIsLoadingPending(false);
            setPendingConversations([]);
        }
    }, [user]);

    const loadPendingConversations = async () => {
        if (isLoadingPending) {
            return;
        }

        try {
            const token = getStoredToken('token');
            if (!token) {
                setIsLoadingPending(false);
                setPendingConversations([]);
                return;
            }
            setIsLoadingPending(true);
            const { ok, data, status } = await getPendingConversations(token);
            if (status === 401) {
                setIsLoadingPending(false);
                setPendingConversations([]);
                return;
            }
            if (ok && Array.isArray(data)) {
                setPendingConversations(data);
            } else {
                setPendingConversations([]);
            }
        } catch (err) {
            if (err?.response?.status !== 401 && err?.status !== 401) {
                console.error('Error loading pending conversations:', err);
            }
            setPendingConversations([]);
        } finally {
            setIsLoadingPending(false);
        }
    };

    const handleAcceptRequest = async (conversation) => {
        try {
            const token = getStoredToken('token');
            if (!token) {
                showError('Vui lòng đăng nhập');
                return;
            }

            setIsLoading(true);
            const { ok, status, data } = await acceptConversation(conversation.partnerId, token);
            
            if (ok) {
                success('Đã tiếp nhận yêu cầu thành công! Bạn đã trở thành người phụ trách.');
                // Chuyển sang trang chat với khách hàng này
                navigate(`/customer-support/chat/${conversation.partnerId}`);
            } else {
                if (status === 401 || status === 403) {
                    showError('Yêu cầu này đã được CSKH khác tiếp nhận hoặc bạn đã tiếp nhận rồi.');
                } else {
                    showError('Không thể tiếp nhận yêu cầu. Vui lòng thử lại.');
                }
            }
        } catch (err) {
            console.error('Error accepting conversation:', err);
            if (err?.message?.includes('đã được CSKH khác')) {
                showError('Yêu cầu này đã được CSKH khác tiếp nhận.');
            } else {
                showError('Có lỗi xảy ra khi tiếp nhận yêu cầu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
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
            return date.toLocaleDateString('vi-VN');
        }
    };

    // Kiểm tra quyền truy cập
    if (loadingUser) {
        return (
            <div className={cx('container')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    const userRole = user?.role?.name || user?.role;
    if (!user || (userRole !== 'CUSTOMER_SUPPORT' && userRole !== 'ADMIN')) {
        return (
            <div className={cx('container')}>
                <div className={cx('error')}>Bạn không có quyền truy cập trang này.</div>
            </div>
        );
    }

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Yêu cầu Chat</h1>
                <p className={cx('subtitle')}>Tiếp nhận và xử lý yêu cầu chat từ khách hàng</p>
            </div>

            {isLoadingPending ? (
                <div className={cx('loading')}>Đang tải yêu cầu...</div>
            ) : pendingConversations.length === 0 ? (
                <div className={cx('empty')}>
                    <div className={cx('empty-icon')}>💬</div>
                    <h3>Không có yêu cầu mới</h3>
                    <p>Tất cả yêu cầu chat đã được tiếp nhận</p>
                </div>
            ) : (
                <div className={cx('requests-list')}>
                    {pendingConversations.map((conv) => (
                        <div key={conv.partnerId} className={cx('request-card')}>
                            <div className={cx('request-header')}>
                                <div className={cx('customer-info')}>
                                    <div className={cx('avatar')}>
                                        {conv.partnerName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h3>{conv.partnerName || conv.partnerEmail}</h3>
                                        <p>{conv.partnerEmail}</p>
                                    </div>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className={cx('unread-badge')}>
                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount} tin nhắn
                                    </span>
                                )}
                            </div>

                            <div className={cx('request-content')}>
                                <p className={cx('last-message')}>
                                    <strong>Tin nhắn cuối:</strong> {conv.lastMessage || 'Chưa có tin nhắn'}
                                </p>
                                {conv.lastMessageTime && (
                                    <span className={cx('time')}>
                                        {formatTime(conv.lastMessageTime)}
                                    </span>
                                )}
                            </div>

                            <div className={cx('request-actions')}>
                                <button
                                    className={cx('accept-button')}
                                    onClick={() => handleAcceptRequest(conv)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Tiếp nhận'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

