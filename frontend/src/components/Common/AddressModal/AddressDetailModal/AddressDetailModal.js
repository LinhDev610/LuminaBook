import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './AddressDetailModal.module.scss';
import { updateAddress, deleteAddress } from '../../../../services';
import { INITIAL_FORM_STATE_ADDRESS_DETAIL } from '../../../../services/constants';
import {
    formatFullAddress,
    normalizeAddressPayload,
    useGhnLocations,
} from '../useGhnLocations';
import { validateAddressForm } from '../../../../utils/addressValidation';
import DeleteAddresssDialog from '../../ConfirmDialog/DeleteAddresssDialog';

const cx = classNames.bind(styles);

const AddressDetailModal = ({ open, address, onClose, onUpdated, onDeleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM_STATE_ADDRESS_DETAIL);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const {
        provinces,
        districts,
        wards,
        loading,
        error: ghnError,
        setDistricts,
        setWards,
        loadProvinces,
        loadDistricts,
        loadWards,
    } = useGhnLocations();

    useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        if (!open || !address) return;
        setForm({ ...INITIAL_FORM_STATE_ADDRESS_DETAIL, ...address });
        setErrors({});
        setStatus('');
        setIsEditing(false);
        setDeleting(false);
        loadProvinces().then(() => {
            if (address?.provinceID) {
                loadDistricts(address.provinceID).then(() => {
                    if (address?.districtID) {
                        loadWards(address.districtID);
                    }
                });
            }
        });
    }, [open, address, loadProvinces, loadDistricts, loadWards]);

    useEffect(() => {
        if (!open || !isEditing) return;
        if (form.provinceID) {
            loadDistricts(form.provinceID).then(() => {
                if (form.districtID) {
                    loadWards(form.districtID);
                }
            });
        }
    }, [open, isEditing, form.provinceID, form.districtID, loadDistricts, loadWards]);


    const handleFieldChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleProvinceChange = (event) => {
        const provinceId = event.target.value;
        const province = provinces.find((item) => item.id === provinceId);
        handleFieldChange('provinceID', provinceId);
        handleFieldChange('provinceName', province?.name || '');
        handleFieldChange('districtID', '');
        handleFieldChange('districtName', '');
        handleFieldChange('wardCode', '');
        handleFieldChange('wardName', '');
        setDistricts([]);
        setWards([]);
        if (provinceId) {
            loadDistricts(provinceId);
        }
    };

    const handleDistrictChange = (event) => {
        const districtId = event.target.value;
        const district = districts.find((item) => item.id === districtId);
        handleFieldChange('districtID', districtId);
        handleFieldChange('districtName', district?.name || '');
        handleFieldChange('wardCode', '');
        handleFieldChange('wardName', '');
        setWards([]);
        if (districtId) {
            loadWards(districtId);
        }
    };

    const handleWardChange = (event) => {
        const wardCode = event.target.value;
        const ward = wards.find((item) => item.code === wardCode);
        handleFieldChange('wardCode', wardCode);
        handleFieldChange('wardName', ward?.name || '');
    };

    const handleUpdate = async (event) => {
        event.preventDefault();
        const payload = normalizeAddressPayload(form);
        const validationErrors = validateAddressForm(payload);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;
        setSubmitting(true);
        setStatus('');
        try {
            const { ok, data } = await updateAddress(form.id, payload);
            if (!ok || !data?.id) {
                throw new Error('Không thể cập nhật địa chỉ');
            }
            onUpdated?.(data);
            setStatus('Đã cập nhật địa chỉ');
            setIsEditing(false);
        } catch (err) {
            console.error('Cập nhật địa chỉ thất bại', err);
            setStatus('Cập nhật địa chỉ thất bại, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!address?.id || deleting) return;
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!address?.id || deleting) return;
        setDeleting(true);
        setStatus('');
        try {
            const { ok } = await deleteAddress(address.id);
            if (!ok) {
                throw new Error('Không thể xóa địa chỉ');
            }
            onDeleted?.(address.id);
            setStatus('Đã xóa địa chỉ');
            onClose?.();
        } catch (err) {
            console.error('Xóa địa chỉ thất bại', err);
            setStatus(err?.message || 'Xóa địa chỉ thất bại, vui lòng thử lại');
        } finally {
            setDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    if (!open || !address || typeof document === 'undefined') {
        return (
            <DeleteAddresssDialog
                open={showConfirmDelete}
                onConfirm={confirmDelete}
                onCancel={() => {
                    if (!deleting) setShowConfirmDelete(false);
                }}
                loading={deleting}
            />
        );
    }

    const modalNode = createPortal(
        <div className={cx('overlay')} role="dialog" aria-modal="true">
            <div className={cx('modal')}>
                <header className={cx('header')}>
                    <div>
                        <h3>Chi tiết địa chỉ</h3>
                        <p>{address.recipientName}</p>
                    </div>
                    <button
                        className={cx('close-btn')}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </header>
                {!isEditing && (
                    <div className={cx('details')}>
                        <div>
                            <span className={cx('label')}>Người nhận</span>
                            <p>{address.recipientName}</p>
                        </div>
                        <div>
                            <span className={cx('label')}>Số điện thoại</span>
                            <p>{address.recipientPhoneNumber}</p>
                        </div>
                        <div>
                            <span className={cx('label')}>Địa chỉ</span>
                            <p>{formatFullAddress(address)}</p>
                        </div>
                        {address.postalCode && (
                            <div>
                                <span className={cx('label')}>Mã bưu chính</span>
                                <p>{address.postalCode}</p>
                            </div>
                        )}
                        <div>
                            <span className={cx('label')}>Trạng thái</span>
                            <p>{address.defaultAddress ? 'Mặc định' : 'Khác'}</p>
                        </div>
                    </div>
                )}
                {isEditing && (
                    <form className={cx('form')} onSubmit={handleUpdate}>
                        <div className={cx('grid')}>
                            <label className={cx('field')}>
                                <span>Người nhận *</span>
                                <input
                                    value={form.recipientName}
                                    onChange={(e) =>
                                        handleFieldChange('recipientName', e.target.value)
                                    }
                                />
                                {errors.recipientName && (
                                    <small className={cx('error')}>
                                        {errors.recipientName}
                                    </small>
                                )}
                            </label>
                            <label className={cx('field')}>
                                <span>Số điện thoại *</span>
                                <input
                                    value={form.recipientPhoneNumber}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'recipientPhoneNumber',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.recipientPhoneNumber && (
                                    <small className={cx('error')}>
                                        {errors.recipientPhoneNumber}
                                    </small>
                                )}
                            </label>
                        </div>
                        <div className={cx('grid')}>
                            <label className={cx('field')}>
                                <span>Tỉnh / Thành *</span>
                                <select
                                    value={form.provinceID}
                                    onChange={handleProvinceChange}
                                >
                                    <option value="">Chọn tỉnh / thành</option>
                                    {provinces.map((province) => (
                                        <option key={province.id} value={province.id}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.provinceID && (
                                    <small className={cx('error')}>
                                        {errors.provinceID}
                                    </small>
                                )}
                            </label>
                            <label className={cx('field')}>
                                <span>Quận / Huyện *</span>
                                <select
                                    value={form.districtID}
                                    onChange={handleDistrictChange}
                                    disabled={!form.provinceID || loading.districts}
                                >
                                    <option value="">Chọn quận / huyện</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.districtID && (
                                    <small className={cx('error')}>
                                        {errors.districtID}
                                    </small>
                                )}
                            </label>
                        </div>
                        <div className={cx('grid')}>
                            <label className={cx('field')}>
                                <span>Phường / Xã *</span>
                                <select
                                    value={form.wardCode}
                                    onChange={handleWardChange}
                                    disabled={!form.districtID || loading.wards}
                                >
                                    <option value="">Chọn phường / xã</option>
                                    {wards.map((ward) => (
                                        <option key={ward.code} value={ward.code}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.wardCode && (
                                    <small className={cx('error')}>
                                        {errors.wardCode}
                                    </small>
                                )}
                            </label>
                            <label className={cx('field')}>
                                <span>Mã bưu chính</span>
                                <input
                                    value={form.postalCode}
                                    onChange={(e) =>
                                        handleFieldChange('postalCode', e.target.value)
                                    }
                                />
                            </label>
                        </div>
                        <label className={cx('field')}>
                            <span>Địa chỉ chi tiết *</span>
                            <textarea
                                rows={3}
                                value={form.address}
                                onChange={(e) =>
                                    handleFieldChange('address', e.target.value)
                                }
                            />
                            {errors.address && (
                                <small className={cx('error')}>{errors.address}</small>
                            )}
                        </label>
                        {ghnError && <div className={cx('helper-error')}>{ghnError}</div>}
                        {status && <div className={cx('status')}>{status}</div>}
                    </form>
                )}
                <footer className={cx('footer')}>
                    {!isEditing && (
                        <>
                            <button className={cx('btn', 'ghost')} onClick={onClose}>
                                Đóng
                            </button>
                            <button
                                className={cx('btn', 'danger')}
                                onClick={handleDelete}
                            >
                                {deleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={() => setIsEditing(true)}
                            >
                                Chỉnh sửa
                            </button>
                        </>
                    )}
                    {isEditing && (
                        <>
                            <button
                                className={cx('btn', 'ghost')}
                                onClick={() => {
                                    setIsEditing(false);
                                    setForm({
                                        ...INITIAL_FORM_STATE_ADDRESS_DETAIL,
                                        ...address,
                                    });
                                    setErrors({});
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'danger')}
                                type="button"
                                onClick={handleDelete}
                            >
                                {deleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={handleUpdate}
                                disabled={submitting}
                                type="button"
                            >
                                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>,
        document.body,
    );

    return (
        <>
            {modalNode}
            <DeleteAddresssDialog
                open={showConfirmDelete}
                onConfirm={confirmDelete}
                onCancel={() => {
                    if (!deleting) setShowConfirmDelete(false);
                }}
                loading={deleting}
            />
        </>
    );
};

export default AddressDetailModal;
