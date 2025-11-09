import { useState, useEffect } from 'react';
import { getActiveCategories } from '../services';

/**
 * Custom hook để fetch active categories và lắng nghe sự kiện categories-updated
 */
export const useActiveCategories = (token) => {
    const [categories, setCategories] = useState([]);
    const [activeCategoryIdSet, setActiveCategoryIdSet] = useState(new Set());
    const [activeCategoryNameSet, setActiveCategoryNameSet] = useState(new Set());
    const [loaded, setLoaded] = useState(false);

    const fetchActiveCategories = async () => {
        try {
            const list = await getActiveCategories(token);
            const opts = [{ value: 'all', label: 'Tất cả danh mục' }].concat(
                list.map((c) => ({ value: c.id || c.categoryId, label: c.name })),
            );
            setCategories(opts);
            setActiveCategoryIdSet(new Set(list.map((c) => String(c.id || c.categoryId))));
            setActiveCategoryNameSet(new Set(list.map((c) => String(c.name || '').toLowerCase())));
            setLoaded(true);
        } catch (_) {
            setCategories([{ value: 'all', label: 'Tất cả danh mục' }]);
            setActiveCategoryIdSet(new Set());
            setActiveCategoryNameSet(new Set());
            setLoaded(false);
        }
    };

    useEffect(() => {
        fetchActiveCategories();
    }, [token]);

    // Listen for categories-updated event
    useEffect(() => {
        const onCategoriesUpdated = () => {
            fetchActiveCategories();
            sessionStorage.removeItem('categories_dirty');
        };
        window.addEventListener('categories-updated', onCategoriesUpdated);
        if (sessionStorage.getItem('categories_dirty') === '1') onCategoriesUpdated();
        return () => window.removeEventListener('categories-updated', onCategoriesUpdated);
    }, []);

    return { categories, activeCategoryIdSet, activeCategoryNameSet, loaded };
};

