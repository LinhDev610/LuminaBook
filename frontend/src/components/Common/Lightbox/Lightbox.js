import React from 'react';
import classNames from 'classnames/bind';
import styles from './Lightbox.module.scss';

const cx = classNames.bind(styles);

const Lightbox = ({
    isOpen,
    onClose,
    mediaUrls = [],
    currentIndex = 0,
    title = '',
    onIndexChange,
    normalizeUrl = (url) => url
}) => {
    if (!isOpen || !mediaUrls || mediaUrls.length === 0) {
        return null;
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (onIndexChange) {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : mediaUrls.length - 1;
            onIndexChange(newIndex);
        }
    };

    const handleNext = () => {
        if (onIndexChange) {
            const newIndex = currentIndex < mediaUrls.length - 1 ? currentIndex + 1 : 0;
            onIndexChange(newIndex);
        }
    };

    const handleThumbnailClick = (index) => {
        if (onIndexChange) {
            onIndexChange(index);
        }
    };

    const currentMediaUrl = mediaUrls[currentIndex];
    const normalizedUrl = normalizeUrl(currentMediaUrl);
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(currentMediaUrl);

    return (
        <div className={cx('overlay')} onClick={handleOverlayClick}>
            <div className={cx('lightbox')} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={cx('header')}>
                    {title && <h2 className={cx('title')}>{title}</h2>}
                    <button
                        className={cx('close-btn')}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Main Media Display */}
                <div className={cx('media-container')}>
                    {mediaUrls.length > 1 && (
                        <button
                            className={cx('nav-btn', 'nav-btn-prev')}
                            onClick={handlePrevious}
                            aria-label="Ảnh trước"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M15 18L9 12L15 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    <div className={cx('media-wrapper')}>
                        {isImage ? (
                            <img
                                src={normalizedUrl}
                                alt={`Media ${currentIndex + 1}`}
                                className={cx('media')}
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14">Không thể tải hình ảnh</text></svg>';
                                }}
                            />
                        ) : (
                            <video
                                src={normalizedUrl}
                                className={cx('media')}
                                controls
                                autoPlay
                            />
                        )}
                    </div>

                    {mediaUrls.length > 1 && (
                        <button
                            className={cx('nav-btn', 'nav-btn-next')}
                            onClick={handleNext}
                            aria-label="Ảnh tiếp theo"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 18L15 12L9 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Thumbnail Navigation */}
                {mediaUrls.length > 1 && (
                    <div className={cx('thumbnails')}>
                        {mediaUrls.map((url, index) => {
                            const normalizedThumbUrl = normalizeUrl(url);
                            const isThumbImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                            const isActive = index === currentIndex;

                            return (
                                <div
                                    key={index}
                                    className={cx('thumbnail', { 'thumbnail-active': isActive })}
                                    onClick={() => handleThumbnailClick(index)}
                                >
                                    {isThumbImage ? (
                                        <img
                                            src={normalizedThumbUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                        />
                                    ) : (
                                        <video src={normalizedThumbUrl} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Media Counter */}
                {mediaUrls.length > 1 && (
                    <div className={cx('counter')}>
                        {currentIndex + 1} / {mediaUrls.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lightbox;

