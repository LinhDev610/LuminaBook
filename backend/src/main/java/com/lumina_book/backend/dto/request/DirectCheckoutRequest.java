package com.lumina_book.backend.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DirectCheckoutRequest {

    // ID của sản phẩm muốn mua ngay.
    String productId;

    // Số lượng sản phẩm (mặc định 1).
    Integer quantity;

    // Thông tin đầy đủ địa chỉ giao hàng (JSON string).
    String shippingAddress;

    // ID của địa chỉ mà khách đã chọn (nếu có trong sổ địa chỉ).
    String addressId;

    // Ghi chú đơn hàng từ phía khách hàng.
    String note;

    // Phí vận chuyển (VND). Nếu null sẽ mặc định 0.
    Double shippingFee;

    // Phương thức thanh toán khách chọn (momo | cod).
    String paymentMethod;

    // Mã đơn hàng được tạo trước (dùng cho thanh toán MoMo để tránh tạo trùng).
    String orderCode;
}

