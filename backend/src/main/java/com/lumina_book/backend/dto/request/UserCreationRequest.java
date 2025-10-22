package com.lumina_book.backend.dto.request;

import com.lumina_book.backend.constant.PredefinedRole;
import com.lumina_book.backend.validator.EmailConstraint;
import com.lumina_book.backend.validator.PasswordConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
// 1 số annotation khác: @Email, @NotNull, @NotBlack, @NotEmpty
public class UserCreationRequest {
    @Size(min = 3, message = "USERNAME_INVALID")
    String username;

    @NotNull(message = "PASSWORD_REQUIRED")
    @PasswordConstraint
    String password;

    @EmailConstraint
    @NotBlank(message = "EMAIL_REQUIRED")
    String email;

    String phoneNumber;
    String fullName;
    String address;
    String avatarUrl;
    boolean isActive;

    @Builder.Default
    String roleName = PredefinedRole.CUSTOMER_ROLE.getName();
}
