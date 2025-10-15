import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductList.module.scss';

// Import navigation icons
import iconLeftArrow from '../../../assets/icons/icon_leftarrow.png';
import iconRightArrow from '../../../assets/icons/icon_rightarrow.png';

const cx = classNames.bind(styles);

// ProductList Component
// Danh sách sản phẩm với filter, sort, pagination
export default function ProductList({
    products = [],
    title = "SẢN PHẨM",
    showNavigation = true,
    showHeader = true,
    minimal = false,
    isGrid = false,
    gridColumns = 4
}) {
    const productsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollPosition = () => {
        if (productsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = productsRef.current;
            
            // Kiểm tra nút trái: hiện khi scrollLeft > 0
            setCanScrollLeft(scrollLeft > 0);
            
            // Kiểm tra nút phải: ẩn khi đã scroll gần hết
            const maxScrollLeft = scrollWidth - clientWidth;
            const canScrollRightValue = scrollLeft < maxScrollLeft - 100;
            
            setCanScrollRight(canScrollRightValue);
        }
    };

    const scrollLeft = () => {
        if (productsRef.current) {
            productsRef.current.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (productsRef.current) {
            productsRef.current.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const container = productsRef.current;
        if (container) {
            // Kiểm tra vị trí ban đầu
            checkScrollPosition();
            
            // Lắng nghe sự kiện scroll
            container.addEventListener('scroll', checkScrollPosition);
            
            // Cleanup
            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
            };
        }
    }, [products]);

    if (!products || products.length === 0) {
        return (
            <section className={cx('hot-promotions', { minimal })}>
                {showHeader && (
                    <div className={cx('hot-header')}>
                        <h2 className={cx('hot-title')}>{title}</h2>
                    </div>
                )}
                <div className={cx('hot-products-container')}>
                    <div className={cx('hot-products')} />
                </div>
            </section>
        );
    }

    return (
        <section className={cx('hot-promotions', { minimal })}>
            {showHeader && (
                <div className={cx('hot-header')}>
                    <h2 className={cx('hot-title')}>{title}</h2>
                </div>
            )}
            <div className={cx('hot-products-container')}>
                {showNavigation && !isGrid && (
                    <>
                        {canScrollLeft && (
                            <button className={cx('nav-button', 'nav-left')} onClick={scrollLeft}>
                                <img src={iconLeftArrow} alt="Previous" className={cx('nav-icon')} />
                            </button>
                        )}
                        {canScrollRight && (
                            <button className={cx('nav-button', 'nav-right')} onClick={scrollRight}>
                                <img src={iconRightArrow} alt="Next" className={cx('nav-icon')} />
                            </button>
                        )}
                    </>
                )}
                <div
                    className={cx(isGrid ? 'grid-products' : 'hot-products')}
                    ref={isGrid ? undefined : productsRef}
                    style={isGrid ? { display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, 1fr)` } : undefined}
                >
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
