package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.*;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import com.lumina_book.backend.enums.ShipmentProvider;
import com.lumina_book.backend.enums.ShipmentStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // GHN order để theo dõi đơn hàng
    String orderCode;

    LocalDate shippedDate;
    LocalDate estimatedDelivery;

    // Thời gian giao hàng dự kiến trả về từ GHN
    OffsetDateTime expectedDeliveryTime;

    @OneToOne
    @JoinColumn(name = "order_id")
    Order order;

    @Enumerated(EnumType.STRING)
    ShipmentProvider provider;

    @Enumerated(EnumType.STRING)
    ShipmentStatus status;

    // Các trường trả về từ GHN
    String sortCode;
    String transType;
    String wardEncode;
    String districtEncode;

    // Các fee breakdown (VND)
    Long feeMainService;
    Long feeInsurance;
    Long feeStationDo;
    Long feeStationPu;
    Long feeReturn;
    Long feeR2s;
    Long feeCoupon;
    Long feeCodFailedFee;
    Long totalFee;
}
