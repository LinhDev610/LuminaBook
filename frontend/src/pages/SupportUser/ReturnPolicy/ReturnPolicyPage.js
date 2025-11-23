import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ReturnPolicyPage.module.scss';

const cx = classNames.bind(styles);

export default function ReturnPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <button className={cx('back-button')} onClick={() => navigate('/support/user')}>
                    ← Quay lại
                </button>

                <div className={cx('content')}>
                    <h1 className={cx('title')}>Chính sách đổi trả</h1>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>1. Điều kiện đổi trả</h2>
                        <p className={cx('section-text')}>
                            Sản phẩm được đổi/trả trong các trường hợp sau:
                        </p>
                        <ul className={cx('list')}>
                            <li>Sản phẩm bị lỗi do nhà sản xuất</li>
                            <li>Sản phẩm không đúng với mô tả trên website</li>
                            <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển</li>
                            <li>Giao nhầm sản phẩm</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>2. Thời gian đổi trả</h2>
                        <p className={cx('section-text')}>
                            Yêu cầu đổi trả phải được thực hiện trong vòng <strong>7 ngày</strong> kể từ ngày nhận hàng.
                        </p>
                        <p className={cx('section-text', 'note')}>
                            Sau thời hạn trên, chúng tôi không thể hỗ trợ đổi trả.
                        </p>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>3. Điều kiện sản phẩm</h2>
                        <p className={cx('section-text')}>
                            Sản phẩm đổi trả phải đảm bảo:
                        </p>
                        <ul className={cx('list')}>
                            <li>Còn nguyên vẹn, chưa sử dụng</li>
                            <li>Còn đầy đủ bao bì, tem mác</li>
                            <li>Không bị trầy xước, hư hỏng do người dùng</li>
                            <li>Có hóa đơn mua hàng hoặc mã đơn hàng</li>
                        </ul>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>4. Quy trình đổi trả</h2>
                        <ol className={cx('ordered-list')}>
                            <li>Liên hệ bộ phận chăm sóc khách hàng qua email hoặc hotline</li>
                            <li>Cung cấp thông tin đơn hàng và lý do đổi trả</li>
                            <li>Chụp ảnh sản phẩm (nếu có lỗi) và gửi cho chúng tôi</li>
                            <li>Chờ xác nhận từ bộ phận hỗ trợ</li>
                            <li>Đóng gói sản phẩm và gửi về địa chỉ được chỉ định</li>
                            <li>Nhận sản phẩm mới hoặc hoàn tiền (nếu yêu cầu trả)</li>
                        </ol>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>5. Chính sách Trả hàng & Hoàn tiền</h2>
                        
                        <div className={cx('subsection')}>
                            <h3 className={cx('subsection-title')}>Thời hạn yêu cầu</h3>
                            <p className={cx('section-text')}>
                                Yêu cầu trả hàng phải được gửi trong vòng <strong>07 ngày</strong> kể từ ngày khách hàng nhận sách thành công.
                            </p>
                        </div>

                        <div className={cx('subsection')}>
                            <h3 className={cx('subsection-title')}>Điều kiện sản phẩm</h3>
                            <p className={cx('section-text')}>
                                Sách phải còn nguyên vẹn (không rách, không ướt, không có dấu vết đã sử dụng, không đánh dấu hay ghi chú).
                            </p>
                        </div>

                        <div className={cx('subsection')}>
                            <h3 className={cx('subsection-title')}>Bằng chứng</h3>
                            <p className={cx('section-text')}>
                                Vui lòng cung cấp ảnh/video rõ ràng về tình trạng sản phẩm và lý do trả hàng để làm bằng chứng xác thực.
                            </p>
                        </div>

                        <div className={cx('subsection')}>
                            <h3 className={cx('subsection-title')}>💰 Quy định về Chi phí Trả hàng</h3>
                            
                            <div className={cx('cost-item')}>
                                <h4 className={cx('cost-title')}>Khách hàng trả trước:</h4>
                                <p className={cx('section-text')}>
                                    Khách hàng vui lòng thanh toán trước chi phí vận chuyển cho đơn hàng trả về cửa hàng.
                                </p>
                            </div>

                            <div className={cx('cost-item')}>
                                <h4 className={cx('cost-title')}>Chi phí được hoàn trả:</h4>
                                <ul className={cx('list')}>
                                    <li>
                                        <strong>Nếu sản phẩm có lỗi từ phía cửa hàng</strong> (sách bị rách, sai phiên bản, thiếu trang, lỗi in ấn), 
                                        chúng tôi sẽ hoàn lại <strong>100% giá trị sản phẩm và chi phí vận chuyển</strong> cho quý khách.
                                    </li>
                                    <li>
                                        <strong>Nếu yêu cầu trả hàng/hoàn tiền xuất phát từ lý do cá nhân của khách hàng</strong> 
                                        (đặt nhầm, không thích, không còn nhu cầu), chúng tôi sẽ trừ <strong>10% giá trị sản phẩm</strong> và khách hàng sẽ tự chịu toàn bộ chi phí vận chuyển trả hàng.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <h2 className={cx('section-title')}>6. Hoàn tiền</h2>
                        <p className={cx('section-text')}>
                            Thời gian hoàn tiền: <strong>3-5 ngày làm việc</strong> sau khi nhận được sản phẩm trả về.
                        </p>
                        <p className={cx('section-text')}>
                            Tiền sẽ được hoàn về:
                        </p>
                        <ul className={cx('list')}>
                            <li>Tài khoản MoMo (nếu thanh toán qua MoMo)</li>
                            <li>Tài khoản ngân hàng (nếu thanh toán COD)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

