import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductCard.module.scss';

const cx = classNames.bind(styles);

// ProductCard Component
// Card hiển thị sản phẩm với hình ảnh, tên, giá, rating
export default function ProductCard({ product }) {
    const { id, title, image, currentPrice, originalPrice, discount } = product;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className={cx('hot-product')}>
            <Link to={`/product/${id}`} className={cx('product-link')}>
                <img src={image} alt={title} className={cx('product-image')} />
                <div className={cx('product-info')}>
                    <h3 className={cx('product-title')}>{title}</h3>
                    <div className={cx('product-price')}>
                        <span className={cx('current-price')}>{formatPrice(currentPrice)}</span>
                        <span className={cx('original-price')}>{formatPrice(originalPrice)}</span>
                        <span className={cx('discount')}>-{discount}%</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
