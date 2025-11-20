import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './DeleteAddresssDialog.module.scss';

const cx = classNames.bind(styles);

function DeleteAddresssDialog({
    open,
    title = 'Xóa địa chỉ',
    message = 'Bạn có chắc chắn muốn xóa địa chỉ này?',
    confirmText = 'Xóa',
    cancelText = 'Hủy',
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className={cx('overlay')} onClick={loading ? undefined : onCancel}>
            <div className={cx('dialog')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>{title}</h3>
                    <button
                        className={cx('close-btn')}
                        onClick={onCancel}
                        aria-label="Đóng"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>
                <div className={cx('body')}>
                    <p className={cx('message')}>{message}</p>
                </div>
                <div className={cx('footer')}>
                    <button
                        className={cx('btn', 'cancel')}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={cx('btn', 'confirm')}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xóa...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default DeleteAddresssDialog;