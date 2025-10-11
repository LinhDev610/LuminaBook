import config from '../config';

// Layouts
import AdminLayout from '../layouts/AdminLayout';

// Pages
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import CustomerAccount from '../pages/CustomerAccount';

// Public routes
// Không có layout -> defaultLayout, layout = null -> Fragment, layout = CustomLayout -> CustomLayout
const publicRoutes = [
    { path: config.routes.home, component: Home },
    { path: config.routes.contact, component: Contact },
    { path: config.routes.customerAccount, component: CustomerAccount },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
