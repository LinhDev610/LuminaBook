package com.lumina_book.backend.dto.request;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateOrderRequest {

    /**
     * Địa chỉ giao hàng dạng text (có thể ghép từ địa chỉ mặc định của user phía frontend).
     */
    String shippingAddress;

    /**
     * Ghi chú đơn hàng từ phía khách hàng.
     */
    String note;

    /**
     * Phí vận chuyển (VND). Nếu null sẽ mặc định 0.
     */
    Double shippingFee;

    /**
     * Danh sách id của các CartItem được chọn để thanh toán.
     * Nếu null hoặc rỗng thì backend sẽ hiểu là thanh toán toàn bộ giỏ hàng.
     */
    List<String> cartItemIds;
}


