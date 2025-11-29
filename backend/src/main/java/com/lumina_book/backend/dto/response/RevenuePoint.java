package com.lumina_book.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevenuePoint {
    LocalDate date;
    LocalDateTime dateTime;
    Double total;
    
    // Constructor để tương thích với code cũ
    public RevenuePoint(LocalDate date, Double total) {
        this.date = date;
        this.total = total;
    }
    
    // Constructor cho revenue theo giờ
    public RevenuePoint(LocalDateTime dateTime, Double total) {
        this.dateTime = dateTime;
        this.date = dateTime.toLocalDate();
        this.total = total;
    }
}
