import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './NewAddressModal.module.scss';
import { createAddress } from '../../../../services';
import { INITIAL_FORM_STATE_ADDRESS } from '../../../../services/constants';
import {
    formatFullAddress,
    normalizeAddressPayload,
    useGhnLocations,
} from '../useGhnLocations';
import { validateAddressForm } from '../../../../utils/addressValidation';

const cx = classNames.bind(styles);



const NewAddressModal = ({ open, onClose, onCreated }) => {
    const [form, setForm] = useState(INITIAL_FORM_STATE_ADDRESS);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState('');

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
        if (!open) return;
        loadProvinces().catch((err) => {
            console.error('Failed to load provinces:', err);
        });
    }, [open, loadProvinces]);

    useEffect(() => {
        if (!open || !form.provinceID) {
            setDistricts([]);
            setWards([]);
            return;
        }
        loadDistricts(form.provinceID);
    }, [open, form.provinceID, loadDistricts, setDistricts, setWards]);

    useEffect(() => {
        if (!open || !form.districtID) {
            setWards([]);
            return;
        }
        loadWards(form.districtID);
    }, [open, form.districtID, loadWards, setWards]);

    useEffect(() => {
        if (!open) {
            setForm(INITIAL_FORM_STATE_ADDRESS);
            setErrors({});
            setStatus('');
        }
    }, [open]);


    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleProvinceChange = (event) => {
        const provinceId = event.target.value;
        const province = provinces.find((item) => item.id === provinceId);
        setForm((prev) => ({
            ...prev,
            provinceID: provinceId,
            provinceName: province?.name || '',
            districtID: '',
            districtName: '',
            wardCode: '',
            wardName: '',
        }));
        setDistricts([]);
        setWards([]);
    };

    const handleDistrictChange = (event) => {
        const districtId = event.target.value;
        const district = districts.find((item) => item.id === districtId);
        setForm((prev) => ({
            ...prev,
            districtID: districtId,
            districtName: district?.name || '',
            wardCode: '',
            wardName: '',
        }));
        setWards([]);
    };

    const handleWardChange = (event) => {
        const wardCode = event.target.value;
        const ward = wards.find((item) => item.code === wardCode);
        setForm((prev) => ({
            ...prev,
            wardCode,
            wardName: ward?.name || '',
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = normalizeAddressPayload(form);
        const validationErrors = validateAddressForm(payload);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;

        setSubmitting(true);
        setStatus('');
        try {
            const { ok, data } = await createAddress(payload);
            if (!ok || !data?.id) {
                throw new Error('Không thể tạo địa chỉ');
            }
            onCreated?.(data);
            setStatus('Đã lưu địa chỉ mới');
            setTimeout(() => {
                setStatus('');
                onClose?.();
            }, 400);
        } catch (err) {
            console.error('Tạo địa chỉ thất bại', err);
            setStatus('Tạo địa chỉ thất bại, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className={cx('overlay')} role="dialog" aria-modal="true">
            <div className={cx('modal')}>
                <header className={cx('header')}>
                    <div>
                        <h3>Thêm địa chỉ mới</h3>
                        <p>
                            Nhập thông tin địa chỉ theo chuẩn GHN để việc giao hàng được chính xác
                            hơn.
                        </p>
                    </div>
                    <button className={cx('close-btn')} onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </header>
                <form className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('grid')}>
                        <label className={cx('field')}>
                            <span>Người nhận *</span>
                            <input
                                type="text"
                                value={form.recipientName}
                                onChange={(e) => handleChange('recipientName', e.target.value)}
                            />
                            {errors.recipientName && (
                                <small className={cx('error')}>{errors.recipientName}</small>
                            )}
                        </label>
                        <label className={cx('field')}>
                            <span>Số điện thoại *</span>
                            <input
                                type="tel"
                                value={form.recipientPhoneNumber}
                                onChange={(e) =>
                                    handleChange('recipientPhoneNumber', e.target.value)
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
                            <span>Tỉnh / Thành phố *</span>
                            <select
                                value={form.provinceID}
                                onChange={handleProvinceChange}
                                disabled={loading.provinces}
                            >
                                <option value="">
                                    {loading.provinces ? 'Đang tải...' : 'Chọn tỉnh / thành phố'}
                                </option>
                                {provinces.map((province) => (
                                    <option key={province.id} value={province.id}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                            {errors.provinceID && (
                                <small className={cx('error')}>{errors.provinceID}</small>
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
                                <small className={cx('error')}>{errors.districtID}</small>
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
                                <small className={cx('error')}>{errors.wardCode}</small>
                            )}
                        </label>
                        <label className={cx('field')}>
                            <span>Mã bưu chính</span>
                            <input
                                type="text"
                                value={form.postalCode}
                                onChange={(e) => handleChange('postalCode', e.target.value)}
                            />
                        </label>
                    </div>
                    <label className={cx('field')}>
                        <span>Địa chỉ chi tiết *</span>
                        <textarea
                            rows={3}
                            value={form.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="Ví dụ: 123 Nguyễn Huệ, Khu phố 1"
                        />
                        {errors.address && <small className={cx('error')}>{errors.address}</small>}
                    </label>
                    <label className={cx('checkbox')}>
                        <input
                            type="checkbox"
                            checked={form.defaultAddress}
                            onChange={(e) => handleChange('defaultAddress', e.target.checked)}
                        />
                        Đặt làm địa chỉ mặc định
                    </label>
                    {ghnError && <div className={cx('helper-error')}>{ghnError}</div>}
                    {status && <div className={cx('status')}>{status}</div>}
                </form>
                <footer className={cx('footer')}>
                    <button className={cx('btn', 'ghost')} onClick={onClose} type="button">
                        Hủy
                    </button>
                    <button
                        className={cx('btn', 'primary')}
                        onClick={handleSubmit}
                        type="button"
                        disabled={submitting}
                    >
                        {submitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
                    </button>
                </footer>
            </div>
            <aside className={cx('preview')}>
                <h4>Xem trước</h4>
                <p>{formatFullAddress(form) || 'Địa chỉ hiển thị ở đây'}</p>
            </aside>
        </div>,
        document.body,
    );
};

export default NewAddressModal;

