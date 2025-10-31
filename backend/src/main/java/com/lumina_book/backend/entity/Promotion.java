package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.*;

import com.lumina_book.backend.enums.PromotionStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "name", nullable = false)
    String name;

    @Column(name = "code", unique = true, nullable = false)
    String code;

    String imageUrl;
    String description;

    @Column(name = "discount_value", nullable = false)
    Double discountValue;

    @Column(name = "min_order_value")
    Double minOrderValue;

    @Column(name = "max_discount_value")
    Double maxDiscountValue;

    @Column(name = "start_date", nullable = false)
    LocalDate startDate;

    @Column(name = "expiry_date", nullable = false)
    LocalDate expiryDate;

    @Column(name = "usage_count")
    Integer usageCount;

    @Column(name = "usage_limit")
    Integer usageLimit;

    @Column(name = "is_active")
    Boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    PromotionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "submitted_at")
    LocalDateTime submittedAt;

    @Column(name = "approved_at")
    LocalDateTime approvedAt;

    @Column(name = "rejection_reason")
    String rejectionReason;

    // Promotion application scope
    @OneToMany(mappedBy = "promotionApply")
    Set<Category> categoryApply;

    @OneToMany(mappedBy = "promotionApply")
    Set<Product> productApply;
}
