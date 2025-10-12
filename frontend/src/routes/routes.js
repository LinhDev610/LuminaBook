import config from '../config';

import Home from '../pages/Home';
import Contact from '../pages/Contact';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';
import VerifyCode from '../components/Auth/VerifyCode';
import ResetPassword from '../components/Auth/ResetPassword';
import CustomerAccount from '../pages/CustomerAccount';

// Public routes
const publicRoutes = [
    { path: config.routes.home, component: Home },
    { path: config.routes.contact, component: Contact },
    { path: config.routes.login, component: Login },
    { path: config.routes.register, component: Register },
    { path: config.routes.forgotPassword, component: ForgotPassword },
    { path: config.routes.verifyCode, component: VerifyCode },
    { path: config.routes.resetPassword, component: ResetPassword },
    { path: config.routes.customerAccount, component: CustomerAccount },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
