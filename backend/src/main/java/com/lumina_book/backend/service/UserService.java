package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lumina_book.backend.dto.request.StaffCreationRequest;
import com.lumina_book.backend.dto.request.UserCreationRequest;
import com.lumina_book.backend.dto.request.UserUpdateRequest;
import com.lumina_book.backend.dto.response.UserResponse;
import com.lumina_book.backend.entity.Role;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.UserMapper;
import com.lumina_book.backend.repository.RoleRepository;
import com.lumina_book.backend.util.SecurityUtil;
import com.lumina_book.backend.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
// Tạo 1 constructor cho tất cả các biến define là final -> Tự động đưa vào
// constructor và inject dependency
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    PasswordGeneratorService passwordGeneratorService;
    BrevoEmailService brevoEmailService;
    FileStorageService fileStorageService;

    @NonFinal
    @Value("${app.default-avatar}")
    private String defaultAvatarUrl;

    public UserResponse createUser(UserCreationRequest request) {
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
        user.setFullName(request.getFullName());
        user.setAddress(request.getAddress() != null ? request.getAddress() : "");
        user.setAvatarUrl(defaultAvatarUrl);
        user.setCreateAt(LocalDate.now());

        Role role = roleRepository
                .findById(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(role.getName().equals("CUSTOMER"));
        user.setRole(role);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createStaff(StaffCreationRequest request) {
        log.info("Creating staff account for email: {}", request.getEmail());

        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Tạo mật khẩu tự động
        String generatedPassword = passwordGeneratorService.generateSecurePassword();
        log.info("Password for staff: {}", generatedPassword);
        log.info("Generated password for staff: {}", request.getEmail());

        // Tạo user entity
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(generatedPassword))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                .address(request.getAddress() != null ? request.getAddress() : "")
                .avatarUrl(defaultAvatarUrl)
                .createAt(LocalDate.now())
                .active(true)
                .build();

        // Lấy role
        Role role = roleRepository
                .findById(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setRole(role);

        try {
            user = userRepository.save(user);
            log.info("Staff account created successfully with ID: {}", user.getId());

            // Gửi email chứa mật khẩu
            try {
                brevoEmailService.sendStaffPasswordEmail(
                        request.getEmail(), request.getFullName(), generatedPassword, role.getName());
                log.info("Password email sent successfully to: {}", request.getEmail());
            } catch (Exception e) {
                log.error("Failed to send password email to: {} - Error: {}", request.getEmail(), e.getMessage());
                // Không throw exception vì tài khoản đã được tạo thành công
            }

        } catch (DataIntegrityViolationException exception) {
            log.error("Data integrity violation when creating staff: {}", exception.getMessage());
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        return userMapper.toUserResponse(user);
    }

    public UserResponse getMyInfo() {
        // SecurityContextHolder chứa thông tin về user đang đăng nhập
        // Khi request được xác định thành công -> thông tin lưu trữ của user được lưu trong Security context holder
        String name = SecurityUtil.getCurrentUserEmail();

        User user = userRepository.findByEmail(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    // User có thể update chính mình, hoặc ADMIN có thể update bất kỳ user nào
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Check current user is ADMIN
        Authentication authentication = SecurityUtil.getAuthentication();
        String currentEmail = authentication.getName();
        
        // Check ADMIN từ SecurityContext authorities trước
        var authorities = authentication.getAuthorities();
        boolean isAdminFromAuthorities = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        // Load user với role (có thể cần fetch role vì lazy loading)
        User currentUser = userRepository
                .findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        boolean isAdminFromRole = currentUser.getRole() != null && 
                currentUser.getRole().getName().equals("ADMIN");
        
        boolean isAdmin = isAdminFromAuthorities || isAdminFromRole;
        
        // Nếu không phải ADMIN và không phải update chính mình → từ chối
        if (!isAdmin && !user.getEmail().equals(currentEmail)) {
            log.warn("Access denied: User {} attempted to update user {}", currentEmail, userId);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        userMapper.updateUser(user, request);

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            String roleName = currentUser.getRole().getName();
            if (roleName.equals("STAFF") || roleName.equals("CUSTOMER_SUPPORT")) {
                user.setActive(true);
            }
        }

        // Change Email
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (isAdmin) {
                user.setEmail(request.getEmail());
            }
        }

        // PhoneNumber
        // Cho phép xóa số điện thoại: nếu field có trong request (kể cả chuỗi rỗng) thì ghi đè lên.
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // FullName
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        // Address
        if (request.getAddress() != null && !request.getAddress().isEmpty()) {
            user.setAddress(request.getAddress());
        }
        // AvatarUrl
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            String oldAvatarUrl = user.getAvatarUrl();
            String newAvatarUrl = request.getAvatarUrl();
            
            // Chỉ cập nhật nếu avatar mới khác với avatar cũ
            if (!newAvatarUrl.equals(oldAvatarUrl)) {
                user.setAvatarUrl(newAvatarUrl);
                
                // Xóa ảnh đại diện cũ nếu có và không phải là default avatar
                if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty() && !oldAvatarUrl.equals(defaultAvatarUrl)) {
                    try {
                        fileStorageService.deleteProfileMedia(oldAvatarUrl);
//                        log.info("Deleted old avatar for user {}: {}", userId, oldAvatarUrl);
                    } catch (Exception e) {
                        // Log lỗi nhưng không fail việc cập nhật user
                        log.warn("Failed to delete old avatar for user {}: {}", userId, e.getMessage());
                    }
                }
            }
        }

        // role
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            if (isAdmin) {
                Role newRole = roleRepository
                        .findById(request.getRole())
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
                user.setRole(newRole);
            } else {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        // active - chỉ cập nhật nếu active có trong request và user là ADMIN
        Boolean requestedActiveValue = request.getActive();

        if (requestedActiveValue != null) {
            if (isAdmin) {
                boolean oldIsActiveValue = user.isActive();
                boolean newIsActiveValue = requestedActiveValue;
                
                String userRoleName = user.getRole() != null ? user.getRole().getName() : null;
                
                // Check if account is being locked (transition from active to inactive)
                if (oldIsActiveValue && !newIsActiveValue) {
                    // Account is being locked - send notification email
                    // Only send email for CUSTOMER, STAFF, and CUSTOMER_SUPPORT (not ADMIN)
                    if (userRoleName != null && 
                        (userRoleName.equals("CUSTOMER") || 
                         userRoleName.equals("STAFF") || 
                         userRoleName.equals("CUSTOMER_SUPPORT"))) {
                        try {
                            brevoEmailService.sendAccountLockedEmail(
                                user.getEmail(),
                                user.getFullName(),
                                userRoleName
                            );
                            log.info("Account locked notification email sent to: {} (Role: {})", user.getEmail(), userRoleName);
                        } catch (Exception e) {
                            // Log error but don't fail the account lock operation
                            log.error("Failed to send account locked email to: {} - Error: {}", 
                                user.getEmail(), e.getMessage(), e);
                        }
                    }
                }
                // Check if account is being unlocked (transition from inactive to active)
                else if (!oldIsActiveValue && newIsActiveValue) {
                    // Account is being unlocked - send notification email
                    // Only send email for CUSTOMER, STAFF, and CUSTOMER_SUPPORT (not ADMIN)
                    if (userRoleName != null && 
                        (userRoleName.equals("CUSTOMER") || 
                         userRoleName.equals("STAFF") || 
                         userRoleName.equals("CUSTOMER_SUPPORT"))) {
                        try {
                            brevoEmailService.sendAccountUnlockedEmail(
                                user.getEmail(),
                                user.getFullName(),
                                userRoleName
                            );
                            log.info("Account unlocked notification email sent to: {} (Role: {})", user.getEmail(), userRoleName);
                        } catch (Exception e) {
                            // Log error but don't fail the account unlock operation
                            log.error("Failed to send account unlocked email to: {} - Error: {}", 
                                user.getEmail(), e.getMessage(), e);
                        }
                    }
                }
                
                user.setActive(newIsActiveValue);
            } else {
                // Nếu không phải ADMIN mà cố gắng thay đổi active → từ chối
                log.warn("Non-admin user {} attempted to change active for user {}", currentEmail, userId);
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        // Save user vào database
        User savedUser = userRepository.save(user);
        
        return userMapper.toUserResponse(savedUser);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    // @EnableMethodSecurity trong SecurityConfig
    @PreAuthorize("hasRole('ADMIN')") // Spring tạo ra 1 proxy ngay trước khi tạo hàm. Sử dụng được nhờ khai báo
    public List<UserResponse> getUsers() {
//        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER_SUPPORT')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }
}
