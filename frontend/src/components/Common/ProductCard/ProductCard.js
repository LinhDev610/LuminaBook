import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductCard.module.scss';
import defaultProductImage from '../../../assets/images/img_sach.png';

const cx = classNames.bind(styles);

// ProductCard Component
// Card hiển thị sản phẩm với hình ảnh, tên, giá, rating
export default function ProductCard({ product = {} }) {
    const {
        id,
        title,
        name,
        image,
        imageUrl,
        thumbnailUrl,
        currentPrice,
        price,
        originalPrice,
        unitPrice,
        discount,
        discountValue,
    } = product || {};

    const parsePrice = (value) =>
        typeof value === 'number' && Number.isFinite(value) ? value : null;

    let resolvedOriginalPrice =
        parsePrice(originalPrice) ?? parsePrice(unitPrice) ?? parsePrice(price) ?? 0;
    let resolvedCurrentPrice =
        parsePrice(currentPrice) ?? parsePrice(price) ?? resolvedOriginalPrice ?? 0;

    if (resolvedOriginalPrice < resolvedCurrentPrice) {
        resolvedOriginalPrice = resolvedCurrentPrice;
    }

    const computedDiscountAmount =
        parsePrice(discountValue) ?? Math.max(resolvedOriginalPrice - resolvedCurrentPrice, 0);

    let resolvedDiscount = Number.isFinite(discount) ? Math.max(0, discount) : null;
    if (resolvedDiscount === null) {
        resolvedDiscount =
            resolvedOriginalPrice > 0 && computedDiscountAmount > 0
                ? Math.min(99, Math.round((computedDiscountAmount / resolvedOriginalPrice) * 100))
                : 0;
    }

    const resolvedTitle = title || name || 'Sản phẩm';
    const resolvedImage =
        image ||
        imageUrl ||
        thumbnailUrl ||
        product.defaultMediaUrl ||
        product.mediaUrl ||
        defaultProductImage;
    const productLink = id ? `/product/${id}` : '/';

    const formatPrice = (value) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value || 0);

    const showOriginal = resolvedOriginalPrice > resolvedCurrentPrice;
    const showDiscount = resolvedDiscount > 0 && showOriginal;

    return (
        <div className={cx('hot-product')}>
            <Link to={productLink} className={cx('product-link')}>
                <div className={cx('image-wrapper')}>
                    <img src={resolvedImage} alt={resolvedTitle} className={cx('product-image')} />
                </div>
                <div className={cx('product-info')}>
                    <h3 className={cx('product-title')}>{resolvedTitle}</h3>
                    <div className={cx('price-block')}>
                        <span className={cx('current-price')}>
                            {formatPrice(resolvedCurrentPrice)}
                        </span>
                        <div className={cx('sub-prices')}>
                            {showOriginal && (
                                <span className={cx('original-price')}>
                                    {formatPrice(resolvedOriginalPrice)}
                                </span>
                            )}
                            {showDiscount && <span className={cx('discount-pill')}>-{resolvedDiscount}%</span>}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
