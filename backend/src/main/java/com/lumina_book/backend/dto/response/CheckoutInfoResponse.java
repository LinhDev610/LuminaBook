package com.lumina_book.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Response chứa thông tin checkout để tạo đơn hàng sau khi thanh toán MoMo thành công.
 * Không tạo đơn hàng ngay, chỉ trả về payment link và thông tin để tạo đơn sau.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutInfoResponse {
    /**
     * Payment URL để redirect sang MoMo
     */
    String payUrl;
    
    /**
     * Checkout token để tạo đơn hàng sau khi thanh toán thành công
     * Frontend sẽ lưu token này và gửi lại khi verify payment
     */
    String checkoutToken;
    
    /**
     * Order code sẽ được tạo (để hiển thị trong OrderSuccess)
     */
    String orderCode;
}

