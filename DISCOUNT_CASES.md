# Các Trường Hợp Giảm Giá - Voucher & Promotion

## 📊 Tổng quan Logic Tính Toán

### Công thức tổng quát:

```
Bước 1: Tính applicableSubtotal (giá trị đơn hàng có thể áp dụng voucher)
  - ORDER: toàn bộ đơn hàng
  - CATEGORY: chỉ các sản phẩm thuộc categories đã chọn
  - PRODUCT: chỉ các sản phẩm cụ thể đã chọn

Bước 2: Kiểm tra minOrderValue
  - Nếu applicableSubtotal < minOrderValue → Lỗi

Bước 3: Tính discount ban đầu
  - PERCENTAGE: discount = applicableSubtotal × (discountValue / 100)
  - AMOUNT: discount = discountValue

Bước 4: Áp dụng các giới hạn
  - Giới hạn bởi maxDiscountValue (nếu có)
  - Giới hạn bởi applicableSubtotal (không giảm quá giá trị đơn hàng)

Bước 5: Tính totalAmount
  - totalAmount = fullSubtotal - discount
```

---

## 🎯 Các Trường Hợp Chi Tiết

### **NHÓM 1: Giảm theo % (PERCENTAGE)**

#### **Trường hợp 1.1: ORDER - Giảm % cho toàn bộ đơn hàng**

**Voucher:**
- `discountValueType`: `PERCENTAGE`
- `discountValue`: `20` (20%)
- `applyScope`: `ORDER`
- `minOrderValue`: `300.000₫`
- `maxDiscountValue`: `null` (không có hạn mức)

**Đơn hàng:**
- Sách A: 200.000₫
- Sách B: 150.000₫
- Sách C: 100.000₫
- **Tổng đơn hàng**: 450.000₫

**Tính toán:**
```
1. applicableSubtotal = 450.000₫ (toàn bộ đơn hàng)
2. Kiểm tra: 450.000₫ >= 300.000₫ ✅
3. discount = 450.000 × 20% = 90.000₫
4. Không có maxDiscountValue → giữ nguyên
5. discount = min(90.000, 450.000) = 90.000₫
6. totalAmount = 450.000 - 90.000 = 360.000₫
```

**Kết quả:** Giảm **90.000₫**, còn lại **360.000₫**

---

#### **Trường hợp 1.2: ORDER - Giảm % có hạn mức**

**Voucher:**
- `discountValueType`: `PERCENTAGE`
- `discountValue`: `20` (20%)
- `applyScope`: `ORDER`
- `minOrderValue`: `300.000₫`
- `maxDiscountValue`: `50.000₫` (hạn mức)

**Đơn hàng:**
- Sách A: 200.000₫
- Sách B: 150.000₫
- Sách C: 100.000₫
- **Tổng đơn hàng**: 450.000₫

**Tính toán:**
```
1. applicableSubtotal = 450.000₫
2. Kiểm tra: 450.000₫ >= 300.000₫ ✅
3. discount = 450.000 × 20% = 90.000₫
4. Áp dụng hạn mức: discount = min(90.000, 50.000) = 50.000₫
5. discount = min(50.000, 450.000) = 50.000₫
6. totalAmount = 450.000 - 50.000 = 400.000₫
```

**Kết quả:** Giảm **50.000₫** (bị giới hạn bởi hạn mức), còn lại **400.000₫**

---

#### **Trường hợp 1.3: CATEGORY - Giảm % cho danh mục cụ thể**

**Voucher:**
- `discountValueType`: `PERCENTAGE`
- `discountValue`: `15` (15%)
- `applyScope`: `CATEGORY`
- `categoryApply`: `["Tiểu thuyết", "Kinh doanh"]`
- `minOrderValue`: `200.000₫`
- `maxDiscountValue`: `30.000₫`

**Đơn hàng:**
- Sách A (Tiểu thuyết): 150.000₫
- Sách B (Kinh doanh): 100.000₫
- Sách C (Khoa học): 80.000₫
- **Tổng đơn hàng**: 330.000₫

**Tính toán:**
```
1. applicableSubtotal = 150.000 + 100.000 = 250.000₫
   (Chỉ tính sách A và B vì thuộc categories đã chọn)
2. Kiểm tra: 250.000₫ >= 200.000₫ ✅
3. discount = 250.000 × 15% = 37.500₫
4. Áp dụng hạn mức: discount = min(37.500, 30.000) = 30.000₫
5. discount = min(30.000, 250.000) = 30.000₫
6. totalAmount = 330.000 - 30.000 = 300.000₫
```

**Kết quả:** 
- Giá trị áp dụng: **250.000₫** (chỉ sách Tiểu thuyết + Kinh doanh)
- Giảm: **30.000₫** (bị giới hạn bởi hạn mức)
- Tổng thanh toán: **300.000₫**

---

#### **Trường hợp 1.4: PRODUCT - Giảm % cho sản phẩm cụ thể**

**Voucher:**
- `discountValueType`: `PERCENTAGE`
- `discountValue`: `25` (25%)
- `applyScope`: `PRODUCT`
- `productApply`: `["Sách A", "Sách B"]`
- `minOrderValue`: `150.000₫`
- `maxDiscountValue`: `40.000₫`

**Đơn hàng:**
- Sách A: 120.000₫
- Sách B: 80.000₫
- Sách C: 100.000₫
- **Tổng đơn hàng**: 300.000₫

**Tính toán:**
```
1. applicableSubtotal = 120.000 + 80.000 = 200.000₫
   (Chỉ tính Sách A và B vì nằm trong danh sách sản phẩm)
2. Kiểm tra: 200.000₫ >= 150.000₫ ✅
3. discount = 200.000 × 25% = 50.000₫
4. Áp dụng hạn mức: discount = min(50.000, 40.000) = 40.000₫
5. discount = min(40.000, 200.000) = 40.000₫
6. totalAmount = 300.000 - 40.000 = 260.000₫
```

**Kết quả:**
- Giá trị áp dụng: **200.000₫** (chỉ Sách A + B)
- Giảm: **40.000₫** (bị giới hạn bởi hạn mức)
- Tổng thanh toán: **260.000₫**

---

### **NHÓM 2: Giảm số tiền cố định (AMOUNT)**

#### **Trường hợp 2.1: ORDER - Giảm số tiền cố định cho toàn bộ đơn hàng**

**Voucher:**
- `discountValueType`: `AMOUNT`
- `discountValue`: `50.000₫`
- `applyScope`: `ORDER`
- `minOrderValue`: `300.000₫`
- `maxDiscountValue`: `null`

**Đơn hàng:**
- Sách A: 200.000₫
- Sách B: 150.000₫
- **Tổng đơn hàng**: 350.000₫

**Tính toán:**
```
1. applicableSubtotal = 350.000₫
2. Kiểm tra: 350.000₫ >= 300.000₫ ✅
3. discount = 50.000₫ (số tiền cố định)
4. Không có maxDiscountValue → giữ nguyên
5. discount = min(50.000, 350.000) = 50.000₫
6. totalAmount = 350.000 - 50.000 = 300.000₫
```

**Kết quả:** Giảm **50.000₫**, còn lại **300.000₫**

---

#### **Trường hợp 2.2: ORDER - Giảm số tiền cố định có hạn mức**

**Voucher:**
- `discountValueType`: `AMOUNT`
- `discountValue`: `100.000₫`
- `applyScope`: `ORDER`
- `minOrderValue`: `300.000₫`
- `maxDiscountValue`: `50.000₫` (hạn mức)

**Đơn hàng:**
- Sách A: 200.000₫
- Sách B: 150.000₫
- **Tổng đơn hàng**: 350.000₫

**Tính toán:**
```
1. applicableSubtotal = 350.000₫
2. Kiểm tra: 350.000₫ >= 300.000₫ ✅
3. discount = 100.000₫
4. Áp dụng hạn mức: discount = min(100.000, 50.000) = 50.000₫
5. discount = min(50.000, 350.000) = 50.000₫
6. totalAmount = 350.000 - 50.000 = 300.000₫
```

**Kết quả:** Giảm **50.000₫** (bị giới hạn bởi hạn mức), còn lại **300.000₫**

---

#### **Trường hợp 2.3: CATEGORY - Giảm số tiền cố định cho danh mục**

**Voucher:**
- `discountValueType`: `AMOUNT`
- `discountValue`: `30.000₫`
- `applyScope`: `CATEGORY`
- `categoryApply`: `["Tiểu thuyết"]`
- `minOrderValue`: `100.000₫`
- `maxDiscountValue`: `20.000₫`

**Đơn hàng:**
- Sách A (Tiểu thuyết): 80.000₫
- Sách B (Tiểu thuyết): 50.000₫
- Sách C (Kinh doanh): 100.000₫
- **Tổng đơn hàng**: 230.000₫

**Tính toán:**
```
1. applicableSubtotal = 80.000 + 50.000 = 130.000₫
   (Chỉ tính sách Tiểu thuyết)
2. Kiểm tra: 130.000₫ >= 100.000₫ ✅
3. discount = 30.000₫
4. Áp dụng hạn mức: discount = min(30.000, 20.000) = 20.000₫
5. discount = min(20.000, 130.000) = 20.000₫
6. totalAmount = 230.000 - 20.000 = 210.000₫
```

**Kết quả:**
- Giá trị áp dụng: **130.000₫** (chỉ sách Tiểu thuyết)
- Giảm: **20.000₫** (bị giới hạn bởi hạn mức)
- Tổng thanh toán: **210.000₫**

---

#### **Trường hợp 2.4: PRODUCT - Giảm số tiền cố định cho sản phẩm cụ thể**

**Voucher:**
- `discountValueType`: `AMOUNT`
- `discountValue`: `25.000₫`
- `applyScope`: `PRODUCT`
- `productApply`: `["Sách A"]`
- `minOrderValue`: `50.000₫`
- `maxDiscountValue`: `null`

**Đơn hàng:**
- Sách A: 80.000₫
- Sách B: 60.000₫
- **Tổng đơn hàng**: 140.000₫

**Tính toán:**
```
1. applicableSubtotal = 80.000₫ (chỉ Sách A)
2. Kiểm tra: 80.000₫ >= 50.000₫ ✅
3. discount = 25.000₫
4. Không có maxDiscountValue → giữ nguyên
5. discount = min(25.000, 80.000) = 25.000₫
6. totalAmount = 140.000 - 25.000 = 115.000₫
```

**Kết quả:**
- Giá trị áp dụng: **80.000₫** (chỉ Sách A)
- Giảm: **25.000₫**
- Tổng thanh toán: **115.000₫**

---

## ⚠️ Các Trường Hợp Lỗi

### **Lỗi 1: Không đạt minOrderValue**

**Voucher:**
- `minOrderValue`: `500.000₫`
- `applyScope`: `ORDER`

**Đơn hàng:**
- Tổng: **400.000₫**

**Kết quả:** ❌ Lỗi `INVALID_VOUCHER_MINIUM`
- "Giá trị đơn hàng không đạt yêu cầu tối thiểu"

---

### **Lỗi 2: Không có sản phẩm phù hợp (CATEGORY/PRODUCT)**

**Voucher:**
- `applyScope`: `CATEGORY`
- `categoryApply`: `["Tiểu thuyết"]`

**Đơn hàng:**
- Sách A (Kinh doanh): 200.000₫
- Sách B (Khoa học): 150.000₫

**Tính toán:**
```
1. applicableSubtotal = 0₫ (không có sách nào thuộc category "Tiểu thuyết")
2. Kiểm tra: 0₫ < minOrderValue → ❌ Lỗi
```

**Kết quả:** ❌ Lỗi `INVALID_VOUCHER_MINIUM`

---

### **Lỗi 3: Discount vượt quá giá trị đơn hàng**

**Voucher:**
- `discountValueType`: `AMOUNT`
- `discountValue`: `100.000₫`
- `applyScope`: `PRODUCT`
- `productApply`: `["Sách A"]`

**Đơn hàng:**
- Sách A: **50.000₫**

**Tính toán:**
```
1. applicableSubtotal = 50.000₫
2. discount = 100.000₫
3. discount = min(100.000, 50.000) = 50.000₫
   (Tự động giới hạn, không lỗi)
```

**Kết quả:** ✅ Giảm **50.000₫** (không giảm quá giá trị đơn hàng)

---

## 📋 Bảng Tóm Tắt Các Trường Hợp

| applyScope | discountValueType | minOrderValue | maxDiscountValue | Ví dụ Kết Quả |
|------------|-------------------|---------------|------------------|---------------|
| ORDER | PERCENTAGE | 300k | null | Giảm 20% toàn đơn |
| ORDER | PERCENTAGE | 300k | 50k | Giảm 20%, tối đa 50k |
| ORDER | AMOUNT | 300k | null | Giảm 50k cố định |
| ORDER | AMOUNT | 300k | 30k | Giảm 50k, tối đa 30k |
| CATEGORY | PERCENTAGE | 200k | 30k | Giảm 15% cho category, tối đa 30k |
| CATEGORY | AMOUNT | 200k | 20k | Giảm 30k cho category, tối đa 20k |
| PRODUCT | PERCENTAGE | 150k | 40k | Giảm 25% cho sản phẩm, tối đa 40k |
| PRODUCT | AMOUNT | 150k | null | Giảm 25k cho sản phẩm |

---

## 🔍 So Sánh ORDER vs CATEGORY vs PRODUCT

### **ORDER (Toàn bộ đơn hàng)**
- ✅ Đơn giản nhất
- ✅ Áp dụng cho tất cả sản phẩm
- ✅ Không cần chọn categories/products
- ⚠️ Có thể giảm nhiều nếu đơn hàng lớn

### **CATEGORY (Theo danh mục)**
- ✅ Linh hoạt, áp dụng cho nhiều sản phẩm cùng danh mục
- ✅ Dễ quản lý khi có nhiều sản phẩm mới
- ⚠️ Cần chọn categories phù hợp
- ⚠️ Chỉ giảm cho sản phẩm thuộc categories đã chọn

### **PRODUCT (Theo sách cụ thể)**
- ✅ Kiểm soát chính xác sản phẩm được giảm
- ✅ Phù hợp cho khuyến mãi sản phẩm cụ thể
- ⚠️ Phải chọn từng sản phẩm
- ⚠️ Khó quản lý khi có nhiều sản phẩm

---

## 💡 Best Practices

1. **Sử dụng ORDER** khi muốn khuyến mãi toàn bộ cửa hàng
2. **Sử dụng CATEGORY** khi muốn khuyến mãi theo nhóm sản phẩm
3. **Sử dụng PRODUCT** khi muốn khuyến mãi sản phẩm cụ thể
4. **Luôn set maxDiscountValue** để kiểm soát chi phí
5. **Set minOrderValue hợp lý** để tăng giá trị đơn hàng trung bình

---

## 🎯 Ví Dụ Thực Tế

### **Ví dụ 1: Flash Sale - Giảm 30% tối đa 100k cho đơn từ 500k**
```
discountValueType: PERCENTAGE
discountValue: 30
applyScope: ORDER
minOrderValue: 500.000₫
maxDiscountValue: 100.000₫
```

### **Ví dụ 2: Khuyến mãi sách Tiểu thuyết - Giảm 50k cho đơn từ 200k**
```
discountValueType: AMOUNT
discountValue: 50.000₫
applyScope: CATEGORY
categoryApply: ["Tiểu thuyết"]
minOrderValue: 200.000₫
maxDiscountValue: null
```

### **Ví dụ 3: Sách bán chạy - Giảm 20% tối đa 80k cho sản phẩm cụ thể**
```
discountValueType: PERCENTAGE
discountValue: 20
applyScope: PRODUCT
productApply: ["Sách A", "Sách B", "Sách C"]
minOrderValue: 150.000₫
maxDiscountValue: 80.000₫
```

