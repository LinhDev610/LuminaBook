import config from '../config';

// Layouts
import AdminLayout from '../layouts/AdminLayout';

// Pages
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import CustomerAccount from '../pages/Customer-account';

// Public routes
// Không có layout -> defaultLayout, layout = null -> Fragment, layout = CustomLayout -> CustomLayout
const publicRoutes = [
    { path: config.routes.home, component: Home },
    { path: config.routes.contact, component: Contact },
];

// Private routes
const privateRoutes = [
    { path: config.routes.customerAccount, component: CustomerAccount },
];

export { publicRoutes, privateRoutes };
