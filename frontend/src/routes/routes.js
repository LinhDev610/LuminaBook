import Home from '../pages/Home';
import PromotionPage from '../pages/Promotion';
import NewBookPage from '../pages/NewBook';
import Contact from '../pages/Contact';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';
import VerifyCode from '../components/Auth/VerifyCode';
import ResetPassword from '../components/Auth/ResetPassword';
import Account from '../pages/CustomerAccount';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/promotion', component: PromotionPage },
    { path: '/newbook', component: NewBookPage },
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