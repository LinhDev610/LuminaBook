package com.lumina_book.backend.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.lumina_book.backend.enums.ProductStatus;
import jakarta.validation.constraints.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductUpdateRequest {

    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    String name;

    @Size(max = 5000, message = "Mô tả không được vượt quá 5000 ký tự")
    String description;

    String size;

    @Size(max = 255, message = "Tên tác giả không được vượt quá 255 ký tự")
    String author;

    @Size(max = 255, message = "Tên nhà xuất bản không được vượt quá 255 ký tự")
    String publisher;

    @DecimalMin(value = "0.0", message = "Trọng lượng phải lớn hơn hoặc bằng 0")
    Double weight;

    @Min(value = 1, message = "Chiều dài phải lớn hơn hoặc bằng 1")
    Double length;

    @Min(value = 1, message = "Chiều rộng phải lớn hơn hoặc bằng 1")
    Double width;

    @Min(value = 1, message = "Chiều cao phải lớn hơn hoặc bằng 1")
    Double height;

    @DecimalMin(value = "0.0", message = "Giá niêm yết (giá gốc) phải lớn hơn hoặc bằng 0")
    Double unitPrice;

    @DecimalMin(value = "0.0", message = "Giá bán phải lớn hơn hoặc bằng 0")
    Double price;

    @DecimalMin(value = "0.0", message = "Giá nhập phải lớn hơn hoặc bằng 0")
    Double purchasePrice;

    @DecimalMin(value = "0.0", message = "Thuế phải lớn hơn hoặc bằng 0")
    Double tax;

    @DecimalMin(value = "0.0", message = "Giá trị giảm giá phải lớn hơn hoặc bằng 0")
    Double discountValue;

    LocalDate publicationDate;

    String categoryId;

    // Promotion (optional)
    String promotionId;

    ProductStatus status;

    @Min(value = 0, message = "Số lượng tồn kho phải >= 0")
    Integer stockQuantity;

    // Media fields
    List<String> imageUrls;
    List<String> videoUrls;
    String defaultMediaUrl;
}
