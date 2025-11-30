package com.lumina_book.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductRevenue {
    String productId;
    String productName;
    Long quantity;  // Tổng số lượng sản phẩm đã bán
    Double total;    // Tổng doanh thu từ sản phẩm này
}
