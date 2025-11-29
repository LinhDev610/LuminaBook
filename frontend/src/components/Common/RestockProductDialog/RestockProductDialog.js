import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './RestockProductDialog.module.scss';

const cx = classNames.bind(styles);

function RestockProductDialog({
    open,
    product,
    defaultQuantity = '',
    loading = false,
    onSubmit,
    onCancel,
}) {
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');

    const validateQuantity = (raw) => {
        if (raw === '') {
            setError('Vui lòng nhập số lượng từ 1 trở lên.');
            return false;
        }
        const parsed = Number(raw);
        if (Number.isNaN(parsed) || parsed <= 0) {
            setError('Vui lòng nhập số lượng từ 1 trở lên.');
            return false;
        }
        setError('');
        return true;
    };

    useEffect(() => {
        if (open) {
            const normalized = defaultQuantity === '' || defaultQuantity === null || defaultQuantity === undefined
                ? ''
                : String(defaultQuantity);
            setQuantity(normalized);
            setError('');
        }
    }, [open, product?.id, defaultQuantity]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const currentStock = Number(product?.stockQuantity ?? 0);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (loading) return;

        if (!validateQuantity(quantity)) {
            return;
        }

        setError('');
        onSubmit?.(Number(quantity));
    };

    const handleChange = (event) => {
        if (loading) return;
        const value = event.target.value;
        if (value === '') {
            setQuantity('');
            setError('Vui lòng nhập số lượng > 0.');
            return;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return;
        }
        const normalized = String(Math.floor(Math.max(0, numeric)));
        setQuantity(normalized);
        validateQuantity(normalized);
    };

    return createPortal(
        <div className={cx('overlay')} onClick={loading ? undefined : onCancel}>
            <div className={cx('dialog')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>Bổ sung tồn kho</h3>
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

                <form onSubmit={handleSubmit}>
                    <div className={cx('body')}>
                        <div className={cx('product-info')}>
                            <p className={cx('name')}>{product?.name || 'Sản phẩm'}</p>
                            <p className={cx('code')}>
                                Mã: <span>{product?.id || 'Không xác định'}</span>
                            </p>
                            <p className={cx('stock')}>
                                Tồn hiện tại:{' '}
                                <strong>{Number.isNaN(currentStock) ? 0 : currentStock}</strong>
                                {' '}sản phẩm
                            </p>
                        </div>

                        <label className={cx('label')} htmlFor="restock-quantity">
                            Số lượng bổ sung
                        </label>
                        <input
                            id="restock-quantity"
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            className={cx('input')}
                            value={quantity}
                            onChange={handleChange}
                            placeholder="Nhập số lượng cần bổ sung"
                            autoFocus
                            disabled={loading}
                        />
                        {error && <p className={cx('error')}>{error}</p>}
                        <p className={cx('hint')}>
                            Số lượng sẽ được cộng vào tồn kho hiện tại của sản phẩm.
                        </p>
                    </div>

                    <div className={cx('footer')}>
                        <button
                            type="button"
                            className={cx('btn', 'cancel')}
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'confirm')}
                            disabled={loading || !quantity || !!error}
                        >
                            {loading ? 'Đang cập nhật...' : 'Bổ sung'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}

export default RestockProductDialog;
