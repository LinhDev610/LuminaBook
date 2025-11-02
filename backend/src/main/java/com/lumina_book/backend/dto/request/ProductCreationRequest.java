package com.lumina_book.backend.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCreationRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    String name;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    String description;

    String size;

    @NotBlank(message = "Tác giả không được để trống")
    @Size(max = 255, message = "Tên tác giả không được vượt quá 255 ký tự")
    String author;

    @NotBlank(message = "Nhà xuất bản không được để trống")
    @Size(max = 255, message = "Tên nhà xuất bản không được vượt quá 255 ký tự")
    String publisher;

    @DecimalMin(value = "0.0", message = "Trọng lượng phải lớn hơn hoặc bằng 0")
    Double weight;

    @Min(value = 1, message = "Chiều dài phải lớn hơn hoặc bằng 1")
    Integer length;

    @Min(value = 1, message = "Chiều rộng phải lớn hơn hoặc bằng 1")
    Integer width;

    @Min(value = 1, message = "Chiều cao phải lớn hơn hoặc bằng 1")
    Integer height;

    @NotNull(message = "Giá sản phẩm không được để trống")
    @DecimalMin(value = "0.0", message = "Giá sản phẩm phải lớn hơn hoặc bằng 0")
    Double price;

    @DecimalMin(value = "0.0", message = "Thuế phải lớn hơn hoặc bằng 0")
    Double tax;

    @DecimalMin(value = "0.0", message = "Giá trị giảm giá phải lớn hơn hoặc bằng 0")
    Double discountValue;

    @NotNull(message = "Ngày xuất bản không được để trống")
    LocalDate publicationDate;

    @NotBlank(message = "Danh mục không được để trống")
    String categoryId;

    @Builder.Default
    Boolean status = true;
}
