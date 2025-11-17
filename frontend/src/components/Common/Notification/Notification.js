import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Notification.module.scss';

const cx = classNames.bind(styles);

// ========== Constants ==========
const DEFAULT_DURATION = 1500;
const NOTIFICATION_TYPES = ['success', 'error', 'info', 'warning'];

const ICONS = {
    success: (
        <svg className={cx('icon')} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47716 17.5228 2 12 2C6.47716 2 2 6.47716 2 12C2 17.5228 6.47716 22 12 22Z" stroke="#16a34a" strokeWidth="2" />
            <path d="M8 12.5L10.6667 15L16 9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg className={cx('icon')} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47716 17.5228 2 12 2C6.47716 2 2 6.47716 2 12C2 17.5228 6.47716 22 12 22Z" stroke="#dc2626" strokeWidth="2" />
            <path d="M15 9L9 15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 9L15 15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    info: (
        <svg className={cx('icon')} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" />
            <path d="M12 8.5V8.51" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 11.5V16" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    warning: (
        <svg className={cx('icon')} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L22 20H2L12 3Z" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 10V14" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17V17.01" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
};

// ========== Context ==========
const NotificationContext = createContext({
    notify: () => { },
    success: () => { },
    error: () => { },
    info: () => { },
    warning: () => { },
});

// ========== Hook ==========
/**
 * Hook để sử dụng notification trong component
 * @returns {Object} Object chứa các methods: notify, success, error, info, warning
 * 
 * @example
 * const { success, error } = Notification.useNotification();
 * success('Thao tác thành công!');
 * error('Có lỗi xảy ra!');
 */
function useNotification() {
    return useContext(NotificationContext);
}

// ========== Components ==========
/**
 * Component hiển thị một toast notification
 * @param {string} type - Loại notification: 'success' | 'error' | 'info' | 'warning'
 * @param {string} title - Tiêu đề notification (optional)
 * @param {string} message - Nội dung notification
 * @param {Function} onClose - Callback khi đóng notification
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 7000ms
 */
function Toast({ type, title, message, onClose, duration = DEFAULT_DURATION }) {
    const icon = useMemo(() => ICONS[type] || ICONS.info, [type]);

    // Tự động đóng sau duration
    useEffect(() => {
        if (duration <= 0) return;
        const timer = setTimeout(() => {
            onClose?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={cx('notification', type, 'enter')} role="alert" aria-live="polite">
            {icon}
            <div className={cx('content')}>
                {title && <div className={cx('title')}>{title}</div>}
                {message && <div className={cx('message')}>{message}</div>}
            </div>
            <button
                className={cx('closeBtn')}
                aria-label="Đóng thông báo"
                onClick={onClose}
                type="button"
            >
                ✕
            </button>
        </div>
    );
}

// ========== Provider ==========
/**
 * Provider component để quản lý notifications trong app
 * Bọc app với component này để sử dụng notification
 */
function NotificationProviderBase({ children }) {
    const [items, setItems] = useState([]);

    /**
     * Tạo notification mới
     * @param {string} type - Loại notification
     * @param {string} message - Nội dung thông báo
     * @param {Object} options - Tùy chọn: { title, duration }
     * @returns {string} ID của notification để có thể đóng thủ công nếu cần
     */
    const notify = useCallback((type, message, options = {}) => {
        if (!message) {
            console.warn('Notification: message is required');
            return null;
        }

        // Validate type
        const validType = NOTIFICATION_TYPES.includes(type) ? type : 'info';

        // Tạo unique ID
        const id = `notification_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Tạo entry
        const entry = {
            id,
            type: validType,
            title: options.title || '',
            message: String(message),
            duration: options.duration ?? DEFAULT_DURATION,
        };

        // Thêm vào danh sách
        setItems((prev) => [...prev, entry]);

        return id;
    }, []);

    // Xóa notification theo ID
    const remove = useCallback((id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    // Tạo các helper methods cho từng loại notification
    // Sử dụng useMemo để tạo methods một lần và chỉ tái tạo khi notify thay đổi
    const notificationMethods = useMemo(() => {
        const methods = {};
        NOTIFICATION_TYPES.forEach((type) => {
            methods[type] = (message, options = {}) => {
                return notify(type, message, options);
            };
        });
        return methods;
    }, [notify]);

    // Context value bao gồm notify chung và các methods riêng
    // useMemo giúp tránh tạo object mới mỗi lần render, chỉ tạo lại khi dependencies thay đổi
    const contextValue = useMemo(
        () => ({
            notify,
            ...notificationMethods,
        }),
        [notify, notificationMethods],
    );

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
            <div className={cx('container')}>
                {items.map((item) => (
                    <Toast
                        key={item.id}
                        type={item.type}
                        title={item.title}
                        message={item.message}
                        duration={item.duration}
                        onClose={() => remove(item.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

// ========== Controlled Notification ==========
function ControlledNotification({
    open,
    type = 'info',
    title = '',
    message = '',
    duration = DEFAULT_DURATION,
    onClose,
}) {
    if (!open) return null;

    const validType = NOTIFICATION_TYPES.includes(type) ? type : 'info';

    return (
        <div className={cx('container')}>
            <Toast type={validType} title={title} message={message} duration={duration} onClose={onClose} />
        </div>
    );
}

// ========== Root Export ==========
function NotificationRoot(props) {
    if (Object.prototype.hasOwnProperty.call(props || {}, 'open')) {
        return <ControlledNotification {...props} />;
    }
    return <NotificationProviderBase {...props} />;
}

export default NotificationRoot;
export { useNotification, NotificationProviderBase as NotificationProvider };
