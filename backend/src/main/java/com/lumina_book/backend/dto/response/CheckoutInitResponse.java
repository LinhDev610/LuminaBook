package com.lumina_book.backend.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutInitResponse {
    OrderResponse order; // null nếu là MoMo (chưa tạo đơn hàng)
    String payUrl;
    String orderCode; // For MoMo: order code sẽ được tạo sau khi thanh toán thành công
}
