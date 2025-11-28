package com.lumina_book.backend.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumina_book.backend.entity.Notification;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.NotificationMapper;
import com.lumina_book.backend.repository.NotificationRepository;
import com.lumina_book.backend.repository.UserRepository;
import com.lumina_book.backend.util.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;
    UserRepository userRepository;
    NotificationMapper notificationMapper;

    @Transactional
    public Notification sendToUsers(String title, String message, String type, Set<String> userIds, String link) {
        // Tạo một notification riêng cho mỗi user để mỗi user có thể đánh dấu đã đọc độc lập
        Set<User> users = new HashSet<>(userRepository.findAllById(userIds));
        Notification firstNotification = null;
        
        for (User user : users) {
            Notification n = Notification.builder()
                    .title(title)
                    .message(message)
                    .type(type)
                    .link(link)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .users(Set.of(user)) // Mỗi notification chỉ gán cho 1 user
                    .build();
            Notification saved = notificationRepository.save(n);
            if (firstNotification == null) {
                firstNotification = saved;
            }
        }
        
        return firstNotification; // Trả về notification đầu tiên
    }

    @Transactional
    public Notification sendToRole(String title, String message, String type, String roleName, String link) {
        List<User> targets = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getName().equals(roleName))
                .toList();
        Set<String> ids = targets.stream().map(User::getId).collect(Collectors.toSet());
        return sendToUsers(title, message, type, ids, link);
    }

    /**
     * Gửi thông báo cho tất cả nhân viên (STAFF và CUSTOMER_SUPPORT)
     */
    @Transactional
    public Notification sendToStaff(String title, String message, String type, String link) {
        List<User> staffUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && 
                        ("STAFF".equals(u.getRole().getName()) || 
                         "CUSTOMER_SUPPORT".equals(u.getRole().getName())))
                .toList();
        Set<String> staffIds = staffUsers.stream().map(User::getId).collect(Collectors.toSet());
        return sendToUsers(title, message, type, staffIds, link);
    }

    /**
     * Lấy danh sách thông báo của user hiện tại
     */
    public List<Notification> getMyNotifications() {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        // Lấy tất cả notifications và filter theo user
        List<Notification> allNotifications = notificationRepository.findAll();
        List<Notification> myNotifications = allNotifications.stream()
                .filter(n -> {
                    if (n.getUsers() == null || n.getUsers().isEmpty()) {
                        return false;
                    }
                    // Kiểm tra xem currentUser có trong danh sách users không
                    return n.getUsers().stream()
                            .anyMatch(u -> u.getId().equals(currentUser.getId()));
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        
        return myNotifications;
    }

    /**
     * Đánh dấu thông báo là đã đọc
     */
    @Transactional
    public Notification markAsRead(String notificationId) {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_EXISTED));
        
        // Kiểm tra user có quyền đánh dấu thông báo này không
        if (notification.getUsers() == null || !notification.getUsers().contains(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        
        // Chỉ đánh dấu đã đọc nếu chưa đọc
        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            return notificationRepository.save(notification);
        }
        
        return notification;
    }

    /**
     * Đánh dấu tất cả thông báo của user hiện tại là đã đọc
     */
    @Transactional
    public int markAllAsRead() {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        List<Notification> myNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getUsers() != null && n.getUsers().contains(currentUser) && !n.getIsRead())
                .toList();
        
        LocalDateTime now = LocalDateTime.now();
        myNotifications.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(now);
        });
        
        notificationRepository.saveAll(myNotifications);
        return myNotifications.size();
    }

    /**
     * Xóa một thông báo
     */
    @Transactional
    public void deleteNotification(String notificationId) {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_EXISTED));
        
        // Kiểm tra user có quyền xóa thông báo này không
        if (notification.getUsers() == null || !notification.getUsers().contains(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        
        // Vì mỗi notification chỉ gán cho 1 user, nên xóa luôn notification
        notificationRepository.delete(notification);
    }

    /**
     * Xóa tất cả thông báo đã đọc của user hiện tại
     */
    @Transactional
    public int deleteAllRead() {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        List<Notification> readNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getUsers() != null && n.getUsers().contains(currentUser) && n.getIsRead())
                .toList();
        
        // Vì mỗi notification chỉ gán cho 1 user, nên xóa luôn
        notificationRepository.deleteAll(readNotifications);
        
        return readNotifications.size();
    }
}
