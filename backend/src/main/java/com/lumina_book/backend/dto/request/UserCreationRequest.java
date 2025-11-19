package com.lumina_book.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.lumina_book.backend.constant.PredefinedRole;
import com.lumina_book.backend.validator.EmailConstraint;
import com.lumina_book.backend.validator.PasswordConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
// 1 số annotation khác: @Email, @NotNull, @NotBlack, @NotEmpty
public class UserCreationRequest {
    String phoneNumber;
    String fullName;
    String address;
    String avatarUrl;

    @NotNull(message = "PASSWORD_REQUIRED")
    @PasswordConstraint
    String password;

    @NotBlank(message = "EMAIL_REQUIRED")
    @EmailConstraint
    String email;

    @Builder.Default
    String roleName = PredefinedRole.CUSTOMER_ROLE.getName();
}
