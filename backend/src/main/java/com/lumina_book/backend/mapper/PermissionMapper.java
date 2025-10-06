package com.lumina_book.backend.mapper;

import org.mapstruct.Mapper;

import com.lumina_book.backend.dto.request.PermissionRequest;
import com.lumina_book.backend.dto.response.PermissionResponse;
import com.lumina_book.backend.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
