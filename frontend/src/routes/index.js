import Home from '../pages/Home';
import Contact from '../pages/Contact';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/contact', component: Contact },
];

// Private routes
const privateRoutes = [];

export { publicRoutes, privateRoutes };
