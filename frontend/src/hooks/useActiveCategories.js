import { useState, useEffect } from 'react';
import { getApiBaseUrl, getStoredToken } from '../services/utils';

/**
 * Custom hook để fetch active categories và lắng nghe sự kiện categories-updated
 */
export const useActiveCategories = (token) => {
    const [categories, setCategories] = useState([]);
    const [activeCategoryIdSet, setActiveCategoryIdSet] = useState(new Set());
    const [activeCategoryNameSet, setActiveCategoryNameSet] = useState(new Set());
    const [loaded, setLoaded] = useState(false);
    const API_BASE_URL = getApiBaseUrl();

    const fetchActiveCategories = async () => {
        try {
            const tokenToUse = token || getStoredToken('token');
            const resp = await fetch(`${API_BASE_URL}/categories/active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                },
            });
            const data = await resp.json().catch(() => ({}));
            const list = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];

            const opts = [{ value: 'all', label: 'Tất cả danh mục' }].concat(
                list.map((c) => ({ value: c.id || c.categoryId, label: c.name })),
            );
            setCategories(opts);

            const idSet = new Set(list.map((c) => String(c.id || c.categoryId)));
            const nameSet = new Set(list.map((c) => String(c.name || '').toLowerCase()));
            setActiveCategoryIdSet(idSet);
            setActiveCategoryNameSet(nameSet);
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

