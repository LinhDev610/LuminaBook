import { Link, useLocation, useNavigate } from 'react-router-dom';
import routes from '../../../config/routes';
import { useState } from 'react';
import classNames from 'classnames/bind';

import styles from './Navbar.module.scss';

const cx = classNames.bind(styles);

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Kiểm tra xem có phải trang CustomerAccount không
    const { pathname } = location;
    const isCustomerAccount = pathname.includes('/customer-account') || 
                             pathname.includes('/account');
    const isHome = pathname === routes.home;
    const isPromotion = pathname.startsWith(routes.promotion);
    
    const handleAllCategoriesClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleMobileMenuClick = () => {
        console.log('Mobile menu clicked, current state:', isMobileMenuOpen);
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    const categories = [
        'SÁCH GIÁO DỤC',
        'SÁCH VĂN HỌC', 
        'SÁCH THIẾU NHI',
        'SÁCH KỸ NĂNG SỐNG',
        'SÁCH QUẢN LÝ KINH DOANH'
    ];
    
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
                        {categories.map((category, index) => (
                            <div 
                                key={index}
                                className={cx('dropdown-item')}
                            >
                                {category}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <Link to={routes.promotion} className={cx({ active: isPromotion })}>KHUYẾN MÃI</Link>
            <Link to="#" className={cx({ active: false })}>SÁCH MỚI</Link>
            <Link to="#" className={cx({ active: false })}>HỖ TRỢ KHÁCH HÀNG</Link>
            <Link to="#" className={cx({ active: false })}>LIÊN HỆ</Link>

            {/* Mobile navbar */}
            <div className={cx('mobile-nav')}>
                <button 
                    className={cx('mobile-hamburger')}
                    onClick={handleMobileMenuClick}
                    style={{ backgroundColor: isMobileMenuOpen ? '#a4343a' : 'transparent' }}
                >
                    ☰
                </button>
                
                <div className={cx('mobile-search')}>
                    <div className={cx('mobile-search-icon')}>🔍</div>
                    <input className='search-bar'
                        type="text" 
                        placeholder="Tìm kiếm theo tên tác phẩm,..." 
                    />
                </div>
                
                <div className={cx('mobile-menu')}>
                    ⋮
                </div>
            </div>

            {/* Mobile dropdown menu - outside mobile-nav */}
            {isMobileMenuOpen && (
                <div className={cx('mobile-dropdown-menu')}>
                    {categories.map((category, index) => (
                        <div 
                            key={index}
                            className={cx('mobile-dropdown-item')}
                        >
                            {category}
                        </div>
                    ))}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
