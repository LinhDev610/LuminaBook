import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';
import iconYtb from '../../../assets/icons/icon_ytb.png';
import iconIns from '../../../assets/icons/icon_ins.png';
import iconFb from '../../../assets/icons/icon_fb.png';
import iconGg from '../../../assets/icons/icon_gg.png';

const cx = classNames.bind(styles);

function Footer() {
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
                <Link to="#">Sách giáo dục</Link>
                <Link to="#">Sách văn học</Link>
                <Link to="#">Sách kỹ năng sống</Link>
                <Link to="#">Sách thiếu nhi</Link>
                <Link to="#">Sách Quản lý - Kinh doanh</Link>
                </div>

                <div className={cx('footer-col')}>
                <h4>Hỗ trợ khách hàng</h4>
                <Link to="#">Hướng dẫn mua hàng</Link>
                <Link to="#">Chính sách thanh toán</Link>
                <Link to="#">Chính sách vận chuyển</Link>
                <Link to="#">Chính sách đổi trả</Link>
                <Link to="#">FAQ</Link>
                </div>
            </div>
            
        </footer>
    );
}

export default Footer;

