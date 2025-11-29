import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';
import iconYtb from '../../../assets/icons/icon_ytb.png';
import iconIns from '../../../assets/icons/icon_ins.png';
import iconFb from '../../../assets/icons/icon_fb.png';
import iconGg from '../../../assets/icons/icon_gg.png';

const cx = classNames.bind(styles);

function Footer() {
    const navigate = useNavigate();

    const handleNavigateAndScrollTop = (to) => {
        navigate(to);
        // Cuộn lên đầu trang sau khi chuyển route
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer>
            <div className={cx('account-footer')}>
                <div className={cx('footer-col')}>
                <h4>Thông tin liên hệ</h4>
                <div>136 Xuân Thủy, phường Cầu Giấy, TP.Hà Nội</div>
                <div>Hotline: 0123 456 789</div>
                <div>Email: support@luminabook.com</div>
                <div>Hỗ trợ 24/7</div>
                <div className={cx('social-row')}>
                    <img className={cx('social-icon')} src={iconFb} alt="Facebook" />
                    <img className={cx('social-icon')} src={iconIns} alt="Instagram" />
                    <img className={cx('social-icon')} src={iconGg} alt="Google" />
                    <img className={cx('social-icon')} src={iconYtb} alt="YouTube" />
                </div>
                </div>

                <div className={cx('footer-col')}>
                <h4>Danh mục sách</h4>
                <button type="button" className={cx('footer-link-btn')} onClick={() => handleNavigateAndScrollTop('/')}>
                    Sách giáo dục
                </button>
                <button type="button" className={cx('footer-link-btn')} onClick={() => handleNavigateAndScrollTop('/')}>
                    Sách văn học
                </button>
                <button type="button" className={cx('footer-link-btn')} onClick={() => handleNavigateAndScrollTop('/')}>
                    Sách kỹ năng sống
                </button>
                <button type="button" className={cx('footer-link-btn')} onClick={() => handleNavigateAndScrollTop('/')}>
                    Sách thiếu nhi
                </button>
                <button type="button" className={cx('footer-link-btn')} onClick={() => handleNavigateAndScrollTop('/')}>
                    Sách Quản lý - Kinh doanh
                </button>
                </div>

                <div className={cx('footer-col')}>
                <h4>Hỗ trợ khách hàng</h4>
                <button
                    type="button"
                    className={cx('footer-link-btn')}
                    onClick={() => handleNavigateAndScrollTop('/support/user')}
                >
                    Hỗ trợ khách hàng
                </button>
                <button
                    type="button"
                    className={cx('footer-link-btn')}
                    onClick={() => handleNavigateAndScrollTop('/support/shopping-guide')}
                >
                    Hướng dẫn mua hàng
                </button>
                <button
                    type="button"
                    className={cx('footer-link-btn')}
                    onClick={() => handleNavigateAndScrollTop('/support/payment-policy')}
                >
                    Chính sách thanh toán
                </button>
                <button
                    type="button"
                    className={cx('footer-link-btn')}
                    onClick={() => handleNavigateAndScrollTop('/support/shipping-policy')}
                >
                    Chính sách vận chuyển
                </button>
                <button
                    type="button"
                    className={cx('footer-link-btn')}
                    onClick={() => handleNavigateAndScrollTop('/support/return-policy')}
                >
                    Chính sách đổi trả
                </button>
                </div>
            </div>
            
        </footer>
    );
}

export default Footer;

