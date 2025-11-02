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

    const checkedRoleRef = useRef(false);
    const lastPathnameRef = useRef(location.pathname);

    useEffect(() => {
        const hasToken = token || sessionToken;
        const currentPath = location.pathname;
        
        // Reset check khi pathname thay đổi (F5 trên route khác)
        if (lastPathnameRef.current !== currentPath) {
            checkedRoleRef.current = false;
            lastPathnameRef.current = currentPath;
        }
        
        // Set flag NGAY LẬP TỨC nếu có token và đang ở trang public (trước khi async check)
        if (hasToken && (currentPath === '/' || (!currentPath.startsWith('/admin') && !currentPath.startsWith('/staff')))) {
            sessionStorage.setItem('_checking_role', '1');
        }
        
        // Chỉ check role 1 lần cho mỗi pathname, khi có token
        if (hasToken && !checkedRoleRef.current) {
            checkedRoleRef.current = true;
            
            (async () => {
                try {
                    // Đọc trực tiếp từ storage và parse để tránh vấn đề JSON.stringify
                    let tokenToUse = sessionToken; // sessionStorage không bị stringify
                    
                    // Nếu không có trong sessionStorage, đọc từ localStorage và parse
                    if (!tokenToUse) {
                        try {
                            const raw = localStorage.getItem('token');
                            if (raw) {
                                // useLocalStorage dùng JSON.stringify, nên cần parse
                                tokenToUse = JSON.parse(raw);
                            }
                        } catch (_) {
                            // Nếu parse lỗi, thử dùng trực tiếp từ hook
                            tokenToUse = token;
                        }
                    }
                    
                    if (!tokenToUse) {
                        return;
                    }
                    
                    // Đảm bảo token là string (không phải object)
                    if (typeof tokenToUse !== 'string') {
                        tokenToUse = String(tokenToUse);
                    }
                    
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

                    // Redirect dựa trên role và route hiện tại
                    if (userRole === 'ADMIN') {
                        // Nếu đang không ở /admin, redirect
                        if (currentPath !== '/admin' && !currentPath.startsWith('/admin/')) {
                            navigate('/admin', { replace: true });
                        }
                        return;
                    }
                    if (userRole === 'STAFF' || userRole === 'CUSTOMER_SUPPORT') {
                        // Nếu đang không ở /staff, redirect
                        if (currentPath !== '/staff' && !currentPath.startsWith('/staff/')) {
                            navigate('/staff', { replace: true });
                        }
                        return;
                    }
                    // Nếu là CUSTOMER nhưng đang ở /admin hoặc /staff, về trang chủ
                    if ((currentPath.startsWith('/admin') || currentPath.startsWith('/staff')) && !userRole) {
                        navigate('/', { replace: true });
                    }
                } catch (_e) {
                    // ignore errors, stay on current page
                } finally {
                    // Xóa flag sau khi check xong
                    sessionStorage.removeItem('_checking_role');
                }
            })();
        } else {
            // Nếu không có token hoặc không cần check, xóa flag ngay
            sessionStorage.removeItem('_checking_role');
        }
    }, [token, sessionToken, location.pathname, navigate]);

    return null; // Component này không render gì
}

export default AdminRedirectHandler;
