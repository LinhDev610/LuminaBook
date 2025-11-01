package com.lumina_book.backend.dto.response;

import com.lumina_book.backend.enums.PaymentMethod;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRevenue {
    PaymentMethod paymentMethod;
    Double total;
}
