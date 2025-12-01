import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './RejectOrderRefundDialog.module.scss';

const cx = classNames.bind(styles);

function RejectOrderRefundDialog({
    open,
    title = 'Từ chối yêu cầu hoàn tiền',
    message = 'Bạn có chắc chắn muốn từ chối yêu cầu hoàn tiền này?',
    confirmText = 'Từ chối',
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
                        type="button"
                        className={cx('btn', 'cancel-btn')}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={cx('btn', 'confirm-btn')}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default RejectOrderRefundDialog;

