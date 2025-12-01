import config from '../../../../config/';
import routes from '../../../../config/routes';
import { clearVoucherFromCart, getCart, searchProducts } from '../../../../services';

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import logoIcon from '../../../../assets/icons/logo_luminabook.png';
import guestIcon from '../../../../assets/icons/icon_guest.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { useAuth } from '../../../../contexts/AuthContext';

import styles from './DefaultHeader.module.scss';

const cx = classNames.bind(styles);

function DefaultHeader() {
    const customerAccount = routes?.customerAccount || '/customer-account';

    const navigate = useNavigate();
    const location = useLocation();
    const { openLoginModal, openRegisterModal, openForgotPasswordModal } = useAuth();
    const [displayName, setDisplayName, removeDisplayName] = useLocalStorage(
        'displayName',
        null,
    );
    const [token, setToken, removeToken] = useLocalStorage('token', null);
    const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage(
        'refreshToken',
        null,
    );
    const [savedEmail, setSavedEmail, removeSavedEmail] = useLocalStorage(
        'savedEmail',
        null,
    );

    // Read token from both storages every render (handles same-tab updates)
    const getStoredToken = () => {
        const read = (get) => {
            try {
                const raw = get('token');
                if (!raw) return null;
                if ((raw.startsWith('"') && raw.endsWith('"')) || raw.startsWith('{') || raw.startsWith('[')) {
                    return JSON.parse(raw);
                }
                return raw;
            } catch (_e) {
                return get('token');
            }
        };
        return token || read(localStorage.getItem.bind(localStorage)) || read(sessionStorage.getItem.bind(sessionStorage));
    };
    const currentToken = getStoredToken();
    const isLoggedIn = !!currentToken;
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [suggestError, setSuggestError] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [authVersion, setAuthVersion] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    // Keep a local mirror of displayName to avoid force-update loops
    const initialDisplayName = (() => {
        try {
            const val = localStorage.getItem('displayName');
            return val ? JSON.parse(val) : displayName;
        } catch (_e) {
            return displayName;
        }
    })();
    const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName);

    // Sync displayName from localStorage on custom event or cross-tab storage changes
    useEffect(() => {
        const syncDisplayName = () => {
            try {
                const val = localStorage.getItem('displayName');
                setDisplayNameValue(val ? JSON.parse(val) : null);
            } catch (_e) {
                setDisplayNameValue(null);
            }
        };

        window.addEventListener('displayNameUpdated', syncDisplayName);
        window.addEventListener('storage', (e) => {
            if (e.key === 'displayName') syncDisplayName();
        });

        // Also run once on mount in case hook value differs
        syncDisplayName();

        return () => {
            window.removeEventListener('displayNameUpdated', syncDisplayName);
            // 'storage' listener with inline fn cannot be removed; acceptable as it's window-scoped
        };
    }, []);

    // Re-render when token is updated anywhere in the app
    useEffect(() => {
        const bump = () => setAuthVersion((v) => v + 1);
        window.addEventListener('tokenUpdated', bump);
        window.addEventListener('storage', (e) => {
            if (e.key === 'token') bump();
        });
        return () => {
            window.removeEventListener('tokenUpdated', bump);
        };
    }, []);

    useEffect(() => {
        if (location.pathname === '/search') {
            const params = new URLSearchParams(location.search);
            setSearchTerm(params.get('q') || '');
        }
    }, [location.pathname, location.search]);

    const toggleMenu = () => setMenuOpen((v) => !v);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const keyword = searchTerm.trim();
        if (!keyword) {
            return;
        }
        setMenuOpen(false);
        setShowSuggestions(false);
        navigate(`/search?q=${encodeURIComponent(keyword)}`);
    };

    // Fetch suggestions with debounce
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            setSuggestError('');
            return;
        }

        let active = true;
        let debounceTimer = setTimeout(async () => {
            try {
                setSuggestLoading(true);
                setSuggestError('');
                const data = await searchProducts(searchTerm.trim());
                if (!active) return;
                setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
            } catch (err) {
                if (!active) return;
                setSuggestError('Không thể tải gợi ý.');
                setSuggestions([]);
                setShowSuggestions(true);
            } finally {
                if (active) {
                    setSuggestLoading(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(debounceTimer);
        };
    }, [searchTerm]);

    const handleSuggestionSelect = (product) => {
        if (!product) return;
        setSearchTerm(product?.name || product?.title || '');
        setShowSuggestions(false);
        navigate(`/product/${product.id}`);
    };

    const handleKeyDown = (event) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (event.key === 'Enter') {
            if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                event.preventDefault();
                handleSuggestionSelect(suggestions[highlightedIndex]);
            }
        } else if (event.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Khi về trang Home, tự động hủy voucher trong giỏ hàng (nếu có)
    const handleGoHome = () => {
        try {
            // Nếu chưa đăng nhập vẫn có thể gọi, backend sẽ tự kiểm tra
            clearVoucherFromCart(currentToken).catch((err) => {
                // Không chặn điều hướng về home nếu lỗi
                // eslint-disable-next-line no-console
                console.error('Error clearing voucher when going home:', err);
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Unexpected error clearing voucher when going home:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const extractCount = (cartData) => {
            if (!cartData) return 0;
            if (typeof cartData.itemCount === 'number') {
                return cartData.itemCount;
            }
            const items = cartData.items || cartData.cartItems;
            if (Array.isArray(items) && items.length > 0) {
                return items.reduce((sum, item) => {
                    const qty = Number(item?.quantity);
                    if (!Number.isNaN(qty) && qty > 0) {
                        return sum + qty;
                    }
                    return sum + 1;
                }, 0);
            }
            return 0;
        };

        const fetchCartCount = async () => {
            if (!isLoggedIn || !currentToken) {
                if (isMounted) setCartCount(0);
                return;
            }
            try {
                const { ok, data } = await getCart(currentToken);
                if (!isMounted) return;
                if (ok) {
                    setCartCount(extractCount(data));
                } else {
                    setCartCount(0);
                }
            } catch (err) {
                if (isMounted) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to fetch cart count:', err);
                    setCartCount(0);
                }
            }
        };

        fetchCartCount();

        const handleCartUpdated = (event) => {
            if (!isMounted) return;
            const incomingCount = event?.detail?.count;
            if (typeof incomingCount === 'number') {
                setCartCount(incomingCount);
            } else {
                fetchCartCount();
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener('cartUpdated', handleCartUpdated);
        };
    }, [isLoggedIn, currentToken]);

    const handleLogout = () => {
        // Close confirm modal immediately so it disappears before navigation
        setShowLogoutConfirm(false);
        removeToken();
        removeRefreshToken();
        removeDisplayName();
        // Clear sessionStorage
        sessionStorage.removeItem('token');
        // Xóa flag checking role để tránh nháy
        sessionStorage.removeItem('_checking_role');
        // Don't remove savedEmail - keep it for next login
        setMenuOpen(false);
        // Notify others and go back to home after logout
        window.dispatchEvent(new Event('tokenUpdated'));
        window.dispatchEvent(new CustomEvent('displayNameUpdated'));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: 0 } }));
        // Always go back to home after logout
        navigate('/');
    };

    return (
        <div>
            <header className={cx('header')}>
                <div className={cx('logo')}>
                    <Link to="/" onClick={handleGoHome}>
                        <img
                            src={logoIcon}
                            alt="LuminaBook"
                            className={cx('logo-image')}
                        />
                    </Link>
                </div>
                <div className={cx('search-wrapper')}>
                    <form className={cx('search')} onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên tác phẩm,…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => {
                                if (suggestions.length > 0) {
                                    setShowSuggestions(true);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 150);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button type="submit">Tìm</button>
                    </form>
                    {showSuggestions && (
                        <div className={cx('search-suggestions')}>
                            {suggestLoading && <div className={cx('suggestion-loading')}>Đang tìm...</div>}
                            {!suggestLoading && suggestError && (
                                <div className={cx('suggestion-error')}>{suggestError}</div>
                            )}
                            {!suggestLoading && !suggestError && suggestions.length === 0 && (
                                <div className={cx('suggestion-empty')}>Không có gợi ý phù hợp.</div>
                            )}
                            {!suggestLoading && !suggestError && suggestions.length > 0 && (
                                <ul>
                                    {suggestions.map((product, index) => (
                                        <li
                                            key={product.id}
                                            className={cx({ highlighted: index === highlightedIndex })}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSuggestionSelect(product)}
                                        >
                                            <span className={cx('suggestion-name')}>
                                                {product.name || product.title || 'Sản phẩm'}
                                            </span>
                                            {product.price && (
                                                <span className={cx('suggestion-price')}>
                                                    {new Intl.NumberFormat('vi-VN', {
                                                        style: 'currency',
                                                        currency: 'VND',
                                                    }).format(product.price)}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className={cx('actions')}>
                    {isLoggedIn && displayNameValue ? (
                        <div className={cx('user-menu')}>
                            <button
                                className={cx('user-menu__trigger')}
                                onClick={toggleMenu}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                            >
                                <span className={cx('user-menu__name')}>
                                    {displayNameValue}
                                </span>
                                <span className={cx('user-menu__avatar')}></span>
                            </button>
                            {menuOpen && (
                                <div className={cx('user-menu__dropdown')} role="menu">
                                    <Link
                                        to={customerAccount}
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Trang cá nhân
                                    </Link>
                                    <button
                                        className={cx('user-menu__item')}
                                        role="menuitem"
                                        onClick={() => setShowLogoutConfirm(true)}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={cx('auth-buttons')}>
                            <button
                                onClick={openLoginModal}
                                className={cx('login-link')}
                            >
                                <span className={cx('login-text')}>Đăng nhập</span>
                                <img
                                    src={guestIcon}
                                    alt="Guest"
                                    className={cx('guest-icon')}
                                />
                            </button>
                        </div>
                    )}
                    <span className={cx('cart')} onClick={() => navigate('/cart')}>
                        <img
                            src="https://cdn0.iconfinder.com/data/icons/mobile-basic-vol-1/32/Tote_Bag-1024.png"
                            alt="Cart"
                        />
                        {cartCount > 0 && (
                            <span className={cx('cart-count')}>
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </span>
                </div>
            </header>
            {showLogoutConfirm && (
                <div className={cx('modal-overlay')} role="dialog" aria-modal="true">
                    <div className={cx('modal')}>
                        <h3 className={cx('modal-title')}>Đăng xuất tài khoản?</h3>
                        <p className={cx('modal-desc')}>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
                        <div className={cx('modal-actions')}>
                            <button className={cx('btn', 'btn-muted')} onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
                            <button className={cx('btn', 'btn-primary')} onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DefaultHeader;