// Layouts
import AdminLayout from '../layouts/AdminLayout';

// Pages
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import CustomerAccount from '../pages/CustomerAccount';

// Public routes
// Không có layout -> defaultLayout, layout = null -> Fragment, layout = CustomLayout -> CustomLayout
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/contact', component: Contact },
    { path: '/customerAccount', component: CustomerAccount },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
