import React, { useState } from 'react';
import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import supportStyles from './CustomerService.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl, getStoredToken } from '../../services/utils';
import { useNavigate } from 'react-router-dom';

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
        customerName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        issue: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

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
        if (!formData.orderId || !formData.orderId.trim()) {
            setSubmitError('Vui lòng nhập mã đơn hàng');
            return;
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
            const content = formData.issue + (formData.notes ? `\n\nGhi chú thêm: ${formData.notes}` : '');

            const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderCode: formData.orderId.trim(),
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
            // Reset form
            setFormData({
                orderId: '',
                customerName: user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
                issue: '',
                notes: ''
            });

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
            link: '/customer-account'
        },
        {
            icon: iconReturn,
            question: 'Tôi muốn đổi hoặc trả sản phẩm, phải làm sao?',
            answer: 'Bạn có thể đổi/trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng. Vui lòng liên hệ hotline hoặc gửi yêu cầu qua form bên dưới.',
            link: '/customer-account'
        },
        {
            icon: iconCard,
            question: 'Tôi có thể thanh toán bằng hình thức nào?',
            answer: 'Chúng tôi hỗ trợ thanh toán qua thẻ tín dụng, chuyển khoản ngân hàng, ví điện tử và thanh toán khi nhận hàng (COD).',
            link: '/contact'
        },
        {
            icon: iconCall,
            question: 'Tôi có thể liên hệ với nhân viên hỗ trợ qua Zalo không?',
            answer: 'Có, bạn có thể liên hệ qua Zalo: 0123 456 789 hoặc Facebook: Lumina Book để được hỗ trợ nhanh chóng.',
            link: '/contact'
        },
        {
            icon: iconClock,
            question: 'Thời gian giao hàng dự kiến là bao lâu?',
            answer: 'Từ 2-5 ngày làm việc tùy khu vực. Bạn sẽ nhận được thông báo khi đơn hàng được vận chuyển.',
            link: '/contact'
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
                        {faqItems.map((item, index) => (
                            <a key={index} href={item.link} className={cxSupport('faq-item')}>
                                <div className={cxSupport('faq-icon')}>
                                    <img src={item.icon} alt="FAQ Icon" />
                                </div>
                                <div className={cxSupport('faq-content')}>
                                    <h3 className={cxSupport('faq-question')}>{item.question}</h3>
                                    <p className={cxSupport('faq-answer')}>{item.answer}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Support Request Form */}
                <section className={cxSupport('support-form-section')}>
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
                                <input
                                    type="text"
                                    name="orderId"
                                    value={formData.orderId}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mã đơn hàng"
                                    className={cxSupport('form-input')}
                                />
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
