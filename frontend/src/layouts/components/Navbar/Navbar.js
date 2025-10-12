import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import classNames from 'classnames/bind';

import styles from './Navbar.module.scss';

const cx = classNames.bind(styles);

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Kiểm tra xem có phải trang CustomerAccount không
    const isCustomerAccount = location.pathname.includes('/customer-account') || 
                             location.pathname.includes('/account');
    
    const handleAllCategoriesClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
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
                    className={cx('nav-trigger', { active: !isCustomerAccount })}
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
            
            <Link to="#" className={cx({ active: false })}>KHUYẾN MÃI</Link>
            <Link to="#" className={cx({ active: false })}>SÁCH MỚI</Link>
            <Link to="#" className={cx({ active: false })}>HỖ TRỢ KHÁCH HÀNG</Link>
            <Link to="#" className={cx({ active: false })}>LIÊN HỆ</Link>

            {/* Mobile navbar */}
            <div className={cx('mobile-nav')}>
                <button 
                    className={cx('mobile-hamburger')}
                    onClick={handleAllCategoriesClick}
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
        </nav>
    );
}

export default Navbar;
