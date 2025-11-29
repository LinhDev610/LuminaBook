import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './BestSeller.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency } from '../../../../services';

const cx = classNames.bind(styles);
const { financial } = API_ROUTES;

function BestSeller({ timeMode = 'day', customDateRange = null }) {
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tính date range dựa trên timeMode
    const getDateRange = () => {
        // Nếu là custom, sử dụng date range từ props
        if (timeMode === 'custom' && customDateRange) {
            if (!customDateRange.start || !customDateRange.end) {
                // Nếu chưa chọn đủ, trả về hôm nay
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                return { start: todayStr, end: todayStr };
            }
            return {
                start: customDateRange.start,
                end: customDateRange.end,
            };
        }

        const today = new Date();
        const end = new Date(today);
        const start = new Date(today);

        switch (timeMode) {
            case 'day':
                // Chỉ hôm nay
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                // Tuần này (từ thứ 2 đến Chủ nhật)
                const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu CN thì lùi 6 ngày, nếu không thì tính offset về thứ 2
                start.setDate(today.getDate() + mondayOffset);
                start.setHours(0, 0, 0, 0);
                // End là Chủ nhật của tuần này (thứ 2 + 6 ngày)
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Cả tháng hiện tại (từ ngày 1 đến ngày cuối tháng)
                start.setDate(1); // Ngày đầu tháng
                start.setHours(0, 0, 0, 0);
                // End là ngày cuối cùng của tháng
                end.setMonth(today.getMonth() + 1, 0); // Ngày 0 của tháng sau = ngày cuối tháng hiện tại
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                // Cả năm hiện tại (từ tháng 1 đến tháng 12)
                start.setMonth(0, 1); // Tháng 1, ngày 1
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31); // Tháng 12, ngày 31
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    };

    useEffect(() => {
        const fetchTopProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const { start, end } = getDateRange();
                const url = `${getApiBaseUrl()}${financial.topProducts(start, end, 10)}`;
                const token = getStoredToken();

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('BestSeller - HTTP error:', response.status, errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // ApiResponse không có field success, chỉ có code (1000 = success), message, và result
                if (data.result && Array.isArray(data.result)) {
                    setTopProducts(data.result);
                } else {
                    console.warn('BestSeller - No valid data in response. Code:', data.code, 'Result:', data.result);
                    setTopProducts([]);
                }
            } catch (err) {
                console.error('BestSeller - Error fetching top products:', err);
                setError(err.message);
                setTopProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, [timeMode, customDateRange]);

    const currentDateRange = getDateRange();

    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Top bán chạy</div>
            <div className={cx('cardSubtitle')}>
                Top sách theo doanh thu
                {!loading && (
                    <span className={cx('dateRangeInfo')}>
                        {' '}({currentDateRange.start} đến {currentDateRange.end})
                    </span>
                )}
            </div>

            {loading ? (
                <div className={cx('loading')}>Đang tải...</div>
            ) : error ? (
                <div className={cx('error')}>Lỗi: {error}</div>
            ) : (
                <>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên sách</th>
                                <th>Số lượng</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={cx('noData')}>
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                topProducts.map((product, index) => (
                                    <tr key={product.productId || index}>
                                        <td>{index + 1}</td>
                                        <td>{product.productName || 'N/A'}</td>
                                        <td>{(product.quantity || 0).toLocaleString('vi-VN')}</td>
                                        <td>{formatCurrency(product.total || 0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {topProducts.length > 0 && (
                        <div className={cx('helper')}>
                            Hiển thị top {topProducts.length} sản phẩm bán chạy nhất theo doanh thu.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default BestSeller;
