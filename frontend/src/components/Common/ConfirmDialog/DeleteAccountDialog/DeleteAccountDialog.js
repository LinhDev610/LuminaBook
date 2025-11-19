import classNames from 'classnames/bind';
import styles from './DeleteAccountDialog.module.scss';

const cx = classNames.bind(styles);

function DeleteAccountDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
}) {
    if (!open) return null;

    return (
        <div className={cx('overlay')} onClick={onCancel}>
            <div className={cx('dialog')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>{title}</h3>
                    <button
                        className={cx('close-btn')}
                        onClick={onCancel}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>
                <div className={cx('body')}>
                    <p className={cx('message')}>{message}</p>
                </div>
                <div className={cx('footer')}>
                    <button className={cx('btn', 'confirm-btn')} onClick={onConfirm}>
                        {confirmText}
                    </button>
                    <button className={cx('btn', 'cancel-btn')} onClick={onCancel}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteAccountDialog;
