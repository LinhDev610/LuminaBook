import classNames from 'classnames/bind';

import styles from './DeleteCategoryDialog.module.scss';

const cx = classNames.bind(styles);

function DeleteCategoryDialog({ open, categoryName, categoryId, loading, onCancel, onConfirm }) {
    if (!open) return null;

    return (
        <div className={cx('overlay')}>
            <div className={cx('dialog')}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>Bạn có chắc chắn muốn xóa danh mục này?</h3>
                    <p className={cx('subtitle')}>
                        Hành động này <span>không thể hoàn tác.</span> Một khi xóa, toàn bộ dữ liệu liên quan đến danh mục
                        sẽ bị mất vĩnh viễn.
                    </p>
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
                <div className={cx('warning')}>
                    <strong>Cảnh báo:</strong> Việc xóa này không thể khôi phục. Hãy chắc chắn rằng bạn muốn tiếp tục.
                </div>
                <div className={cx('actions')}>
                    <button type="button" className={cx('btn', 'cancel')} onClick={onCancel} disabled={loading}>
                        Hủy
                    </button>
                    <button type="button" className={cx('btn', 'danger')} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteCategoryDialog;
