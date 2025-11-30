import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ReportsAnalyticsPage.module.scss';
import RevenueReport from './RevenueReport';
import OrderReport from './OrderReport';
import FinancialReport from './FinancialReport';
import BestSeller from './BestSeller';

const cx = classNames.bind(styles);

function ReportsAnalyticsPage() {
    const [activeTab, setActiveTab] = useState('revenue'); // revenue | orders | financial | top
    const [timeMode, setTimeMode] = useState('day'); // day | week | month | year | custom
    const [customDateRange, setCustomDateRange] = useState({
        start: '',
        end: ''
    });

    const handleTimeModeChange = (e) => {
        setTimeMode(e.target.value);
        // Reset custom date range khi đổi mode
        if (e.target.value !== 'custom') {
            setCustomDateRange({ start: '', end: '' });
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('headerRow')}>
                <h1 className={cx('title')}>Báo cáo và doanh thu</h1>
                <div className={cx('filters')}>
                    <span>Thống kê theo:</span>
                    <select
                        className={cx('select')}
                        value={timeMode}
                        onChange={handleTimeModeChange}
                    >
                        <option value="day">Theo ngày</option>
                        <option value="week">Theo tuần</option>
                        <option value="month">Theo tháng</option>
                        <option value="year">Theo năm</option>
                        <option value="custom">Khoảng thời gian</option>
                    </select>
                    {timeMode === 'custom' && (
                        <div className={cx('dateRangePicker')}>
                            <input
                                type="date"
                                className={cx('dateInput')}
                                value={customDateRange.start}
                                max={customDateRange.end || undefined}
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    // Nếu ngày bắt đầu > ngày kết thúc, tự động điều chỉnh ngày kết thúc
                                    if (customDateRange.end && newStart > customDateRange.end) {
                                        setCustomDateRange({ start: newStart, end: newStart });
                                    } else {
                                        setCustomDateRange({ ...customDateRange, start: newStart });
                                    }
                                }}
                                placeholder="Từ ngày"
                            />
                            <span className={cx('dateSeparator')}>đến</span>
                            <input
                                type="date"
                                className={cx('dateInput')}
                                value={customDateRange.end}
                                min={customDateRange.start || undefined}
                                onChange={(e) => {
                                    const newEnd = e.target.value;
                                    // Nếu ngày kết thúc < ngày bắt đầu, tự động điều chỉnh ngày bắt đầu
                                    if (customDateRange.start && newEnd < customDateRange.start) {
                                        setCustomDateRange({ start: newEnd, end: newEnd });
                                    } else {
                                        setCustomDateRange({ ...customDateRange, end: newEnd });
                                    }
                                }}
                                placeholder="Đến ngày"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className={cx('tabs')}>
                <button
                    type="button"
                    className={cx('tab', { tabActive: activeTab === 'revenue' })}
                    onClick={() => setActiveTab('revenue')}
                >
                    Báo cáo doanh thu
                </button>
                <button
                    type="button"
                    className={cx('tab', { tabActive: activeTab === 'orders' })}
                    onClick={() => setActiveTab('orders')}
                >
                    Báo cáo đơn hàng
                </button>
                <button
                    type="button"
                    className={cx('tab', { tabActive: activeTab === 'financial' })}
                    onClick={() => setActiveTab('financial')}
                >
                    Báo cáo tài chính
                </button>
                <button
                    type="button"
                    className={cx('tab', { tabActive: activeTab === 'top' })}
                    onClick={() => setActiveTab('top')}
                >
                    Top bán chạy
                </button>
            </div>

            {activeTab === 'revenue' && (
                <RevenueReport
                    timeMode={timeMode}
                    customDateRange={timeMode === 'custom' ? customDateRange : null}
                />
            )}

            {activeTab === 'orders' && (
                <OrderReport
                    timeMode={timeMode}
                    customDateRange={timeMode === 'custom' ? customDateRange : null}
                />
            )}

            {activeTab === 'financial' && (
                <FinancialReport
                    timeMode={timeMode}
                    customDateRange={timeMode === 'custom' ? customDateRange : null}
                />
            )}

            {activeTab === 'top' && (
                <BestSeller
                    timeMode={timeMode}
                    customDateRange={timeMode === 'custom' ? customDateRange : null}
                />
            )}
        </div>
    );
}

export default ReportsAnalyticsPage;
