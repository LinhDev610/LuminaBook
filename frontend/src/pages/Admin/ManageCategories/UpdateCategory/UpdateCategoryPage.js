import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './UpdateCategoryPage.module.scss';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotification } from '../../../../components/Common/Notification';
import { getApiBaseUrl, getStoredToken } from '../../../../services/utils';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();

function UpdateCategoryPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { id } = useParams();
    const { openLoginModal } = useAuth();
    const { success, error } = useNotification();
    const [isEditMode, setIsEditMode] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
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

    // Fetch category data if editing
    useEffect(() => {
        if (id && id !== 'new') {
            setIsEditMode(true);
            setLoadingData(true);
            const fetchCategory = async () => {
                try {
                    const token = readToken();
                    const resp = await fetch(`${API_BASE_URL}/categories/${id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });
                    if (!resp.ok) {
                        throw new Error('Không thể tải thông tin danh mục');
                    }
                    const data = await resp.json().catch(() => ({}));
                    const cat = data?.result || data;
                    setFormData({
                        id: cat.id || '',
                        name: cat.name || '',
                        description: cat.description || '',
                        parentId: cat.parentId || cat.parent?.id || '',
                        status: cat.status === undefined ? true : Boolean(cat.status),
                    });
                } catch (err) {
                    console.error('Error fetching category:', err);
                    error('Không thể tải thông tin danh mục');
                } finally {
                    setLoadingData(false);
                }
            };
            fetchCategory();
        }
    }, [id]);

    // Fetch root categories for parent category dropdown
    useEffect(() => {
        const fetchRootCategories = async () => {
            setLoadingCategories(true);
            try {
                let token = readToken('token') || sessionStorage.getItem('token');
                const resp = await fetch(`${API_BASE_URL}/categories/root`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                const data = await resp.json().catch(() => ({}));
                const categories = data?.result || data || [];
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
            const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken })
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data?.result?.token) {
                localStorage.setItem('token', data.result.token);
                localStorage.setItem('refreshToken', data.result.token);
                return data.result.token;
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

                const url = isEditMode
                    ? `${API_BASE_URL}/categories/${id}`
                    : `${API_BASE_URL}/categories`;
                const method = isEditMode ? 'PUT' : 'POST';

                let response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                let data = {};
                try { data = await response.json(); } catch (_) { }

                // Nếu hết hạn -> thử refresh và gọi lại 1 lần
                if (response.status === 401) {
                    const newToken = await refreshTokenIfNeeded();
                    if (newToken) {
                        token = newToken;
                        response = await fetch(url, {
                            method: method,
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestData),
                        });
                        try { data = await response.json(); } catch (_) { }
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

                if (response.ok) {
                    success(isEditMode ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!');
                    navigate('/admin/categories');
                } else {
                    // Extract error message from response
                    const serverMsg = data?.message || data?.error || data?.result || '';
                    const errorCode = data?.code;

                    if (response.status === 403) {
                        error('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập bằng tài khoản ADMIN.');
                    } else if (response.status === 401) {
                        error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    } else if (response.status === 400) {
                        // More specific error messages
                        let errorAlert = '';
                        if (serverMsg) {
                            errorAlert = serverMsg;
                        } else if (errorCode) {
                            errorAlert = `Lỗi mã ${errorCode}: Vui lòng kiểm tra lại thông tin.`;
                        } else {
                            errorAlert = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin. Có thể mã danh mục hoặc tên danh mục đã tồn tại.';
                        }

                        // Show specific messages for common errors
                        if (serverMsg && (serverMsg.includes('existed') || serverMsg.includes('tồn tại'))) {
                            error(`Danh mục đã tồn tại: ${serverMsg}`);
                        } else if (serverMsg && (serverMsg.includes('không được để trống') || serverMsg.includes('không hợp lệ') || serverMsg.includes('vượt quá'))) {
                            error(`Dữ liệu không hợp lệ: ${serverMsg}`);
                        } else {
                            error(`Dữ liệu không hợp lệ: ${errorAlert}`);
                        }
                    } else {
                        error(`Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} danh mục (HTTP ${response.status}): ${serverMsg || 'Không rõ nguyên nhân'}`);
                    }
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

    if (loadingData) {
        return (
            <div className={cx('add-category-page')}>
                <div className={cx('page-header')}>
                    <button className={cx('back-btn')} onClick={handleCancel}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className={cx('page-title')}>Chỉnh sửa danh mục</h1>
                </div>
                <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={cx('add-category-page')}>
            <div className={cx('page-header')}>
                <button className={cx('back-btn')} onClick={handleCancel}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1 className={cx('page-title')}>{isEditMode ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h1>
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
                            {isLoading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Lưu danh mục')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdateCategoryPage;
