import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styles from './Banner1.module.scss';

const cx = classNames.bind(styles);

/*
  Banner1 - Two-column layout
  - If heroImages is provided (array), render a carousel with arrows and auto-play (5s)
  - Else fallback to a single heroImage
  Props:
  - heroImage?: string
  - heroImages?: string[]
  - promos?: Array<{ image: string, alt?: string, href?: string }>
*/
export default function Banner1({ heroImage, heroImages = [], promos = [] }) {
    const [current, setCurrent] = useState(0);
    const slides = useMemo(() => (heroImages && heroImages.length > 0 ? heroImages : heroImage ? [heroImage] : []), [heroImages, heroImage]);
    const isCarousel = slides.length > 1;

    const trackRef = useRef(null);

    // autoplay every 10s
    useEffect(() => {
        if (!isCarousel) return;
        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % slides.length);
        }, 10000);
        return () => clearInterval(id);
    }, [isCarousel, slides.length]);

    const prev = useCallback(() => {
        if (!isCarousel) return;
        setCurrent((c) => (c - 1 + slides.length) % slides.length);
    }, [isCarousel, slides.length]);

    const next = useCallback(() => {
        if (!isCarousel) return;
        setCurrent((c) => (c + 1) % slides.length);
    }, [isCarousel, slides.length]);

    return (
        <section className={cx('main-content')}>
            {/* Left Column - Hero Banner */}
            <div className={cx('hero-banner')}>
                <div className={cx('slides-viewport')}>
                    <div
                        ref={trackRef}
                        className={cx('slides-track')}
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {slides.map((src, idx) => (
                            <Link to="#" className={cx('hero-link')} key={idx}>
                                <img src={src} alt={`Banner ${idx + 1}`} className={cx('hero-image')} />
                            </Link>
                        ))}
                    </div>
                </div>
                {isCarousel && (
                    <>
                        <button className={cx('nav-btn', 'nav-prev')} onClick={prev} aria-label="Prev slide">
                            ‹
                        </button>
                        <button className={cx('nav-btn', 'nav-next')} onClick={next} aria-label="Next slide">
                            ›
                        </button>
                        <div className={cx('dots')}>
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={cx('dot', { active: idx === current })}
                                    onClick={() => setCurrent(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
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

