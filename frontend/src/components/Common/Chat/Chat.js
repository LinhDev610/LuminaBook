import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames/bind';
import styles from './Chat.module.scss';
import { getStoredToken } from '../../../services/utils';
import { sendChatMessage, getChatConversation, markChatAsRead, getChatUnreadCount, getFirstCustomerSupport, getMyInfo } from '../../../services';
import { useNotification } from '../Notification';

const cx = classNames.bind(styles);

export default function Chat() {
    const [user, setUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState('menu'); // 'menu', 'chat', 'policies', 'faq'
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [currentPartnerId, setCurrentPartnerId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const { error: showError, success } = useNotification();

    // Load user info
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = getStoredToken('token');
                if (!token) {
                    setUser(null);
                    return;
                }
                // getMyInfo trả về data trực tiếp, không phải {ok, data}
                const userData = await getMyInfo(token);
                if (userData && userData.id) {
                    // Extract role from data
                    const role = userData?.role?.name || userData?.role || null;
                    setUser({ ...userData, role });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Error loading user:', err);
                setUser(null);
            }
        };
        loadUser();
        
        // Reload user khi token thay đổi
        const handleTokenUpdate = () => {
            loadUser();
        };
        window.addEventListener('tokenUpdated', handleTokenUpdate);
        return () => window.removeEventListener('tokenUpdated', handleTokenUpdate);
    }, []);

    const scrollToBottom = (force = false) => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const loadMessages = useCallback(async (partnerId) => {
        if (!partnerId) return;
        
        try {
            const token = getStoredToken('token');
            if (!token) {
                // Stop polling if no token
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                return;
            }
            
            // Không block polling - luôn cho phép load tin nhắn mới
            setIsLoadingMessages(true);
            const { ok, data, status } = await getChatConversation(partnerId, token);
            
            if (status === 401) {
                // Token invalid, stop polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setIsOpen(false);
                setIsLoadingMessages(false);
                return;
            }
            
            if (ok && Array.isArray(data)) {
                setMessages(data);
                scrollToBottom();
            }
        } catch (err) {
            // Log error để debug nhưng không block polling
            console.error('Error loading messages:', err);
        } finally {
            // Luôn reset loading state để polling tiếp tục
            setIsLoadingMessages(false);
        }
    }, []);

    const loadUnreadCount = async () => {
        try {
            const token = getStoredToken('token');
            if (!token) {
                // Stop polling if no token
                return;
            }
            const { ok, data, status } = await getChatUnreadCount(token);
            if (status === 401) {
                // Token invalid, stop polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                return;
            }
            if (ok && typeof data === 'number') {
                setUnreadCount(data);
            }
        } catch (err) {
            // Silently handle errors to avoid noise
            console.debug('Error loading unread count:', err);
        }
    };

    // Load tin nhắn khi currentPartnerId thay đổi
    useEffect(() => {
        if (isOpen && currentPartnerId) {
            // Clear messages trước khi load mới để tránh hiển thị tin nhắn cũ
            setMessages([]);
            // Load ngay lập tức khi có partnerId
            loadMessages(currentPartnerId);
        } else if (!currentPartnerId) {
            // Clear messages nếu không có partner
            setMessages([]);
        }
    }, [isOpen, currentPartnerId, loadMessages]);

    // Clear messages khi user thay đổi
    useEffect(() => {
        if (user && user.id) {
            // Clear messages khi user thay đổi để đảm bảo mỗi user có chat riêng
            setMessages([]);
            setCurrentPartnerId(null);
        }
    }, [user?.id]);

    // Polling để lấy tin nhắn mới
    useEffect(() => {
        if (isOpen && currentPartnerId) {
            // Poll mỗi 1.5 giây để nhận tin nhắn nhanh hơn
            pollingIntervalRef.current = setInterval(() => {
                loadMessages(currentPartnerId);
            }, 1500);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            };
        } else {
            // Clear interval khi đóng chat
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }
    }, [isOpen, currentPartnerId, loadMessages]);

    // Load unread count
    useEffect(() => {
        if (user) {
            loadUnreadCount();
            // Poll mỗi 15 giây (tăng từ 5s để giảm request)
            const interval = setInterval(loadUnreadCount, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleOpenChat = async () => {
        // Clear messages và partner khi mở chat mới
        setMessages([]);
        setCurrentPartnerId(null);
        setIsOpen(true);
        setViewMode('menu'); // Reset về menu khi mở
        
        // Kiểm tra đăng nhập
        const token = getStoredToken('token');
        if (!token) {
            showError('Vui lòng đăng nhập để sử dụng tính năng chat');
            setIsOpen(false);
            return;
        }

        // Nếu user chưa được load, thử load lại
        let currentUser = user;
        if (!currentUser) {
            try {
                const userData = await getMyInfo(token);
                // getMyInfo trả về data trực tiếp, không phải {ok, data}
                if (userData && userData.id) {
                    const role = userData?.role?.name || userData?.role || null;
                    currentUser = { ...userData, role };
                    setUser(currentUser);
                } else {
                    showError('Vui lòng đăng nhập để sử dụng tính năng chat');
                    setIsOpen(false);
                    return;
                }
            } catch (err) {
                console.error('Error loading user:', err);
                showError('Vui lòng đăng nhập để sử dụng tính năng chat');
                setIsOpen(false);
                return;
            }
        }

        // Kiểm tra role - chỉ cho phép CUSTOMER
        const userRole = currentUser?.role?.name || currentUser?.role;
        if (userRole && userRole !== 'CUSTOMER') {
            showError('Chỉ khách hàng mới có thể sử dụng tính năng chat');
            setIsOpen(false);
            return;
        }
    };

    const handleSelectChat = async () => {
        // Clear messages trước khi chuyển sang chat
        setMessages([]);
        setViewMode('chat');
        
        // Kiểm tra đăng nhập
        const token = getStoredToken('token');
        if (!token) {
            showError('Vui lòng đăng nhập để sử dụng tính năng chat');
            return;
        }

        // Nếu chưa có partner, tìm CSKH đầu tiên
        if (!currentPartnerId) {
            try {
                const { ok, data } = await getFirstCustomerSupport(token);
                if (ok && data?.id) {
                    setCurrentPartnerId(data.id);
                } else {
                    showError('Không tìm thấy nhân viên CSKH. Vui lòng thử lại sau.');
                }
            } catch (err) {
                console.error('Error getting customer support:', err);
                showError('Không thể kết nối với CSKH. Vui lòng thử lại sau.');
            }
        }
    };

    const handleSelectPolicies = async () => {
        // Chuyển sang chat và hiển thị thông tin chính sách như tin nhắn bot
        await handleSelectChat();
        
        // Tạo tin nhắn bot với thông tin chính sách
        const policyMessage = {
            id: `policy-${Date.now()}`,
            message: `📋 **CHÍNH SÁCH MUA HÀNG**

📦 **Chính sách vận chuyển:**
• Miễn phí vận chuyển cho đơn hàng từ 500.000đ
• Giao hàng trong 2-5 ngày làm việc
• Hỗ trợ giao hàng nhanh trong nội thành

🔄 **Chính sách đổi trả:**
• Đổi trả trong vòng 7 ngày kể từ ngày nhận hàng
• Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng
• Miễn phí đổi trả nếu sản phẩm lỗi do nhà sản xuất

💳 **Phương thức thanh toán:**
• Thanh toán khi nhận hàng (COD)
• Chuyển khoản ngân hàng
• Thanh toán online qua thẻ tín dụng/ghi nợ
• Ví điện tử (MoMo, ZaloPay, ShopeePay)

🛡️ **Bảo hành:**
• Bảo hành chính hãng theo từng sản phẩm
• Hỗ trợ bảo hành tại các trung tâm ủy quyền
• Đổi mới trong 30 ngày nếu lỗi do nhà sản xuất

Bạn có câu hỏi gì về chính sách không? Nhân viên sẽ hỗ trợ bạn ngay!`,
            senderId: 'system',
            createdAt: new Date().toISOString(),
            isSystemMessage: true
        };
        
        // Thêm tin nhắn vào danh sách
        setMessages((prev) => [...prev, policyMessage]);
        setTimeout(() => {
            scrollToBottom(true);
        }, 100);
    };

    const handleSelectFAQ = async () => {
        // Chuyển sang chat và hiển thị thông tin FAQ
        await handleSelectChat();
        
        const faqMessage = {
            id: `faq-${Date.now()}`,
            message: `❓ **CÂU HỎI THƯỜNG GẶP**

1. **Làm thế nào để đặt hàng?**
   → Bạn có thể đặt hàng trực tiếp trên website hoặc gọi hotline 1900-123-456

2. **Thời gian giao hàng là bao lâu?**
   → Thông thường 2-5 ngày làm việc, tùy theo khu vực

3. **Có được đổi trả sản phẩm không?**
   → Có, trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn

4. **Phương thức thanh toán nào được chấp nhận?**
   → Chúng tôi chấp nhận COD, chuyển khoản, thẻ tín dụng và ví điện tử

5. **Sản phẩm có được bảo hành không?**
   → Có, tất cả sản phẩm đều có chế độ bảo hành theo quy định của nhà sản xuất

Bạn cần hỗ trợ thêm về vấn đề nào? Hãy chat với nhân viên để được tư vấn chi tiết!`,
            senderId: 'system',
            createdAt: new Date().toISOString(),
            isSystemMessage: true
        };
        
        setMessages((prev) => [...prev, faqMessage]);
        setTimeout(() => {
            scrollToBottom(true);
        }, 100);
    };

    const handleSelectHotline = () => {
        // Mở số điện thoại để gọi
        window.open('tel:1900123456');
    };

    const handleBackToMenu = () => {
        setViewMode('menu');
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !currentPartnerId) {
            if (!currentPartnerId) {
                showError('Vui lòng chọn nhân viên CSKH');
            }
            return;
        }

        const messageText = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await sendChatMessage(messageText, currentPartnerId, token);
            
            if (ok) {
                // Thêm tin nhắn vào danh sách ngay lập tức
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
                loadUnreadCount();
                // Load lại tin nhắn sau 0.5 giây để đảm bảo đồng bộ
                setTimeout(() => {
                    loadMessages(currentPartnerId);
                }, 500);
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

    useEffect(() => {
        if (isOpen && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    // Đánh dấu đã đọc khi mở chat (chỉ một lần, không polling)
    useEffect(() => {
        if (isOpen && currentPartnerId) {
            // Chỉ mark as read một lần khi mở conversation, không phải mỗi lần polling
            const token = getStoredToken('token');
            if (token) {
                markChatAsRead(currentPartnerId, token).catch(() => {
                    // Silently handle errors
                });
                loadUnreadCount();
            }
        }
    }, [isOpen, currentPartnerId]);

    // Chỉ hiển thị cho customer hoặc user chưa đăng nhập
    const userRole = user?.role?.name || user?.role;
    
    // Ẩn nếu là admin, staff, hoặc customer_support
    // Nếu user chưa được load hoặc không có role, vẫn hiển thị (cho phép user chưa đăng nhập)
    const shouldHide = user && userRole && (userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'CUSTOMER_SUPPORT');
    
    // Debug: Log để kiểm tra
    console.log('[Chat Component] Render check:', {
        hasUser: !!user,
        userRole,
        shouldHide,
        willRender: !shouldHide
    });
    
    if (shouldHide) {
        return null;
    }
    
    // Luôn hiển thị chat button (cho customer hoặc user chưa đăng nhập)

    return (
        <>
            {/* Floating Button */}
            <button
                className={cx('chat-button', { open: isOpen })}
                onClick={() => {
                    if (!isOpen) {
                        handleOpenChat();
                    } else {
                        // Clear messages và partner khi đóng chat
                        setMessages([]);
                        setCurrentPartnerId(null);
                        setIsOpen(false);
                    }
                }}
                aria-label="Mở chat"
            >
                {isOpen ? (
                    <span className={cx('close-icon')}>×</span>
                ) : (
                    <>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                                fill="currentColor"
                            />
                        </svg>
                        {unreadCount > 0 && (
                            <span className={cx('unread-badge')}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={cx('chat-window')}>
                    <div className={cx('chat-header')}>
                        <div className={cx('header-info')}>
                            <div className={cx('avatar')}>💬</div>
                            <div>
                                <h3>
                                    {viewMode === 'menu' && 'Hỗ trợ khách hàng'}
                                    {viewMode === 'chat' && 'Chat với CSKH'}
                                    {viewMode === 'policies' && 'Chính sách mua hàng'}
                                </h3>
                                <p>
                                    {viewMode === 'menu' && 'Chọn dịch vụ bạn cần hỗ trợ'}
                                    {viewMode === 'chat' && 'Nhân viên sẽ phản hồi trong thời gian sớm nhất'}
                                    {viewMode === 'policies' && 'Thông tin về chính sách mua hàng'}
                                </p>
                            </div>
                        </div>
                        {viewMode !== 'menu' && (
                            <button 
                                className={cx('back-button')}
                                onClick={handleBackToMenu}
                                aria-label="Quay lại menu"
                            >
                                ←
                            </button>
                        )}
                    </div>

                    {viewMode === 'menu' && (
                        <div className={cx('menu-options')}>
                            <button 
                                className={cx('option-button')}
                                onClick={handleSelectChat}
                            >
                                <div className={cx('option-icon')}>💬</div>
                                <div className={cx('option-content')}>
                                    <h4>Chat với nhân viên</h4>
                                    <p>Nhận hỗ trợ trực tiếp từ nhân viên CSKH</p>
                                </div>
                            </button>
                            
                            <button 
                                className={cx('option-button')}
                                onClick={handleSelectPolicies}
                            >
                                <div className={cx('option-icon')}>📋</div>
                                <div className={cx('option-content')}>
                                    <h4>Chính sách mua hàng</h4>
                                    <p>Xem thông tin về chính sách đổi trả, vận chuyển, thanh toán</p>
                                </div>
                            </button>

                            <button 
                                className={cx('option-button')}
                                onClick={handleSelectFAQ}
                            >
                                <div className={cx('option-icon')}>❓</div>
                                <div className={cx('option-content')}>
                                    <h4>Câu hỏi thường gặp</h4>
                                    <p>Tìm câu trả lời cho các câu hỏi phổ biến</p>
                                </div>
                            </button>

                            <button 
                                className={cx('option-button')}
                                onClick={handleSelectHotline}
                            >
                                <div className={cx('option-icon')}>📞</div>
                                <div className={cx('option-content')}>
                                    <h4>Gọi hotline</h4>
                                    <p>Liên hệ trực tiếp qua điện thoại: 1900-123-456</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {viewMode === 'chat' && (
                        <>
                            {!currentPartnerId ? (
                                <div className={cx('no-partner')}>
                                    <p>Đang tìm nhân viên CSKH...</p>
                                    <p className={cx('note')}>
                                        Vui lòng đợi trong giây lát
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className={cx('chat-messages')} ref={messagesContainerRef}>
                                        {isLoadingMessages && messages.length === 0 ? (
                                            <div className={cx('loading')}>Đang tải tin nhắn...</div>
                                        ) : messages.length === 0 ? (
                                            <div className={cx('no-messages')}>
                                                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                                            </div>
                                        ) : (
                                            messages.map((message) => {
                                                // Kiểm tra nếu là tin nhắn hệ thống
                                                const isSystemMessage = message.isSystemMessage || message.senderId === 'system';
                                                
                                                // So sánh senderId với user.id (đảm bảo cả hai đều là string)
                                                let isOwn = false;
                                                if (!isSystemMessage && user && user.id && message && message.senderId) {
                                                    // Chuyển đổi cả hai về string và so sánh
                                                    const userId = String(user.id).trim();
                                                    const senderId = String(message.senderId).trim();
                                                    isOwn = userId === senderId;
                                                }
                                                
                                                return (
                                                    <div 
                                                        key={message.id} 
                                                        className={cx('message', { 
                                                            own: isOwn,
                                                            system: isSystemMessage
                                                        })}
                                                        data-is-own={isOwn}
                                                        data-user-id={user?.id}
                                                        data-sender-id={message.senderId}
                                                    >
                                                        <div className={cx('message-content')}>
                                                            <p style={{ whiteSpace: 'pre-line' }}>{message.message}</p>
                                                            {!isSystemMessage && (
                                                                <span className={cx('message-time')}>
                                                                    {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </span>
                                                            )}
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
                        </>
                    )}
                </div>
            )}
        </>
    );
}

