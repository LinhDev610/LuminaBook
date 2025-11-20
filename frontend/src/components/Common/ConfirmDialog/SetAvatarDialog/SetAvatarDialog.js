import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './SetAvatarDialog.module.scss';

const cx = classNames.bind(styles);

function SetAvatarDialog({
    open,
    previewUrl,
    title = 'Đổi ảnh đại diện',
    message = 'Bạn có chắc chắn muốn đổi ảnh đại diện này không?',
    confirmText = 'Xác nhận',
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
                    {previewUrl && (
                        <div className={cx('preview-wrapper')}>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className={cx('preview-image')}
                            />
                        </div>
                    )}
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
                        {loading ? 'Đang xử lý...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default SetAvatarDialog;
