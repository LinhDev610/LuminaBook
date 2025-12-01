import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import homeStyles from '../Home/Home.module.scss';
import supportStyles from './CustomerService.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl, getStoredToken } from '../../services/utils';
import { getMyInfo } from '../../services';

// Import icons
import iconBox from '../../assets/icons/icon_box.png';
import iconReturn from '../../assets/icons/icon_return.png';
import iconCard from '../../assets/icons/icon_card.png';
import iconCall from '../../assets/icons/icon_call.png';
import iconClock from '../../assets/icons/icon_clock.png';
import iconComplaint from '../../assets/icons/icon_complaint.png';

const cxHome = classNames.bind(homeStyles);
const cxSupport = classNames.bind(supportStyles);

export default function CustomerService() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_BASE_URL = getApiBaseUrl();
    const [formData, setFormData] = useState({
        orderId: '',
        orderIdOther: '', // For "Khác" option
        customerName: '',
        email: '',
        phone: '',
        issue: '',
        notes: ''
    });
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isOrderIdOther, setIsOrderIdOther] = useState(false);

    // Tự động điền thông tin user và lấy danh sách đơn hàng khi đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = getStoredToken();
            if (!token) {
                // Nếu chưa đăng nhập, giữ form trống
                return;
            }

            try {
                const userInfo = await getMyInfo(token);
                if (userInfo) {
                    setFormData(prev => ({
                        ...prev,
                        customerName: userInfo.fullName || userInfo.full_name || prev.customerName || '',
                        email: userInfo.email || prev.email || '',
                        phone: userInfo.phoneNumber || userInfo.phone_number || prev.phone || '',
                    }));
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                // Không hiển thị lỗi, chỉ log để không làm gián đoạn UX
            }
        };

        const fetchOrders = async () => {
            const token = getStoredToken();
            if (!token) {
                return;
            }

            setLoadingOrders(true);
            try {
                const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    // Lấy danh sách đơn hàng và format để hiển thị
                    const ordersList = Array.isArray(data.result) ? data.result : [];
                    setOrders(ordersList);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                // Không hiển thị lỗi, chỉ log
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchUserInfo();
        fetchOrders();
    }, [API_BASE_URL]); // Chạy một lần khi component mount

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        // Check if user is logged in
        const token = getStoredToken();
        if (!token) {
            setSubmitError('Vui lòng đăng nhập để gửi khiếu nại');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return;
        }

        // Validation
        if (!isOrderIdOther) {
            if (!formData.orderId || !formData.orderId.trim()) {
                setSubmitError('Vui lòng chọn đơn hàng hoặc chọn "Khác"');
                return;
            }
        } else {
            if (!formData.orderIdOther || !formData.orderIdOther.trim()) {
                setSubmitError('Vui lòng nhập thông tin khiếu nại');
                return;
            }
        }
        if (!formData.customerName || !formData.customerName.trim()) {
            setSubmitError('Vui lòng nhập họ và tên');
            return;
        }
        if (!formData.email || !formData.email.trim()) {
            setSubmitError('Vui lòng nhập email');
            return;
        }
        if (!formData.phone || !formData.phone.trim()) {
            setSubmitError('Vui lòng nhập số điện thoại');
            return;
        }
        if (!formData.issue || !formData.issue.trim()) {
            setSubmitError('Vui lòng mô tả tình trạng bạn đang gặp phải');
            return;
        }

        setIsSubmitting(true);

        try {
            // Combine issue and notes into content
            const orderInfo = isOrderIdOther 
                ? `Khiếu nại khác: ${formData.orderIdOther.trim()}`
                : `Mã đơn hàng: ${formData.orderId.trim()}`;
            
            const content = `${orderInfo}\n\nVấn đề: ${formData.issue}` + (formData.notes ? `\n\nGhi chú thêm: ${formData.notes}` : '');

            const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderCode: isOrderIdOther ? 'KHAC' : formData.orderId.trim(),
                    customerName: formData.customerName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    content: content.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.');
            }

            // Success
            setSubmitSuccess(true);
            // Reset form nhưng giữ lại thông tin user
            setFormData(prev => ({
                orderId: '',
                orderIdOther: '',
                customerName: prev.customerName,
                email: prev.email,
                phone: prev.phone,
                issue: '',
                notes: ''
            }));
            setIsOrderIdOther(false);

            // Hide success message after 5 seconds
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 5000);
        } catch (error) {
            console.error('Error submitting support request:', error);
            setSubmitError(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const faqItems = [
        {
            icon: iconBox,
            question: 'Làm thế nào để kiểm tra tình trạng đơn hàng?',
            answer: 'Bạn có thể kiểm tra tình trạng đơn hàng bằng cách đăng nhập vào tài khoản và vào mục "Lịch sử đơn hàng" hoặc liên hệ hotline 0123 456 789.',
            link: '/customer-account/orders'
        },
        {
            icon: iconReturn,
            question: 'Tôi muốn đổi hoặc trả sản phẩm, phải làm sao?',
            answer: 'Bạn có thể đổi/trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng. Vui lòng xem chi tiết chính sách đổi trả hoặc gửi yêu cầu qua form bên dưới.',
            link: '/support/return-policy'
        },
        {
            icon: iconCard,
            question: 'Tôi có thể thanh toán bằng hình thức nào?',
            answer: 'Chúng tôi hỗ trợ thanh toán qua MoMo (ví điện tử) và thanh toán khi nhận hàng (COD). Xem chi tiết các phương thức thanh toán.',
            link: '/support/payment-policy'
        },
        {
            icon: iconClock,
            question: 'Thời gian giao hàng dự kiến là bao lâu?',
            answer: 'Từ 2-5 ngày làm việc tùy khu vực. Bạn sẽ nhận được thông báo khi đơn hàng được vận chuyển. Xem chi tiết chính sách vận chuyển.',
            link: '/support/shipping-policy'
        }
    ];

    return (
        <div className={cxHome('home-wrapper')}>
            <main className={cxHome('home-content')}>
                {/* FAQ Section */}
                <section className={cxSupport('faq-section')}>
                    <div className={cxSupport('section-header')}>
                        <div className={cxSupport('header-icon')}>❓</div>
                        <div className={cxSupport('header-bar')}></div>
                        <h2 className={cxSupport('section-title')}>Câu hỏi thường gặp</h2>
                    </div>
                    
                    <div className={cxSupport('faq-list')}>
                        {faqItems.map((item, index) => {
                            const handleClick = (e) => {
                                if (item.link.startsWith('#')) {
                                    e.preventDefault();
                                    const element = document.getElementById(item.link.substring(1));
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }
                            };

                            return (
                                <Link 
                                    key={index} 
                                    to={item.link} 
                                    className={cxSupport('faq-item')}
                                    onClick={handleClick}
                                >
                                    <div className={cxSupport('faq-icon')}>
                                        <img src={item.icon} alt="FAQ Icon" />
                                    </div>
                                    <div className={cxSupport('faq-content')}>
                                        <h3 className={cxSupport('faq-question')}>{item.question}</h3>
                                        <p className={cxSupport('faq-answer')}>{item.answer}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Support Request Form */}
                <section id="support-form" className={cxSupport('support-form-section')}>
                    <div className={cxSupport('section-header')}>
                        <div className={cxSupport('header-icon')}>
                            <img src={iconComplaint} alt="Complaint Icon" />
                        </div>
                        <div className={cxSupport('header-bar')}></div>
                        <h2 className={cxSupport('section-title')}>Gửi yêu cầu hỗ trợ/ khiếu nại</h2>
                    </div>

                    <form className={cxSupport('support-form')} onSubmit={handleSubmit}>
                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Mã đơn hàng:</label>
                                {loadingOrders ? (
                                    <div style={{ padding: '12px', color: '#666' }}>Đang tải danh sách đơn hàng...</div>
                                ) : orders.length > 0 ? (
                                    <>
                                        <select
                                            name="orderId"
                                            value={isOrderIdOther ? 'OTHER' : formData.orderId}
                                            onChange={(e) => {
                                                if (e.target.value === 'OTHER') {
                                                    setIsOrderIdOther(true);
                                                    setFormData(prev => ({ ...prev, orderId: '' }));
                                                } else {
                                                    setIsOrderIdOther(false);
                                                    handleInputChange(e);
                                                }
                                            }}
                                            className={cxSupport('form-input')}
                                            style={{ padding: '12px', cursor: 'pointer' }}
                                        >
                                            <option value="">-- Chọn đơn hàng --</option>
                                            {orders.map((order) => (
                                                <option key={order.id} value={order.code || order.orderCode || order.id}>
                                                    {order.code || order.orderCode || `Đơn hàng #${order.id.substring(0, 8)}`}
                                                    {order.createdAt && ` - ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`}
                                                </option>
                                            ))}
                                            <option value="OTHER">Khác</option>
                                        </select>
                                        {isOrderIdOther && (
                                            <input
                                                type="text"
                                                name="orderIdOther"
                                                value={formData.orderIdOther}
                                                onChange={handleInputChange}
                                                className={cxSupport('form-input')}
                                                placeholder="Nhập thông tin khiếu nại (ví dụ: Vấn đề về tài khoản, Vấn đề về website...)"
                                                style={{ marginTop: '12px', padding: '12px' }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={handleInputChange}
                                        placeholder="Nhập mã đơn hàng"
                                        className={cxSupport('form-input')}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Họ và tên khách hàng:</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên của bạn"
                                    className={cxSupport('form-input')}
                                />
                            </div>
                        </div>

                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Email đăng ký:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Nhập email đã đăng ký tài khoản"
                                    className={cxSupport('form-input')}
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>

                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Số điện thoại:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Nhập số điện thoại liên hệ"
                                    className={cxSupport('form-input')}
                                />
                            </div>
                        </div>

                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Tình trạng khách hàng gặp phải:</label>
                                <textarea
                                    name="issue"
                                    value={formData.issue}
                                    onChange={handleInputChange}
                                    placeholder="Mô tả chi tiết tình trạng bạn đang gặp phải..."
                                    className={cxSupport('form-textarea')}
                                    rows="4"
                                />
                            </div>
                        </div>

                        <div className={cxSupport('form-row')}>
                            <div className={cxSupport('form-group')}>
                                <label className={cxSupport('form-label')}>Ghi chú thêm (nếu có):</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Ghi chú thêm thông tin về đơn hàng hoặc yêu cầu khác..."
                                    className={cxSupport('form-textarea')}
                                    rows="3"
                                />
                            </div>
                        </div>

                        {submitError && (
                            <div className={cxSupport('form-error')} style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fee', borderRadius: '8px' }}>
                                {submitError}
                            </div>
                        )}
                        {submitSuccess && (
                            <div className={cxSupport('form-success')} style={{ color: 'green', marginBottom: '16px', padding: '12px', background: '#efe', borderRadius: '8px' }}>
                                Yêu cầu hỗ trợ đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
                            </div>
                        )}

                        <div className={cxSupport('form-actions')}>
                            <button
                                type="submit"
                                className={cxSupport('submit-button')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
