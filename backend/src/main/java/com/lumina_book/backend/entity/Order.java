package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.*;

import com.lumina_book.backend.enums.OrderStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id")
    Cart cart;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    Shipment shipment;

    /**
     * Mã đơn hàng hiển thị cho khách (ví dụ: LMN20241120ABC123).
     */
    @Column(name = "order_code", unique = true)
    String code;

    String note;
    String shippingAddress;
    LocalDate orderDate;
    LocalDate expectedDeliveryDate;
    Double shippingFee;
    Double totalAmount; // subtotalAmount + shippingFee

    @Enumerated(EnumType.STRING)
    OrderStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    Address address;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    List<OrderItem> items;
}
