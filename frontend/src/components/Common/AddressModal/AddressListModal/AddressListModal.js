import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './AddressListModal.module.scss';
import { getMyAddresses } from '../../../../services';
import { formatFullAddress } from '../useGhnLocations';

const cx = classNames.bind(styles);

const sortAddresses = (items = []) => {
    return [...items].sort((a, b) => {
        if (a?.defaultAddress && !b?.defaultAddress) return -1;
        if (!a?.defaultAddress && b?.defaultAddress) return 1;
        const aTime = Date.parse(a?.createdAt || '') || 0;
        const bTime = Date.parse(b?.createdAt || '') || 0;
        return bTime - aTime;
    });
};

const AddressListModal = ({
    open,
    onClose,
    onSelectAddress,
    onViewDetail,
    onAddNewAddress,
    refreshKey = 0,
    highlightAddressId = null,
}) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAddresses = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyAddresses();
            const next = Array.isArray(data) ? sortAddresses(data) : [];
            setAddresses(next);
        } catch (err) {
            console.error('Không thể tải danh sách địa chỉ', err);
            setError('Không thể tải danh sách địa chỉ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAddresses();
        }
    }, [open, refreshKey]);

    useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    if (!open || typeof document === 'undefined') return null;

    const handleClose = () => {
        onClose?.();
    };

    const handleSelect = (address) => {
        onSelectAddress?.(address);
        handleClose();
    };

    const handleViewDetail = (address) => {
        onViewDetail?.(address);
    };

    const handleAddNew = () => {
        onAddNewAddress?.();
    };

    const renderContent = () => {
        if (loading) {
            return <div className={cx('placeholder')}>Đang tải danh sách địa chỉ...</div>;
        }
        if (error) {
            return <div className={cx('placeholder', 'error')}>{error}</div>;
        }
        if (!addresses.length) {
            return (
                <div className={cx('placeholder')}>
                    Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ mới.
                </div>
            );
        }
        return (
            <ul className={cx('address-list')}>
                {addresses.map((address) => {
                    const createdDate = address?.createdAt ? new Date(address.createdAt) : null;
                    const validCreatedDate = createdDate && !Number.isNaN(createdDate.getTime());
                    return (
                        <li
                            key={address.id}
                            className={cx('address-item', {
                                active: highlightAddressId && highlightAddressId === address.id,
                                default: address.defaultAddress,
                            })}
                        >
                            <div className={cx('address-meta-wrap')}>
                                <div className={cx('address-meta')}>
                                    <div className={cx('address-title')}>
                                        <span className={cx('recipient')}>{address.recipientName}</span>
                                        <span className={cx('divider')} />
                                        <span className={cx('phone')}>{address.recipientPhoneNumber}</span>
                                        {address.defaultAddress && <span className={cx('badge')}>Mặc định</span>}
                                    </div>
                                    <p className={cx('address-line')}>{formatFullAddress(address)}</p>
                                    {validCreatedDate && (
                                        <span className={cx('timestamp')}>
                                            Đã thêm: {createdDate.toLocaleString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className={cx('icon-btn')}
                                    onClick={() => handleViewDetail(address)}
                                    title="Xem / chỉnh sửa"
                                    aria-label="Xem hoặc chỉnh sửa địa chỉ"
                                >
                                    ⋯
                                </button>
                            </div>
                            <div className={cx('actions')}>
                                <button
                                    type="button"
                                    className={cx('btn', 'primary')}
                                    onClick={() => handleSelect(address)}
                                >
                                    Chọn
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    };

    return createPortal(
        <div className={cx('overlay')} role="dialog" aria-modal="true">
            <div className={cx('modal')}>
                <header className={cx('header')}>
                    <div>
                        <h3>Địa chỉ của bạn</h3>
                        <p>Chọn địa chỉ giao hàng hoặc tạo địa chỉ mới</p>
                    </div>
                    <button className={cx('close-btn')} onClick={handleClose} aria-label="Đóng">
                        ×
                    </button>
                </header>
                <div className={cx('content')}>{renderContent()}</div>
                <footer className={cx('footer')}>
                    <button className={cx('btn', 'ghost')} onClick={handleClose}>
                        Đóng
                    </button>
                    <button className={cx('btn', 'primary')} onClick={handleAddNew}>
                        + Thêm địa chỉ mới
                    </button>
                </footer>
            </div>
        </div>,
        document.body,
    );
};

export default AddressListModal;

