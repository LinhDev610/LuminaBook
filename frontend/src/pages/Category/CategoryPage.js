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

export default function CategoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categoryName = useMemo(() => categoryInfo?.name || '', [categoryInfo]);

    const featuredProducts = useMemo(() => products.slice(0, 10), [products]);
    const comboProducts = useMemo(
        () => (products.length > 10 ? products.slice(10, 20) : products.slice(0, 10)),
        [products],
    );
    const studyProducts = useMemo(
        () => (products.length > 20 ? products.slice(20, 30) : products.slice(0, 10)),
        [products],
    );

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
        const { minimal = true, isGrid = false } = options;
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
                    gridColumns={4}
                />
            </section>
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

                {!loading && !error && products.length > 0 && (
                    renderSection(`Sản phẩm nổi bật - ${categoryName}`, iconFire, null, featuredProducts)
                )}
            </main>
        </div>
    );
}

