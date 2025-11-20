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
import CartPage from '../pages/CartPage';
import CheckoutDetailPage from '../pages/CheckoutPage/CheckoutDetails';
import ConfirmCheckoutPage from '../pages/CheckoutPage/ConfirmCheckout';
import CustomerAccountLayout from '../layouts/CustomerAccountLayout';
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import CustomerSupportLayout from '../layouts/CustomerSupportLayout';
import ManageStaffAccountsPage from '../pages/Admin/ManageStaffAccounts';

import StaffDetailPage from '../pages/Admin/ManageStaffAccounts/StaffDetail';
import ManageCustomerAccountsPage from '../pages/Admin/ManageCustomerAccounts';
import CustomerDetailPage from '../pages/Admin/ManageCustomerAccounts/CustomerDetail';
import ProfileAdminPage from '../pages/Admin/ProfileAdmin';
import ManageCategoriesPage from '../pages/Admin/ManageCategories/ManageCategoriesPage';
import AddCategoryPage from '../pages/Admin/ManageCategories/AddCategory/AddCategoryPage';
import ManageProductsPage from '../pages/Admin/ManageProduct';
import AdminProductDetailPage from '../pages/Admin/ManageProduct/ProductDetail/ProductDetailPage';
import CategoryDetailPage from '../pages/Admin/ManageCategories/CategoryDetail';
import UpdateCategoryPage from '../pages/Admin/ManageCategories/UpdateCategory';
import ManageVouchersPromotionsPage from '../pages/Admin/ManageVouchersPromotions';
import AdminVoucherDetailPage from '../pages/Admin/ManageVouchersPromotions/VoucherDetail';
import AdminPromotionDetailPage from '../pages/Admin/ManageVouchersPromotions/PromotionDetail';
import ManageComplaintsPage from '../pages/Admin/ManageComplaints';
import ComplaintsDetailPage from '../pages/Admin/ManageComplaints/ComplaintsDetail';
import ManageContentPage from '../pages/Admin/ManageContent';
import ContentDetailPage from '../pages/Admin/ManageContent/ContentDetail';

import StaffMainPage from '../pages/Employees/Staff/StaffMain';
import ProfileStaffPage from '../pages/Employees/Staff/ProfileStaff';
import AddEmployeePage from '../pages/Admin/ManageStaffAccounts/AddEmployee';
import StaffProductsPage from '../pages/Employees/Staff/ProductManagement';
import StaffAddProductPage from '../pages/Employees/Staff/ProductManagement/AddProduct';
import StaffProductDetailPage from '../pages/Employees/Staff/ProductManagement/ProductDetail/ProductDetailPage';
import StaffUpdateProductPage from '../pages/Employees/Staff/ProductManagement/UpdateProduct/UpdateProductPage';
import ContentManagementPage from '../pages/Employees/Staff/ContentManagement';
import AddBannerPage from '../pages/Employees/Staff/ContentManagement/AddBanner';
import BannerDetailPage from '../pages/Employees/Staff/ContentManagement/BannerDetail';
import BannerBookListPage from '../pages/Employees/Staff/ContentManagement/BannerDetail/BannerBookList';
import UpdateContentPage from '../pages/Employees/Staff/ContentManagement/UpdateContent';
import VouchersPromotionsPage from '../pages/Employees/Staff/VouchersPromotionsPage';
import OrderManagementPage from '../pages/Employees/Staff/OrderManagement';
import OrderDetailPage from '../pages/Employees/Staff/OrderManagement/OrderDetail';
import AddVoucherPage from '../pages/Employees/Staff/VouchersPromotionsPage/Voucher/AddVoucher/AddVoucherPage';
import AddPromotionPage from '../pages/Employees/Staff/VouchersPromotionsPage/Promotion/AddPromotion';
import VoucherDetailPage from '../pages/Employees/Staff/VouchersPromotionsPage/Voucher/VoucherDetail';
import PromotionDetailPage from '../pages/Employees/Staff/VouchersPromotionsPage/Promotion/PromotionDetail';
import UpdateVoucherPage from '../pages/Employees/Staff/VouchersPromotionsPage/Voucher/UpdateVoucher';
import UpdatePromotionPage from '../pages/Employees/Staff/VouchersPromotionsPage/Promotion/UpdatePromotion';
import CustomerSupportMainPage from '../pages/Employees/CustomerSupport/CustomerSupportMain';
import ComplaintManagementPage from '../pages/Employees/CustomerSupport/ComplaintManagement';
import ReviewCommentManagementPage from '../pages/Employees/CustomerSupport/ReviewCommentManagement';
import ProfileCustomerSupportPage from '../pages/Employees/CustomerSupport/ProfileCustomerSupport';

// Public routes
const publicRoutes = [
    { path: '/', component: Home },
    { path: '/promotion', component: PromotionPage },
    { path: '/newbook', component: NewBookPage },
    { path: '/contact', component: Contact },
    { path: '/support', component: CustomerService },
    { path: '/product/:id', component: ProductDetailPage },
    { path: '/cart', component: CartPage },
    { path: '/checkout', component: CheckoutDetailPage },
    { path: '/checkout/confirm', component: ConfirmCheckoutPage },
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
    {
        path: '/admin/customer-accounts',
        component: ManageCustomerAccountsPage,
        layout: AdminLayout,
    },
    { path: '/admin/customers/:id', component: CustomerDetailPage, layout: AdminLayout },
    { path: '/admin/products', component: ManageProductsPage, layout: AdminLayout },
    {
        path: '/admin/products/:id',
        component: AdminProductDetailPage,
        layout: AdminLayout,
    },
    { path: '/admin/categories', component: ManageCategoriesPage, layout: AdminLayout },
    { path: '/admin/categories/new', component: AddCategoryPage, layout: AdminLayout },
    { path: '/admin/categories/:id', component: CategoryDetailPage, layout: AdminLayout },
    {
        path: '/admin/categories/:id/update',
        component: UpdateCategoryPage,
        layout: AdminLayout,
    },
    { path: '/admin/orders', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/complaints', component: ManageComplaintsPage, layout: AdminLayout },
    {
        path: '/admin/complaints/:id',
        component: ComplaintsDetailPage,
        layout: AdminLayout,
    },
    { path: '/admin/content', component: ManageContentPage, layout: AdminLayout },
    { path: '/admin/content/:id', component: ContentDetailPage, layout: AdminLayout },
    {
        path: '/admin/content/:id/books',
        component: BannerBookListPage,
        layout: AdminLayout,
    },
    {
        path: '/admin/vouchers-promotions',
        component: ManageVouchersPromotionsPage,
        layout: AdminLayout,
    },
    {
        path: '/admin/vouchers/:id',
        component: AdminVoucherDetailPage,
        layout: AdminLayout,
    },
    {
        path: '/admin/promotions/:id',
        component: AdminPromotionDetailPage,
        layout: AdminLayout,
    },
    { path: '/admin/content', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/reports', component: ManageStaffAccountsPage, layout: AdminLayout },
    { path: '/admin/profile', component: ProfileAdminPage, layout: AdminLayout },

    // Staff routes
    { path: '/staff', component: StaffMainPage, layout: StaffLayout },
    { path: '/staff/products', component: StaffProductsPage, layout: StaffLayout },
    { path: '/staff/products/new', component: StaffAddProductPage, layout: StaffLayout },
    { path: '/staff/products/:id', component: StaffProductDetailPage, layout: StaffLayout },
    { path: '/staff/products/:id/update', component: StaffUpdateProductPage, layout: StaffLayout },

    { path: '/staff/content', component: ContentManagementPage, layout: StaffLayout },
    { path: '/staff/content/add-banner', component: AddBannerPage, layout: StaffLayout },
    { path: '/staff/content/:id', component: BannerDetailPage, layout: StaffLayout },
    { path: '/staff/content/:id/edit', component: UpdateContentPage, layout: StaffLayout },
    { path: '/staff/content/:id/books', component: BannerBookListPage, layout: StaffLayout },

    { path: '/staff/vouchers', component: VouchersPromotionsPage, layout: StaffLayout },
    { path: '/staff/vouchers-promotions', component: VouchersPromotionsPage, layout: StaffLayout },
    { path: '/staff/vouchers/new', component: AddVoucherPage, layout: StaffLayout },
    { path: '/staff/vouchers/:id', component: VoucherDetailPage, layout: StaffLayout },
    { path: '/staff/vouchers/:id/update', component: UpdateVoucherPage, layout: StaffLayout },

    { path: '/staff/promotions/new', component: AddPromotionPage, layout: StaffLayout },
    { path: '/staff/promotions/:id', component: PromotionDetailPage, layout: StaffLayout },
    { path: '/staff/promotions/:id/update', component: UpdatePromotionPage, layout: StaffLayout },
    
    { path: '/staff/orders', component: OrderManagementPage, layout: StaffLayout },
    { path: '/staff/orders/:id', component: OrderDetailPage, layout: StaffLayout },

    { path: '/staff/profile', component: ProfileStaffPage, layout: StaffLayout },

    // Customer Support routes
    {
        path: '/customer-support',
        component: CustomerSupportMainPage,
        layout: CustomerSupportLayout,
    },
    {
        path: '/customer-support/complaints',
        component: ComplaintManagementPage,
        layout: CustomerSupportLayout,
    },
    {
        path: '/customer-support/reviews',
        component: ReviewCommentManagementPage,
        layout: CustomerSupportLayout,
    },
    {
        path: '/customer-support/profile',
        component: ProfileCustomerSupportPage,
        layout: CustomerSupportLayout,
    },
];

export { publicRoutes, privateRoutes };
