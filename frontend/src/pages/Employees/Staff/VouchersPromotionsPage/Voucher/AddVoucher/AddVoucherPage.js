import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AddVoucherPage.module.scss';

const cx = classNames.bind(styles);

const API_BASE_URL = 'http://localhost:8080/lumina_book';

// Mock data cho dropdown loại sách
const bookTypes = [
    { value: '', label: '-- Chọn loại sách --' },
    { value: 'sach-giao-duc', label: 'Sách giáo dục' },
    { value: 'sach-van-hoc', label: 'Sách văn học' },
    { value: 'sach-thieu-nhi', label: 'Sách thiếu nhi' },
    { value: 'sach-ky-nang-song', label: 'Sách kỹ năng sống' },
    { value: 'sach-quan-ly-kinh-doanh', label: 'Sách quản lý kinh doanh' },
];

export default function AddVoucherPage() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        campaignName: '',
        voucherCode: '',
        value: '',
        orderValueFrom: '',
        applyType: 'by-book-type', // 'by-book-type' hoặc 'by-specific-book'
        bookType: '',
        limit: '',
        quantity: '',
        startDate: '',
        endDate: '',
        image: null,
        notes: '',
    });

    const [errors, setErrors] = useState({});
    const [selectedFileName, setSelectedFileName] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error khi user nhập
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFileName(file.name);
            setFormData(prev => ({ ...prev, image: file }));
            
            // Tạo preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        setFormData({
            campaignName: '',
            voucherCode: '',
            value: '',
            orderValueFrom: '',
            applyType: 'by-book-type',
            bookType: '',
            limit: '',
            quantity: '',
            startDate: '',
            endDate: '',
            image: null,
            notes: '',
        });
        setErrors({});
        setSelectedFileName('');
        setImagePreview(null);
        // Reset file input
        const fileInput = document.getElementById('voucher-image-input');
        if (fileInput) fileInput.value = '';
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.campaignName.trim()) {
            newErrors.campaignName = 'Vui lòng nhập tên chương trình';
        }
        if (!formData.voucherCode.trim()) {
            newErrors.voucherCode = 'Vui lòng nhập mã voucher';
        }
        if (!formData.value.trim()) {
            newErrors.value = 'Vui lòng nhập giá trị';
        }
        if (!formData.orderValueFrom.trim()) {
            newErrors.orderValueFrom = 'Vui lòng nhập giá trị đơn từ';
        }
        if (formData.applyType === 'by-book-type' && !formData.bookType) {
            newErrors.bookType = 'Vui lòng chọn loại sách';
        }
        if (!formData.limit.trim()) {
            newErrors.limit = 'Vui lòng nhập hạn mức';
        }
        if (!formData.quantity.trim()) {
            newErrors.quantity = 'Vui lòng nhập số lượng voucher';
        }
        if (!formData.startDate) {
            newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        }
        if (!formData.endDate) {
            newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // TODO: Gọi API để tạo voucher
            // const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            // const formDataToSend = new FormData();
            // Object.keys(formData).forEach(key => {
            //     if (key === 'image' && formData[key]) {
            //         formDataToSend.append('image', formData[key]);
            //     } else if (formData[key]) {
            //         formDataToSend.append(key, formData[key]);
            //     }
            // });
            // 
            // const resp = await fetch(`${API_BASE_URL}/vouchers`, {
            //     method: 'POST',
            //     headers: {
            //         Authorization: `Bearer ${token}`,
            //     },
            //     body: formDataToSend,
            // });

            alert('Gửi duyệt thành công!');
            navigate('/staff/vouchers');
        } catch (error) {
            alert('Có lỗi xảy ra khi gửi duyệt.');
        }
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-icon-btn')} onClick={() => navigate('/staff/vouchers')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <div>
                        <h2 className={cx('subtitle')}>Voucher & Khuyến mãi</h2>
                        <h1 className={cx('title')}>Thêm Voucher</h1>
                    </div>
                </div>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>

            <div className={cx('form-container')}>
                <div className={cx('form-card')}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Tên chương trình</label>
                        <input
                            type="text"
                            className={cx('form-input', { error: errors.campaignName })}
                            placeholder="VD: Giảm tối đa 50k cho đơn từ 400k"
                            value={formData.campaignName}
                            onChange={(e) => handleInputChange('campaignName', e.target.value)}
                        />
                        {errors.campaignName && (
                            <span className={cx('error-text')}>{errors.campaignName}</span>
                        )}
                    </div>

                    <div className={cx('form-row')}>
                        <div className={cx('form-group', 'form-group-half')}>
                            <label className={cx('form-label')}>Mã voucher</label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.voucherCode })}
                                placeholder="VD: VC_MAX50"
                                value={formData.voucherCode}
                                onChange={(e) => handleInputChange('voucherCode', e.target.value)}
                            />
                            {errors.voucherCode && (
                                <span className={cx('error-text')}>{errors.voucherCode}</span>
                            )}
                        </div>

                        <div className={cx('form-group', 'form-group-half')}>
                            <label className={cx('form-label')}>Giá trị</label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.value })}
                                placeholder="VD: Giảm 10% hoặc 50.000₫"
                                value={formData.value}
                                onChange={(e) => handleInputChange('value', e.target.value)}
                            />
                            {errors.value && (
                                <span className={cx('error-text')}>{errors.value}</span>
                            )}
                        </div>
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Điều kiện áp dụng</label>
                        
                        <div className={cx('condition-row')}>
                            <label className={cx('condition-label')}>Giá trị đơn từ (VNĐ):</label>
                            <input
                                type="text"
                                className={cx('form-input', 'condition-input', { error: errors.orderValueFrom })}
                                placeholder="VD: 400000"
                                value={formData.orderValueFrom}
                                onChange={(e) => handleInputChange('orderValueFrom', e.target.value)}
                            />
                        </div>

                        <div className={cx('radio-group')}>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyType"
                                    value="by-book-type"
                                    checked={formData.applyType === 'by-book-type'}
                                    onChange={(e) => handleInputChange('applyType', e.target.value)}
                                    className={cx('radio-input')}
                                />
                                <span className={cx('radio-text')}>Theo loại sách</span>
                            </label>
                            <label className={cx('radio-label')}>
                                <input
                                    type="radio"
                                    name="applyType"
                                    value="by-specific-book"
                                    checked={formData.applyType === 'by-specific-book'}
                                    onChange={(e) => handleInputChange('applyType', e.target.value)}
                                    className={cx('radio-input')}
                                />
                                <span className={cx('radio-text')}>Theo sách cụ thể</span>
                            </label>
                        </div>

                    </div>

                    <div className={cx('form-row')}>
                        <div className={cx('form-group', 'form-group-half')}>
                            <label className={cx('form-label')}>Hạn mức</label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.limit })}
                                placeholder="VD: Tối đa 50.000đ / đơn"
                                value={formData.limit}
                                onChange={(e) => handleInputChange('limit', e.target.value)}
                            />
                            {errors.limit && (
                                <span className={cx('error-text')}>{errors.limit}</span>
                            )}
                        </div>

                        {formData.applyType === 'by-book-type' && (
                            <div className={cx('form-group', 'form-group-half')}>
                                <label className={cx('form-label')}>Loại sách áp dụng</label>
                                <select
                                    className={cx('form-select', { error: errors.bookType })}
                                    value={formData.bookType}
                                    onChange={(e) => handleInputChange('bookType', e.target.value)}
                                >
                                    {bookTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.bookType && (
                                    <span className={cx('error-text')}>{errors.bookType}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={cx('form-row', 'form-row-three')}>
                        <div className={cx('form-group', 'form-group-third')}>
                            <label className={cx('form-label')}>Số lượng voucher</label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.quantity })}
                                placeholder="VD: 200"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange('quantity', e.target.value)}
                            />
                            {errors.quantity && (
                                <span className={cx('error-text')}>{errors.quantity}</span>
                            )}
                        </div>

                        <div className={cx('form-group', 'form-group-third')}>
                            <label className={cx('form-label')}>Ngày bắt đầu</label>
                            <div className={cx('date-input-wrapper')}>
                                <input
                                    type="text"
                                    className={cx('form-input', 'date-input', { error: errors.startDate })}
                                    placeholder="dd/mm/yyyy"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                />
                                <button type="button" className={cx('calendar-btn')}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                            {errors.startDate && (
                                <span className={cx('error-text')}>{errors.startDate}</span>
                            )}
                        </div>

                        <div className={cx('form-group', 'form-group-third')}>
                            <label className={cx('form-label')}>Ngày kết thúc</label>
                            <div className={cx('date-input-wrapper')}>
                                <input
                                    type="text"
                                    className={cx('form-input', 'date-input', { error: errors.endDate })}
                                    placeholder="dd/mm/yyyy"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                />
                                <button type="button" className={cx('calendar-btn')}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                            {errors.endDate && (
                                <span className={cx('error-text')}>{errors.endDate}</span>
                            )}
                        </div>
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Ảnh voucher</label>
                        <div className={cx('file-upload-section')}>
                            <label className={cx('file-upload-btn')}>
                                <input
                                    id="voucher-image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={cx('file-input')}
                                />
                                Chọn tệp
                            </label>
                            <span className={cx('file-name')}>
                                {selectedFileName || 'Chưa có tệp nào được chọn'}
                            </span>
                        </div>
                        {imagePreview && (
                            <div className={cx('image-preview')}>
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                        {!imagePreview && (
                            <div className={cx('image-placeholder')}></div>
                        )}
                    </div>

                    <div className={cx('form-group', 'form-group-notes')}>
                        <label className={cx('form-label')}>Ghi chú / Lý do đề xuất</label>
                        <textarea
                            className={cx('form-textarea')}
                            placeholder="VD: Đề xuất cho chiến dịch cuối năm, ưu tiên khách hàng mới."
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className={cx('form-actions')}>
                        <button className={cx('btn', 'btn-reset')} onClick={handleReset}>
                            Reset
                        </button>
                        <button className={cx('btn', 'btn-submit')} onClick={handleSubmit}>
                            Gửi duyệt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

