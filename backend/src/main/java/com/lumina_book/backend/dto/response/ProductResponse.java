package com.lumina_book.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {

    String id;
    String name;
    String description;
    String size;
    String author;
    String publisher;
    Double weight;
    Integer length;
    Integer width;
    Integer height;
    Double price;
    Double tax;
    Double discountValue;
    Integer quantitySold;
    Boolean status;
    LocalDate publicationDate;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Submitted by user info
    String submittedBy;
    String submittedByName;

    // Category info
    String categoryId;
    String categoryName;

    // Media info
    List<String> mediaUrls;
    String defaultMediaUrl;

    // Review info
    Integer reviewCount;
    Double averageRating;

    // Inventory info
    Integer availableQuantity;
}
