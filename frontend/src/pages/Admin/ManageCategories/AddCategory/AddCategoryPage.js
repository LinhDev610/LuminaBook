import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AddCategoryPage.module.scss';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotification } from '../../../../components/Common/Notification';
import { getStoredToken } from '../../../../services/utils';
import { getRootCategories, refreshToken, createCategory } from '../../../../services';

const cx = classNames.bind(styles);

function AddCategoryPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { openLoginModal } = useAuth();
    const { success, error } = useNotification();
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        parentId: '',
        status: true
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [rootCategories, setRootCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // ========== Helper Functions ==========
    const readToken = (key = 'token') => getStoredToken(key);

    // Fetch root categories for parent category dropdown
    useEffect(() => {
        const fetchRootCategories = async () => {
            setLoadingCategories(true);
            try {
                let token = readToken('token') || sessionStorage.getItem('token');
                const categories = await getRootCategories(token) || [];
                setRootCategories(Array.isArray(categories) ? categories : []);
            } catch (err) {
                console.error('Error fetching root categories:', err);
                setRootCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchRootCategories();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Xóa error khi người dùng nhập
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.id.trim()) {
            newErrors.id = 'Vui lòng nhập mã danh mục';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên danh mục';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const refreshTokenIfNeeded = async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const { ok, data: responseData } = await refreshToken(refreshToken);
            if (ok && responseData?.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('refreshToken', responseData.token);
                return responseData.token;
            }
        } catch (_) { }
        return null;
    };

    const handleSave = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {
                let token = getStoredToken('token') || sessionStorage.getItem('token');
                if (!token) {
                    error('Thiếu token xác thực. Vui lòng đăng nhập lại bằng tài khoản admin.');
                    setIsLoading(false);
                    return;
                }

                // Prepare request data
                const requestData = {
                    id: formData.id.trim(),
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    status: formData.status,
                    parentId: (formData.parentId && formData.parentId.trim()) || null
                };

                let { ok, data: result } = await createCategory(requestData, token);

                // Nếu hết hạn -> thử refresh và gọi lại 1 lần
                if (!ok) {
                    const newToken = await refreshTokenIfNeeded();
                    if (newToken) {
                        token = newToken;
                        const retryResult = await createCategory(requestData, token);
                        ok = retryResult.ok;
                        result = retryResult.data;
                    } else {
                        // Không có refreshToken (user không tick Ghi nhớ) -> buộc đăng nhập lại
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        sessionStorage.removeItem('token');
                        error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                        navigate('/', { replace: true });
                        // Mở modal đăng nhập nếu có sẵn context
                        try { openLoginModal?.(); } catch (_) { }
                        return;
                    }
                }

                if (ok) {
                    success('Tạo danh mục thành công!');
                    navigate('/admin/categories');
                } else {
                    const serverMsg = result?.message || result?.error || '';
                    error(serverMsg || 'Không thể tạo danh mục. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error('Error creating category:', error);
                error('Không thể kết nối máy chủ. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCancel = () => {
        navigate('/admin/categories');
    };

    return (
        <div className={cx('add-category-page')}>
            <div className={cx('page-header')}>
                <button className={cx('back-btn')} onClick={handleCancel}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1 className={cx('page-title')}>Thêm danh mục</h1>
            </div>

            <div className={cx('form-container')}>
                <div className={cx('form-card')}>
                    <div className={cx('form-content')}>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Mã danh mục <span className={cx('required')}>*</span>
                            </label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.id })}
                                placeholder="VD: DM0001"
                                value={formData.id}
                                onChange={(e) => handleInputChange('id', e.target.value)}
                            />
                            {errors.id && <span className={cx('error-message')}>{errors.id}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Tên danh mục <span className={cx('required')}>*</span>
                            </label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.name })}
                                placeholder="VD: Sách Giáo Khoa"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                            {errors.name && <span className={cx('error-message')}>{errors.name}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Mô tả</label>
                            <textarea
                                className={cx('form-textarea', { error: errors.description })}
                                placeholder="VD: Danh mục chứa các sách giáo khoa phổ thông."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                            />
                            {errors.description && <span className={cx('error-message')}>{errors.description}</span>}
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group', 'half')}>
                                <label className={cx('form-label')}>Danh mục cha</label>
                                <select
                                    className={cx('form-select', { error: errors.parentId })}
                                    value={formData.parentId}
                                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                                    disabled={loadingCategories}
                                >
                                    <option value="">-- Không có (Danh mục gốc) --</option>
                                    {rootCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.parentId && <span className={cx('error-message')}>{errors.parentId}</span>}
                            </div>

                            <div className={cx('form-group', 'half')}>
                                <label className={cx('form-label')}>Trạng thái hiển thị</label>
                                <div className={cx('toggle-container')}>
                                    <label className={cx('toggle-switch')}>
                                        <input
                                            type="checkbox"
                                            checked={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.checked)}
                                        />
                                        <span className={cx('toggle-slider')}></span>
                                    </label>
                                    <span className={cx('toggle-label')}>
                                        {formData.status ? 'Hiển thị' : 'Ẩn'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cx('form-footer')}>
                        <button className={cx('btn', 'cancel-btn')} onClick={handleCancel}>
                            Hủy
                        </button>
                        <button
                            className={cx('btn', 'save-btn')}
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang lưu...' : 'Lưu danh mục'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddCategoryPage;
