// Layouts
import CustomLayout from '../layouts/CustomLayout';

// Pages
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import Account from '../pages/Account';

// Public routes
// Không có layout -> defaultLayout, layout = null -> Fragment, layout = CustomLayout -> CustomLayout
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/contact', component: Contact },
    { path: '/account', component: Account, layout: CustomLayout },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
