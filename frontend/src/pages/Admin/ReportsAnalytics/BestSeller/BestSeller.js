import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './BestSeller.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency, getDateRange } from '../../../../services';

const cx = classNames.bind(styles);
const { financial } = API_ROUTES;

function BestSeller({ timeMode = 'day', customDateRange = null }) {
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const { start, end } = getDateRange(timeMode, customDateRange);
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
                    // Sắp xếp theo doanh thu (total) giảm dần và giới hạn tối đa 10 sản phẩm
                    const sortedTop10 = [...data.result]
                        .sort((a, b) => (b.total || 0) - (a.total || 0))
                        .slice(0, 10);
                    setTopProducts(sortedTop10);
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

    const currentDateRange = getDateRange(timeMode, customDateRange);

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
