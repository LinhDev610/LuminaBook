import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './RestockDialog.module.scss';

const cx = classNames.bind(styles);

function RestockDialog({
    open,
    product,
    quantity,
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!open || typeof document === 'undefined') return null;

    const safeQuantity = Number(quantity) || 0;
    const currentStock = Number(product?.stockQuantity ?? 0);
    const nextStock = currentStock + safeQuantity;

    return createPortal(
        <div className={cx('overlay')} onClick={loading ? undefined : onCancel}>
            <div className={cx('dialog')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>Xác nhận bổ sung</h3>
                    <button
                        type="button"
                        className={cx('close-btn')}
                        aria-label="Đóng"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>
                <div className={cx('body')}>
                    <p className={cx('message')}>
                        Bạn có chắc chắn muốn bổ sung{' '}
                        <strong>{safeQuantity}</strong> sản phẩm cho{' '}
                        <strong>{product?.name || 'sản phẩm'}</strong>?
                    </p>
                    <div className={cx('summary')}>
                        <div>
                            <span className={cx('label')}>Tồn hiện tại</span>
                            <span className={cx('value')}>{Number.isNaN(currentStock) ? 0 : currentStock}</span>
                        </div>
                        <div>
                            <span className={cx('label')}>Sau bổ sung</span>
                            <span className={cx('value', 'highlight')}>
                                {Number.isNaN(nextStock) ? safeQuantity : nextStock}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={cx('footer')}>
                    <button
                        type="button"
                        className={cx('btn', 'cancel')}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Quay lại
                    </button>
                    <button
                        type="button"
                        className={cx('btn', 'confirm')}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang cập nhật...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default RestockDialog;
