package com.lumina_book.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;

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
    @GeneratedValue(strategy = GenerationType.UUID)
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
    Integer length;

    @Column(name = "width")
    Integer width;

    @Column(name = "height")
    Integer height;

    @Column(name = "tax")
    Double tax;

    @Column(name = "unit_price", nullable = false)
    Double unitPrice;

    @Column(name = "discount_value")
    Double discountValue;

    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "quantity_sold")
    Integer quantitySold;

    @Column(name = "status", nullable = false)
    Boolean status;

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

    // Category relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    // Product media
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
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

    // Promotion
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion")
    Promotion promotionApply;
}
