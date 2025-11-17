import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './CustomerProfilePage.module.scss';
import useLocalStorage from '../../../hooks/useLocalStorage';

const cx = classNames.bind(styles);
const PHONE_REGEX = /^0\d{9}$/;

export default function CustomerProfilePage() {
    const [displayName, setDisplayName] = useLocalStorage('displayName', 'Khách');
    const [email, setEmail] = useLocalStorage('email', 'user123@gmail.com');
    const [phoneNumber, setPhoneNumber] = useLocalStorage('phoneNumber', '0123456789');
    const [address, setAddress] = useLocalStorage('address', '123 Đường ABC, phường Thanh Xuân, Hà Nội');
    const [statusMsg, setStatusMsg] = useState('');

    const [formValues, setFormValues] = useState({
        username: displayName || '',
        email: email || '',
        phoneNumber: phoneNumber || '',
        address: address || '',
    });
    const [errors, setErrors] = useState({ phoneNumber: '' });

    useEffect(() => {
        setFormValues({
            username: displayName || '',
            email: email || '',
            phoneNumber: phoneNumber || '',
            address: address || '',
        });
    }, [displayName, email, phoneNumber, address]);

    const handleChange = (field) => (event) => {
        const { value } = event.target;
        setFormValues((prev) => ({ ...prev, [field]: value }));
        setStatusMsg('');
        if (field === 'phoneNumber') {
            setErrors((prev) => ({
                ...prev,
                phoneNumber: value.trim() && !PHONE_REGEX.test(value.trim())
                    ? 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0'
                    : '',
            }));
        }
    };

    const handleSave = () => {
        if (!PHONE_REGEX.test(formValues.phoneNumber.trim())) {
            setErrors((prev) => ({
                ...prev,
                phoneNumber: 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0',
            }));
            setStatusMsg('Vui lòng kiểm tra lại số điện thoại');
            return;
        }
        setDisplayName(formValues.username.trim());
        setEmail(formValues.email.trim());
        setPhoneNumber(formValues.phoneNumber.trim());
        setAddress(formValues.address.trim());
        setStatusMsg('Đã lưu thông tin cá nhân');
    };

    const handleReset = () => {
        setFormValues({
            username: displayName || '',
            email: email || '',
            phoneNumber: phoneNumber || '',
            address: address || '',
        });
        setErrors({ phoneNumber: '' });
        setStatusMsg('');
    };

    return (
        <section className={cx('panel')}>
            <h3 className={cx('panel-title')}>Thông tin cá nhân</h3>
            <div className={cx('form-row')}>
                <div className={cx('form-group')}>
                    <label>Username</label>
                    <input value={formValues.username} onChange={handleChange('username')} />
                </div>
                <div className={cx('form-group')}>
                    <label>Gmail</label>
                    <input value={formValues.email} onChange={handleChange('email')} />
                </div>
            </div>
            <div className={cx('form-row')}>
                <div className={cx('form-group')}>
                    <label>Số điện thoại</label>
                    <input value={formValues.phoneNumber} onChange={handleChange('phoneNumber')} />
                    {errors.phoneNumber && <span className={cx('error-msg')}>{errors.phoneNumber}</span>}
                </div>
                <div className={cx('form-group')}>
                    <label>Địa chỉ</label>
                    <input value={formValues.address} onChange={handleChange('address')} />
                </div>
            </div>
            <div className={cx('form-actions')}>
                <button className={cx('secondary')} type="button" onClick={handleReset}>
                    Hủy
                </button>
                <button className={cx('primary')} type="button" onClick={handleSave}>
                    Lưu thay đổi
                </button>
            </div>
            {statusMsg && <p className={cx('status-msg')}>{statusMsg}</p>}
        </section>
    );
}


