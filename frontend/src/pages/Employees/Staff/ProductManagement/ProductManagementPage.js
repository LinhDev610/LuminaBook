import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookPlaceholder from '../../../../assets/images/img_sach.png';

const cx = classNames.bind(styles);

const mockProducts = [
    { id: 'P001', name: 'Tư duy nhanh và chậm', category: 'Kỹ năng sống', price: 120000, status: 'Chờ duyệt', updatedAt: '2025-10-31T08:30:00Z' },
    { id: 'P002', name: 'Dạy con làm giàu 1', category: 'Tài chính', price: 145000, status: 'Đã duyệt', updatedAt: '2025-10-31T07:10:00Z' },
];

function formatDateTime(value) {
    try {
        const d = new Date(value);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch (_) {
        return value;
    }
}

export default function ProductManagementPage() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('');
    const [date, setDate] = useState('');
    const [tab, setTab] = useState('all');

    const filtered = mockProducts.filter((p) => {
        const byTab =
            tab === 'all' ||
            (tab === 'pending' && p.status === 'Chờ duyệt') ||
            (tab === 'approved' && p.status === 'Đã duyệt') ||
            (tab === 'rejected' && p.status === 'Từ chối');
        const byKeyword = !keyword || p.name.toLowerCase().includes(keyword.toLowerCase());
        return byTab && byKeyword;
    });

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý sản phẩm</h2>
            </div>

            <div className={cx('controls-top')}>
                <input
                    className={cx('search-large')}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm kiếm theo mã, tên sản phẩm,..."
                />
                <input
                    type="date"
                    className={cx('date-input')}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <button className={cx('btn', 'secondary')}>Tìm kiếm</button>
            </div>

            <div className={cx('bottom-actions')}>
                <button className={cx('btn', 'primary')} onClick={() => navigate('/staff/products/new')}>Thêm sản phẩm</button>
            </div>

            <div className={cx('controls')}>
                <div className={cx('tabs')}>
                    <button className={cx('tab', { active: tab === 'all' })} onClick={() => setTab('all')}>Tất cả</button>
                    <button className={cx('tab', { active: tab === 'pending' })} onClick={() => setTab('pending')}>Chờ duyệt</button>
                    <button className={cx('tab', { active: tab === 'approved' })} onClick={() => setTab('approved')}>Đã duyệt</button>
                    <button className={cx('tab', { active: tab === 'rejected' })} onClick={() => setTab('rejected')}>Từ chối</button>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('card-header')}>Danh sách sản phẩm</div>
                <table className={cx('table')}>
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Cập nhật</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td className={cx('thumb-cell')}><img src={bookPlaceholder} alt="thumb" className={cx('thumb')} /></td>
                                <td className={cx('product-cell')}>
                                    <div className={cx('prod-name')}>{p.name}</div>
                                    <div className={cx('prod-id')}>#{p.id}</div>
                                </td>
                                <td>{p.category}</td>
                                <td>{p.price.toLocaleString()} đ</td>
                                <td><span className={cx('badge', p.status === 'Chờ duyệt' ? 'pending' : p.status === 'Đã duyệt' ? 'approved' : 'rejected')}>{p.status}</span></td>
                                <td>{formatDateTime(p.updatedAt)}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className={cx('empty')}>Không có sản phẩm phù hợp.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


