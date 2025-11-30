import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './FinancialReport.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency, getDateRange } from '../../../../services';

const cx = classNames.bind(styles);
const { financial } = API_ROUTES;

function FinancialReport({ timeMode = 'day', customDateRange = null }) {
    const [financialSummary, setFinancialSummary] = useState(null);
    const [paymentRevenues, setPaymentRevenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiBaseUrl = getApiBaseUrl();
                const token = getStoredToken();
                const { start, end } = getDateRange(timeMode, customDateRange);

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
                    console.log('Financial Summary Data:', summaryData.result);
                    setFinancialSummary(summaryData.result);
                } else {
                    console.warn('Financial Summary: No result data received', summaryData);
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

    // Tính lợi nhuận = Tổng thu - Tổng chi (tự tính để đảm bảo chính xác)
    const totalIncome = financialSummary?.totalIncome || 0;
    const totalExpense = financialSummary?.totalExpense || 0;
    const profit = totalIncome - totalExpense;
    const profitColor = profit >= 0 ? '#166534' : '#b91c1c';

    // Debug logging
    console.log('Financial Report Calculation:', {
        totalIncome,
        totalExpense,
        profit,
        backendProfit: financialSummary?.profit,
        calculatedProfit: totalIncome - totalExpense
    });

    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo tài chính</div>
            <div className={cx('cardSubtitle')}>Tổng thu - chi - lợi nhuận</div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng thu</div>
                    <div className={cx('statValue', 'statValueAccent')}>
                        {formatCurrency(totalIncome)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng chi</div>
                    <div className={cx('statValue')} style={{ color: '#b91c1c' }}>
                        {formatCurrency(totalExpense)}
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
                Tổng thu dựa trên doanh thu bán hàng (không bao gồm phí ship).
                COD: chỉ tính khi đơn hàng đã giao thành công. MoMo: chỉ tính khi đã thanh toán và nhân viên xác nhận.
                Tổng chi bao gồm giá gốc sản phẩm và các khoản hoàn tiền/hoàn trả.
            </div>
        </div>
    );
}

export default FinancialReport;
