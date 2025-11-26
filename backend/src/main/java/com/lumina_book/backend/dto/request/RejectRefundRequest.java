package com.lumina_book.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectRefundRequest {
    @NotBlank(message = "Lý do từ chối không được để trống")
    private String reason;
}

