package com.lumina_book.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.lumina_book.backend.dto.request.UserCreationRequest;
import com.lumina_book.backend.dto.request.UserUpdateRequest;
import com.lumina_book.backend.dto.response.UserResponse;
import com.lumina_book.backend.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    // @Mapping(source = "firstName", target = "lastName")  // Custom mapping attribute
    // @Mapping(target = "lastName", ignore = true)  // Không mapping field lastName
    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
