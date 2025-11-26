import { Link, useLocation, useNavigate } from 'react-router-dom';
import routes from '../../../config/routes';
import { useEffect, useState } from 'react';
import { getActiveCategories } from '../../../services';
import classNames from 'classnames/bind';

import styles from './NavBar.module.scss';

const cx = classNames.bind(styles);

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState('');

    // Kiểm tra xem có phải trang CustomerAccount không
    const { pathname } = location;
    const isCustomerAccount =
        pathname.includes('/customer-account') || pathname.includes('/account');
    const isHome = pathname === routes.home;
    const isPromotion = pathname.startsWith(routes.promotion);
    const isNewBook = pathname.startsWith(routes.newbook);
    const isCustomerSupport = pathname.startsWith(routes.customerSupport);

    const handleAllCategoriesClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleMobileMenuClick = () => {
        // console.log('Mobile menu clicked, current state:', isMobileMenuOpen);
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        let ignore = false;
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                setCategoriesError('');
                const data = await getActiveCategories().catch(() => []);
                if (ignore) return;
                const normalized = Array.isArray(data)
                    ? data.filter((item) => item && item.name)
                    : [];
                setCategories(normalized);
            } catch (error) {
                if (!ignore) {
                    setCategories([]);
                    setCategoriesError('Không thể tải danh mục');
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

    const handleCategorySelect = (category) => {
        const categoryId = typeof category === 'string' ? null : category?.id;
        const categoryName = typeof category === 'string'
            ? category
            : category?.name;

        if (categoryId) {
            navigate(`/category/${categoryId}`);
        } else if (categoryName) {
            navigate(`/search?q=${encodeURIComponent(categoryName)}`);
        }
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const renderCategoryItems = (variant = 'desktop') => {
        const itemClass = variant === 'mobile' ? 'mobile-dropdown-item' : 'dropdown-item';
        const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
        const dataSource = categories.slice(0, 12);

        if (categoriesLoading) {
            return (
                <div className={cx(statusClass)}>
                    Đang tải danh mục...
                </div>
            );
        }

        if (categoriesError) {
            return (
                <div className={cx(statusClass, 'error')}>
                    {categoriesError}
                </div>
            );
        }

        if (!dataSource.length) {
            return (
                <div className={cx(statusClass)}>
                    Chưa có danh mục nào
                </div>
            );
        }

        return dataSource.map((category) => (
            <button
                key={category.id || category.name}
                type="button"
                className={cx(itemClass)}
                onClick={() => handleCategorySelect(category)}
            >
                {category.name}
            </button>
        ));
    };

    return (
        <nav className={cx('account-nav')}>
            {/* Desktop navbar */}
            <div className={cx('dropdown-container')}>
                <button
                    className={cx('nav-trigger', { active: isHome })}
                    onClick={handleAllCategoriesClick}
                >
                    TẤT CẢ DANH MỤC
                </button>

                {isDropdownOpen && (
                    <div className={cx('dropdown-menu')}>
                        {renderCategoryItems()}
                    </div>
                )}
            </div>

            <Link to={routes.promotion} className={cx({ active: isPromotion })}>
                KHUYẾN MÃI
            </Link>
            <Link to={routes.newbook} className={cx({ active: isNewBook })}>
                SÁCH MỚI
            </Link>
            <Link
                to={routes.customerSupport}
                className={cx({ active: isCustomerSupport })}
            >
                HỖ TRỢ KHÁCH HÀNG
            </Link>

            {/* Mobile navbar */}
            <div className={cx('mobile-nav')}>
                <button
                    className={cx('mobile-hamburger')}
                    onClick={handleMobileMenuClick}
                    style={{
                        backgroundColor: isMobileMenuOpen ? '#a4343a' : 'transparent',
                    }}
                >
                    ☰
                </button>

                <div className={cx('mobile-search')}>
                    <div className={cx('mobile-search-icon')}>🔍</div>
                    <input
                        className="search-bar"
                        type="text"
                        placeholder="Tìm kiếm theo tên tác phẩm,..."
                    />
                </div>

                <div className={cx('mobile-menu')}>⋮</div>
            </div>

            {/* Mobile dropdown menu - outside mobile-nav */}
            {isMobileMenuOpen && (
                <div className={cx('mobile-dropdown-menu')}>
                    {renderCategoryItems('mobile')}
                </div>
            )}
        </nav>
    );
}

export default NavBar;
