import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';
import { getRootCategories } from '../../../services';
import iconYtb from '../../../assets/icons/icon_ytb.png';
import iconIns from '../../../assets/icons/icon_ins.png';
import iconFb from '../../../assets/icons/icon_fb.png';
import iconGg from '../../../assets/icons/icon_gg.png';

const cx = classNames.bind(styles);

function Footer() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Fetch root categories từ API (chỉ danh mục chính, không có danh mục con)
    useEffect(() => {
        let ignore = false;
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const data = await getRootCategories().catch(() => []);
                if (!ignore) {
                    const normalized = Array.isArray(data)
                        ? data.filter((item) => item && item.name && item.id)
                        : [];
                    // Giới hạn số lượng categories hiển thị (tối đa 10)
                    setCategories(normalized.slice(0, 10));
                }
            } catch (error) {
                if (!ignore) {
                    setCategories([]);
                }
            } finally {
                if (!ignore) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchCategories();
        return () => {
            ignore = true;
        };
    }, []);

    const handleNavigateAndScrollTop = (to) => {
        navigate(to);
        // Cuộn lên đầu trang sau khi chuyển route
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryClick = (categoryId) => {
        if (categoryId) {
            handleNavigateAndScrollTop(`/category/${categoryId}`);
        }
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
                {categoriesLoading ? (
                    <div>Đang tải...</div>
                ) : categories.length > 0 ? (
                    categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            className={cx('footer-link-btn')}
                            onClick={() => handleCategoryClick(category.id)}
                        >
                            {category.name}
                        </button>
                    ))
                ) : (
                    <div>Không có danh mục</div>
                )}
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

