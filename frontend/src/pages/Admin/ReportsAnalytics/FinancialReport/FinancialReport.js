import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './FinancialReport.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency } from '../../../../services';

const cx = classNames.bind(styles);
const { financial } = API_ROUTES;

function FinancialReport({ timeMode = 'day', customDateRange = null }) {
    const [financialSummary, setFinancialSummary] = useState(null);
    const [paymentRevenues, setPaymentRevenues] = useState([]);
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
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                start.setDate(today.getDate() + mondayOffset);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Cả tháng hiện tại (từ ngày 1 đến ngày cuối tháng)
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(today.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                // Cả năm hiện tại (từ 1/1 đến 31/12)
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                // Mặc định: hôm nay
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiBaseUrl = getApiBaseUrl();
                const token = getStoredToken();
                const { start, end } = getDateRange();

                // Fetch financial summary
                const summaryResponse = await fetch(
                    `${apiBaseUrl}${financial.summary(start, end)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!summaryResponse.ok) {
                    throw new Error('Failed to fetch financial summary');
                }

                const summaryData = await summaryResponse.json();
                if (summaryData.result) {
                    setFinancialSummary(summaryData.result);
                }

                // Fetch payment revenues
                const paymentResponse = await fetch(
                    `${apiBaseUrl}${financial.revenueByPayment(start, end)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!paymentResponse.ok) {
                    throw new Error('Failed to fetch payment revenues');
                }

                const paymentData = await paymentResponse.json();
                if (paymentData.result) {
                    setPaymentRevenues(paymentData.result);
                }
            } catch (err) {
                console.error('Error fetching financial data:', err);
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeMode, customDateRange]);

    // Format payment method name
    const formatPaymentMethod = (method) => {
        const methodMap = {
            'MOMO': 'Ví MoMo',
            'COD': 'Thanh toán khi nhận hàng',
            'ZALO': 'Ví ZaloPay',
            'VNPAY': 'VNPay',
            'BANK_TRANSFER': 'Chuyển khoản ngân hàng',
        };
        return methodMap[method] || method;
    };

    if (loading) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo tài chính</div>
                <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo tài chính</div>
                <div style={{ padding: '20px', color: '#b91c1c' }}>Lỗi: {error}</div>
            </div>
        );
    }

    const profit = financialSummary?.profit || 0;
    const profitColor = profit >= 0 ? '#166534' : '#b91c1c';

    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo tài chính</div>
            <div className={cx('cardSubtitle')}>Tổng thu - chi - lợi nhuận</div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng thu</div>
                    <div className={cx('statValue', 'statValueAccent')}>
                        {formatCurrency(financialSummary?.totalIncome || 0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng chi</div>
                    <div className={cx('statValue')} style={{ color: '#b91c1c' }}>
                        {formatCurrency(financialSummary?.totalExpense || 0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Lợi nhuận</div>
                    <div className={cx('statValue')} style={{ color: profitColor }}>
                        {formatCurrency(profit)}
                    </div>
                </div>
            </div>

            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th>Phương thức thanh toán</th>
                        <th>Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentRevenues.length === 0 ? (
                        <tr>
                            <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                Không có doanh thu nào trong khoảng thời gian đã chọn
                            </td>
                        </tr>
                    ) : (
                        paymentRevenues
                            .sort((a, b) => (b.total || 0) - (a.total || 0)) // Sắp xếp theo doanh thu giảm dần
                            .map((item, index) => (
                                <tr key={index}>
                                    <td>{formatPaymentMethod(item.paymentMethod)}</td>
                                    <td>{formatCurrency(item.total || 0)}</td>
                                </tr>
                            ))
                    )}
                </tbody>
            </table>
            <div className={cx('helper')}>
                Tổng thu dựa trên doanh thu bán hàng (không bao gồm phí ship), tổng chi bao gồm các khoản hoàn tiền/hoàn trả.
            </div>
        </div>
    );
}

export default FinancialReport;
