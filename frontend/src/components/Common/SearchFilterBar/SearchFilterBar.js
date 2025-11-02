import classNames from 'classnames/bind';
import styles from './SearchFilterBar.module.scss';

const cx = classNames.bind(styles);

export default function SearchFilterBar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm...',
    dateFilter,
    onDateChange,
    onSearchClick,
    sortFilter,
    onSortChange,
    sortOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ duyệt' },
        { value: 'approved', label: 'Đã duyệt' },
    ],
    sortLabel = 'Sắp xếp:',
    actionButtons = [],
}) {
    return (
        <div className={cx('search-section')}>
            <div className={cx('search-row')}>
                <input
                    type="text"
                    className={cx('search-input')}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={onSearchChange}
                />
                <div className={cx('date-wrapper')}>
                    <input
                        type="text"
                        className={cx('date-input')}
                        placeholder="dd/mm/yyyy"
                        value={dateFilter}
                        onChange={onDateChange}
                    />
                    <svg
                        className={cx('calendar-icon')}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <button className={cx('btn', 'btn-search')} onClick={onSearchClick}>
                    Tìm kiếm
                </button>
            </div>

            <div className={cx('actions-row')}>
                <div className={cx('sort-wrapper')}>
                    <label className={cx('sort-label')}>{sortLabel}</label>
                    <select
                        className={cx('sort-select')}
                        value={sortFilter}
                        onChange={onSortChange}
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {actionButtons.length > 0 && (
                    <div className={cx('action-buttons')}>
                        {actionButtons.map((button, index) => (
                            <button
                                key={index}
                                className={cx('btn', 'btn-add')}
                                onClick={button.onClick}
                            >
                                {button.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

