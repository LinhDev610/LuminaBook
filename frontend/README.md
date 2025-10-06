# 📚 WEBSITE BÁN SÁCH - CẤU TRÚC FOLDER

## 🎯 Mục đích
Cấu trúc folder cơ bản cho website bán sách, phù hợp team 2-3 dev, dễ hiểu và mở rộng.

## 📂 Cấu trúc folder

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
│   ├── constants.js    # Hằng số
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

## 🚀 Cách sử dụng

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

## 📝 Quy tắc đặt tên

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

## 🎯 Lợi ích

- ✅ **Dễ hiểu**: Phân chia rõ ràng theo chức năng
- ✅ **Dễ mở rộng**: Thêm component/page mới dễ dàng
- ✅ **Dễ bảo trì**: Code được tổ chức logic
- ✅ **Phù hợp team nhỏ**: 2-3 dev có thể làm việc song song
- ✅ **Scalable**: Có thể mở rộng khi dự án lớn hơn

## 📚 Tài liệu tham khảo

- [React Documentation](https://reactjs.org/docs)
- [React Router](https://reactrouter.com/)
- [Context API](https://reactjs.org/docs/context.html)
- [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📋 TODO List

- [ ] Implement Auth components (Login, Register, Forgot)
- [ ] Implement Layout components (Header, Footer)
- [ ] Implement Product components (Card, List, Detail)
- [ ] Implement Pages (Home, Products, Cart, Checkout, Profile)
- [ ] Implement Contexts (Auth, Cart)
- [ ] Implement Services (API, Utils)
- [ ] Implement Custom Hooks
- [ ] Add Routing
- [ ] Add Styling
- [ ] Add Testing
- [ ] Add Documentation