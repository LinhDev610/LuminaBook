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
    const [timeMode, setTimeMode] = useState('day'); // day | month | year

    return (
        <div className={cx('wrapper')}>
            <div className={cx('headerRow')}>
                <h1 className={cx('title')}>Báo cáo và doanh thu</h1>
                <div className={cx('filters')}>
                    <span>Thống kê theo:</span>
                    <select
                        className={cx('select')}
                        value={timeMode}
                        onChange={(e) => setTimeMode(e.target.value)}
                    >
                        <option value="day">Theo ngày</option>
                        <option value="month">Theo tháng</option>
                        <option value="year">Theo năm</option>
                    </select>
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

            {activeTab === 'revenue' && <RevenueReport />}

            {activeTab === 'orders' && <OrderReport />}

            {activeTab === 'financial' && <FinancialReport />}

            {activeTab === 'top' && <BestSeller />}
        </div>
    );
}

export default ReportsAnalyticsPage;
