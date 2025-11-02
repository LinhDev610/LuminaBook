import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './VouchersPromotionsPage.module.scss';
import { useSearchAndFilter } from '../../../../hooks';
import { SearchFilterBar } from '../../../../components/Common';

const cx = classNames.bind(styles);

// Dữ liệu mẫu - sau này sẽ thay bằng API
const mockVouchers = [
    {
        id: 1,
        code: 'VC_MAX50',
        name: 'Giảm tối đa 50k cho đơn từ 400k',
        type: 'Voucher',
        createDate: '01/11/2025',
        status: 'Chờ duyệt',
    },
    {
        id: 2,
        code: 'KM_10OFF',
        name: 'Giảm 10% tất cả sản phẩm',
        type: 'Khuyến mãi',
        createDate: '01/10/2025',
        status: 'Đã duyệt',
    },
    {
        id: 3,
        code: 'VC_B1G1',
        name: 'Mua 1 tặng 1 sách kỹ năng sống',
        type: 'Voucher',
        createDate: '15/10/2025',
        status: 'Chờ duyệt',
    },
    {
        id: 4,
        code: 'KM_TN20',
        name: 'Giảm 20% sách thiếu nhi',
        type: 'Khuyến mãi',
        createDate: '05/11/2025',
        status: 'Chờ duyệt',
    },
    {
        id: 5,
        code: 'VC_TECH15',
        name: 'Giảm 15% sách kỹ thuật',
        type: 'Voucher',
        createDate: '10/11/2025',
        status: 'Đã duyệt',
    },
    {
        id: 6,
        code: 'KM_NOVSALE',
        name: 'Khuyến mãi tháng 11 - Tất cả sản phẩm',
        type: 'Khuyến mãi',
        createDate: '01/11/2025',
        status: 'Đã duyệt',
    },
    {
        id: 7,
        code: 'VC_COMBO5',
        name: 'Voucher combo 5 sách',
        type: 'Voucher',
        createDate: '12/11/2025',
        status: 'Chờ duyệt',
    },
];

export default function VouchersPromotionsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [vouchers] = useState(mockVouchers);

    // Sử dụng hook dùng chung để filter
    const filtered = useSearchAndFilter(vouchers, {
        searchQuery,
        statusFilter: sortFilter,
        dateFilter,
        searchFields: ['code', 'name'], // Tìm kiếm theo mã và tên
        statusField: 'status',
        statusMap: {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
        },
    });

    const handleViewDetail = (id) => {
        navigate(`/staff/vouchers/${id}`);
    };

    const handleAddVoucher = () => {
        navigate('/staff/vouchers/add-voucher');
    };

    const handleAddPromotion = () => {
        navigate('/staff/vouchers/add-promotion');
    };

    const handleSearch = () => {
        // Filter đã được tính toán real-time
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Voucher & Khuyến mãi</h1>
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

            <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Tìm kiếm theo mã voucher, tên khuyến mãi....."
                dateFilter={dateFilter}
                onDateChange={(e) => setDateFilter(e.target.value)}
                onSearchClick={handleSearch}
                sortFilter={sortFilter}
                onSortChange={(e) => setSortFilter(e.target.value)}
                sortOptions={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'approved', label: 'Đã duyệt' },
                ]}
                actionButtons={[
                    { label: 'Thêm voucher', onClick: handleAddVoucher },
                    { label: 'Thêm khuyến mãi', onClick: handleAddPromotion },
                ]}
            />

            <div className={cx('table-section')}>
                <h2 className={cx('table-title')}>Danh sách Voucher / Khuyến mãi</h2>
                <div className={cx('table-container')}>
                    <table className={cx('vouchers-table')}>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Tên</th>
                                <th>Loại</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={cx('empty-cell')}>
                                        Không có voucher/khuyến mãi phù hợp.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((voucher) => (
                                <tr key={voucher.id}>
                                    <td className={cx('code-cell')}>{voucher.code}</td>
                                    <td className={cx('name-cell')}>{voucher.name}</td>
                                    <td className={cx('type-cell')}>{voucher.type}</td>
                                    <td className={cx('date-cell')}>{voucher.createDate}</td>
                                    <td className={cx('status-cell')}>
                                        <span
                                            className={cx('status-badge', {
                                                pending: voucher.status === 'Chờ duyệt',
                                                approved: voucher.status === 'Đã duyệt',
                                            })}
                                        >
                                            {voucher.status}
                                        </span>
                                    </td>
                                    <td className={cx('action-cell')}>
                                        <button
                                            className={cx('btn', 'btn-view')}
                                            onClick={() => handleViewDetail(voucher.id)}
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

