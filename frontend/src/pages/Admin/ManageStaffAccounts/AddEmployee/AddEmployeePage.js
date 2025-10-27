import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AddEmployeePage.module.scss';

const cx = classNames.bind(styles);

function AddEmployeePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        position: '',
        email: '',
        phone: ''
    });

    const [errors, setErrors] = useState({});

    const positions = [
        'Nhân viên',
        'Chăm sóc khách hàng'
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        if (!formData.position) {
            newErrors.position = 'Vui lòng chọn chức vụ';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            // TODO: Call API to save employee
            console.log('Saving employee:', formData);
            
            // Navigate back to staff management page
            navigate('/admin');
        }
    };

    const handleCancel = () => {
        // Navigate back to staff management page
        navigate('/admin');
    };

    return (
        <div className={cx('add-employee-page')}>
            <div className={cx('page-header')}>
                <button className={cx('back-btn')} onClick={handleCancel}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <h1 className={cx('page-title')}>Thêm tài khoản nhân viên</h1>
            </div>

            <div className={cx('form-container')}>
                <div className={cx('form-card')}>
                    <div className={cx('form-content')}>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Họ và tên</label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.fullName })}
                                placeholder="Nhập họ tên nhân viên"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                            />
                            {errors.fullName && <span className={cx('error-message')}>{errors.fullName}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Chức vụ</label>
                            <select
                                className={cx('form-select', { error: errors.position })}
                                value={formData.position}
                                onChange={(e) => handleInputChange('position', e.target.value)}
                            >
                                <option value="">-- Chọn chức vụ --</option>
                                {positions.map((position, index) => (
                                    <option key={index} value={position}>{position}</option>
                                ))}
                            </select>
                            {errors.position && <span className={cx('error-message')}>{errors.position}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Email</label>
                            <input
                                type="email"
                                className={cx('form-input', { error: errors.email })}
                                placeholder="example@gmail.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                            {errors.email && <span className={cx('error-message')}>{errors.email}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Số điện thoại</label>
                            <input
                                type="tel"
                                className={cx('form-input', { error: errors.phone })}
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                            {errors.phone && <span className={cx('error-message')}>{errors.phone}</span>}
                        </div>
                    </div>

                    <div className={cx('form-footer')}>
                        <button className={cx('btn', 'cancel-btn')} onClick={handleCancel}>
                            Hủy
                        </button>
                        <button className={cx('btn', 'save-btn')} onClick={handleSave}>
                            Lưu nhân viên
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddEmployeePage;
