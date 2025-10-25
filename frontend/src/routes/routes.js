import Home from '../pages/Home';
import PromotionPage from '../pages/Promotion';
import NewBookPage from '../pages/NewBook';
import Contact from '../pages/Contact';
import CustomerSupport from '../pages/CustomerSupport';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';
import VerifyCode from '../components/Auth/VerifyCode';

import Account from '../pages/CustomerAccount';
import CustomerAccountLayout from '../layouts/CustomerAccountLayout';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/promotion', component: PromotionPage },
    { path: '/newbook', component: NewBookPage },
    { path: '/contact', component: Contact },
    { path: '/customer-support', component: CustomerSupport },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/verify-code', component: VerifyCode },
    { path: '/account', component: Account },
    { path: '/customer-account', component: Account, layout: CustomerAccountLayout },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };