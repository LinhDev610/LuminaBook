import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function PrivateRoute({ children }) {
    const [token] = useLocalStorage('token', null);

    // Nếu có token thì cho phép truy cập, không thì redirect về login
    return token ? children : <Navigate to="/" replace />;
}

export default PrivateRoute;
