package com.lumina_book.backend.dto.response;

import java.time.LocalDate;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderDetailResponse {

    String id;
    String code;

    String customerName;
    String customerEmail;

    String shippingAddress;
    LocalDate orderDate;

    Double totalAmount;
    String status;

    List<OrderItemResponse> items;
}


