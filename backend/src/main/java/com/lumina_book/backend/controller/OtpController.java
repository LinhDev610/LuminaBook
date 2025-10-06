package com.lumina_book.backend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.OtpVerificationRequest;
import com.lumina_book.backend.service.OtpService;

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

    @PostMapping("/send-otp")
    public ApiResponse<String> sendOtp(@RequestParam @NotBlank @Email String email) {
        try {
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
            boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp());

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
}
