import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Banner1.module.scss';

const cx = classNames.bind(styles);

/*
  Banner1 - Reusable two-column hero + promo-blocks layout
  Props:
  - heroImage: string (src)
  - promos: Array<{ image: string, alt?: string, href?: string }>
*/
export default function Banner1({ heroImage, promos = [] }) {
    return (
        <section className={cx('main-content')}>
            {/* Left Column - Hero Banner */}
            <div className={cx('hero-banner')}>
                <Link to="#" className={cx('hero-link')}>
                    <img src={heroImage} alt="Banner" className={cx('hero-image')} />
                </Link>
            </div>

            {/* Right Column - 3 Promo Blocks */}
            <div className={cx('promo-column')}>
                {promos.slice(0, 3).map((p, idx) => (
                    <div key={idx} className={cx('promo-block', `promo-block-${idx + 1}`)}>
                        <Link to={p.href || '#'} className={cx('promo-link')}>
                            <img src={p.image} alt={p.alt || `Promo ${idx + 1}`} className={cx('promo-image')} />
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}

