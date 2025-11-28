package com.lumina_book.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductRestockRequest {

    @NotNull(message = "Số lượng bổ sung không được để trống")
    @Min(value = 1, message = "Số lượng bổ sung phải lớn hơn 0")
    Integer quantity;
}

