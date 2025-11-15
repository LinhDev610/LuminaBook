package com.lumina_book.backend.dto.response;


import com.lumina_book.backend.enums.DiscountApplyScope;
import com.lumina_book.backend.enums.DiscountValueType;
import com.lumina_book.backend.enums.VoucherStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherResponse {

    String id;
    String name;
    String code;
    String imageUrl;
    String description;
    Double discountValue;
    Double minOrderValue;
    Double maxOrderValue;
    Double maxDiscountValue;
    DiscountValueType discountValueType;
    DiscountApplyScope applyScope;
    LocalDate startDate;
    LocalDate expiryDate;
    Integer usageCount;
    Integer usageLimit;
    Boolean isActive;
    VoucherStatus status;

    // Approval workflow info
    String submittedBy;
    String submittedByName; // Tên người tạo
    String approvedBy;
    String approvedByName; // Tên người duyệt
    LocalDateTime submittedAt;
    LocalDateTime approvedAt;
    String rejectionReason;

    // Application scope
    Set<String> categoryIds;
    List<String> categoryNames;
    Set<String> productIds;
    List<String> productNames;
}
