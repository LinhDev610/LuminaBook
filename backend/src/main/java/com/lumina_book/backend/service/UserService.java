package com.lumina_book.backend.service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.lumina_book.backend.dto.request.UserCreationRequest;
import com.lumina_book.backend.dto.request.UserUpdateRequest;
import com.lumina_book.backend.dto.response.UserResponse;
import com.lumina_book.backend.entity.Role;
import com.lumina_book.backend.entity.User;
import com.lumina_book.backend.exception.AppException;
import com.lumina_book.backend.exception.ErrorCode;
import com.lumina_book.backend.mapper.UserMapper;
import com.lumina_book.backend.repository.RoleRepository;
import com.lumina_book.backend.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.experimental.FieldDefaults;
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

    @NonFinal
    @Value("${app.default-avatar}")
    private String defaultAvatarUrl;

    public UserResponse createUser(UserCreationRequest request) {
        log.info("Creating user with email: {}", request.getEmail());
        
        try {
            // Kiểm tra email đã tồn tại chưa
            if (userRepository.existsByEmail(request.getEmail())) {
                log.warn("Email already exists: {}", request.getEmail());
                throw new AppException(ErrorCode.USER_EXISTED);
            }

            // Kiểm tra username đã tồn tại chưa
            if (userRepository.existsByUsername(request.getUsername())) {
                log.warn("Username already exists: {}", request.getUsername());
                throw new AppException(ErrorCode.USER_EXISTED);
            }

            User user = userMapper.toUser(request);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmail(request.getEmail());
            user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "");
            user.setFullName(request.getFullName() != null ? request.getFullName() : request.getUsername());
            user.setAddress(request.getAddress() != null ? request.getAddress() : "");
            user.setAvatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl() : defaultAvatarUrl);
            user.setCreateAt(LocalDate.now());
            user.setActive(request.isActive());

            HashSet<Role> roles = new HashSet<>();
            roleRepository.findById(request.getRoleName()).ifPresent(roles::add);
            user.setRoles(roles);

            user = userRepository.save(user);
            log.info("User created successfully with ID: {}", user.getId());
            
            return userMapper.toUserResponse(user);
            
        } catch (AppException e) {
            log.error("AppException in createUser: {}", e.getMessage());
            throw e;
        } catch (DataIntegrityViolationException e) {
            log.error("DataIntegrityViolationException in createUser: {}", e.getMessage());
            throw new AppException(ErrorCode.USER_EXISTED);
        } catch (Exception e) {
            log.error("Unexpected error in createUser: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public UserResponse getMyInfo() {
        // SecurityContextHolder chứa thông tin về user đang đăng nhập
        // Khi request được xác định thành công -> thông tin lưu trữ của user được lưu trong Security context holder
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    // User chỉ có thể lấy được thông tin của chính mình, không thể lấy được thông tin của người khác
    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        // Check current user is ADMIN
        var context = SecurityContextHolder.getContext();
        String currentUsername = context.getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ADMIN"));

        // Password TODO: Nhập mật khẩu cũ
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Email TODO: Thêm OTP khi thay pass
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }

        // PhoneNumber
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
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
            user.setAvatarUrl(request.getAvatarUrl());
        }

        // role
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            if (isAdmin) {
                var roles = roleRepository.findAllById(request.getRoles());
                user.setRoles(new HashSet<>(roles));
            } else {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
        }

        // isActive
        if (isAdmin) {
            user.setActive(request.getIsActive());
        } else {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    // @EnableMethodSecurity trong SecurityConfig
    @PreAuthorize("hasRole('ADMIN')") // Spring tạo ra 1 proxy ngay trước khi tạo hàm. Sử dụng được nhờ khai báo
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }
}
