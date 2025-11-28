package com.lumina_book.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.lumina_book.backend.dto.response.ShipmentResponse;
import com.lumina_book.backend.entity.Shipment;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {

    @Mapping(target = "orderId", source = "order.id")
    ShipmentResponse toResponse(Shipment shipment);
}

