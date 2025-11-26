package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

import com.lumina_book.backend.enums.ProductStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "products")
public class Product {
    @Id
    String id;

    @Column(name = "name", nullable = false)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "size")
    String size;

    @Column(name = "author")
    String author;

    @Column(name = "publisher")
    String publisher;

    @Column(name = "weight")
    Double weight;

    @Column(name = "length")
    Double length;

    @Column(name = "width")
    Double width;

    @Column(name = "height")
    Double height;

    @Column(name = "tax")
    Double tax;

    @Column(name = "unit_price", nullable = false)
    Double unitPrice;

    @Column(name = "purchase_price")
    Double purchasePrice;

    @Column(name = "discount_value")
    Double discountValue;

    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "quantity_sold")
    Integer quantitySold;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    ProductStatus status;

    @Column(name = "publication_date")
    LocalDate publicationDate;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // Submitted by user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    User submittedBy;

    // Approval info
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "approved_at")
    LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    // Category relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    // Product media
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    List<ProductMedia> mediaList;

    // Default media
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "default_media_id")
    ProductMedia defaultMedia;

    // Reviews
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    List<Review> reviews;

    // Inventory
    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL)
    Inventory inventory;

    // Banners
    @ManyToMany(mappedBy = "products")
    List<Banner> banners;

    // Promotions
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    Promotion promotion;

    // Vouchers
    @ManyToMany(mappedBy = "productApply", fetch = FetchType.LAZY)
    @Builder.Default
    Set<Voucher> vouchers = new HashSet<>();
}
