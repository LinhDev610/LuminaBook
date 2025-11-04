package com.lumina_book.backend.configuration;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.exception.ErrorCode;

// Gọi API mà không có JWT token, hoặc token sau/hết hạn -> Spring tự động nhảy vào đây AuthenticationEntryPoint
// -> Class này giúp API trả về lỗi 401 dưới dạng JSON chuẩn, thay vì response HTML mặc định.
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {
        log.error("🚫 JWT Authentication failed: method={}, uri={}, error={}", 
                request.getMethod(), request.getRequestURI(), authException.getMessage());
        ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;

        response.setStatus(errorCode.getStatusCode().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        ObjectMapper objectMapper = new ObjectMapper();

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        response.flushBuffer(); // Đảm bảo dữ liệu dược gửi ngay về client
    }
}
