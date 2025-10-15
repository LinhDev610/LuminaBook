# Common Components

Thư mục này chứa các component tái sử dụng được trong toàn bộ ứng dụng.

## ProductCard

Component hiển thị thông tin sản phẩm dưới dạng card.

### Props:
- `product` (object): Thông tin sản phẩm
  - `id` (number): ID sản phẩm
  - `title` (string): Tên sản phẩm
  - `image` (string): URL hình ảnh
  - `currentPrice` (number): Giá hiện tại
  - `originalPrice` (number): Giá gốc
  - `discount` (number): Phần trăm giảm giá

### Usage:
```jsx
import ProductCard from '../components/Common/ProductCard';

<ProductCard product={productData} />
```

## ProductList

Component hiển thị danh sách sản phẩm với tính năng scroll ngang và navigation.

### Props:
- `products` (array): Mảng các sản phẩm
- `title` (string): Tiêu đề section (default: "SẢN PHẨM")
- `showNavigation` (boolean): Hiển thị nút navigation (default: true)

### Usage:
```jsx
import ProductList from '../components/Common/ProductList';

<ProductList 
    products={productsData} 
    title="KHUYẾN MÃI HOT" 
    showNavigation={true}
/>
```

## Cấu trúc dữ liệu sản phẩm

```javascript
const product = {
    id: 1,
    title: "Tên sản phẩm",
    image: "path/to/image.jpg",
    currentPrice: 200000,
    originalPrice: 285000,
    discount: 29
};
```

## Tích hợp với Backend

Khi có API từ backend, chỉ cần thay thế `mockProducts` trong `Home.js` bằng dữ liệu từ API:

```javascript
// Thay vì:
const mockProducts = [...];

// Sử dụng:
const [products, setProducts] = useState([]);

useEffect(() => {
    // Gọi API để lấy dữ liệu sản phẩm
    fetchProducts().then(data => setProducts(data));
}, []);
```
