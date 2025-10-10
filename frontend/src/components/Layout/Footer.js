import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export default function Footer() {
    return (
        <footer className={styles['account-footer']}>
            <div className={styles['footer-col']}>
                <h4>Thông tin liên hệ</h4>
                <div>136 Xuân Thủy, phường Cầu Giấy, TP.Hà Nội</div>
                <div>Hotline: 0123 456 789</div>
                <div>Email: support@luminabook.com</div>
                <div>Hỗ trợ 24/7</div>
            </div>
            <div className={styles['footer-col']}>
                <h4>Danh mục sách</h4>
                <Link to="#">Sách giáo dục</Link>
                <Link to="#">Sách văn học</Link>
                <Link to="#">Sách kỹ năng sống</Link>
                <Link to="#">Sách thiếu nhi</Link>
                <Link to="#">Sách Quản lý - Kinh doanh</Link>
            </div>
            <div className={styles['footer-col']}>
                <h4>Hỗ trợ khách hàng</h4>
                <Link to="#">Hướng dẫn mua hàng</Link>
                <Link to="#">Chính sách thanh toán</Link>
                <Link to="#">Chính sách vận chuyển</Link>
                <Link to="#">Chính sách đổi trả</Link>
                <Link to="#">FQA</Link>
            </div>
        </footer>
    );
}
