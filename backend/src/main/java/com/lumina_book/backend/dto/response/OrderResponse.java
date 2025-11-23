package com.lumina_book.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {

    String id;

    /**
     * Mã đơn hàng hiển thị (hiện tại dùng luôn id, có thể thay đổi sau).
     */
    String code;

    String customerName;

    String customerEmail;

    String receiverName;

    String receiverPhone;

    String shippingAddress;

    LocalDate orderDate;
    LocalDateTime orderDateTime;

    Double shippingFee;
    Double totalAmount;

    /**
     * Trạng thái đơn hàng dạng chuỗi (CREATED, PAID, SHIPPED, ...).
     */
    String status;

    String paymentMethod;
    String paymentStatus;
    Boolean paid;
    String paymentReference;

    // Refund/Return request information (for list view)
    String refundReasonType;
    String refundDescription;
    String refundEmail;
    String refundReturnAddress;
    String refundMethod;
    String refundBank;
    String refundAccountNumber;
    String refundAccountHolder;
    Double refundAmount;
    Double refundReturnFee; // Phí trả hàng
}


