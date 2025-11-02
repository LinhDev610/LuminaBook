import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentManagementPage.module.scss';
import { useSearchAndFilter } from '../../../../hooks';
import { SearchFilterBar } from '../../../../components/Common';

const cx = classNames.bind(styles);

// Dữ liệu mẫu - sau này sẽ thay bằng API
const mockContents = [
    {
        id: 1,
        title: 'Sách mới tháng 10',
        createDate: '08/10/2025',
        status: 'Chờ duyệt',
        creator: 'Lê Hòa',
    },
    {
        id: 2,
        title: 'Bộ sưu tập du học',
        createDate: '15/09/2025',
        status: 'Đã duyệt',
        creator: 'Ngọc Hà',
    },
    {
        id: 3,
        title: 'Khám phá sách thiếu nhi',
        createDate: '20/09/2025',
        status: 'Đã duyệt',
        creator: 'Minh Tâm',
    },
    {
        id: 4,
        title: 'Top sách kỹ năng tháng 10',
        createDate: '05/10/2025',
        status: 'Chờ duyệt',
        creator: 'Lê Hòa',
    },
    {
        id: 5,
        title: 'Combo sách cha mẹ & con',
        createDate: '12/09/2025',
        status: 'Chờ duyệt',
        creator: 'Ngọc Hà',
    },
    {
        id: 6,
        title: 'Banner "Đọc là hạnh phúc"',
        createDate: '25/09/2025',
        status: 'Đã duyệt',
        creator: 'Minh Tâm',
    },
    {
        id: 7,
        title: 'Ưu đãi sách văn học Việt',
        createDate: '30/09/2025',
        status: 'Chờ duyệt',
        creator: 'Lê Hòa',
    },
    {
        id: 8,
        title: 'Chào tháng 10 cùng sách',
        createDate: '01/10/2025',
        status: 'Chờ duyệt',
        creator: 'Ngọc Hà',
    },
];

export default function ContentManagementPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [contents] = useState(mockContents);

    // Sử dụng hook dùng chung để filter
    const filtered = useSearchAndFilter(contents, {
        searchQuery,
        statusFilter: sortFilter,
        dateFilter,
        searchFields: ['title'], // Tìm kiếm theo title
        statusField: 'status',
        statusMap: {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
        },
    });

    const handleViewDetail = (id) => {
        navigate(`/staff/content/${id}`);
    };

    const handleAddBanner = () => {
        navigate('/staff/content/add-banner');
    };

    const handleSearch = () => {
        // Filter đã được tính toán real-time trong filtered
        // Có thể thêm logic bổ sung nếu cần
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý nội dung</h1>
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
                searchPlaceholder="Tìm kiếm theo tiêu đề, mô tả..."
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
                    { label: 'Thêm Banner/ Slider', onClick: handleAddBanner },
                ]}
            />

            <div className={cx('table-container')}>
                <table className={cx('content-table')}>
                    <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Người tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className={cx('empty-cell')}>
                                    Không có nội dung phù hợp.
                                </td>
                            </tr>
                        )}
                        {filtered.map((content) => (
                            <tr key={content.id}>
                                <td className={cx('title-cell')}>{content.title}</td>
                                <td className={cx('date-cell')}>{content.createDate}</td>
                                <td className={cx('status-cell')}>
                                    <span
                                        className={cx('status-badge', {
                                            pending: content.status === 'Chờ duyệt',
                                            approved: content.status === 'Đã duyệt',
                                        })}
                                    >
                                        {content.status}
                                    </span>
                                </td>
                                <td className={cx('creator-cell')}>{content.creator}</td>
                                <td className={cx('action-cell')}>
                                    <button
                                        className={cx('btn', 'btn-detail')}
                                        onClick={() => handleViewDetail(content.id)}
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

