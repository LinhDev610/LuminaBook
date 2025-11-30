import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import styles from './ChatManagementPage.module.scss';
import { getStoredToken } from '../../../../services/utils';
import {
    getChatConversations,
    getChatConversation,
    sendChatMessage,
    markChatAsRead,
    getChatUnreadCount,
} from '../../../../services';
import { useNotification } from '../../../../components/Common/Notification';
import { getMyInfo } from '../../../../services';

const cx = classNames.bind(styles);

export default function ChatManagementPage() {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const shouldAutoScrollRef = useRef(true); // Flag để kiểm tra có nên auto scroll không
    const isLoadingMessagesRef = useRef(false); // Ref để lưu loading state
    const selectedConversationRef = useRef(null); // Ref để lưu selectedConversation
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

    // Load conversations
    useEffect(() => {
        if (user) {
            // Load ngay lập tức
            loadConversations();
            // Poll mỗi 15 giây (tăng từ 5s để giảm request)
            const interval = setInterval(() => {
                loadConversations();
            }, 15000);
            return () => clearInterval(interval);
        } else {
            // Nếu không có user, reset loading state
            setIsLoadingConversations(false);
            setConversations([]);
        }
    }, [user]);

    // Load messages khi chọn conversation
    useEffect(() => {
        if (selectedConversation) {
            setMessages([]); // Clear messages trước khi load mới
            setIsLoadingMessages(true); // Set loading state
            shouldAutoScrollRef.current = true; // Cho phép scroll khi chọn conversation mới
            loadMessages(selectedConversation.partnerId);
            // Chỉ mark as read một lần khi chọn conversation, không phải mỗi lần polling
            markAsRead(selectedConversation.partnerId);
        } else {
            setMessages([]);
            setIsLoadingMessages(false);
        }
    }, [selectedConversation]);

    // Detect khi người dùng scroll để tắt auto-scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // Nếu người dùng scroll lên (không phải ở cuối), tắt auto-scroll
            const isAtBottom = isNearBottom();
            if (!isAtBottom) {
                shouldAutoScrollRef.current = false;
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [selectedConversation]);

    // Cập nhật ref khi selectedConversation thay đổi
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // Polling để lấy tin nhắn mới
    useEffect(() => {
        // Luôn clear interval trước khi tạo mới để tránh duplicate
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (selectedConversation) {
            // Poll mỗi 3 giây để giảm số lượng request (tăng từ 1.5s lên 3s)
            // Loại bỏ loadConversations khỏi đây để tránh duplicate polling
            pollingIntervalRef.current = setInterval(() => {
                // Chỉ poll nếu tab/window đang active và không đang loading
                const currentConv = selectedConversationRef.current;
                if (document.visibilityState === 'visible' && 
                    !isLoadingMessagesRef.current && 
                    currentConv) {
                    loadMessages(currentConv.partnerId);
                }
            }, 3000);
        }

        // Cleanup function - luôn clear interval khi dependencies thay đổi hoặc component unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [selectedConversation]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    const loadConversations = async () => {
        // Tránh concurrent requests - nếu đang loading thì skip
        if (isLoadingConversations) {
            return;
        }

        try {
            const token = getStoredToken('token');
            if (!token) {
                // Stop polling if no token
                setIsLoadingConversations(false);
                setConversations([]);
                return;
            }
            setIsLoadingConversations(true);
            const { ok, data, status } = await getChatConversations(token);
            if (status === 401) {
                // Token invalid, stop polling
                setIsLoadingConversations(false);
                setConversations([]);
                return;
            }
            if (ok && Array.isArray(data)) {
                setConversations(data);
                // Nếu đang chọn một conversation, cập nhật thông tin
                if (selectedConversation) {
                    const updated = data.find((c) => c.partnerId === selectedConversation.partnerId);
                    if (updated) {
                        setSelectedConversation(updated);
                    }
                }
            } else {
                // Nếu không ok hoặc không phải array, set empty
                setConversations([]);
            }
        } catch (err) {
            // Log error để debug
            console.error('Error loading conversations:', err);
            setConversations([]);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    const loadMessages = async (partnerId) => {
        if (!partnerId) {
            setIsLoadingMessages(false);
            return;
        }

        // Tránh concurrent requests - nếu đang loading thì skip
        if (isLoadingMessagesRef.current) {
            return;
        }

        try {
            const token = getStoredToken('token');
            if (!token) {
                // Stop polling if no token
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                isLoadingMessagesRef.current = false;
                setIsLoadingMessages(false);
                return;
            }
            isLoadingMessagesRef.current = true;
            setIsLoadingMessages(true);
            const { ok, data, status } = await getChatConversation(partnerId, token);
            if (status === 401) {
                // Token invalid, stop polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                isLoadingMessagesRef.current = false;
                setIsLoadingMessages(false);
                return;
            }
            if (ok && Array.isArray(data)) {
                // Lưu messages cũ và vị trí scroll trước khi update
                const oldMessages = messages;
                const container = messagesContainerRef.current;
                const wasNearBottom = isNearBottom();
                const hasNew = hasNewMessages(oldMessages, data);
                
                // Lưu scroll position hiện tại (chỉ khi không cần auto scroll và không có tin nhắn mới ở cuối)
                const shouldAutoScroll = shouldAutoScrollRef.current;
                // Nếu có tin nhắn mới và đang ở cuối, không lưu scroll position để tránh nhảy lên
                const shouldPreserveScroll = !shouldAutoScroll && !(hasNew && wasNearBottom);
                const previousScrollTop = shouldPreserveScroll ? (container?.scrollTop || 0) : null;
                
                setMessages(data);
                
                // Sử dụng requestAnimationFrame để scroll đồng bộ với DOM update
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const newContainer = messagesContainerRef.current;
                        if (!newContainer) return;
                        
                        // Chỉ scroll nếu shouldAutoScrollRef.current = true
                        // (khi mở conversation mới hoặc gửi tin nhắn)
                        if (shouldAutoScroll) {
                            // Lần đầu load hoặc được yêu cầu scroll
                            newContainer.scrollTop = newContainer.scrollHeight;
                            shouldAutoScrollRef.current = false; // Reset flag sau khi scroll
                        } else if (hasNew && wasNearBottom) {
                            // Có tin nhắn mới và người dùng đang ở cuối - scroll xuống ngay lập tức
                            newContainer.scrollTop = newContainer.scrollHeight;
                        } else if (previousScrollTop !== null) {
                            // Không có tin nhắn mới hoặc người dùng đang xem tin nhắn cũ
                            // Giữ nguyên vị trí scroll
                            newContainer.scrollTop = previousScrollTop;
                        }
                    });
                });
            } else {
                setMessages([]);
            }
        } catch (err) {
            // Silently handle errors to avoid noise
            console.debug('Error loading messages:', err);
            setMessages([]);
        } finally {
            isLoadingMessagesRef.current = false;
            setIsLoadingMessages(false);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setMessages([]); // Clear messages trước khi load mới
        shouldAutoScrollRef.current = true; // Cho phép scroll khi chọn conversation mới
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedConversation) {
            return;
        }

        const messageText = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await sendChatMessage(
                messageText,
                selectedConversation.partnerId,
                token,
            );

            if (ok) {
                setMessages((prev) => [...prev, data]);
                
                // Luôn scroll khi gửi tin nhắn của chính mình
                shouldAutoScrollRef.current = true; // Cho phép scroll
                
                // Sử dụng requestAnimationFrame để scroll ngay sau khi DOM update
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const container = messagesContainerRef.current;
                        if (container) {
                            // Scroll trực tiếp vào container để tránh bị reset
                            container.scrollTop = container.scrollHeight;
                        }
                    });
                });
                loadConversations(); // Cập nhật danh sách
                // Không cần load lại tin nhắn ngay vì đã thêm vào state rồi
                // Polling sẽ tự động cập nhật tin nhắn mới từ server
            } else {
                showError('Không thể gửi tin nhắn. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            showError('Có lỗi xảy ra khi gửi tin nhắn');
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (partnerId) => {
        if (!partnerId) return;
        try {
            const token = getStoredToken('token');
            if (token) {
                await markChatAsRead(partnerId, token);
                // Không cần loadConversations ngay lập tức, sẽ được update trong lần polling tiếp theo
            }
        } catch (err) {
            // Silently handle errors to avoid noise
            console.debug('Error marking as read:', err);
        }
    };

    // Kiểm tra xem người dùng có đang ở gần cuối không (trong vòng 200px)
    const isNearBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return true;
        
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // Nếu cách cuối dưới 200px thì coi như đang ở gần cuối
        return distanceFromBottom < 200;
    };

    const scrollToBottom = (force = false, instant = false) => {
        // Chỉ scroll nếu được force hoặc người dùng đang ở gần cuối
        if (!force && !isNearBottom()) {
            return;
        }
        
        const scrollBehavior = instant ? 'auto' : 'smooth';
        const delay = instant ? 0 : 100;
        
        setTimeout(() => {
            const container = messagesContainerRef.current;
            if (container) {
                // Scroll trực tiếp vào container để tránh bị reset
                container.scrollTop = container.scrollHeight;
            } else {
                // Fallback nếu không có container
                messagesEndRef.current?.scrollIntoView({ behavior: scrollBehavior });
            }
        }, delay);
    };

    // Kiểm tra xem có tin nhắn mới không (so sánh ID của tin nhắn cuối cùng)
    const hasNewMessages = (oldMessages, newMessages) => {
        if (!oldMessages || oldMessages.length === 0) return true; // Lần đầu load
        if (!newMessages || newMessages.length === 0) return false;
        
        const oldLastId = oldMessages[oldMessages.length - 1]?.id;
        const newLastId = newMessages[newMessages.length - 1]?.id;
        
        // Có tin nhắn mới nếu ID cuối cùng khác hoặc số lượng tăng
        return newLastId !== oldLastId || newMessages.length > oldMessages.length;
    };

    useEffect(() => {
        if (selectedConversation) {
            inputRef.current?.focus();
        }
    }, [selectedConversation]);

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
            <h1 className={cx('title')}>Quản lý Chat</h1>

            <div className={cx('chat-layout')}>
                {/* Danh sách conversations */}
                <div className={cx('conversations-list')}>
                    <div className={cx('conversations-header')}>
                        <h2>Cuộc trò chuyện</h2>
                        <span className={cx('count')}>{conversations.length}</span>
                    </div>

                    {isLoadingConversations ? (
                        <div className={cx('loading')}>Đang tải...</div>
                    ) : conversations.length === 0 ? (
                        <div className={cx('empty')}>Chưa có cuộc trò chuyện nào</div>
                    ) : (
                        <div className={cx('conversations')}>
                            {conversations.map((conv) => (
                                <div
                                    key={conv.partnerId}
                                    className={cx('conversation-item', {
                                        active: selectedConversation?.partnerId === conv.partnerId,
                                    })}
                                    onClick={() => handleSelectConversation(conv)}
                                >
                                    <div className={cx('conversation-avatar')}>
                                        {conv.partnerName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className={cx('conversation-info')}>
                                        <div className={cx('conversation-header')}>
                                            <h3>{conv.partnerName || conv.partnerEmail}</h3>
                                            {conv.unreadCount > 0 && (
                                                <span className={cx('unread-badge')}>
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={cx('last-message')}>
                                            {conv.lastMessage || 'Chưa có tin nhắn'}
                                        </p>
                                        {conv.lastMessageTime && (
                                            <span className={cx('last-time')}>
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat window */}
                <div className={cx('chat-window')}>
                    {!selectedConversation ? (
                        <div className={cx('no-selection')}>
                            <div className={cx('no-selection-content')}>
                                <div className={cx('icon')}>💬</div>
                                <h3>Chọn một cuộc trò chuyện</h3>
                                <p>Chọn một khách hàng từ danh sách bên trái để bắt đầu chat</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={cx('chat-header')}>
                                <div className={cx('chat-header-info')}>
                                    <div className={cx('chat-avatar')}>
                                        {selectedConversation.partnerName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h3>{selectedConversation.partnerName || selectedConversation.partnerEmail}</h3>
                                        <p>{selectedConversation.partnerEmail}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('chat-messages')} ref={messagesContainerRef}>
                                {isLoadingMessages && messages.length === 0 ? (
                                    <div className={cx('loading')}>Đang tải tin nhắn...</div>
                                ) : messages.length === 0 ? (
                                    <div className={cx('no-messages')}>
                                        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        // So sánh senderId với user.id (đảm bảo cả hai đều là string)
                                        // Kiểm tra nhiều trường hợp để đảm bảo so sánh chính xác
                                        let isOwn = false;
                                        if (user && user.id && message && message.senderId) {
                                            const userId = String(user.id).trim();
                                            const senderId = String(message.senderId).trim();
                                            isOwn = userId === senderId;
                                        }
                                        
                                        return (
                                            <div 
                                                key={message.id} 
                                                className={cx('message', { own: isOwn })}
                                                data-is-own={isOwn}
                                                data-user-id={user?.id}
                                                data-sender-id={message.senderId}
                                            >
                                                <div className={cx('message-content')}>
                                                    <p>{message.message}</p>
                                                    <span className={cx('message-time')}>
                                                        {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className={cx('chat-input')}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !inputMessage.trim()}
                                    className={cx('send-button')}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

