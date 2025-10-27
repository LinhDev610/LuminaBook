import { Navigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function PrivateRoute({ children }) {
    const [token] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');

    // Kiểm tra cả localStorage và sessionStorage
    const hasToken = token || sessionToken;

    // Nếu có token thì cho phép truy cập, không thì redirect về trang chủ
    return hasToken ? children : <Navigate to="/" replace />;
}

export default PrivateRoute;
