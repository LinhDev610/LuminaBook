import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CategoryDetailPage.module.scss';
import { getApiBaseUrl, getStoredToken, getUserRole } from '../../../../services/utils';

const cx = classNames.bind(styles);

function CategoryDetailPage() {
    // ========== Constants ==========
    const API_BASE_URL = getApiBaseUrl();

    // ========== State Management ==========
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState(null);
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
        navigate(`/admin/categories/${id}/update`);
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
            </div>

            <div className={cx('card')}>
                <div className={cx('card-header')}>
                    <span className={cx('category-name')}>Danh mục: {name || '-'}</span>
                    {isAdmin && (
                        <div className={cx('card-actions')}>
                            <button
                                className={cx('btn', 'primary')}
                                onClick={handleToggleEdit}
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    )}
                </div>
                <div className={cx('section')}>
                    <div className={cx('section-title')}>
                        <span className={cx('section-bar')}></span>
                        <span>Thông tin cơ bản</span>
                    </div>
                    <div className={cx('info-grid')}>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>ID danh mục:</span>
                            <span className={cx('value')}>{category.id || '-'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Tên danh mục:</span>
                            <span className={cx('value')}>{name || '-'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Danh mục cha:</span>
                            <span className={cx('value')}>{parentName || '-'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Mô tả:</span>
                            <span className={cx('value')}>{description || '-'}</span>
                        </div>
                        <div className={cx('info-row')}>
                            <span className={cx('label')}>Trạng thái:</span>
                            <span className={cx('value')}>
                                <span
                                    className={cx('badge', status ? 'active' : 'locked')}
                                >
                                    {status ? 'Hiển thị' : 'Ẩn'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('section')}>
                    <div className={cx('section-title')}>
                        <span className={cx('section-bar')}></span>
                        <span>Sản phẩm thuộc danh mục</span>
                    </div>
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
        </div>
    );
}

export default CategoryDetailPage;
