package com.lumina_book.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnProcessRequest {
    /**
     * Optional internal note from CSKH / Staff / Admin when processing the return.
     */
    private String note;

    /**
     * Refund amount decided at the current processing step (e.g. staff inspection result).
     */
    private Double refundAmount;
}

