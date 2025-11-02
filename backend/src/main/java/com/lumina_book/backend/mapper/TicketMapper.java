package com.lumina_book.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.lumina_book.backend.dto.request.TicketCreationRequest;
import com.lumina_book.backend.dto.response.TicketResponse;
import com.lumina_book.backend.entity.SupportTicket;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "handlerNote", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    SupportTicket toEntity(TicketCreationRequest request);

    TicketResponse toResponse(SupportTicket ticket);
}
