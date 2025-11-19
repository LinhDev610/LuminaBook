package com.lumina_book.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.lumina_book.backend.dto.request.AddressCreationRequest;
import com.lumina_book.backend.dto.request.AddressUpdateRequest;
import com.lumina_book.backend.dto.response.AddressResponse;
import com.lumina_book.backend.entity.Address;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    // Request to Entity
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "users", ignore = true)
    @Mapping(target = "country", ignore = true)
    Address toAddress(AddressCreationRequest request);

    // Entity to Response
    @Mapping(target = "id", source = "addressId")
    AddressResponse toAddressResponse(Address address);

    // Update Entity
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "users", ignore = true)
    @Mapping(target = "country", ignore = true)
    void updateAddress(@MappingTarget Address address, AddressUpdateRequest request);
}

