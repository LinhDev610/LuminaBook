package com.lumina_book.backend.exception;

import java.util.Map;
import java.util.Objects;

import jakarta.validation.ConstraintViolation;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.lumina_book.backend.dto.request.ApiResponse;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String MIN_ATTRIBUTE = "min";

    // Xử lý lỗi khi không tìm thấy static resource (404)
    @ExceptionHandler(value = {NoResourceFoundException.class, NoHandlerFoundException.class})
    ResponseEntity<?> handleResourceNotFoundException(Exception exception) {
        // Chỉ log ở mức debug để tránh spam log
        log.debug("Resource not found: {}", exception.getMessage());
        // Trả về 404 không có body để tránh conflict với Content-Type đã được set
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    // Xử lý lỗi khi client ngắt kết nối (thường xảy ra khi load video/media)
    @ExceptionHandler(value = ClientAbortException.class)
    ResponseEntity<?> handleClientAbortException(ClientAbortException exception) {
        // Chỉ log ở mức debug vì đây là hành vi bình thường khi client cancel request
        log.debug("Client aborted connection: {}", exception.getMessage());
        // Trả về empty response để tránh conflict với Content-Type đã được set
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<?> handleException(Exception exception) {
        if (exception instanceof ClientAbortException) {
            return handleClientAbortException((ClientAbortException) exception);
        }
        if (exception instanceof NoResourceFoundException 
            || exception instanceof NoHandlerFoundException) {
            return handleResourceNotFoundException(exception);
        }
        log.error("Unhandled exception in request-return: {}", exception.getMessage(), exception);
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<?>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        // Sử dụng custom message nếu có, nếu không thì dùng message từ ErrorCode
        String message = exception.getMessage() != null && !exception.getMessage().isEmpty() 
                ? exception.getMessage() 
                : errorCode.getMessage();
        log.error("AppException: code={}, message={}", errorCode.getCode(), message, exception);
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(message)
                .build();
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse<?>> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<?>> handlingValidation(MethodArgumentNotValidException exception) {
        String enumKey = (exception.getFieldError() != null)
                ? exception.getFieldError().getDefaultMessage() // trả về thông báo lỗi gắn trong annotation(message)
                : ErrorCode.INVALID_KEY.name();

        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        Map<String, Object> attributes = null;

        try {
            errorCode = ErrorCode.valueOf(enumKey);

            // getBindingResult là những error mà method MethodArgumentNotValidException wrap lại
            var constraintViolation = exception
                    .getBindingResult()
                    .getAllErrors()
                    .get(0) // Lấy lỗi dầu tiên
                    .unwrap(ConstraintViolation.class);

            // getConstraintDescriptor: get nội dung những annotation
            // getAttributes: lấy Map các tham số trong annotation. VD: {min=3, message="USERNAME_TOO_SHORT", ...}
            attributes = constraintViolation.getConstraintDescriptor().getAttributes();

            log.info(attributes.toString());

        } catch (IllegalArgumentException ex) {
            // Nếu không tìm thấy ErrorCode enum, sử dụng message từ validation annotation
            if (exception.getFieldError() != null) {
                String validationMessage = exception.getFieldError().getDefaultMessage();
                log.warn("Validation error - field: {}, message: {}", 
                    exception.getFieldError().getField(), validationMessage);
                ApiResponse<?> apiResponse = new ApiResponse();
                apiResponse.setCode(ErrorCode.INVALID_KEY.getCode());
                apiResponse.setMessage(validationMessage);
                return ResponseEntity.badRequest().body(apiResponse);
            }
        }

        ApiResponse<?> apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        String message = errorCode.getMessage();
        if (Objects.nonNull(attributes) && message != null && message.contains("{")) {
            message = mapAttribute(message, attributes); // thay {min} nếu có
        }
        apiResponse.setMessage(message);

        return ResponseEntity.badRequest().body(apiResponse);
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
        // cặp {} để
        // 1. Tránh nhầm lẫn với message thông thường;
        // 2. Đây là 1 chuẩn của java khi replay 1 chuỗi
    }
}
