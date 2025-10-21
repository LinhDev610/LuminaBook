import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Banner2.module.scss';

const cx = classNames.bind(styles);

/*
  Banner2 - Reusable three-card banner row
  Props: items = Array<{ image: string, alt?: string, href?: string, variant?: 1|2|3 }>
*/
export default function Banner2({ items = [] }) {
    const cards = items.slice(0, 3);
    return (
        <section className={cx('bottom-banners')}>
            {cards.map((item, idx) => (
                <div key={idx} className={cx('banner-card', `banner-${item.variant || idx + 1}`)}>
                    <Link to={item.href || '#'} className={cx('banner-link')}>
                        <img src={item.image} alt={item.alt || `Banner ${idx + 1}`} className={cx('banner-image')} />
                    </Link>
                </div>
            ))}
        </section>
    );
}

