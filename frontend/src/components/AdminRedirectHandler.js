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
        // 2. Email chứa admin
        // 3. Đang ở trang chủ (không phải admin page)
        const hasToken = token || sessionToken;
        const isAdminEmail = savedEmail && savedEmail.toLowerCase().includes('admin');
        const isOnHomePage = location.pathname === '/';
        
        if (hasToken && isAdminEmail && isOnHomePage) {
            console.log('AdminRedirectHandler: Redirecting admin to /admin');
            // Sử dụng setTimeout để tránh conflict với các navigate khác
            const timer = setTimeout(() => {
                navigate('/admin', { replace: true });
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [savedEmail, token, sessionToken, navigate, location.pathname]);

    return null; // Component này không render gì
}

export default AdminRedirectHandler;
