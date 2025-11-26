import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import styles from './SearchResultsPage.module.scss';
import ProductCard from '../../components/Common/ProductCard/ProductCard';
import { searchProducts } from '../../services';

const cx = classNames.bind(styles);

export default function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const keyword = (searchParams.get('q') || '').trim();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!keyword) {
            setResults([]);
            setError('');
            return;
        }

        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await searchProducts(keyword);
                if (!isMounted) return;
                setResults(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!isMounted) return;
                setError('Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.');
                setResults([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [keyword]);

    const handleBackHome = () => {
        navigate('/');
    };

    return (
        <div className={cx('search-page')}>
            <div className={cx('search-header')}>
                <h1>Kết quả tìm kiếm</h1>
                {keyword ? (
                    <p>
                        Hiển thị kết quả cho <strong>"{keyword}"</strong>
                    </p>
                ) : (
                    <p>Nhập từ khóa để tìm kiếm sách theo tên.</p>
                )}
            </div>

            {!keyword && (
                <div className={cx('empty-state')}>
                    <p>Chưa có từ khóa nào được nhập.</p>
                    <button type="button" onClick={handleBackHome}>
                        Về trang chủ
                    </button>
                </div>
            )}

            {keyword && loading && <div className={cx('state-card')}>Đang tìm kiếm...</div>}

            {keyword && !loading && error && (
                <div className={cx('state-card', 'error')}>
                    <p>{error}</p>
                    <button type="button" onClick={() => window.location.reload()}>
                        Thử lại
                    </button>
                </div>
            )}

            {keyword && !loading && !error && results.length === 0 && (
                <div className={cx('state-card')}>
                    <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                </div>
            )}

            {keyword && !loading && !error && results.length > 0 && (
                <div className={cx('results-grid')}>
                    {results.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

