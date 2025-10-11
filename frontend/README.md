# 📚 LUMINA BOOK - WEBSITE BÁN SÁCH

## 🎯 Giới thiệu

LuminaBook là website bán sách trực tuyến được xây dựng bằng React với CSS Modules và classnames/bind pattern. Dự án sử dụng layout system linh hoạt và component-based architecture.

## 🚀 Tính năng chính

-   ✅ **Trang chủ**: Hero banner, sản phẩm nổi bật, promotions
-   ✅ **Layout System**: DefaultLayout, CustomLayout, Fragment
-   ✅ **Authentication**: Login, Register, Forgot Password
-   ✅ **Product Management**: Card, List, Detail
-   ✅ **Shopping Cart**: Thêm/sửa/xóa sản phẩm
-   ✅ **User Account**: Profile, Order History
-   ✅ **Responsive Design**: Mobile-first approach

## 🛠️ Công nghệ sử dụng

-   **Frontend**: React 19.2.0
-   **Routing**: React Router DOM 7.9.3
-   **Styling**: CSS Modules + SCSS
-   **State Management**: React Context API
-   **Build Tool**: Create React App
-   **Package Manager**: Yarn

## 📦 Dependencies chính

```json
{
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.3",
    "classnames": "^2.1.1",
    "sass": "^1.93.2"
}
```

## 🚀 Quick Start

### **1. Cài đặt dependencies**

```bash
# Sử dụng yarn (khuyến nghị)
yarn install

# Hoặc sử dụng npm
npm install
```

### **2. Chạy development server**

```bash
# Sử dụng yarn
yarn start

# Hoặc sử dụng npm
npm start
```

### **3. Build production**

```bash
# Sử dụng yarn
yarn build

# Hoặc sử dụng npm
npm run build
```

## 📁 Cấu trúc dự án

```
src/
├── layouts/              # Layout system
│   ├── components/      # Header, Footer, Search
│   ├── DefaultLayout/   # Layout mặc định
│   └── CustomLayout/    # Layout tùy chỉnh
├── pages/               # Các trang chính
├── components/          # Component tái sử dụng
├── contexts/            # State management
├── services/            # API và logic
├── hooks/               # Custom hooks
├── assets/              # Tài nguyên
└── routes/              # Định tuyến
```

## 🎨 CSS Modules + classnames/bind

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

## 🛠️ Development Commands

```bash
# Development
yarn start          # Chạy dev server (port 3000)
yarn build          # Build production
yarn test           # Chạy tests
yarn eject          # Eject CRA (không khuyến nghị)

# Code Quality
yarn lint           # ESLint
yarn format         # Prettier
```

## 📋 Project Status

### ✅ Completed

-   [x] Project setup với React + CSS Modules
-   [x] Layout system (DefaultLayout, CustomLayout)
-   [x] Header component với navigation
-   [x] Footer component
-   [x] Home page với hero banner
-   [x] Routing system
-   [x] CSS Modules + classnames/bind
-   [x] Responsive design

### 🚧 In Progress

-   [ ] Authentication system
-   [ ] Product management
-   [ ] Shopping cart
-   [ ] User account

### 📝 TODO

-   [ ] API integration
-   [ ] State management (Context)
-   [ ] Testing setup
-   [ ] Performance optimization
-   [ ] SEO optimization

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📚 Documentation

-   **Chi tiết cấu trúc**: Xem [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
-   **API Documentation**: Xem [API.md](./API.md) (sắp có)
-   **Component Guide**: Xem [COMPONENTS.md](./COMPONENTS.md) (sắp có)

## 📞 Support

-   **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
-   **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
-   **Email**: support@luminabook.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
