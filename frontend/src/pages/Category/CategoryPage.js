import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import homeStyles from '../Home/Home.module.scss';
import promoStyles from '../Promotion/Promotion.module.scss';
import styles from './CategoryPage.module.scss';

import { getCategoryById, getProductsByCategory } from '../../services';
import ProductList from '../../components/Common/ProductList/ProductList';
import iconFire from '../../assets/icons/icon_fire.png';
import iconGift from '../../assets/icons/icon_gift.png';
import iconBook from '../../assets/icons/icon_book.png';

const cxHome = classNames.bind(homeStyles);
const cxPromo = classNames.bind(promoStyles);
const cxCategory = classNames.bind(styles);

const ITEMS_PER_PAGE = 15;

export default function CategoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-high', 'price-low', 'bestseller'

    const categoryName = useMemo(() => categoryInfo?.name || '', [categoryInfo]);

    // Sắp xếp sản phẩm dựa trên sortBy
    const sortedProducts = useMemo(() => {
        if (!products.length) return [];
        
        const sorted = [...products];
        
        switch (sortBy) {
            case 'price-high':
                sorted.sort((a, b) => {
                    const priceA = a.price || a.unitPrice || 0;
                    const priceB = b.price || b.unitPrice || 0;
                    return priceB - priceA;
                });
                break;
            case 'price-low':
                sorted.sort((a, b) => {
                    const priceA = a.price || a.unitPrice || 0;
                    const priceB = b.price || b.unitPrice || 0;
                    return priceA - priceB;
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
    }, [products, sortBy]);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)),
        [sortedProducts.length],
    );

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedProducts, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [id, sortedProducts.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        let ignore = false;
        const fetchCategoryData = async () => {
            if (!id) {
                setError('Không tìm thấy danh mục.');
                return;
            }
            try {
                setLoading(true);
                setError('');
                const [categoryData, productData] = await Promise.all([
                    getCategoryById(id).catch(() => null),
                    getProductsByCategory(id).catch(() => []),
                ]);
                if (ignore) return;
                setCategoryInfo(categoryData);
                setProducts(Array.isArray(productData) ? productData : []);
                if (!categoryData) {
                    setError('Danh mục không tồn tại hoặc đã bị ẩn.');
                } else if (!productData?.length) {
                    setError('');
                }
            } catch (err) {
                if (!ignore) {
                    setError('Không thể tải dữ liệu danh mục. Vui lòng thử lại sau.');
                    setProducts([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchCategoryData();
        return () => {
            ignore = true;
        };
    }, [id]);

    const handleBackHome = () => {
        navigate('/');
    };

    const handleReload = () => {
        // Force reload the current path
        navigate(location.pathname + location.search);
    };

    const renderStateCard = (content, isError = false, showActions = false) => (
        <div className={cxCategory('state-card', { error: isError })}>
            <p>{content}</p>
            {showActions && (
                <div className={cxCategory('state-actions')}>
                    <button type="button" onClick={handleReload}>
                        Tải lại
                    </button>
                    <button type="button" onClick={handleBackHome}>
                        Về trang chủ
                    </button>
                </div>
            )}
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

    const buildPaginationItems = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, idx) => idx + 1);
        }
        if (currentPage <= 3) {
            return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
        }
        if (currentPage >= totalPages - 2) {
            return [
                1,
                'ellipsis',
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }
        return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
    };

    const paginationItems = useMemo(buildPaginationItems, [currentPage, totalPages]);

    const renderPagination = () => {
        if (!sortedProducts.length) return null;
        return (
            <div className={cxCategory('pagination')}>
                <button
                    type="button"
                    className={cxCategory('page-arrow')}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                    ‹
                </button>
                {paginationItems.map((item, idx) =>
                    item === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className={cxCategory('page-ellipsis')}>
                            ...
                        </span>
                    ) : (
                        <button
                            type="button"
                            key={item}
                            className={cxCategory('page-button', { active: item === currentPage })}
                            onClick={() => setCurrentPage(item)}
                        >
                            {item}
                        </button>
                    ),
                )}
                <button
                    type="button"
                    className={cxCategory('page-arrow')}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                    ›
                </button>
            </div>
        );
    };

    return (
        <div className={cxHome('home-wrapper')}>
            <main className={cxHome('home-content')}>
                <div className={cxCategory('summary-card')}>
                    <p className={cxCategory('breadcrumb')}>
                        <button type="button" onClick={handleBackHome}>
                            Trang chủ
                        </button>
                        <span>/</span>
                        <span>Danh mục</span>
                        {categoryName && (
                            <>
                                <span>/</span>
                                <strong>{categoryName}</strong>
                            </>
                        )}
                    </p>
                    <h1>{categoryName || 'Danh mục sản phẩm'}</h1>
                    {categoryInfo?.description && (
                        <p className={cxCategory('category-desc')}>{categoryInfo.description}</p>
                    )}
                </div>

                {loading && renderStateCard('Đang tải dữ liệu danh mục...')}

                {!loading && error && renderStateCard(error, true, true)}

                {!loading && !error && products.length === 0 && (
                    renderStateCard('Danh mục này chưa có sản phẩm nào.', false, true)
                )}

                {!loading &&
                    !error &&
                    products.length > 0 && (
                        <>
                            <div className={cxCategory('filter-bar')}>
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
                                    <option value="bestseller">Bán chạy</option>
                                </select>
                            </div>
                            {renderSection(`Sản phẩm - ${categoryName}`, iconFire, null, paginatedProducts, {
                                minimal: false,
                                isGrid: true,
                                gridColumns: 5,
                            })}
                        </>
                    )}

                {renderPagination()}
            </main>
        </div>
    );
}

