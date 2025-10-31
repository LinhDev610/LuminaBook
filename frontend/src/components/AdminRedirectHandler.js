import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

// Component để xử lý redirect admin một cách mượt mà
const API_BASE_URL = 'http://localhost:8080/lumina_book';

function AdminRedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();
    const [savedEmail] = useLocalStorage('savedEmail', null);
    const [token] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');

    const hasRedirectedRef = useRef(false);

    useEffect(() => {
        // Chỉ redirect nếu:
        // 1. Có token
        // 2. Đang ở trang chủ (không phải admin page)
        const hasToken = token || sessionToken;
        const isOnHomePage = location.pathname === '/';
        
        // Kiểm tra role từ API để quyết định redirect (chỉ chạy 1 lần)
        if (hasToken && isOnHomePage && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            (async () => {
                try {
                    const tokenToUse = token || sessionToken;
                    const me = await fetch(`${API_BASE_URL}/users/my-info`, {
                        headers: {
                            Authorization: `Bearer ${tokenToUse}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    const meData = await me.json().catch(() => ({}));
                    const userRole = meData?.result?.role?.name ||
                        meData?.result?.role ||
                        meData?.role?.name ||
                        meData?.role ||
                        meData?.result?.authorities?.[0]?.authority ||
                        meData?.authorities?.[0]?.authority;

                    if (userRole === 'ADMIN') {
                        navigate('/admin', { replace: true });
                        return;
                    }
                    if (userRole === 'STAFF' || userRole === 'CUSTOMER_SUPPORT') {
                        navigate('/staff', { replace: true });
                        return;
                    }
                    // Nếu không phải role đặc biệt, cho ở nguyên trang chủ
                } catch (_e) {
                    // ignore errors, stay on home
                }
            })();
        }
        // Deps hạn chế để tránh lặp vô hạn khi navigate
    }, [token, sessionToken, location.pathname, navigate]);

    return null; // Component này không render gì
}

export default AdminRedirectHandler;
