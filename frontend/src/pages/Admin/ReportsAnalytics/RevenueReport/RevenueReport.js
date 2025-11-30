import { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './RevenueReport.module.scss';
import { getApiBaseUrl, getStoredToken, API_ROUTES, formatCurrency, getDateRange, formatNumber } from '../../../../services';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const cx = classNames.bind(styles);
const { financial } = API_ROUTES;

function RevenueReport({ timeMode = 'day', customDateRange = null }) {
    const [revenueSummary, setRevenueSummary] = useState(null);
    const [revenueByDay, setRevenueByDay] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const { start, end } = getDateRange(timeMode, customDateRange);
                const token = getStoredToken();
                const apiBaseUrl = getApiBaseUrl();

                // Fetch revenue summary
                const summaryResponse = await fetch(
                    `${apiBaseUrl}${financial.revenueSummary(start, end)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!summaryResponse.ok) {
                    throw new Error('Failed to fetch revenue summary');
                }

                const summaryData = await summaryResponse.json();
                if (summaryData.result) {
                    setRevenueSummary(summaryData.result);
                }

                // Fetch revenue by day
                const dayResponse = await fetch(
                    `${apiBaseUrl}${financial.revenueByDay(start, end, timeMode)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!dayResponse.ok) {
                    throw new Error('Failed to fetch revenue by day');
                }

                const dayData = await dayResponse.json();
                if (dayData.result) {
                    setRevenueByDay(dayData.result);
                }
            } catch (err) {
                console.error('Error fetching revenue data:', err);
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeMode, customDateRange]);

    // Format date label theo timeMode
    const formatDateLabel = (point, mode) => {
        // Nếu có dateTime (revenue theo giờ), dùng dateTime
        const dateStr = point.dateTime || point.date;
        const date = new Date(dateStr);

        switch (mode) {
            case 'day':
                // Nếu có dateTime, hiển thị theo giờ
                if (point.dateTime) {
                    return date.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                });
            case 'week':
                return date.toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                });
            case 'month':
                // Hiển thị tuần (ngày đầu tuần - ngày cuối tuần)
                const startOfWeek = new Date(date);
                const endOfWeek = new Date(date);
                endOfWeek.setDate(startOfWeek.getDate() + 6); // Thêm 6 ngày để có ngày cuối tuần
                const startStr = startOfWeek.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                });
                const endStr = endOfWeek.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                });
                return `${startStr} - ${endStr}`;
            case 'year':
                // Hiển thị tháng (vì đã group theo tháng)
                return date.toLocaleDateString('vi-VN', {
                    month: 'short',
                    year: 'numeric'
                });
            case 'custom':
            default:
                return date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit'
                });
        }
    };

    // Chuẩn bị data cho chart
    const chartData = useMemo(() => {
        if (!revenueByDay || revenueByDay.length === 0) {
            // Nếu là day mode, vẫn hiển thị 24 giờ với giá trị 0
            if (timeMode === 'day') {
                const labels = Array.from({ length: 24 }, (_, i) => {
                    return `${i.toString().padStart(2, '0')}:00`;
                });
                const data = Array(24).fill(0);
                return {
                    labels,
                    datasets: [
                        {
                            label: 'Doanh thu',
                            data: data,
                            borderColor: 'rgb(37, 99, 235)',
                            backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
                                gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');
                                return gradient;
                            },
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: 'rgb(37, 99, 235)',
                            pointBorderWidth: 2,
                            pointHoverBackgroundColor: 'rgb(37, 99, 235)',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2,
                        },
                    ],
                };
            }
            return null;
        }

        // Nếu là day mode, tạo mảng 24 giờ (0-23)
        if (timeMode === 'day') {
            // Tạo map để lưu revenue theo giờ
            const revenueByHour = new Map();

            // Khởi tạo tất cả 24 giờ với giá trị 0
            for (let hour = 0; hour < 24; hour++) {
                revenueByHour.set(hour, 0);
            }

            // Map data từ API vào các giờ tương ứng
            // Backend đã filter theo date range, nên chỉ cần map vào giờ
            revenueByDay.forEach(point => {
                const dateStr = point.dateTime || point.date;
                if (dateStr) {
                    const date = new Date(dateStr);
                    const hour = date.getHours();
                    const currentRevenue = revenueByHour.get(hour) || 0;
                    revenueByHour.set(hour, currentRevenue + (point.total || 0));
                }
            });

            // Tạo labels và data cho 24 giờ
            const labels = Array.from({ length: 24 }, (_, i) => {
                return `${i.toString().padStart(2, '0')}:00`;
            });
            const data = Array.from({ length: 24 }, (_, i) => {
                return revenueByHour.get(i) || 0;
            });

            return {
                labels,
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: data,
                        borderColor: 'rgb(37, 99, 235)',
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
                            gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');
                            return gradient;
                        },
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: function (context) {
                            return context.parsed.y === 0 ? 3 : 5;
                        },
                        pointHoverRadius: function (context) {
                            return context.parsed.y === 0 ? 5 : 7;
                        },
                        pointBackgroundColor: '#fff',
                        pointBorderColor: 'rgb(37, 99, 235)',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    },
                ],
            };
        }

        // Các mode khác giữ nguyên logic cũ
        // Sắp xếp theo date hoặc dateTime
        const sortedData = [...revenueByDay].sort((a, b) => {
            const dateA = a.dateTime ? new Date(a.dateTime) : new Date(a.date);
            const dateB = b.dateTime ? new Date(b.dateTime) : new Date(b.date);
            return dateA - dateB;
        });

        const labels = sortedData.map(point => formatDateLabel(point, timeMode));
        const data = sortedData.map(point => point.total || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: data,
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
                        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');
                        return gradient;
                    },
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    // Đảm bảo point luôn hiển thị, kể cả khi giá trị = 0
                    pointRadius: function (context) {
                        return context.parsed.y === 0 ? 3 : 5;
                    },
                    pointHoverRadius: function (context) {
                        return context.parsed.y === 0 ? 5 : 7;
                    },
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgb(37, 99, 235)',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: 'rgb(37, 99, 235)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                },
            ],
        };
    }, [revenueByDay, timeMode]);

    // Tính max value từ data để set trục Y
    const maxRevenue = useMemo(() => {
        if (!revenueByDay || revenueByDay.length === 0) return 0;

        // Với day mode, tính max từ tất cả các giờ trong date range
        if (timeMode === 'day') {
            const revenueByHour = new Map();
            for (let hour = 0; hour < 24; hour++) {
                revenueByHour.set(hour, 0);
            }

            // Map data từ API vào các giờ tương ứng
            // Backend đã filter theo date range, nên chỉ cần map vào giờ
            revenueByDay.forEach(point => {
                const dateStr = point.dateTime || point.date;
                if (dateStr) {
                    const date = new Date(dateStr);
                    const hour = date.getHours();
                    const currentRevenue = revenueByHour.get(hour) || 0;
                    revenueByHour.set(hour, currentRevenue + (point.total || 0));
                }
            });

            return Math.max(...Array.from(revenueByHour.values()));
        }

        return Math.max(...revenueByDay.map(point => point.total || 0));
    }, [revenueByDay, timeMode]);

    // Tính max value cho trục Y với padding
    const calculateYAxisMax = (maxValue) => {
        if (maxValue === 0) return 100; // Nếu không có data, set max = 100

        // Thêm 15% padding phía trên
        const paddedMax = maxValue * 1.15;

        // Làm tròn lên theo bậc thang đẹp
        if (paddedMax >= 1000000) {
            // Làm tròn lên đến hàng trăm nghìn
            return Math.ceil(paddedMax / 100000) * 100000;
        } else if (paddedMax >= 100000) {
            // Làm tròn lên đến hàng chục nghìn
            return Math.ceil(paddedMax / 10000) * 10000;
        } else if (paddedMax >= 10000) {
            // Làm tròn lên đến hàng nghìn
            return Math.ceil(paddedMax / 1000) * 1000;
        } else if (paddedMax >= 1000) {
            // Làm tròn lên đến hàng trăm
            return Math.ceil(paddedMax / 100) * 100;
        } else {
            // Làm tròn lên đến hàng chục
            return Math.ceil(paddedMax / 10) * 10;
        }
    };

    // Chart options
    const chartOptions = useMemo(() => {
        const yAxisMax = calculateYAxisMax(maxRevenue);

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    padding: 14,
                    titleFont: {
                        size: 13,
                        weight: '600',
                    },
                    bodyFont: {
                        size: 14,
                        weight: '500',
                    },
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            const value = context.parsed.y || 0;
                            return `Doanh thu: ${formatCurrency(value)}`;
                        },
                        filter: function (tooltipItem) {
                            // Luôn hiển thị tooltip, kể cả khi giá trị = 0
                            return true;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: yAxisMax,
                    ticks: {
                        callback: function (value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value.toLocaleString('vi-VN');
                        },
                        font: {
                            size: 11,
                            family: 'Inter, system-ui, sans-serif',
                        },
                        color: '#6b7280',
                        padding: 8,
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.06)',
                        drawBorder: false,
                    },
                },
                x: {
                    ticks: {
                        font: {
                            size: 10,
                            family: 'Inter, system-ui, sans-serif',
                        },
                        color: '#6b7280',
                        maxRotation: timeMode === 'year' ? 0 : timeMode === 'day' ? 0 : 45,
                        minRotation: timeMode === 'year' ? 0 : timeMode === 'day' ? 0 : 45,
                        padding: 6,
                        // Với day mode, hiển thị tất cả 24 giờ
                        // Chart.js sẽ tự động điều chỉnh số lượng ticks hiển thị dựa trên không gian
                        // Nhưng chúng ta vẫn có đầy đủ 24 data points
                        autoSkip: timeMode === 'day' ? true : false,
                        maxTicksLimit: timeMode === 'day' ? 24 : undefined,
                    },
                    grid: {
                        display: false,
                    },
                },
            },
        };
    }, [timeMode, maxRevenue]);

    if (loading) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo doanh thu</div>
                <div className={cx('helper')}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('card')}>
                <div className={cx('cardTitle')}>Báo cáo doanh thu</div>
                <div className={cx('helper')} style={{ color: '#b91c1c' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className={cx('card')}>
            <div className={cx('cardTitle')}>Báo cáo doanh thu</div>
            <div className={cx('cardSubtitle')}>
                Tổng quan doanh thu theo thời gian
                {timeMode === 'day' && ' (hôm nay)'}
                {timeMode === 'week' && ' (tuần này)'}
                {timeMode === 'month' && ' (tháng này)'}
                {timeMode === 'year' && ' (năm này)'}
                {timeMode === 'custom' && customDateRange?.start && customDateRange?.end &&
                    ` (${new Date(customDateRange.start).toLocaleDateString('vi-VN')} - ${new Date(customDateRange.end).toLocaleDateString('vi-VN')})`}
            </div>

            <div className={cx('statsRow')}>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng doanh thu</div>
                    <div className={cx('statValue', 'statValueAccent')}>
                        {revenueSummary?.totalRevenue
                            ? formatCurrency(revenueSummary.totalRevenue)
                            : formatCurrency(0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Tổng đơn hàng</div>
                    <div className={cx('statValue')}>
                        {formatNumber(revenueSummary?.totalOrders || 0)}
                    </div>
                </div>
                <div className={cx('statBox')}>
                    <div className={cx('statLabel')}>Giá trị trung bình</div>
                    <div className={cx('statValue')}>
                        {revenueSummary?.averageOrderValue
                            ? formatCurrency(revenueSummary.averageOrderValue)
                            : formatCurrency(0)}
                    </div>
                </div>
            </div>

            <div className={cx('chartContainer')}>
                {chartData ? (
                    <div className={cx('chartWrapper')}>
                        <div className={cx('chartTitle')}>
                            Doanh thu theo {timeMode === 'day' ? 'giờ' : timeMode === 'week' ? 'ngày' : timeMode === 'month' ? 'tuần' : timeMode === 'year' ? 'tháng' : 'ngày'}
                        </div>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                ) : (
                    <div className={cx('helper')}>Không có dữ liệu doanh thu</div>
                )}
            </div>
        </div>
    );
}

export default RevenueReport;
