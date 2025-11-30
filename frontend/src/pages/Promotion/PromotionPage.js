import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import promoStyles from './Promotion.module.scss';
import categoryStyles from '../Category/CategoryPage.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import { getActiveProducts } from '../../services';
import iconFire from '../../assets/icons/icon_fire.png';
import iconGift from '../../assets/icons/icon_gift.png';
import iconBook from '../../assets/icons/icon_book.png';

const cxHome = classNames.bind(homeStyles);
const cxPromo = classNames.bind(promoStyles);
const cxCategory = classNames.bind(categoryStyles);

const ITEMS_PER_PAGE = 15;

export default function PromotionPage() {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-high', 'price-low', 'bestseller', 'discount-high'

    // Lọc sản phẩm có khuyến mãi
    const productsWithPromotion = useMemo(() => {
        if (!allProducts.length) return [];
        
        return allProducts.filter((product) => {
            // Sản phẩm có khuyến mãi nếu:
            // 1. Có promotionId
            // 2. Có promotionPrice khác với price
            // 3. Có discount > 0
            const hasPromotionId = product.promotionId || product.promotion?.id;
            const hasPromotionPrice = product.promotionPrice && product.promotionPrice !== product.price;
            const hasDiscount = product.discount && product.discount > 0;
            
            return hasPromotionId || hasPromotionPrice || hasDiscount;
        });
    }, [allProducts]);

    // Sắp xếp sản phẩm dựa trên sortBy
    const sortedProducts = useMemo(() => {
        if (!productsWithPromotion.length) return [];
        
        const sorted = [...productsWithPromotion];
        
        switch (sortBy) {
            case 'price-high':
                sorted.sort((a, b) => {
                    const priceA = a.promotionPrice || a.price || a.unitPrice || 0;
                    const priceB = b.promotionPrice || b.price || b.unitPrice || 0;
                    return priceB - priceA;
                });
                break;
            case 'price-low':
                sorted.sort((a, b) => {
                    const priceA = a.promotionPrice || a.price || a.unitPrice || 0;
                    const priceB = b.promotionPrice || b.price || b.unitPrice || 0;
                    return priceA - priceB;
                });
                break;
            case 'discount-high':
                sorted.sort((a, b) => {
                    const discountA = a.discount || calculateDiscount(a) || 0;
                    const discountB = b.discount || calculateDiscount(b) || 0;
                    return discountB - discountA;
                });
                break;
            case 'bestseller':
                sorted.sort((a, b) => {
                    const soldA = a.quantitySold || 0;
                    const soldB = b.quantitySold || 0;
                    return soldB - soldA;
                });
                break;
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || 0);
                    const dateB = new Date(b.createdAt || b.created_at || 0);
                    return dateA - dateB;
                });
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || 0);
                    const dateB = new Date(b.createdAt || b.created_at || 0);
                    return dateB - dateA;
                });
                break;
        }
        
        return sorted;
    }, [productsWithPromotion, sortBy]);

    // Tính discount nếu chưa có
    function calculateDiscount(product) {
        const originalPrice = product.price || product.unitPrice || 0;
        const promoPrice = product.promotionPrice || 0;
        if (originalPrice > 0 && promoPrice > 0 && promoPrice < originalPrice) {
            return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
        }
        return 0;
    }

    // Fetch products từ API
    useEffect(() => {
        let ignore = false;
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');
                
                const products = await getActiveProducts();
                
                if (!ignore) {
                    setAllProducts(Array.isArray(products) ? products : []);
                }
            } catch (err) {
                if (!ignore) {
                    setError('Không thể tải dữ liệu khuyến mãi. Vui lòng thử lại sau.');
                    setAllProducts([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();
        return () => {
            ignore = true;
        };
    }, []);

    const renderStateCard = (content, isError = false) => (
        <div className={cxCategory('state-card', { error: isError })}>
            <p>{content}</p>
        </div>
    );

    const renderSection = (title, icon, colorClass, productList, options = {}) => {
        if (!productList || productList.length === 0) return null;
        const { minimal = true, isGrid = false, gridColumns = 4 } = options;
        return (
            <section className={cxHome('trending-section', cxPromo('promo-container'))}>
                <div className={cxPromo('promo-header', cxPromo(colorClass || ''))}>
                    <img src={icon} alt={title} className={cxPromo('promo-icon')} />
                    <h3 className={cxPromo('promo-title')}>{title}</h3>
                </div>
                <ProductList
                    products={productList}
                    title={title}
                    showNavigation={!isGrid}
                    showHeader={false}
                    minimal={minimal}
                    isGrid={isGrid}
                    gridColumns={gridColumns}
                />
            </section>
        );
    };

    return (
        <div className={cxHome('home-wrapper')}>
            <main className={cxHome('home-content')}>
                {loading && renderStateCard('Đang tải dữ liệu khuyến mãi...')}

                {!loading && error && renderStateCard(error, true)}

                {!loading && !error && productsWithPromotion.length === 0 && (
                    renderStateCard('Hiện tại không có sản phẩm khuyến mãi nào.')
                )}

                {!loading && !error && productsWithPromotion.length > 0 && (
                    <>
                        {/* Sort Bar */}
                        <div className={cxCategory('filter-bar')}>
                            <div className={cxCategory('filter-group')}>
                                <div className={cxCategory('filter-label')}>
                                    <span>Sắp xếp theo:</span>
                                </div>
                                <select
                                    className={cxCategory('filter-select')}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="price-high">Giá cao nhất</option>
                                    <option value="price-low">Giá thấp nhất</option>
                                    <option value="discount-high">Giảm giá nhiều nhất</option>
                                    <option value="bestseller">Bán chạy</option>
                                </select>
                            </div>
                        </div>

                        {/* Hiển thị tất cả sản phẩm khuyến mãi */}
                        {renderSection(
                            'KHUYẾN MÃI',
                            iconFire,
                            null,
                            sortedProducts,
                            { minimal: false, isGrid: true, gridColumns: 5 }
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
