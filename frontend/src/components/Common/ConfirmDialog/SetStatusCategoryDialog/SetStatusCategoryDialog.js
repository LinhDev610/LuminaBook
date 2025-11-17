import classNames from 'classnames/bind';

import styles from './SetStatusCategoryDialog.module.scss';

const cx = classNames.bind(styles);

function SetStatusCategoryDialog({
    open,
    categoryName,
    categoryId,
    targetStatus,
    loading,
    onCancel,
    onConfirm,
}) {
    if (!open) return null;

    const isActivating = Boolean(targetStatus);
    const title = isActivating ? 'Bạn có chắc chắn muốn hiển thị danh mục này?' : 'Bạn có chắc chắn muốn ẩn danh mục này?';
    const description = isActivating
        ? 'Hiển thị sẽ cho phép người dùng truy cập và xem các mục thuộc danh mục này.'
        : 'Ẩn sẽ khiến người dùng không thể truy cập các mục thuộc danh mục này.';
    const actionLabel = isActivating ? 'Xác nhận' : 'Ẩn';

    return (
        <div className={cx('overlay')}>
            <div className={cx('dialog')}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>{title}</h3>
                    <p className={cx('subtitle')}>{description}</p>
                </div>
                <div className={cx('info')}>
                    <div>
                        <p className={cx('info-label')}>Tên danh mục</p>
                        <p className={cx('info-value')}>{categoryName || 'Danh mục chưa xác định'}</p>
                    </div>
                    <div className={cx('info-divider')} />
                    <div>
                        <p className={cx('info-label')}>ID</p>
                        <p className={cx('info-value', 'code')}>{categoryId || '--'}</p>
                    </div>
                </div>
                <div className={cx('actions')}>
                    <button type="button" className={cx('btn', 'cancel')} onClick={onCancel} disabled={loading}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        className={cx('btn', isActivating ? 'primary' : 'warning')}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SetStatusCategoryDialog;
