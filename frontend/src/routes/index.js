import Home from '../pages/Home';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyCode from '../pages/VerifyCode';
import ResetPassword from '../pages/ResetPassword';
import Account from '../pages/Account';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/contact', component: Contact },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/verify-code', component: VerifyCode },
    { path: '/reset-password', component: ResetPassword },
    { path: '/account', component: Account },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
