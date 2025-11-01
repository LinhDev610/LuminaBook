package com.lumina_book.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import com.lumina_book.backend.enums.FinancialRecordType;
import com.lumina_book.backend.enums.PaymentMethod;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "financial_records")
public class FinancialRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    Product product;

    @Column(name = "amount", nullable = false)
    Double amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", nullable = false)
    FinancialRecordType recordType;

    @Column(name = "occurred_at", nullable = false)
    LocalDateTime occurredAt;
}
