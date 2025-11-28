package com.lumina_book.backend.controller;

import java.util.List;
import java.util.Set;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.lumina_book.backend.dto.request.ApiResponse;
import com.lumina_book.backend.dto.request.NotificationCreationRequest;
import com.lumina_book.backend.dto.response.NotificationResponse;
import com.lumina_book.backend.entity.Notification;
import com.lumina_book.backend.mapper.NotificationMapper;
import com.lumina_book.backend.service.NotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;
    NotificationMapper notificationMapper;

    /**
     * Gửi thông báo cho tất cả nhân viên
     */
    @PostMapping("/send-to-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<NotificationResponse> sendToStaff(@RequestBody NotificationCreationRequest request) {
        Notification notification = notificationService.sendToStaff(
                request.getTitle(),
                request.getMessage(),
                request.getType(),
                request.getLink()
        );
        NotificationResponse response = notificationMapper.toResponse(notification);
        return ApiResponse.<NotificationResponse>builder()
                .result(response)
                .message("Đã gửi thông báo cho tất cả nhân viên")
                .build();
    }

    /**
     * Gửi thông báo cho một user cụ thể
     */
    @PostMapping("/send-to-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<NotificationResponse> sendToUser(
            @PathVariable String userId,
            @RequestBody NotificationCreationRequest request) {
        Notification notification = notificationService.sendToUsers(
                request.getTitle(),
                request.getMessage(),
                request.getType(),
                Set.of(userId),
                request.getLink()
        );
        NotificationResponse response = notificationMapper.toResponse(notification);
        return ApiResponse.<NotificationResponse>builder()
                .result(response)
                .message("Đã gửi thông báo")
                .build();
    }

    /**
     * Lấy danh sách thông báo của user hiện tại
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('STAFF','CUSTOMER_SUPPORT','ADMIN')")
    public ApiResponse<List<NotificationResponse>> getMyNotifications() {
        List<Notification> notifications = notificationService.getMyNotifications();
        List<NotificationResponse> responses = notifications.stream()
                .map(notificationMapper::toResponse)
                .toList();
        return ApiResponse.<List<NotificationResponse>>builder()
                .result(responses)
                .build();
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    @PutMapping("/{id}/mark-as-read")
    @PreAuthorize("hasAnyRole('STAFF','CUSTOMER_SUPPORT','ADMIN')")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable String id) {
        Notification notification = notificationService.markAsRead(id);
        NotificationResponse response = notificationMapper.toResponse(notification);
        return ApiResponse.<NotificationResponse>builder()
                .result(response)
                .message("Đã đánh dấu đã đọc")
                .build();
    }

    /**
     * Đánh dấu tất cả thông báo là đã đọc
     */
    @PutMapping("/mark-all-as-read")
    @PreAuthorize("hasAnyRole('STAFF','CUSTOMER_SUPPORT','ADMIN')")
    public ApiResponse<Integer> markAllAsRead() {
        int count = notificationService.markAllAsRead();
        return ApiResponse.<Integer>builder()
                .result(count)
                .message("Đã đánh dấu " + count + " thông báo là đã đọc")
                .build();
    }

    /**
     * Xóa một thông báo
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','CUSTOMER_SUPPORT','ADMIN')")
    public ApiResponse<Void> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa thông báo")
                .build();
    }

    /**
     * Xóa tất cả thông báo đã đọc
     */
    @DeleteMapping("/delete-all-read")
    @PreAuthorize("hasAnyRole('STAFF','CUSTOMER_SUPPORT','ADMIN')")
    public ApiResponse<Integer> deleteAllRead() {
        int count = notificationService.deleteAllRead();
        return ApiResponse.<Integer>builder()
                .result(count)
                .message("Đã xóa " + count + " thông báo đã đọc")
                .build();
    }
}

