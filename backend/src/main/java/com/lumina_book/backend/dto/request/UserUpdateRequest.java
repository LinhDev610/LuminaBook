package com.lumina_book.backend.dto.request;

import com.lumina_book.backend.validator.EmailConstraint;
import com.lumina_book.backend.validator.PasswordConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @PasswordConstraint
    String password;

    @EmailConstraint
    String email;

    String phoneNumber;
    String fullName;
    String address;
    String avatarUrl;
    Boolean isActive;

    String role;
}
