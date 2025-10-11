# LUMINA BOOK - WEBSITE BÁN SÁCH

## Mục đích

Cấu trúc folder cho website bán sách LuminaBook, sử dụng React với CSS Modules và classnames/bind pattern.

## Cấu trúc tổng quan

```
src/
├── layouts/              # Layout components
│   ├── components/      # Layout components (Header, Footer, Search)
│   │   ├── Header/      # Header component
│   │   ├── Footer/      # Footer component
│   │   └── Search/      # Search component
│   ├── DefaultLayout/   # Layout mặc định (Header + Content + Footer)
│   ├── CustomLayout/    # Layout tùy chỉnh
│   └── index.js         # Export layouts
├── pages/               # Các trang chính
│   ├── Home/            # Trang chủ
│   ├── Account/         # Tài khoản
│   ├── Contact/         # Liên hệ
│   ├── Cart/            # Giỏ hàng
│   ├── Checkout/        # Thanh toán
│   ├── ProductDetail/   # Chi tiết sản phẩm
│   └── Profile/         # Hồ sơ cá nhân
├── components/          # Component tái sử dụng
│   ├── Auth/            # Xác thực (Login, Register, Forgot)
│   ├── Product/         # Sản phẩm (Card, List, Detail)
│   └── Common/         # Component chung (Button, Input)
├── contexts/            # State management
│   ├── AuthContext.js   # Quản lý đăng nhập
│   └── CartContext.js   # Quản lý giỏ hàng
├── services/            # API và logic
│   ├── api.js           # API calls
│   ├── constants.js     # Hằng số
│   └── utils.js         # Hàm tiện ích
├── hooks/               # Custom hooks
│   ├── useLocalStorage.js
│   └── useDebounce.js
├── assets/              # Tài nguyên
│   ├── images/          # Hình ảnh
│   ├── icons/           # Icon
│   └── styles/          # CSS global
├── routes/              # Định tuyến
│   └── index.js
├── config/              # Cấu hình
│   ├── index.js
│   └── routes.js
├── App.js
└── index.js
```

## Chi tiết từng folder

### **layouts/**

**Mục đích**: Layout components và cấu trúc trang
**Chứa**:

-   `DefaultLayout/` - Layout mặc định (Header + Content + Footer)
-   `CustomLayout/` - Layout tùy chỉnh cho các trang đặc biệt
-   `components/` - Layout components (Header, Footer, Search)

### **layouts/components/Header/**

**Mục đích**: Header component với navigation và user menu
**Chứa**:

-   `Header.js` - Component chính với logo, search, user menu
-   `Header.module.scss` - Styles sử dụng CSS Modules
-   `index.js` - Export component
    **Tính năng**: Logo, search bar, user authentication, cart icon

### **layouts/components/Footer/**

**Mục đích**: Footer component với thông tin công ty
**Chứa**:

-   `Footer.js` - Component footer
-   `Footer.module.scss` - Styles sử dụng CSS Modules
-   `index.js` - Export component
    **Tính năng**: Thông tin liên hệ, danh mục sách, hỗ trợ khách hàng

### **pages/Home/**

**Mục đích**: Trang chủ
**Chứa**:

-   `index.js` - Component trang chủ
-   `Home.module.scss` - Styles sử dụng CSS Modules
    **Tính năng**: Hero banner, sản phẩm nổi bật, promotions, navigation

### **components/Auth/**

**Mục đích**: Xử lý đăng nhập, đăng ký, quên mật khẩu
**Chứa**:

-   `Login/` - Modal đăng nhập
-   `Register/` - Modal đăng ký
-   `ForgotPassword/` - Modal quên mật khẩu
-   `VerifyCode/` - Xác thực mã OTP
-   `Auth.module.scss` - Styles chung
-   `index.js` - Export components

### **components/Product/**

**Mục đích**: Hiển thị sản phẩm
**Chứa**:

-   `ProductCard.js` - Card hiển thị sản phẩm
-   `ProductList.js` - Danh sách sản phẩm với filter, sort
-   `ProductDetail.js` - Chi tiết sản phẩm
-   `ProductCard.css`, `ProductList.css` - Styles
-   `index.js` - Export components

### **pages/Home/**

**Mục đích**: Trang chủ
**Chứa**:

-   `index.js` - Component trang chủ
-   `Home.css` - Styles cho trang chủ
    **Tính năng**: Hero banner, sản phẩm nổi bật, promotions

### **pages/Products/**

**Mục đích**: Danh sách sản phẩm
**Chứa**:

-   `index.js` - Component danh sách sản phẩm
-   `Products.css` - Styles
    **Tính năng**: Filter, sort, pagination, search

### **contexts/**

**Mục đích**: Quản lý state toàn cục
**Chứa**:

-   `AuthContext.js` - Quản lý đăng nhập, user info
-   `CartContext.js` - Quản lý giỏ hàng
-   `index.js` - Export contexts

### **services/**

**Mục đích**: API và logic nghiệp vụ
**Chứa**:

-   `api.js` - Tất cả API calls
-   `constants.js` - Hằng số (endpoints, categories, etc.)
-   `utils.js` - Hàm tiện ích (format currency, date, etc.)
-   `index.js` - Export services

### **hooks/**

**Mục đích**: Custom hooks tái sử dụng
**Chứa**:

-   `useLocalStorage.js` - Lưu trữ local storage
-   `useDebounce.js` - Debounce cho search
-   `index.js` - Export hooks

## Công nghệ sử dụng

### **CSS Modules + classnames/bind**

```javascript
// Import
import classNames from 'classnames/bind';
import styles from './Component.module.scss';

// Bind styles
const cx = classNames.bind(styles);

// Sử dụng
<div className={cx('wrapper', 'active')}>
    <h1 className={cx('title')}>Title</h1>
</div>;
```

### **Routing với Layout**

```javascript
// Trong src/routes/index.js
const publicRoutes = [
    { path: '/', component: Home }, // Sử dụng DefaultLayout
    { path: '/account', component: Account, layout: CustomLayout }, // Sử dụng CustomLayout
    { path: '/contact', component: Contact, layout: null }, // Không có layout
];
```

## Workflow làm việc

### **1. Tạo component mới**

```bash
# Tạo folder
mkdir src/components/NewComponent

# Tạo files
touch src/components/NewComponent/NewComponent.js
touch src/components/NewComponent/NewComponent.module.scss
touch src/components/NewComponent/index.js
```

### **2. Tạo page mới**

```bash
# Tạo folder
mkdir src/pages/NewPage

# Tạo files
touch src/pages/NewPage/index.js
touch src/pages/NewPage/NewPage.module.scss
```

### **3. Tạo layout component**

```bash
# Tạo folder
mkdir src/layouts/components/NewLayout

# Tạo files
touch src/layouts/components/NewLayout/NewLayout.js
touch src/layouts/components/NewLayout/NewLayout.module.scss
touch src/layouts/components/NewLayout/index.js
```

### **4. Thêm route**

```jsx
// Trong src/routes/index.js
import NewPage from '../pages/NewPage';
import CustomLayout from '../layouts/CustomLayout';

const publicRoutes = [
    { path: '/new-page', component: NewPage, layout: CustomLayout },
];
```

## Quy tắc đặt tên

### **Files và Folders**

-   **Components**: PascalCase (ProductCard.js)
-   **Pages**: PascalCase (HomePage.js)
-   **Hooks**: camelCase (useLocalStorage.js)
-   **Services**: camelCase (apiService.js)
-   **Layouts**: PascalCase (DefaultLayout.js)

### **CSS Classes (CSS Modules)**

-   **File naming**: `Component.module.scss`
-   **Class naming**: camelCase (`.productCard`, `.productCard__title`)
-   **Usage**: `className={cx('productCard', 'active')}`

### **Import/Export**

-   **Default export**: `export default Component`
-   **Named export**: `export { Component }`
-   **Import**: `import Component from './Component'`
-   **Import with bind**: `import classNames from 'classnames/bind'`

## Cấu trúc Layout System

### **Layout Hierarchy**

```
App.js
├── Router
    └── Routes
        └── Route
            └── Layout (DefaultLayout/CustomLayout/Fragment)
                ├── Header (nếu có)
                ├── Page Content
                └── Footer (nếu có)
```

### **Layout Types**

-   **DefaultLayout**: Header + Content + Footer
-   **CustomLayout**: Layout tùy chỉnh (chỉ Header)
-   **Fragment**: Không có layout wrapper

## 🔄 Luồng dữ liệu

### **1. User tương tác**

```
User → Component → Context → API → Server
```

### **2. Dữ liệu từ server**

```
Server → API → Context → Component → UI
```

## Tài liệu tham khảo

-   [React Documentation](https://reactjs.org/docs)
-   [React Router](https://reactrouter.com/)
-   [Context API](https://reactjs.org/docs/context.html)
-   [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
-   [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
