import React, { useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './Notification.module.scss';

const cx = classNames.bind(styles);

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

export default function Notification({
    open,
    type = 'info',
    title,
    message,
    duration = 5000,
    onClose,
}) {
    const icon = useMemo(() => ICONS[type] || ICONS.info, [type]);

    useEffect(() => {
        if (!open) return;
        if (duration === 0) return; 
        const t = setTimeout(() => onClose?.(), duration);
        return () => clearTimeout(t);
    }, [open, duration, onClose]);

    if (!open) return null;

    return (
        <div className={cx('container')} role="status" aria-live="polite">
            <div className={cx('notification', type, 'enter')}>
                {icon}
                <div className={cx('content')}>
                    {title ? <div className={cx('title')}>{title}</div> : null}
                    {message ? <div className={cx('message')}>{message}</div> : null}
                </div>
                <button className={cx('closeBtn')} aria-label="Đóng" onClick={onClose}>
                    ✕
                </button>
            </div>
        </div>
    );
}

