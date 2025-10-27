import React from 'react';
import classNames from 'classnames/bind';
import styles from './SearchAndSort.module.scss';

const cx = classNames.bind(styles);

function SearchAndSort({ 
    searchPlaceholder = "Tìm kiếm...",
    searchValue,
    onSearchChange,
    onSearchClick,
    sortLabel = "Sắp xếp:",
    sortOptions = [],
    sortValue,
    onSortChange,
    additionalButtons = []
}) {
    return (
        <div className={cx('search-sort-container')}>
            <div className={cx('search-section')}>
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className={cx('search-input')}
                    value={searchValue}
                    onChange={onSearchChange}
                />
                <button className={cx('search-btn')} onClick={onSearchClick}>
                    Tìm kiếm
                </button>
            </div>

            <div className={cx('sort-section')}>
                <span className={cx('sort-label')}>{sortLabel}</span>
                <select className={cx('sort-dropdown')} value={sortValue} onChange={onSortChange}>
                    {sortOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {additionalButtons.map((button, index) => (
                <button 
                    key={index}
                    className={cx('btn', button.className)} 
                    onClick={button.onClick}
                >
                    {button.text}
                </button>
            ))}
        </div>
    );
}

export default SearchAndSort;
