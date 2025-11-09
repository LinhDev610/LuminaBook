import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CategoryDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, getUserRole } from '../../../../services/utils';
import { useNotification } from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

function CategoryDetailPage() {
    // ========== Constants ==========
    const API_BASE_URL = getApiBaseUrl();

    // ========== State Management ==========
    const navigate = useNavigate();
    const { success, error: notifyError } = useNotification();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [category, setCategory] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [products, setProducts] = useState([]);

    // Editable fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentName, setParentName] = useState('');
    const [status, setStatus] = useState(true); // true: hiển thị, false: ẩn

    // ========== Helper Functions ==========
    const readToken = (key = 'token') => getStoredToken(key);

    // ========== Data Fetching ==========
    useEffect(() => {
        // Xóa danh sách sản phẩm cũ để tránh hiển thị sai khi đang tải danh mục mới
        setProducts([]);
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const token = readToken();

                // role check
                try {
                    const role = await getUserRole(API_BASE_URL, token);
                    setIsAdmin(role === 'ADMIN');
                } catch (_) {
                    setIsAdmin(false);
                }

                // category detail
                const resp = await fetch(`${API_BASE_URL}/categories/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                if (!resp.ok) {
                    const txt = await resp.text().catch(() => '');
                    throw new Error(txt || `HTTP ${resp.status}`);
                }
                const data = await resp.json().catch(() => ({}));
                const cat = data?.result || data;
                setCategory(cat);
                setName(cat.name || '');
                setDescription(cat.description || '');
                setParentName(cat.parentName || '-');
                setStatus(cat.status === undefined ? true : Boolean(cat.status));

                // products in category
                try {
                    const r = await fetch(`${API_BASE_URL}/products`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    });
                    if (!r.ok) throw new Error('fetch products failed');
                    const jd = await r.json().catch(() => ({}));
                    const list = jd?.result || jd?.content || jd?.items || jd || [];
                    const productsAll = Array.isArray(list) ? list : [];

                    const catId = String(cat.id || id || '').toLowerCase();
                    const catCode = String(cat.code || cat.categoryCode || '').toLowerCase();
                    const catName = String(cat.name || '').toLowerCase();

                    const filtered = productsAll.filter((p) => {
                        const pid = String(p.categoryId || p.category?.id || '').toLowerCase();
                        const pcode = String(p.categoryCode || p.category?.code || '').toLowerCase();
                        const pname = String(p.categoryName || p.category?.name || '').toLowerCase();
                        return (
                            (pid && catId && pid === catId) ||
                            (pcode && catCode && pcode === catCode) ||
                            (pname && catName && pname === catName)
                        );
                    });
                    setProducts(filtered);
                } catch (_) {
                    setProducts([]);
                }
            } catch (e) {
                setError(e?.message || 'Không thể tải thông tin danh mục');
                setCategory(null);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    // ========== Handlers ==========
    const handleBack = () => navigate('/admin/categories');

    const handleToggleEdit = () => {
        if (!isAdmin) return;
        setIsEditing((v) => !v);
    };

    const handleSave = async () => {
        if (!isAdmin) return;
        try {
            setSaving(true);
            const token = readToken();
            const payload = {
                name: (name || '').trim(),
                description: (description || '').trim() || null,
                status: Boolean(status),
            };
            const resp = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const txt = await resp.text().catch(() => '');
                throw new Error(txt || `HTTP ${resp.status}`);
            }
            const data = await resp.json().catch(() => ({}));
            const cat = data?.result || data;
            setCategory(cat);
            setName(cat.name || '');
            setDescription(cat.description || '');
            setStatus(cat.status === undefined ? true : Boolean(cat.status));
            setIsEditing(false);
            success('Cập nhật danh mục thành công');
        } catch (e) {
            notifyError('Lỗi: ' + (e?.message || 'Không thể cập nhật danh mục'));
        } finally {
            setSaving(false);
        }
    };

    // ========== UI ==========
    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }
    if (error || !category) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('error')}>
                    <p>{error || 'Không tìm thấy danh mục'}</p>
                    <button className={cx('btn', 'btn-back')} onClick={handleBack}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <button className={cx('back-btn')} onClick={handleBack}>
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
                <h1 className={cx('title')}>Chi tiết danh mục</h1>
                <div className={cx('actions')}>
                    {isAdmin && !isEditing && (
                        <button
                            className={cx('btn', 'primary')}
                            onClick={handleToggleEdit}
                        >
                            Chỉnh sửa
                        </button>
                    )}
                    {isAdmin && isEditing && (
                        <>
                            <button
                                className={cx('btn', 'muted')}
                                onClick={handleToggleEdit}
                                disabled={saving}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('section-title')}>Thông tin cơ bản</div>
                <div className={cx('info-grid')}>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>ID danh mục:</span>
                        <span className={cx('value')}>{category.id || '-'}</span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Tên danh mục:</span>
                        <span className={cx('value')}>
                            {isEditing ? (
                                <input
                                    className={cx('input')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            ) : (
                                name || '-'
                            )}
                        </span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Danh mục cha:</span>
                        <span className={cx('value')}>{parentName || '-'}</span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Mô tả:</span>
                        <span className={cx('value')}>
                            {isEditing ? (
                                <textarea
                                    className={cx('textarea')}
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            ) : (
                                description || '-'
                            )}
                        </span>
                    </div>
                    <div className={cx('info-row')}>
                        <span className={cx('label')}>Trạng thái:</span>
                        <span className={cx('value')}>
                            {isEditing ? (
                                <select
                                    className={cx('select')}
                                    value={status ? 'active' : 'locked'}
                                    onChange={(e) =>
                                        setStatus(e.target.value === 'active')
                                    }
                                >
                                    <option value="active">Hiển thị</option>
                                    <option value="locked">Ẩn</option>
                                </select>
                            ) : (
                                <span
                                    className={cx('badge', status ? 'active' : 'locked')}
                                >
                                    {status ? 'Hiển thị' : 'Ẩn'}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                {isAdmin && (
                    <div className={cx('actions')}>
                        {isEditing ? (
                            <>
                                <button
                                    className={cx('btn', 'muted')}
                                    onClick={handleToggleEdit}
                                    disabled={saving}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={cx('btn', 'primary')}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </>
                        ) : (
                            <button className={cx('btn', 'primary')} onClick={handleToggleEdit}>Chỉnh sửa</button>
                        )}
                    </div>
                )}
            </div>

            <div className={cx('card')}>
                <div className={cx('section-title')}>Sản phẩm thuộc danh mục</div>
                <div className={cx('table-wrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã SP</th>
                                <th>Tên sản phẩm</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(products) && products.length > 0 ? (
                                products.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.id}</td>
                                        <td>{p.name}</td>
                                        <td>{(p.price || 0).toLocaleString('vi-VN')}đ</td>
                                        <td>
                                            {(() => {
                                                const categoryActive = Boolean(status);
                                                const productStatus = String(p.status ?? '').trim();
                                                const productApproved =
                                                    productStatus === 'Đã duyệt' ||
                                                    productStatus === 'approved' ||
                                                    productStatus === 'active' ||
                                                    p.status === true;
                                                const visible = categoryActive && productApproved;
                                                return (
                                                    <span className={cx('badge', visible ? 'active' : 'locked')}>
                                                        {visible ? 'Hiển thị' : 'Ẩn'}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        style={{ textAlign: 'center', padding: 12 }}
                                    >
                                        Chưa có sản phẩm
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CategoryDetailPage;
