package com.lumina_book.backend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.service.OtpService;
import com.lumina_book.backend.dto.request.ResetPasswordRequest;
import com.lumina_book.backend.dto.request.OtpVerificationRequest;
import com.lumina_book.backend.dto.request.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OtpController {

    OtpService otpService;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @PostMapping("/send-otp")
    public ApiResponse<String> sendOtp(@RequestParam @NotBlank @Email String email,
                                       @RequestParam(required = false) String mode) {
        try {
            // If in register mode and email already exists, block sending OTP
            if ("register".equalsIgnoreCase(mode) && userRepository.findByUsername(email).isPresent()) {
                return ApiResponse.<String>builder()
                        .code(400)
                        .message("Email đã được sử dụng")
                        .result(null)
                        .build();
            }
            String otpCode = otpService.generateAndSendOtp(email);
            return ApiResponse.<String>builder()
                    .code(200)
                    .message("OTP sent successfully to " + email)
                    .result(otpCode)
                    .build();
        } catch (Exception e) {
            log.error("Error sending OTP to email: {}", email, e);
            return ApiResponse.<String>builder()
                    .code(500)
                    .message("Failed to send OTP")
                    .result(null)
                    .build();
        }
    }

    @PostMapping("/verify-otp")
    public ApiResponse<String> verifyOtp(@RequestBody @Valid OtpVerificationRequest request) {
        try {
            boolean isValid = otpService.isValidOtp(request.getEmail(), request.getOtp());

            if (isValid) {
                return ApiResponse.<String>builder()
                        .code(200)
                        .message("OTP verified successfully")
                        .result("OTP is valid")
                        .build();
            } else {
                return ApiResponse.<String>builder()
                        .code(400)
                        .message("Invalid or expired OTP")
                        .result(null)
                        .build();
            }
        } catch (Exception e) {
            log.error("Error verifying OTP for email: {}", request.getEmail(), e);
            return ApiResponse.<String>builder()
                    .code(500)
                    .message("Failed to verify OTP")
                    .result(null)
                    .build();
        }
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        try {
            // Validate OTP and then consume it
            otpService.consumeOtp(request.getEmail(), request.getOtp());

            User user = userRepository.findByUsername(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            return ApiResponse.<String>builder()
                    .code(200)
                    .message("Password reset successfully")
                    .result("OK")
                    .build();
        } catch (Exception e) {
            log.error("Error resetting password for email: {}", request.getEmail(), e);
            return ApiResponse.<String>builder()
                    .code(400)
                    .message(e.getMessage())
                    .result(null)
                    .build();
        }
    }
}
