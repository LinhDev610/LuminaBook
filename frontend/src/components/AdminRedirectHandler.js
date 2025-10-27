import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

// Component để xử lý redirect admin một cách mượt mà
function AdminRedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();
    const [savedEmail] = useLocalStorage('savedEmail', null);
    const [token] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');

    useEffect(() => {
        // Chỉ redirect nếu:
        // 1. Có token
        // 2. Đang ở trang chủ (không phải admin page)
        const hasToken = token || sessionToken;
        const isOnHomePage = location.pathname === '/';
        
        // Kiểm tra role từ token hoặc API để quyết định redirect
        if (hasToken && isOnHomePage) {
            // Có thể thêm logic kiểm tra role ở đây nếu cần
            // Hiện tại không tự động redirect admin
        }
    }, [savedEmail, token, sessionToken, navigate, location.pathname]);

    return null; // Component này không render gì
}

export default AdminRedirectHandler;
