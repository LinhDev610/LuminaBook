import React from 'react';
import classNames from 'classnames/bind';
import styles from './StatusBadge.module.scss';
import { getStatusClass } from '../../../services/productUtils';

const cx = classNames.bind(styles);

/**
 * Status Badge Component - Tái sử dụng cho toàn bộ dự án
 */
export default function StatusBadge({ status, className }) {
    const statusClass = getStatusClass(status);

    return (
        <span className={cx('badge', statusClass, className)}>
            {status}
        </span>
    );
}

