package com.lumina_book.backend.dto.request;

import java.time.LocalDate;

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

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    String description;

    String size;

    @Size(max = 255, message = "Tên tác giả không được vượt quá 255 ký tự")
    String author;

    @Size(max = 255, message = "Tên nhà xuất bản không được vượt quá 255 ký tự")
    String publisher;

    @DecimalMin(value = "0.0", message = "Trọng lượng phải lớn hơn hoặc bằng 0")
    Double weight;

    @DecimalMin(value = "0.0", message = "Giá sản phẩm phải lớn hơn hoặc bằng 0")
    Double price;

    @DecimalMin(value = "0.0", message = "Thuế phải lớn hơn hoặc bằng 0")
    Double tax;

    @DecimalMin(value = "0.0", message = "Giá trị giảm giá phải lớn hơn hoặc bằng 0")
    Double discountValue;

    LocalDate publicationDate;

    String categoryId;

    Boolean status;
}
