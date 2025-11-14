package com.lumina_book.backend.dto.response;

import java.time.LocalDateTime;

import com.lumina_book.backend.enums.TicketAssignee;
import com.lumina_book.backend.enums.TicketStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketResponse {
    String id;
    String orderCode;
    String customerName;
    String email;
    String phone;
    String content;
    String handlerNote;
    String handlerId;
    String handlerName;
    TicketStatus status;
    TicketAssignee assignedTo;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
