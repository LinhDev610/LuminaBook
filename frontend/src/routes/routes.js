import Home from '../pages/Home';
import PromotionPage from '../pages/Promotion';
import NewBookPage from '../pages/NewBook';
import Contact from '../pages/Contact';
import CustomerService from '../pages/CustomerService';
import ProductDetailPage from '../pages/ProductDetail';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import ForgotPassword from '../components/Auth/ForgotPassword';
import VerifyCode from '../components/Auth/VerifyCode';

import Account from '../pages/CustomerAccount';
import CustomerAccountLayout from '../layouts/CustomerAccountLayout';
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import ManageStaffAccountsPage from '../pages/Admin/ManageStaffAccounts';
import StaffMainPage from '../pages/Employees/Staff/StaffMain';
import ManageCustomerAccountsPage from '../pages/Admin/ManageCustomerAccounts';
import ManageProductsPage from '../pages/Admin/ManageProduct';
import AddEmployeePage from '../pages/Admin/ManageStaffAccounts/AddEmployee';
import StaffProductsPage from '../pages/Employees/Staff/ProductManagement';
import StaffAddProductPage from '../pages/Employees/Staff/ProductManagement/AddProduct';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/promotion', component: PromotionPage },
    { path: '/newbook', component: NewBookPage },
    { path: '/contact', component: Contact },
    { path: '/customer-support', component: CustomerService },
    { path: '/product/:id', component: ProductDetailPage },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/verify-code', component: VerifyCode },
    { path: '/account', component: Account },
    { path: '/customer-account', component: Account, layout: CustomerAccountLayout },
];

// Private routes
const privateRoutes = [
    { path: '/admin', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/add-employee', component: AddEmployeePage, layout: AdminLayout },
    { path: '/admin/customer-accounts', component: ManageCustomerAccountsPage, layout: AdminLayout },
    { path: '/admin/products', component: ManageProductsPage, layout: AdminLayout },
    { path: '/admin/categories', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/orders', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/vouchers', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/complaints', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/content', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/reports', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/profile', component: ManageStaffAccountsPage, layout: AdminLayout },
    // Staff routes
    { path: '/staff', component: StaffMainPage, layout: StaffLayout },
    { path: '/staff/products', component: StaffProductsPage, layout: StaffLayout },
    { path: '/staff/products/new', component: StaffAddProductPage, layout: StaffLayout },
];

export { publicRoutes, privateRoutes };