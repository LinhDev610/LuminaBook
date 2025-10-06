# WEBSITE BÁN SÁCH

## Mục đích
Cấu trúc folder cơ bản cho website bán sách, phù hợp team 2-3 dev, dễ hiểu và mở rộng.

## Cấu trúc tổng quan

```
src/
├── components/           # Component tái sử dụng
│   ├── Auth/            # Xác thực (Login, Register, Forgot)
│   ├── Layout/          # Layout (Header, Footer)
│   ├── Product/         # Sản phẩm (Card, List, Detail)
│   └── Common/          # Component chung (Button, Input, Modal)
├── pages/               # Các trang chính
│   ├── Home/            # Trang chủ
│   ├── Products/        # Danh sách sản phẩm
│   ├── ProductDetail/   # Chi tiết sản phẩm
│   ├── Cart/            # Giỏ hàng
│   ├── Checkout/        # Thanh toán
│   ├── Profile/         # Tài khoản
│   └── Contact/         # Liên hệ
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
├── App.js
└── index.js
```

## Chi tiết từng folder

### **components/Auth/**
**Mục đích**: Xử lý đăng nhập, đăng ký, quên mật khẩu
**Chứa**:
- `LoginModal.js` - Modal đăng nhập
- `RegisterModal.js` - Modal đăng ký
- `ForgotPasswordModal.js` - Modal quên mật khẩu
- `Auth.css` - Styles cho auth components
- `index.js` - Export components

### **components/Layout/**
**Mục đích**: Layout chung của website
**Chứa**:
- `Header.js` - Header với logo, search, navigation, user menu
- `Footer.js` - Footer với thông tin công ty
- `Header.css`, `Footer.css` - Styles
- `index.js` - Export components

### **components/Product/**
**Mục đích**: Hiển thị sản phẩm
**Chứa**:
- `ProductCard.js` - Card hiển thị sản phẩm
- `ProductList.js` - Danh sách sản phẩm với filter, sort
- `ProductDetail.js` - Chi tiết sản phẩm
- `ProductCard.css`, `ProductList.css` - Styles
- `index.js` - Export components

### **pages/Home/**
**Mục đích**: Trang chủ
**Chứa**:
- `index.js` - Component trang chủ
- `Home.css` - Styles cho trang chủ
**Tính năng**: Hero banner, sản phẩm nổi bật, promotions

### **pages/Products/**
**Mục đích**: Danh sách sản phẩm
**Chứa**:
- `index.js` - Component danh sách sản phẩm
- `Products.css` - Styles
**Tính năng**: Filter, sort, pagination, search

### **contexts/**
**Mục đích**: Quản lý state toàn cục
**Chứa**:
- `AuthContext.js` - Quản lý đăng nhập, user info
- `CartContext.js` - Quản lý giỏ hàng
- `index.js` - Export contexts

### **services/**
**Mục đích**: API và logic nghiệp vụ
**Chứa**:
- `api.js` - Tất cả API calls
- `constants.js` - Hằng số (endpoints, categories, etc.)
- `utils.js` - Hàm tiện ích (format currency, date, etc.)
- `index.js` - Export services

### **hooks/**
**Mục đích**: Custom hooks tái sử dụng
**Chứa**:
- `useLocalStorage.js` - Lưu trữ local storage
- `useDebounce.js` - Debounce cho search
- `index.js` - Export hooks

## Workflow làm việc

### **1. Tạo component mới**
```bash
# Tạo folder
mkdir src/components/NewComponent

# Tạo files
touch src/components/NewComponent/NewComponent.js
touch src/components/NewComponent/NewComponent.css
touch src/components/NewComponent/index.js
```

### **2. Tạo page mới**
```bash
# Tạo folder
mkdir src/pages/NewPage

# Tạo files
touch src/pages/NewPage/index.js
touch src/pages/NewPage/NewPage.css
```

### **3. Thêm route**
```jsx
// Trong src/routes/index.js
import NewPage from '../pages/NewPage';

const publicRoutes = [
    { path: '/new-page', component: NewPage },
];
```

## Quy tắc đặt tên

### **Files và Folders**
- **Components**: PascalCase (ProductCard.js)
- **Pages**: PascalCase (HomePage.js)
- **Hooks**: camelCase (useLocalStorage.js)
- **Services**: camelCase (apiService.js)

### **CSS Classes**
- **BEM**: `.product-card`, `.product-card__title`

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

- [React Documentation](https://reactjs.org/docs)
- [React Router](https://reactrouter.com/)
- [Context API](https://reactjs.org/docs/context.html)
- [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
