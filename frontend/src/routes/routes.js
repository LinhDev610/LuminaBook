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
import StaffDetailPage from '../pages/Admin/ManageStaffAccounts/StaffDetail';
import ManageCustomerAccountsPage from '../pages/Admin/ManageCustomerAccounts';
import CustomerDetailPage from '../pages/Admin/ManageCustomerAccounts/CustomerDetail';
import ProfileAdminPage from '../pages/Admin/ProfileAdmin';
import ManageCategoriesPage from '../pages/Admin/ManageCategories/ManageCategoriesPage';
import AddCategoryPage from '../pages/Admin/ManageCategories/AddCategory/AddCategoryPage';
import ManageProductsPage from '../pages/Admin/ManageProduct';
import AdminProductDetailPage from '../pages/Admin/ManageProduct/ProductDetail/ProductDetailPage';

import StaffMainPage from '../pages/Employees/Staff/StaffMain';
import ProfileStaffPage from '../pages/Employees/Staff/ProfileStaff';
import AddEmployeePage from '../pages/Admin/ManageStaffAccounts/AddEmployee';
import StaffProductsPage from '../pages/Employees/Staff/ProductManagement';
import StaffAddProductPage from '../pages/Employees/Staff/ProductManagement/AddProduct';
import StaffProductDetailPage from '../pages/Employees/Staff/ProductManagement/ProductDetail/ProductDetailPage';
import StaffUpdateProductPage from '../pages/Employees/Staff/ProductManagement/UpdateProduct/UpdateProductPage';
import ContentManagementPage from '../pages/Employees/Staff/ContentManagement';
import BannerDetailPage from '../pages/Employees/Staff/ContentManagement/BannerDetail';
import VouchersPromotionsPage from '../pages/Employees/Staff/VouchersPromotionsPage';
import CategoryDetailPage from '../pages/Admin/ManageCategories/CategoryDetail';
import UpdateCategoryPage from '../pages/Admin/ManageCategories/UpdateCategory';

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
];

// Private routes
const privateRoutes = [
    // Customer routes
    { path: '/customer-account', component: Account, layout: CustomerAccountLayout },

    // Admin routes
    { path: '/admin', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/add-employee', component: AddEmployeePage, layout: AdminLayout },
    { path: '/admin/staff/:id', component: StaffDetailPage, layout: AdminLayout },
    { path: '/admin/customer-accounts', component: ManageCustomerAccountsPage, layout: AdminLayout },
    { path: '/admin/customers/:id', component: CustomerDetailPage, layout: AdminLayout },
    { path: '/admin/products', component: ManageProductsPage, layout: AdminLayout },
    { path: '/admin/products/:id', component: AdminProductDetailPage, layout: AdminLayout },
    { path: '/admin/categories', component: ManageCategoriesPage, layout: AdminLayout },
    { path: '/admin/categories/new', component: AddCategoryPage, layout: AdminLayout },
    { path: '/admin/categories/:id', component: CategoryDetailPage, layout: AdminLayout },
    { path: '/admin/categories/:id/update', component: UpdateCategoryPage, layout: AdminLayout },
    { path: '/admin/orders', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/vouchers', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/complaints', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/content', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/reports', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/profile', component: ProfileAdminPage, layout: AdminLayout },
    // Staff routes
    { path: '/staff', component: StaffMainPage, layout: StaffLayout },
    { path: '/staff/products', component: StaffProductsPage, layout: StaffLayout },
    { path: '/staff/products/:id', component: StaffProductDetailPage, layout: StaffLayout },
    { path: '/staff/products/:id/update', component: StaffUpdateProductPage, layout: StaffLayout },
    { path: '/staff/products/new', component: StaffAddProductPage, layout: StaffLayout },
    { path: '/staff/content', component: ContentManagementPage, layout: StaffLayout },
    { path: '/staff/content/:id', component: BannerDetailPage, layout: StaffLayout },
    { path: '/staff/vouchers', component: VouchersPromotionsPage, layout: StaffLayout },
    { path: '/staff/profile', component: ProfileStaffPage, layout: StaffLayout },
];

export { publicRoutes, privateRoutes };